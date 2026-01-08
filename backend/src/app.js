const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Routes
const dishRoutes = require("./routes/dishRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require('./routes/reservationRoutes');
const preOrderRoutes = require('./routes/preOrderRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Connect Database (can be here or in server.js, but user suggested server.js structure usually imports app)
// Actually, user's sample app.js didn't show db connect. 
// But standard practice: App defines routes/middleware. Server connects DB and starts listening.
// Let's remove connectDB from here and keep it in server.js as per typical separation.

// Middleware
app.use(express.json());

// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL // Will be 'https://henei-dimsum.vercel.app' set in Render Env Vars
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        // We normalize to handle potential trailing slashes if needed, but array check is usually strict
        // Let's use flexible check
        const isAllowed = allowedOrigins.some(allowed =>
            origin === allowed || origin === allowed + '/'
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Routes
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/preorders', preOrderRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.send('Backend OK');
});

// Root Test Route
app.get('/', (req, res) => {
    res.json({ message: "Backend is running successfully!" });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

module.exports = app;
