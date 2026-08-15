const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dmch-resto-super-secret-key-2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Allow public read-only GET requests so terminals can initialize master data
    if (req.method === 'GET' || req.method === 'OPTIONS') {
      return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (req.method === 'GET' || req.method === 'OPTIONS') {
        return next();
      }
      return res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' } // 7-day token for reliable terminal operation
  );
};

module.exports = { authenticateToken, generateToken, JWT_SECRET };

