const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests (supports Vercel, localhost, or custom domain)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'DMCH Resto POS & MIS API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Import API Routers
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const employeesRouter = require('./routes/employees');
const departmentsRouter = require('./routes/departments');
const roomsRouter = require('./routes/rooms');
const usersRouter = require('./routes/users');

// Register API Routes
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`🚀 DMCH Resto POS & MIS Server running on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
});

module.exports = app;
