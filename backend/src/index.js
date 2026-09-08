const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./utils/socket');
const { isAllowedOrigin } = require('./utils/corsOrigins');
const { initCronJobs } = require('./jobs/cronJobs');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: './.env' }); // fallback

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize Background Cron Jobs
initCronJobs();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate Limiting (brute-force protection for credentials endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://yourdomain.com"
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'ParkEase Smart Parking API Server',
    status: 'online',
    healthCheck: '/api/health',
    slots: '/api/slots',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Parking System API is running with Socket.io & Cron Jobs', timestamp: new Date().toISOString() });
});

// Ensure DB connection before processing API requests (crucial for Vercel Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection error. Ensure MongoDB Atlas allows 0.0.0.0/0 in Network Access.',
      error: err.message,
    });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/security', require('./routes/security'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/realtime', require('./routes/realtime'));
app.use('/api/layout', require('./routes/layout'));
app.use('/api/payments', require('./routes/payments'));

// Direct web seed endpoint for initialization
app.get('/api/seed', async (req, res) => {
  try {
    const { seedAll } = require('./utils/seeder');
    const result = await seedAll();
    res.json({
      success: true,
      message: 'Database seeded successfully with default slots, users, and security watchlist!',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server with Socket.io running on port ${PORT}`);
  });
}

module.exports = app;
