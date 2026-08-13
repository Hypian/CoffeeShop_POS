const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users - Get system user accounts
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT id, username, password_hash, full_name, role, status, created_at, updated_at FROM users ORDER BY username ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Create or sync user account
router.post('/', async (req, res) => {
  try {
    const { id, username, passwordHash, fullName, role, status } = req.body;
    if (!username || !passwordHash) {
      return res.status(400).json({ success: false, error: 'Username and password hash required' });
    }

    if (!db.pool) return res.json({ success: true, data: req.body });

    const text = `
      INSERT INTO users (id, username, password_hash, full_name, role, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, username, full_name, role, status, created_at, updated_at;
    `;
    const values = [
      id || `usr-${Date.now()}`,
      username.toLowerCase().trim(),
      passwordHash,
      fullName || username,
      role || 'cashier',
      status || 'PENDING_APPROVAL'
    ];

    const { rows } = await db.query(text, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
