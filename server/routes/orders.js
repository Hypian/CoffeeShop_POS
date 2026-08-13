const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/orders - Fetch all orders
router.get('/', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: [] });
    const { rows } = await db.query('SELECT * FROM orders ORDER BY timestamp DESC LIMIT 500');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - Save new order
router.post('/', async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.id || !order.total) {
      return res.status(400).json({ success: false, error: 'Invalid order payload' });
    }

    if (!db.pool) return res.json({ success: true, data: order });

    const text = `
      INSERT INTO orders (
        id, timestamp, items, subtotal, tax, total, payment_method, 
        checkout_mode, cashier, employee_id, department_id, room_number, 
        meal_type, patient_notes, status, payer_name, customer_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        payer_name = EXCLUDED.payer_name,
        customer_name = EXCLUDED.customer_name,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      order.id,
      order.timestamp || new Date(),
      JSON.stringify(order.items || []),
      order.subtotal || 0,
      order.tax || 0,
      order.total,
      order.paymentMethod || order.payment_method || 'CASH',
      order.checkoutMode || order.checkout_mode || 'DIRECT',
      order.cashier || order.cashierName || 'System',
      order.employeeId || order.employee_id || null,
      order.departmentId || order.department_id || null,
      order.roomNumber || order.room_number || null,
      order.mealType || order.meal_type || null,
      order.patientNotes || order.patient_notes || null,
      order.status || 'COMPLETED',
      order.payerName || order.payer_name || order.customerName || order.customer_name || 'Walk-in Customer',
      order.customerName || order.customer_name || order.payerName || order.payer_name || 'Walk-in Customer'
    ];

    const { rows } = await db.query(text, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!db.pool) return res.json({ success: true, data: { id, status } });

    const { rows } = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

// DELETE /api/orders/:id - Remove an order/receipt
router.delete('/:id', async (req, res) => {
  try {
    if (!db.pool) return res.json({ success: true, data: { id: req.params.id } });
    const { rows } = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
