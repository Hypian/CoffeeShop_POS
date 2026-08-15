const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, 'dmch-resto-super-secret-key-2026', { expiresIn: '1h' });

const payload = { id: `dept-${Date.now()}`, code: 'TEST_API', name: 'TEST_API', monthlyCreditLimit: 1000 };

fetch('https://dmch-resto-pos-api.onrender.com/api/departments', {
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
