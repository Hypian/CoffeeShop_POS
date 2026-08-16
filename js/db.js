/* ==========================================================================
   DMCH Resto POS & MIS — Unified Render Express REST API & Local Database Sync
   ========================================================================== */

let cloudSyncActive = false;
let _isSyncingFromCloud = false;

const RENDER_PROD_API = 'https://dmch-resto-pos-api.onrender.com/api';

function getApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return window.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://dmch-resto-pos-api.onrender.com/api');
}

function getAuthToken() {
  return sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken') || '';
}

function setAuthToken(token) {
  if (token) {
    try { sessionStorage.setItem('jwtToken', token); } catch(e) {}
    try { localStorage.setItem('jwtToken', token); } catch(e) {}
  } else {
    try { sessionStorage.removeItem('jwtToken'); } catch(e) {}
    try { localStorage.removeItem('jwtToken'); } catch(e) {}
  }
}

window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;

window.apiFetch = async function(url, options = {}) {
  const token = getAuthToken();
  if (!options.headers) options.headers = {};
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }
  
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    console.warn(`[apiFetch] Network error for ${url}:`, netErr.message);
    throw netErr;
  }

  // If token expired / invalid and we have an active session, attempt seamless refresh
  if ((res.status === 401 || res.status === 403) && !options._retry && !url.includes('/users/login')) {
    try {
      const baseUrl = getApiBaseUrl();
      const session = JSON.parse(sessionStorage.getItem('dmch_resto_session') || localStorage.getItem('dmch_resto_session') || '{}');
      if (session && session.username === 'admin') {
        const loginRes = await fetch(`${baseUrl}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'Dmc@123' })
        });
        const loginData = await loginRes.json().catch(() => null);
        if (loginRes.ok && loginData && loginData.token) {
          setAuthToken(loginData.token);
          options._retry = true;
          options.headers['Authorization'] = 'Bearer ' + loginData.token;
          return fetch(url, options);
        }
      }
    } catch (e) {
      console.warn('[apiFetch] Silent re-auth skipped:', e);
    }
  }

  return res;
};

window.initCloudDatabase = async function() {
  let baseUrl = getApiBaseUrl();
  if (baseUrl === RENDER_PROD_API && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
     baseUrl = 'http://localhost:5000/api';
  }

  try {
    const res = await apiFetch(`${baseUrl}/health`, { method: 'GET' });
    if (res.ok) {
      window.API_BASE_URL = baseUrl;
      cloudSyncActive = true;
      console.log(`⚡ Connected to POS API at ${baseUrl}`);
      await pullCloudDataToState();
      return true;
    }
  } catch (err) {
    console.warn(`<i class='bx bx-error'></i> Local API (${baseUrl}) unavailable. Fallback to Render Cloud backend...`);
  }

  // Automatic Fallback to Live Render Cloud API if localhost:5000 is not running
  if (baseUrl !== RENDER_PROD_API) {
    try {
      const resProd = await apiFetch(`${RENDER_PROD_API}/health`, { method: 'GET' });
      if (resProd.ok) {
        window.API_BASE_URL = RENDER_PROD_API;
        cloudSyncActive = true;
        console.log(`⚡ Auto-connected to Live Render Cloud API at ${RENDER_PROD_API}`);
        await pullCloudDataToState();
        return true;
      }
    } catch (errProd) {
      console.error("<i class='bx bx-error'></i> Could not connect to Render Cloud API either:", errProd);
    }
  }

  cloudSyncActive = false;
  return false;
};

window.pullCloudDataToState = async function() {
  const baseUrl = getApiBaseUrl();
  _isSyncingFromCloud = true;

  try {
    // 1. Fetch Orders
    const resOrders = await apiFetch(`${baseUrl}/orders`).catch(() => null);
    if (resOrders && resOrders.ok) {
      const result = await resOrders.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        const fetchedOrders = result.data.map(o => ({
          id: o.id,
          timestamp: o.timestamp,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          subtotal: Number(o.subtotal || 0),
          tax: Number(o.tax || 0),
          total: Number(o.total || 0),
          paymentMethod: o.payment_method,
          checkoutMode: o.checkout_mode,
          cashier: o.cashier,
          cashierName: o.cashier_name || o.cashier,
          employeeId: o.employee_id,
          departmentId: o.department_id,
          roomNumber: o.room_number,
          mealType: o.meal_type,
          patientNotes: o.patient_notes,
          payerName: o.payer_name || o.payerName || o.customer_name || o.customerName,
          customerName: o.customer_name || o.customerName || o.payer_name || o.payerName,
          status: o.status
        }));
        state.orders = fetchedOrders;
      }
    }

    // 2. Fetch Products
    const resProds = await apiFetch(`${baseUrl}/products`).catch(() => null);
    if (resProds && resProds.ok) {
      const result = await resProds.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        const fetchedProds = result.data.map(p => ({
          id: p.id,
          name: p.name,
          categoryId: p.category_id || p.categoryId,
          price: Number(p.price || 0),
          icon: p.icon || "<i class='bx bx-coffee'></i>",
          stock: Number(p.stock || 100)
        }));
        state.products = fetchedProds;
      }
    }

    // 3. Fetch Departments
    const resDepts = await apiFetch(`${baseUrl}/departments`).catch(() => null);
    if (resDepts && resDepts.ok) {
      const result = await resDepts.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        const fetchedDepts = result.data.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          monthlyCreditLimit: Number(d.monthly_credit_limit || d.monthlyCreditLimit || 100000)
        }));
        state.departments = fetchedDepts;
      }
    }

    // 4. Fetch Employees
    const resEmps = await apiFetch(`${baseUrl}/employees`).catch(() => null);
    if (resEmps && resEmps.ok) {
      const result = await resEmps.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        const fetchedEmps = result.data.map(e => ({
          id: e.id,
          staffId: e.staff_id || e.staffId,
          fullName: e.full_name || e.fullName,
          departmentId: e.department_id || e.departmentId,
          monthlyCreditLimit: Number(e.monthly_credit_limit || e.monthlyCreditLimit || 50000),
          currentBalance: Number(e.current_balance || e.currentBalance || 0)
        }));
        state.employees = fetchedEmps;
      }
    }

    // 5. Fetch Rooms
    const resRooms = await apiFetch(`${baseUrl}/rooms`).catch(() => null);
    if (resRooms && resRooms.ok) {
      const result = await resRooms.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        const fetchedRooms = result.data.map(r => ({
          id: r.id,
          roomNumber: r.room_number || r.roomNumber,
          tier: r.tier || 'Normal Room'
        }));
        state.rooms = fetchedRooms;
      }
    }

    // 6. Fetch Users directly from Render Cloud API
    const resUsers = await apiFetch(`${baseUrl}/users`).catch(() => null);
    if (resUsers && resUsers.ok) {
      const result = await resUsers.json().catch(() => null);
      if (result && result.success && Array.isArray(result.data)) {
        state.users = result.data.map(u => ({
          id: u.id,
          username: u.username,
          passwordHash: u.password_hash || u.passwordHash || u.password,
          fullName: (u.full_name || u.name || u.username).toUpperCase(),
          role: u.role,
          status: u.status || 'APPROVED',
          createdAt: u.created_at || u.createdAt
        }));
      }
    }

    if (window.refreshAllStaffDropdownsAndViews) {
      window.refreshAllStaffDropdownsAndViews();
    } else if (window.renderAllViews) {
      window.renderAllViews();
    }
  } catch (err) {
    console.error('Error pulling Render cloud data:', err);
  } finally {
    _isSyncingFromCloud = false;
  }
};

let _isPushingToCloud = false;

window.syncStateToCloud = async function() {
  if (_isPushingToCloud) return;
  const baseUrl = getApiBaseUrl();
  _isPushingToCloud = true;

  try {
    // Push products
    if (state.products && state.products.length > 0) {
      await apiFetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.products)
      }).catch(() => null);
    }

    // Push departments
    if (state.departments && state.departments.length > 0) {
      await apiFetch(`${baseUrl}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.departments)
      }).catch(() => null);
    }

    // Push employees
    if (state.employees && state.employees.length > 0) {
      await apiFetch(`${baseUrl}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.employees)
      }).catch(() => null);
    }

    // Push rooms
    if (state.rooms && state.rooms.length > 0) {
      await apiFetch(`${baseUrl}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.rooms)
      }).catch(() => null);
    }
  } catch (err) {
    console.warn('Error syncing state to Render backend:', err);
  } finally {
    _isPushingToCloud = false;
  }
};

window.cloudDeleteOrder = async function(orderId) {
  const baseUrl = getApiBaseUrl();
  try {
    const response = await apiFetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Order could not be deleted.');
    return result.data;
  } catch (err) {
    console.warn('Cloud delete order skipped or failed:', err);
    return null;
  }
};

window.cloudSaveProduct = async function(product) {
  const baseUrl = getApiBaseUrl();
  const payload = {
    id: product.id || `p-${Date.now()}`,
    name: product.name,
    categoryId: product.categoryId || product.category_id || 'cat-coffee',
    price: Number(product.price || 0),
    icon: product.icon || "<i class='bx bx-coffee'></i>",
    stock: Number(product.stock || 100)
  };
  const response = await apiFetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Product could not be saved to cloud.');
  }
  return result.data;
};

window.cloudSaveRoom = async function(room) {
  const baseUrl = getApiBaseUrl();
  const payload = {
    id: room.id || `room-${Date.now()}`,
    roomNumber: room.roomNumber || room.room_number,
    tier: room.tier || 'Normal Room'
  };
  const response = await apiFetch(`${baseUrl}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Room could not be saved to cloud.');
  }
  return result.data;
};

window.cloudSaveDepartment = async function(dept) {
  const baseUrl = getApiBaseUrl();
  const payload = {
    id: dept.id || `dept-${Date.now()}`,
    code: dept.code,
    name: dept.name,
    monthlyCreditLimit: dept.monthlyCreditLimit || dept.monthly_credit_limit || 100000
  };
  const response = await apiFetch(`${baseUrl}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Department could not be saved to cloud.');
  }
  return result.data;
};

window.cloudSaveEmployee = async function(emp) {
  const baseUrl = getApiBaseUrl();
  const payload = {
    id: emp.id || `emp-${Date.now()}`,
    staffId: emp.staffId || emp.staff_id,
    fullName: emp.fullName || emp.full_name,
    departmentId: emp.departmentId || emp.department_id,
    monthlyCreditLimit: emp.monthlyCreditLimit || emp.monthly_credit_limit || 50000,
    currentBalance: emp.currentBalance || emp.current_balance || 0
  };
  const response = await apiFetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Employee could not be saved to cloud.');
  }
  return result.data;
};

window.cloudDeleteProduct = async function(productId) {
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE'
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Product could not be deleted from cloud.');
  }
};

window.cloudDeleteDepartment = async function(deptId) {
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/departments/${encodeURIComponent(deptId)}`, { method: 'DELETE' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Department could not be deleted from cloud.');
  return result.data;
};

window.cloudDeleteEmployee = async function(empId) {
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/employees/${encodeURIComponent(empId)}`, { method: 'DELETE' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Employee could not be deleted from cloud.');
  return result.data;
};

window.cloudDeleteRoom = async function(roomId) {
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Room could not be deleted from cloud.');
  return result.data;
};

window.cloudSyncUsers = async function(users) {
  if (!users) return;
  const baseUrl = getApiBaseUrl();
  const userList = Array.isArray(users) ? users : [users];
  for (const u of userList) {
    if (!u || !u.username) continue;
    await apiFetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: u.id,
        username: u.username,
        password: u.password || u.passwordHash,
        fullName: u.fullName || u.name || u.username,
        role: u.role || 'cashier',
        status: u.status || 'APPROVED'
      })
    }).then(async response => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'User could not be saved.');
    }).catch(err => {
      console.warn('User cloud sync warning:', err.message);
    });
  }
};

window.cloudDeleteUser = async function(userId) {
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'User could not be deleted.');
};

// REAL-TIME CROSS-TERMINAL LIVE BROADCAST ENGINE
let _liveBroadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    _liveBroadcastChannel = new BroadcastChannel('dmch_resto_live_sync_channel');
    _liveBroadcastChannel.onmessage = function(event) {
      handleLiveSyncMessage(event.data);
    };
  }
} catch (e) {
  console.warn('BroadcastChannel fallback enabled:', e);
}

window.addEventListener('storage', function(e) {
  if (e.key === 'dmch_resto_users') {
    handleLiveSyncMessage({ type: 'USERS_UPDATED' });
  } else if (e.key === 'dmch_resto_posData') {
    handleLiveSyncMessage({ type: 'DATA_UPDATED' });
  }
});

window.broadcastLiveSync = function(payload) {
  try {
    if (_liveBroadcastChannel) {
      _liveBroadcastChannel.postMessage(payload);
    }
  } catch(err) {
    console.warn('Live sync broadcast warning:', err);
  }
  handleLiveSyncMessage(payload);
};

function handleLiveSyncMessage(payload) {
  if (!payload || !payload.type) return;

  if (payload.type === 'USERS_UPDATED') {
    if (window.renderUsers) window.renderUsers();
    if (window.applyRolePermissions) window.applyRolePermissions();
  } else if (payload.type === 'DATA_UPDATED') {
    if (window.pullCloudDataToState) window.pullCloudDataToState();
  }
}

// Stub functions
window.openCloudSyncModal = function() {};
window.saveCloudSyncSettings = function() {};
window.disconnectCloudSync = function() {};
window.copySqlSchemaToClipboard = function() {};
window.updateCloudStatusBadge = function() {};
