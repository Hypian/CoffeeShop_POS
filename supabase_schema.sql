-- ============================================================================
-- DMCH Resto MIS & POS — Supabase PostgreSQL Schema Migration Script
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================================

-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
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

-- 2. Create Products Inventory Table
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    icon VARCHAR(10) DEFAULT '☕',
    stock INT DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    monthly_credit_limit NUMERIC(12,2) DEFAULT 100000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Employees Staff Credit Accounts Table
CREATE TABLE IF NOT EXISTS public.employees (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department_id VARCHAR(50),
    monthly_credit_limit NUMERIC(12,2) DEFAULT 50000,
    current_balance NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Hospital Rooms Directory Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id VARCHAR(50) PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL,
    tier VARCHAR(50) DEFAULT 'Normal Room',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Users Accounts Table
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'cashier',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    details TEXT
);

-- Enable Row Level Security (RLS) & Grant Public Anon Access for POS Terminals
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public anon access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public anon access to audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for instant multi-terminal sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
