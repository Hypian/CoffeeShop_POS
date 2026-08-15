const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, 'dmch-resto-super-secret-key-2026', { expiresIn: '1h' });

const payload = { id: `prod-${Date.now()}`, name: 'TEST_PROD', categoryId: 'cat-all', price: 1000, icon: "<i class='bx bx-box'></i>", stock: 100 };

fetch('https://dmch-resto-pos-api.onrender.com/api/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(console.log)
.catch(console.error);
