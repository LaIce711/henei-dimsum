import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reservationsAPI, dishesAPI } from "../services/api";
import "./ReservationPage.css";

const ReservationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    reservationDate: "",
    reservationTime: "",
    numberOfGuests: 2,
    tablePreference: "Không yêu cầu",
    specialRequests: "",
    servingTime: "" // Giờ lên món
  });

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // States for pre-ordering dishes
  const [showMenu, setShowMenu] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const timeSlots = [
    "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30", "21:00"
  ];

  /* eslint-disable react-hooks/exhaustive-deps */
  // Load menu items when toggle is on
  useEffect(() => {
    if (showMenu && dishes.length === 0) {
      const loadDishes = async () => {
        try {
          const data = await dishesAPI.getAllDishes();
          setDishes(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Failed to load dishes", err);
        }
      };
      loadDishes();
    }
  }, [showMenu, dishes.length]);

  // Check availability when date/time/guests change
  useEffect(() => {
    if (formData.reservationDate && formData.reservationTime && formData.numberOfGuests) {
      checkAvailability();
    }
  }, [formData.reservationDate, formData.reservationTime, formData.numberOfGuests]);

  const checkAvailability = async () => {
    if (formData.numberOfGuests >= 8) {
      setIsAvailable(false);
      setAvailabilityMessage("Với nhóm từ 8 khách trở lên, vui lòng gọi hotline 0967.582.566 để được hỗ trợ tốt nhất.");
      return;
    }

    setChecking(true);
    try {
      const result = await reservationsAPI.checkAvailability({
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        numberOfGuests: formData.numberOfGuests
      });

      if (result.isAvailable) {
        setIsAvailable(true);
        setAvailabilityMessage(`✅ Còn bàn (Còn ${result.remaining} bàn)`);
      } else {
        setIsAvailable(false);
        setAvailabilityMessage("❌ Đã hết bàn cho số lượng khách này vào giờ này. Vui lòng chọn giờ khác.");
      }
    } catch (error) {
      console.error("Check failed", error);
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dish selection logic
  const addItem = (dish) => {
    const existingItem = selectedItems.find(item => item._id === dish._id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item._id === dish._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...dish, quantity: 1 }]);
    }
  };

  const removeItem = (dishId) => {
    setSelectedItems(selectedItems.filter(item => item._id !== dishId));
  };

  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Logic Date: Nếu quá 21:00 thì không cho đặt hôm nay nữa
  const now = new Date();
  const currentHour = now.getHours();
  let minDate = new Date().toISOString().split('T')[0];

  if (currentHour >= 21) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    minDate = tomorrow.toISOString().split('T')[0];
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAvailable) {
      alert("Hiện tại không còn bàn hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    if (!formData.name || !formData.phone || !formData.reservationDate || !formData.reservationTime) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    // require servingTime if dishes selected
    if (selectedItems.length > 0) {
      if (!formData.servingTime) {
        alert("Bạn đã chọn món, vui lòng chọn 'Giờ lên món'.");
        return;
      }

      // Validate serving time > reservation time
      // Simple string comparison works for "HH:mm" format (24h)
      if (formData.servingTime <= formData.reservationTime) {
        alert(`Giờ lên món (${formData.servingTime}) phải sau giờ đặt bàn (${formData.reservationTime}).`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        },
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        numberOfGuests: formData.numberOfGuests,
        tablePreference: formData.tablePreference,
        specialRequests: formData.specialRequests,
        items: selectedItems.length > 0 ? selectedItems.map(item => ({
          dishId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })) : [],
        servingTime: formData.servingTime
      };

      const data = await reservationsAPI.create(payload);

      alert(`🎉 Đặt bàn thành công!\n\nMã đặt bàn: ${data.reservationId}\n\nChúng tôi sẽ gọi xác nhận trong thời gian sớm nhất.`);
      navigate("/");
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-container">
      <div className="reservation-header">
        <h1>🍽️ Đặt Bàn</h1>
        <p>Đặt bàn trước để đảm bảo chỗ ngồi tốt nhất</p>
      </div>

      <form onSubmit={handleSubmit} className="reservation-form">
        {/* Phần 1: Thông tin khách & Bàn */}
        <div className="form-section">
          <h3>1. Thông tin đặt bàn</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày đến *</label>
              <input type="date" name="reservationDate" value={formData.reservationDate} onChange={handleChange} min={minDate} required />
            </div>
            <div className="form-group">
              <label>Giờ đến *</label>
              <select name="reservationTime" value={formData.reservationTime} onChange={handleChange} required>
                <option value="">-- Chọn giờ --</option>
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Số lượng khách *</label>
            <input type="number" name="numberOfGuests" value={formData.numberOfGuests} onChange={handleChange} min="1" max="20" required />
          </div>

          {/* Availability Message */}
          {formData.reservationDate && formData.reservationTime && (
            <div className={`availability-alert ${isAvailable ? 'success' : 'error'}`}>
              {checking ? "⏳ Đang kiểm tra bàn..." : availabilityMessage}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Họ tên *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Tên của bạn" />
            </div>
            <div className="form-group">
              <label>Số điện thoại *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="0xxxxxxxxx" />
            </div>
          </div>

          <div className="form-group">
            <label>Ghi chú / Yêu cầu đặc biệt</label>
            <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows="2" placeholder="VD: Sinh nhật, ghế trẻ em..." />
          </div>
        </div>

        {/* Phần 2: Đặt món trước (Optional) */}
        <div className="form-section pre-order-section">
          <div className="section-header-toggle">
            <h3>2. Đặt món trước (Không bắt buộc)</h3>
            <button type="button" className={`toggle-btn ${showMenu ? 'active' : ''}`} onClick={() => setShowMenu(!showMenu)}>
              {showMenu ? "Ẩn Menu" : "Xem Menu & Đặt món"}
            </button>
          </div>

          {showMenu && (
            <div className="reservation-menu">
              {/* Chọn món */}
              <div className="mini-menu-grid">
                {dishes.map(dish => (
                  <div key={dish._id} className="mini-dish-card">
                    <img src={dish.image} alt={dish.name} />
                    <div>
                      <p className="dish-name">{dish.name}</p>
                      <p className="dish-price">{dish.price.toLocaleString()}đ</p>
                      <button type="button" onClick={() => addItem(dish)}>+ Thêm</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Giỏ hàng mini - Simplified Layout */}
              {selectedItems.length > 0 && (
                <div className="mini-cart-summary">
                  <div className="cart-header">
                    <h4>Các món đã chọn ({selectedItems.length})</h4>
                  </div>

                  <div className="cart-items-simple">
                    {selectedItems.map(item => (
                      <div key={item._id} className="simple-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                        <div className="item-info" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span className="item-name" style={{ fontWeight: 500 }}>{item.name}</span>
                          <span className="item-qty" style={{ color: '#666' }}>x{item.quantity}</span>
                        </div>
                        <div className="item-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="item-price" style={{ color: '#d32f2f', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString()}đ</span>
                          <button type="button" className="simple-remove-btn" onClick={() => removeItem(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '1.2rem' }} title="Xóa">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-footer">
                    <div className="mini-total">
                      <span>Tổng tiền món:</span>
                      <span className="total-amount">{totalPrice.toLocaleString()}đ</span>
                    </div>

                    <div className="serving-time-group">
                      <label>Giờ lên món *</label>
                      <div className="input-with-icon">
                        <input type="time" name="servingTime" value={formData.servingTime} onChange={handleChange} />
                      </div>
                      <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                        {formData.reservationTime ? `Giờ lên món phải sau ${formData.reservationTime}` : "Vui lòng chọn giờ đến trước."}
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={loading || !isAvailable}>
          {loading ? "Đang xử lý..." : "✅ Xác nhận Đặt bàn"}
        </button>

      </form>
    </div>
  );
};

export default ReservationPage;
