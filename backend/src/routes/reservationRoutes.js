// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');

// POST /api/reservations/check-daily-availability - Kiểm tra bàn trống cho cả ngày
router.post('/check-daily-availability', async (req, res) => {
  try {
    const { reservationDate, numberOfGuests } = req.body;

    if (!reservationDate || !numberOfGuests) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày hoặc số khách.' });
    }

    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await Reservation.find({
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const timeSlots = [
      "10:30", "11:00", "11:30", "12:00", "12:30",
      "13:00", "13:30", "17:30", "18:00", "18:30",
      "19:00", "19:30", "20:00", "20:30", "21:00"
    ];

    let totalCapacity = (numberOfGuests <= 2) ? 6 : 14;

    const availability = {};

    timeSlots.forEach(slot => {
      // Đếm số đơn đặt vào khung giờ này với loại bàn tương ứng
      const count = existingReservations.filter(r =>
        r.reservationTime === slot &&
        ((numberOfGuests <= 2 && r.numberOfGuests <= 2) || (numberOfGuests > 2 && r.numberOfGuests > 2))
      ).length;

      availability[slot] = {
        remaining: totalCapacity - count,
        isAvailable: count < totalCapacity
      };
    });

    res.json(availability);

  } catch (error) {
    console.error('Lỗi kiểm tra lịch ngày:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/reservations/check-availability - Kiểm tra bàn trống (Cụ thể)
router.post('/check-availability', async (req, res) => {
  try {
    const { reservationDate, reservationTime, numberOfGuests } = req.body;

    if (!reservationDate || !reservationTime || !numberOfGuests) {
      return res.status(400).json({ message: 'Thiếu thông tin kiểm tra.' });
    }

    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Đếm số lượng đặt bàn trong ngày và khung giờ đó
    // Lưu ý: Logic đơn giản kiểm tra trùng khung giờ.
    // Thực tế có thể phức tạp hơn (VD: bàn ăn trong 1.5h)
    const existingReservations = await Reservation.find({
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      reservationTime: reservationTime,
      status: { $ne: 'cancelled' } // Không tính đơn đã hủy
    });

    let totalCapacity = 0;

    // Logic giới hạn bàn
    if (numberOfGuests <= 2) {
      totalCapacity = 6; // 6 bàn cho 2 người
    } else {
      totalCapacity = 14; // 14 bàn to cho 3 người trở lên
    }

    // Lọc ra các đơn cùng loại bàn (nhỏ/to) để đếm
    const relevantReservations = existingReservations.filter(r => {
      if (numberOfGuests <= 2) return r.numberOfGuests <= 2;
      return r.numberOfGuests > 2;
    });

    const isAvailable = relevantReservations.length < totalCapacity;

    res.json({
      isAvailable,
      remaining: totalCapacity - relevantReservations.length,
      message: isAvailable ? 'Còn bàn' : 'Hết bàn'
    });

  } catch (error) {
    console.error('Lỗi kiểm tra bàn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/reservations - Tạo đặt bàn mới (Public)
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      reservationDate,
      reservationTime,
      numberOfGuests,
      tablePreference,
      specialRequests,
      items,
      servingTime
    } = req.body;

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ message: 'Thông tin khách hàng không đầy đủ.' });
    }

    if (!reservationDate || !reservationTime || !numberOfGuests) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin đặt bàn.' });
    }

    // Double check availability (Backend validation)
    // Tái sử dụng logic check, nhưng viết gọn lại hoặc tách hàm
    // Ở đây tạm thời tin tưởng frontend hoặc check lại nếu cần chặt chẽ

    const reservation = new Reservation({
      customer,
      reservationDate,
      reservationTime,
      numberOfGuests,
      tablePreference: tablePreference || 'Không yêu cầu',
      specialRequests,
      items: items || [],
      servingTime
    });

    await reservation.save();

    res.status(201).json({
      message: 'Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận sớm nhất.',
      reservationId: reservation._id,
      reservation
    });
  } catch (error) {
    console.error('Lỗi tạo đặt bàn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/reservations/:id - Lấy thông tin đặt bàn (Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đặt bàn.' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Lỗi lấy đặt bàn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// GET /api/reservations - Lấy tất cả đặt bàn (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ reservationDate: -1 });
    res.json(reservations);
  } catch (error) {
    console.error('Lỗi lấy danh sách đặt bàn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// PUT /api/reservations/:id/status - Cập nhật trạng thái đặt bàn (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đặt bàn.' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
