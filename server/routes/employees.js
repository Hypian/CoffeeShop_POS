const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/employees - Get all staff members
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT * FROM employees ORDER BY full_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees - Add or update staff credit account
router.post('/', async (req, res) => {
  try {
    const employees = Array.isArray(req.body) ? req.body : [req.body];
    if (!db.pool) return res.json({ success: true, data: employees });

    const results = [];
    for (const emp of employees) {
      const text = `
        INSERT INTO employees (id, staff_id, full_name, department_id, monthly_credit_limit, current_balance, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          staff_id = EXCLUDED.staff_id,
          full_name = EXCLUDED.full_name,
          department_id = EXCLUDED.department_id,
          monthly_credit_limit = EXCLUDED.monthly_credit_limit,
          current_balance = EXCLUDED.current_balance,
          updated_at = NOW()
        RETURNING *;
      `;
      const values = [
        emp.id,
        emp.staffId || emp.staff_id,
        emp.fullName || emp.full_name,
        emp.departmentId || emp.department_id,
        emp.monthlyCreditLimit || emp.monthly_credit_limit || 50000,
        emp.currentBalance || emp.current_balance || 0
      ];
      const { rows } = await db.query(text, values);
      results.push(rows[0]);
    }

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    console.error('Error saving employees:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/employees/:id/balance - Update employee balance
router.patch('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentBalance } = req.body;

    if (!db.pool) return res.json({ success: true, data: { id, currentBalance } });

    const { rows } = await db.query(
      'UPDATE employees SET current_balance = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [currentBalance, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating employee balance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/employees/:id - Delete employee credit account
router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM employees WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
