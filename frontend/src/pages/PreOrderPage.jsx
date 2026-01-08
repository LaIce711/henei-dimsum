import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dishesAPI, preordersAPI } from "../services/api";
import "./PreOrderPage.css";

const PreOrderPage = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tính ngày tối thiểu (hôm nay)
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    paymentMethod: "Thanh toán khi nhận",
    pickupDate: today,
    pickupTime: "",
    specialRequests: "",
    specialRequestNote: "" // Ghi chú thêm
  });

  const specialRequestOptions = [
    "Không yêu cầu",
    "Ít cay",
    "Không hành",
    "Không rau thơm",
    "Nước dùng trong",
    "Khác..."
  ];

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const data = await dishesAPI.getAllDishes();
      setDishes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const updateQuantity = (dishId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(dishId);
      return;
    }
    setSelectedItems(selectedItems.map(item =>
      item._id === dishId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address || !formData.pickupDate || !formData.pickupTime) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (Ngày & Giờ nhận).");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một món.");
      return;
    }

    // Gộp yêu cầu đặc biệt
    let finalRequests = formData.specialRequests;
    if (formData.specialRequestNote) {
      finalRequests += ` - ${formData.specialRequestNote}`;
    }

    try {
      const data = await preordersAPI.create({
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        },
        deliveryAddress: formData.address,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        items: selectedItems.map(item => ({
          dishId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalPrice,
        paymentMethod: formData.paymentMethod,
        specialRequests: finalRequests
      });

      alert(`🎉 Đặt hàng thành công!\n\nMã đơn: ${data.preOrderId}\nTổng tiền: ${totalPrice.toLocaleString()}đ\n\nVui lòng đến nhận hàng lúc ${formData.pickupTime} ngày ${formData.pickupDate}!`);
      navigate("/");
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  return (
    <div className="preorder-container">
      <div className="preorder-header">
        <h1>📦 Đặt Hàng Trước</h1>
        <p>Đặt món trước, nhận hàng nhanh - không cần chờ đợi</p>
      </div>

      <div className="preorder-content">
        <div className="menu-selection">
          <h2>Chọn món</h2>
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <div className="dishes-grid">
              {dishes.map(dish => (
                <div key={dish._id} className="dish-item">
                  <img src={dish.image} alt={dish.name} />
                  <div className="dish-info">
                    <h4>{dish.name}</h4>
                    <p className="dish-price">{dish.price.toLocaleString()}đ</p>
                    <button onClick={() => addItem(dish)} className="add-btn">+ Thêm</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-summary">
          <h2>Đơn hàng của bạn</h2>

          {selectedItems.length === 0 ? (
            <p className="empty-cart">Chưa có món nào được chọn</p>
          ) : (
            <>
              <div className="selected-items">
                {selectedItems.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>{item.price.toLocaleString()}đ</p>
                    </div>
                    <div className="item-controls">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      <button onClick={() => removeItem(item._id)} className="remove-btn">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-price">
                <strong>Tổng cộng:</strong>
                <strong>{totalPrice.toLocaleString()}đ</strong>
              </div>

              <form onSubmit={handleSubmit} className="order-form">
                <h3>Thông tin nhận hàng</h3>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Họ tên *"
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại *"
                  required
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email (không bắt buộc)"
                />

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ giao hàng *"
                  rows="2"
                  required
                />

                <div className="form-row">
                  <div className="form-group half">
                    <label>Ngày nhận *</label>
                    <input
                      type="date"
                      name="pickupDate"
                      value={formData.pickupDate}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                  </div>
                  <div className="form-group half">
                    <label>Giờ nhận *</label>
                    <input
                      type="time"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phương thức thanh toán</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="Thanh toán khi nhận">Thanh toán khi nhận</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Yêu cầu đặc biệt</label>
                  <select
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn yêu cầu --</option>
                    {specialRequestOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <textarea
                    name="specialRequestNote"
                    value={formData.specialRequestNote}
                    onChange={handleChange}
                    placeholder="Ghi chú thêm (nếu có)..."
                    rows="2"
                    style={{ marginTop: '5px' }}
                  />
                </div>

                <button type="submit" className="submit-btn">✅ Xác nhận đặt hàng</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreOrderPage;


