const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const isProduction = process.env.NODE_ENV === 'production' || connectionString.includes('render.com');
  pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL client error:', err);
  });

  console.log('⚡ Render PostgreSQL Pool initialized.');
} else {
  console.warn('⚠️ DATABASE_URL environment variable is missing. Server will run with memory fallback/mock mode.');
}

async function query(text, params) {
  if (!pool) {
    throw new Error('Database connection not configured. Please set DATABASE_URL.');
  }
  return pool.query(text, params);
}

module.exports = {
  query,
  pool
};
