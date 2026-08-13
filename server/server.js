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

// Auto-migration: ensure database columns added in later versions exist
async function runMigrations() {
  const db = require('./db');
  if (!db.pool) return;

  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payer_name VARCHAR(255)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)`
  ];

  for (const sql of migrations) {
    try {
      await db.query(sql);
    } catch (err) {
      // Ignore errors (e.g. column already exists on older PG versions)
      console.warn('Migration skipped:', err.message);
    }
  }
  console.log('✅ Database migrations checked.');
}

// Start Express Listener
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DMCH Resto POS & MIS Server running on port ${PORT}`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('Migration error (non-fatal):', err);
  app.listen(PORT, () => {
    console.log(`🚀 DMCH Resto POS & MIS Server running on port ${PORT}`);
  });
});

module.exports = app;
