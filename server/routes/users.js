const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, generateToken } = require('../middleware/auth');

// POST /api/users/login - Authenticate user and get JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    if (!db.pool) {
      // Mock mode fallback for local dev without DB
      if (username === 'admin' && password === 'Dmc@123') {
        return res.json({ success: true, token: 'mock-token', user: { username: 'admin', role: 'admin' } });
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    if (rows.length === 0) {
      // Auto-provision admin if no users exist
      if (username === 'admin' && password === 'Dmc@123') {
        const adminCheck = await db.query('SELECT count(*) FROM users');
        if (parseInt(adminCheck.rows[0].count) === 0) {
          const hashed = await bcrypt.hash('Dmc@123', 10);
          const newAdmin = await db.query(
            `INSERT INTO users (id, username, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [`usr-${Date.now()}`, 'admin', hashed, 'Administrator', 'admin', 'APPROVED']
          );
          const token = generateToken(newAdmin.rows[0]);
          return res.json({ success: true, token, user: newAdmin.rows[0] });
        }
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Check if account is active
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ success: false, error: 'Account is pending approval or declined.' });
    }

    // Since we are upgrading from frontend-hashing to backend bcrypt, we might need to handle legacy hashes, but for a fresh production deployment we expect bcrypt.
    let isValid = false;
    if (user.password_hash && user.password_hash.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy plaintext or old weak hash fallback (only for transition, should be removed later)
      // If we are strictly migrating, we assume the frontend sent the raw password. 
      // If the old hash in DB matches the raw password exactly (unlikely), or we just force reset.
      // For safety, if it doesn't start with $2b$, reject unless it matches exactly (for dev).
      isValid = (password === user.password_hash);
      
      // Auto-upgrade hash if valid
      if (isValid) {
        const newHash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    // Never send password hash back
    delete user.password_hash;

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/users - Get system user accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT id, username, full_name, role, status, created_at, updated_at FROM users ORDER BY username ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Create or sync user account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { id, username, password, fullName, role, status } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username required' });
    }

    if (!db.pool) return res.json({ success: true, data: req.body });

    // Check if user exists
    const existing = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    
    let passwordHashToSave = null;
    if (password) {
      passwordHashToSave = await bcrypt.hash(password, 10);
    }

    if (existing.rows.length > 0) {
      // Update
      const text = `
        UPDATE users SET
          full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          status = COALESCE($3, status),
          password_hash = COALESCE($4, password_hash),
          updated_at = NOW()
        WHERE username = $5
        RETURNING id, username, full_name, role, status, created_at, updated_at;
      `;
      const values = [fullName, role, status, passwordHashToSave, username.toLowerCase().trim()];
      const { rows } = await db.query(text, values);
      return res.status(200).json({ success: true, data: rows[0] });
    } else {
      // Insert
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password required for new users' });
      }
      const text = `
        INSERT INTO users (id, username, password_hash, full_name, role, status, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, username, full_name, role, status, created_at, updated_at;
      `;
      const values = [
        id || `usr-${Date.now()}`,
        username.toLowerCase().trim(),
        passwordHashToSave,
        fullName || username,
        role || 'cashier',
        status || 'PENDING_APPROVAL'
      ];
      const { rows } = await db.query(text, values);
      return res.status(201).json({ success: true, data: rows[0] });
    }
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
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
