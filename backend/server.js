// server.js
const express = require('express');
const connectDB = require('./src/config/db');
const dishRoutes = require("./src/routes/dishRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const reservationRoutes = require('./src/routes/reservationRoutes');
const preOrderRoutes = require('./src/routes/preOrderRoutes');
const promotionRoutes = require('./src/routes/promotionRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cors = require('cors');

require('dotenv').config();
const app = express();

// Kết nối database
connectDB();

// Middleware - CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép các request không có origin (như mobile apps hoặc curl)
    if (!origin) return callback(null, true);

    // Kiểm tra xem origin có khớp với FRONTEND_URL (sau khi đã loại bỏ dấu / ở cuối)
    const normalizedFrontendUrl = frontendUrl.replace(/\/$/, "");
    const normalizedOrigin = origin.replace(/\/$/, "");

    if (normalizedOrigin === normalizedFrontendUrl || normalizedOrigin === 'http://localhost:3000') {
      callback(null, true);
    } else {
      console.log("CORS blocked for origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Xử lý body JSON

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Henei Dimsum API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Định nghĩa routes
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/preorders', preOrderRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Khởi động server (chỉ khi không phải Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

// Export app cho Vercel serverless
module.exports = app;
