let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  jwt = require('./server/node_modules/jsonwebtoken');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dmch-resto-super-secret-key-2026';
const token = jwt.sign({ id: 'usr-admin', username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const API_BASE = process.env.API_BASE || 'https://dmch-resto-pos-api.onrender.com/api';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`⚡ TESTING ALL BACKEND REST API & CRUD ENDPOINTS`);
  console.log(`📡 Target API URL: ${API_BASE}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Healthcheck API
  await test('GET /health (Server Health & Uptime)', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (!res.ok || data.status !== 'online') throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
  });

  // 2. User Authentication API
  let authToken = token;
  await test('POST /users/login (Admin Master Authentication)', async () => {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Dmc@123' })
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.token) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    authToken = data.token;
  });

  // 3. User Directory GET & POST & DELETE
  let testUserId = `usr-test-${Date.now()}`;
  await test('POST, GET, DELETE /users (User Management CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testUserId,
        username: `testuser_${Date.now()}`,
        password: 'Password@123',
        fullName: 'TEST CASHIER USER',
        role: 'cashier',
        status: 'APPROVED'
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const getRes = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const getData = await getRes.json();
    if (!getRes.ok || !getData.success || !Array.isArray(getData.data)) throw new Error(`GET error: ${JSON.stringify(getData)}`);

    const createdId = postData.data.id || testUserId;
    const delRes = await fetch(`${API_BASE}/users/${encodeURIComponent(createdId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  // 4. Products Catalog GET, POST, DELETE
  let testProdId = `prod-test-${Date.now()}`;
  await test('POST, GET, DELETE /products (Menu Items Catalog CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testProdId,
        name: 'Special Caramel Macchiato',
        categoryId: 'coffee',
        price: 3500,
        icon: '☕',
        stock: 80
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const getRes = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const getData = await getRes.json();
    if (!getRes.ok || !getData.success || !Array.isArray(getData.data)) throw new Error(`GET error: ${JSON.stringify(getData)}`);

    const delRes = await fetch(`${API_BASE}/products/${testProdId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  // 5. Departments GET, POST, DELETE
  let testDeptId = `dept-test-${Date.now()}`;
  await test('POST, GET, DELETE /departments (Hospital Departments CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testDeptId,
        code: 'TEST_CARDIO',
        name: 'Cardiovascular Surgery',
        monthlyCreditLimit: 250000
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const getRes = await fetch(`${API_BASE}/departments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const getData = await getRes.json();
    if (!getRes.ok || !getData.success || !Array.isArray(getData.data)) throw new Error(`GET error: ${JSON.stringify(getData)}`);

    const delRes = await fetch(`${API_BASE}/departments/${testDeptId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  // 6. Employees Staff Accounts GET, POST, PATCH, DELETE
  let testEmpId = `emp-test-${Date.now()}`;
  await test('POST, GET, PATCH, DELETE /employees (Staff Credit & Balances CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testEmpId,
        staffId: `STF-${Date.now().toString().slice(-4)}`,
        fullName: 'Dr. Test Physician',
        monthlyCreditLimit: 100000,
        currentBalance: 15000
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const patchRes = await fetch(`${API_BASE}/employees/${testEmpId}/balance`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentBalance: 20000 })
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok || !patchData.success) throw new Error(`PATCH error: ${JSON.stringify(patchData)}`);

    const delRes = await fetch(`${API_BASE}/employees/${testEmpId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  // 7. Hospital Rooms GET, POST, DELETE
  let testRoomId = `room-test-${Date.now()}`;
  await test('POST, GET, DELETE /rooms (Hospital Patient Rooms CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testRoomId,
        roomNumber: `VIP-${Date.now().toString().slice(-3)}`,
        tier: 'VIP Luxury Suite'
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const getRes = await fetch(`${API_BASE}/rooms`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const getData = await getRes.json();
    if (!getRes.ok || !getData.success || !Array.isArray(getData.data)) throw new Error(`GET error: ${JSON.stringify(getData)}`);

    const delRes = await fetch(`${API_BASE}/rooms/${testRoomId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  // 8. Orders & Financial Receipts GET, POST, PATCH, DELETE
  let testOrderId = `ORD-TEST-${Date.now()}`;
  await test('POST, GET, PATCH, DELETE /orders (Orders & Financial Receipts CRUD)', async () => {
    const postRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testOrderId,
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Cafe Latte', qty: 2, price: 2500, subtotal: 5000 },
          { name: 'Croissant', qty: 1, price: 1500, subtotal: 1500 }
        ],
        subtotal: 6500,
        tax: 0,
        total: 6500,
        paymentMethod: 'CARD',
        checkoutMode: 'DIRECT_PAYMENT',
        payerName: 'Dr. Test Customer',
        customerName: 'Dr. Test Customer',
        cashier: 'admin',
        status: 'COMPLETED'
      })
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) throw new Error(`POST error: ${JSON.stringify(postData)}`);

    const patchRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'VOIDED' })
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok || !patchData.success) throw new Error(`PATCH error: ${JSON.stringify(patchData)}`);

    const getRes = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const getData = await getRes.json();
    if (!getRes.ok || !getData.success || !Array.isArray(getData.data)) throw new Error(`GET error: ${JSON.stringify(getData)}`);

    const delRes = await fetch(`${API_BASE}/orders/${testOrderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(`DELETE error: ${JSON.stringify(delData)}`);
  });

  console.log(`\n======================================================`);
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

