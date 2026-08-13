const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/rooms - Get all hospital rooms
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT * FROM rooms ORDER BY room_number ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/rooms - Sync or create room
router.post('/', async (req, res) => {
  try {
    const rooms = Array.isArray(req.body) ? req.body : [req.body];
    if (!db.pool) return res.json({ success: true, data: rooms });

    const results = [];
    for (const r of rooms) {
      const text = `
        INSERT INTO rooms (id, room_number, tier, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          room_number = EXCLUDED.room_number,
          tier = EXCLUDED.tier,
          updated_at = NOW()
        RETURNING *;
      `;
      const values = [r.id, r.roomNumber || r.room_number, r.tier || 'Normal Room'];
      const { rows } = await db.query(text, values);
      results.push(rows[0]);
    }

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    console.error('Error saving rooms:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/rooms/:id - Remove hospital room
router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM rooms WHERE id = $1 OR room_number = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
