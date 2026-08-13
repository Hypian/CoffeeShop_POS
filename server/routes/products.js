const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT * FROM products ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products - Add or sync products
router.post('/', async (req, res) => {
  try {
    const products = Array.isArray(req.body) ? req.body : [req.body];
    if (!db.pool) return res.json({ success: true, data: products });

    const results = [];
    for (const p of products) {
      const text = `
        INSERT INTO products (id, name, category_id, price, icon, stock, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category_id = EXCLUDED.category_id,
          price = EXCLUDED.price,
          icon = EXCLUDED.icon,
          stock = EXCLUDED.stock,
          updated_at = NOW()
        RETURNING *;
      `;
      const values = [p.id, p.name, p.categoryId || p.category_id || 'coffee', p.price, p.icon || '☕', p.stock || 100];
      const { rows } = await db.query(text, values);
      results.push(rows[0]);
    }

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    console.error('Error saving products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id - Remove a product from the catalog
router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
