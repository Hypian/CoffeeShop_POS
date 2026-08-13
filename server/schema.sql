-- ============================================================================
-- DMCH Resto MIS & POS — Render PostgreSQL Schema Definition
-- Run this script in your Render PostgreSQL database console or migration pipeline
-- ============================================================================

-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB NOT NULL,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50),
    checkout_mode VARCHAR(50) NOT NULL,
    cashier VARCHAR(100),
    employee_id VARCHAR(50),
    department_id VARCHAR(50),
    room_number VARCHAR(50),
    meal_type VARCHAR(50),
    patient_notes TEXT,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    icon VARCHAR(10) DEFAULT '☕',
    stock INT DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    monthly_credit_limit NUMERIC(12,2) DEFAULT 100000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department_id VARCHAR(50),
    monthly_credit_limit NUMERIC(12,2) DEFAULT 50000,
    current_balance NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL,
    tier VARCHAR(50) DEFAULT 'Normal Room',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'cashier',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    details TEXT
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_staff_id ON employees(staff_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
