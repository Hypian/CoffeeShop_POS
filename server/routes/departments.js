const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/departments - Get all hospital departments
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/departments - Sync/Add department
router.post('/', async (req, res) => {
  try {
    const departments = Array.isArray(req.body) ? req.body : [req.body];
    if (!db.pool) return res.json({ success: true, data: departments });

    const results = [];
    for (const d of departments) {
      const text = `
        INSERT INTO departments (id, code, name, monthly_credit_limit, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          monthly_credit_limit = EXCLUDED.monthly_credit_limit,
          updated_at = NOW()
        RETURNING *;
      `;
      const values = [
        d.id,
        d.code,
        d.name,
        d.monthlyCreditLimit || d.monthly_credit_limit || 100000
      ];
      const { rows } = await db.query(text, values);
      results.push(rows[0]);
    }

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    console.error('Error saving departments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

// DELETE /api/departments/:id - Remove a department
router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM departments WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Department not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
