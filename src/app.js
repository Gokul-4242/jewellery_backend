const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const rateRoutes = require('./routes/rateRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Security and CORS middlewares
app.use(helmet());
app.use(cors());

// Webhooks MUST be mounted before express.json() to maintain the raw body buffer for Stripe sig verify
app.use('/api/webhooks', webhookRoutes);

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

module.exports = app;
