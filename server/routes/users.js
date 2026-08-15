const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { authenticateToken, generateToken } = require('../middleware/auth');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// POST /api/users/login - Authenticate user and get JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const cleanUsername = username.toLowerCase().trim();

    if (!db.pool) {
      // Mock mode fallback for local dev without DB
      if (cleanUsername === 'admin' && password === 'Dmc@123') {
        return res.json({ success: true, token: generateToken({ id: 'usr-admin', username: 'admin', role: 'admin' }), user: { username: 'admin', role: 'admin', full_name: 'SYSTEM ADMINISTRATOR' } });
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [cleanUsername]);
    
    // Auto-provision or auto-recover admin account if missing or if credentials match default master
    if (rows.length === 0) {
      if (cleanUsername === 'admin' && password === 'Dmc@123') {
        const hashed = await bcrypt.hash('Dmc@123', 10);
        const newAdmin = await db.query(
          `INSERT INTO users (id, username, password_hash, full_name, role, status, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
           ON CONFLICT (username) DO UPDATE SET password_hash = $3, status = 'APPROVED', updated_at = NOW()
           RETURNING *`,
          [`usr-${Date.now()}`, 'admin', hashed, 'SYSTEM ADMINISTRATOR', 'admin', 'APPROVED']
        );
        const token = generateToken(newAdmin.rows[0]);
        const userResp = { ...newAdmin.rows[0] };
        delete userResp.password_hash;
        return res.json({ success: true, token, user: userResp });
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Check if account is active
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ success: false, error: 'Account is pending approval or declined.' });
    }

    // Comprehensive password verification across all hash versions
    let isValid = false;
    const dbHash = user.password_hash || '';
    const passSha256 = sha256(password);

    if (cleanUsername === 'admin' && password === 'Dmc@123') {
      // Master admin emergency recovery: always allow default admin pass
      isValid = true;
    } else if (dbHash.startsWith('$2b$') || dbHash.startsWith('$2a$')) {
      // Direct bcrypt comparison
      isValid = await bcrypt.compare(password, dbHash);
      if (!isValid) {
        // Legacy frontend double-hash check: bcrypt(sha256(password))
        try {
          isValid = await bcrypt.compare(passSha256, dbHash);
        } catch (e) {}
      }
    } else {
      // Legacy unhashed or single SHA-256 hash comparison
      isValid = (password === dbHash || passSha256 === dbHash);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Auto-upgrade password hash to modern direct bcrypt
    try {
      const isAlreadyBcrypt = dbHash.startsWith('$2b$') && (await bcrypt.compare(password, dbHash));
      if (!isAlreadyBcrypt) {
        const freshHash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [freshHash, user.id]);
      }
    } catch (e) {
      console.warn('Hash upgrade warning:', e.message);
    }

    const token = generateToken(user);
    const userResp = { ...user };
    delete userResp.password_hash;

    res.json({ success: true, token, user: userResp });
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
router.post('/', async (req, res) => {
  try {
    const { id, username, password, fullName, role, status } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!db.pool) return res.json({ success: true, data: req.body });

    // Check if user exists
    const existing = await db.query('SELECT * FROM users WHERE username = $1', [cleanUsername]);
    
    let passwordHashToSave = null;
    if (password) {
      if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
        passwordHashToSave = password;
      } else {
        passwordHashToSave = await bcrypt.hash(password, 10);
      }
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
      const values = [fullName, role, status, passwordHashToSave, cleanUsername];
      const { rows } = await db.query(text, values);
      return res.status(200).json({ success: true, data: rows[0] });
    } else {
      // Insert
      const finalHash = passwordHashToSave || (await bcrypt.hash('Dmc@123', 10));
      const text = `
        INSERT INTO users (id, username, password_hash, full_name, role, status, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, username, full_name, role, status, created_at, updated_at;
      `;
      const values = [
        id || `usr-${Date.now()}`,
        cleanUsername,
        finalHash,
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

