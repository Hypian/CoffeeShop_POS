/* ==========================================================================
   DMCH Resto POS & MIS — Unified Render Express REST API & Local Database Sync
   ========================================================================== */

let cloudSyncActive = false;
let _isSyncingFromCloud = false;

const RENDER_PROD_API = 'https://dmch-resto-pos-api.onrender.com/api';

function getApiBaseUrl() {
  return window.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : RENDER_PROD_API);
}

window.apiFetch = async function(url, options = {}) {
  const token = sessionStorage.getItem('jwtToken');
  if (!options.headers) options.headers = {};
  if (token) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }
  return fetch(url, options);
};


window.initCloudDatabase = async function() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('⚡ Running locally. Cloud sync is disabled for testing.');
    cloudSyncActive = false;
    return false;
  }

  let baseUrl = window.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api');

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

  const prevSignature = JSON.stringify({
    o: (state.orders || []).map(x => x.id),
    p: (state.products || []).map(x => `${x.id}-${x.price}-${x.name}`),
    d: (state.departments || []).map(x => x.id),
    e: (state.employees || []).map(x => `${x.id}-${x.currentBalance}`),
    r: (state.rooms || []).map(x => x.id)
  });

  try {
    // 1. Fetch Orders
    const resOrders = await apiFetch(`${baseUrl}/orders`).catch(() => null);
    if (resOrders && resOrders.ok) {
      const result = await resOrders.json();
      if (result.success && Array.isArray(result.data)) {
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
      const result = await resProds.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedProds = result.data.map(p => ({
          id: p.id,
          name: p.name,
          categoryId: p.category_id,
          price: Number(p.price || 0),
          icon: p.icon || "<i class=\'bx bx-coffee\'></i>",
          stock: Number(p.stock || 100)
        }));
        state.products = fetchedProds;
      }
    }

    // 3. Fetch Departments
    const resDepts = await apiFetch(`${baseUrl}/departments`).catch(() => null);
    if (resDepts && resDepts.ok) {
      const result = await resDepts.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedDepts = result.data.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          monthlyCreditLimit: Number(d.monthly_credit_limit || 100000)
        }));
        state.departments = fetchedDepts;
      }
    }

    // 4. Fetch Employees
    const resEmps = await apiFetch(`${baseUrl}/employees`).catch(() => null);
    if (resEmps && resEmps.ok) {
      const result = await resEmps.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedEmps = result.data.map(e => ({
          id: e.id,
          staffId: e.staff_id,
          fullName: e.full_name,
          departmentId: e.department_id,
          monthlyCreditLimit: Number(e.monthly_credit_limit || 50000),
          currentBalance: Number(e.current_balance || 0)
        }));
        state.employees = fetchedEmps;
      }
    }

    // 5. Fetch Rooms
    const resRooms = await apiFetch(`${baseUrl}/rooms`).catch(() => null);
    if (resRooms && resRooms.ok) {
      const result = await resRooms.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedRooms = result.data.map(r => ({
          id: r.id,
          roomNumber: r.room_number,
          tier: r.tier
        }));
        state.rooms = fetchedRooms;
      }
    }

    // 6. Fetch Users directly from Render Cloud API
    const resUsers = await apiFetch(`${baseUrl}/users`).catch(() => null);
    if (resUsers && resUsers.ok) {
      const result = await resUsers.json();
      if (result.success && Array.isArray(result.data)) {
        state.users = result.data.map(u => ({
          id: u.id,
          username: u.username,
          passwordHash: u.password_hash || u.passwordHash || u.password,
          fullName: (u.full_name || u.name || u.username).toUpperCase(),
          role: u.role,
          status: u.status || 'PENDING_APPROVAL',
          createdAt: u.created_at || u.createdAt
        }));
        if (window.renderUsers) window.renderUsers();
      }
    }

    const nextSignature = JSON.stringify({
      o: (state.orders || []).map(x => x.id),
      p: (state.products || []).map(x => `${x.id}-${x.price}-${x.name}`),
      d: (state.departments || []).map(x => x.id),
      e: (state.employees || []).map(x => `${x.id}-${x.currentBalance}`),
      r: (state.rooms || []).map(x => x.id)
    });

    if (prevSignature !== nextSignature && window.renderAllViews) {
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
    // Push orders
    if (state.orders && state.orders.length > 0) {
      for (const o of state.orders) {
        await apiFetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(o)
        }).catch(() => null);
      }
    }

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
    console.error('Error syncing state to Render backend:', err);
  } finally {
    _isPushingToCloud = false;
  }
};

window.cloudDeleteOrder = async function(orderId) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  try {
    const response = await apiFetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Order could not be deleted.');
    return result.data;
  } catch (err) {
    console.error('Error deleting order from cloud:', err);
    throw err;
  }
};

window.cloudSaveProduct = async function(product) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Product could not be saved.');
  }
  return result.data;
};

window.cloudSaveRoom = async function(room) {
  if (!cloudSyncActive) return;
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
    throw new Error((result && result.error) || 'Room could not be saved.');
  }
  return result.data;
};

window.cloudSaveDepartment = async function(dept) {
  if (!cloudSyncActive) return;
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
    throw new Error((result && result.error) || 'Department could not be saved.');
  }
  return result.data;
};

window.cloudSaveEmployee = async function(emp) {
  if (!cloudSyncActive) return;
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
    throw new Error((result && result.error) || 'Employee could not be saved.');
  }
  return result.data;
};

window.cloudDeleteProduct = async function(productId) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  const response = await apiFetch(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE'
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.success) {
    throw new Error((result && result.error) || 'Product could not be deleted.');
  }
};

window.cloudDeleteDepartment = async function(deptId) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  try {
    const response = await apiFetch(`${baseUrl}/departments/${encodeURIComponent(deptId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Department could not be deleted.');
    return result.data;
  } catch (err) {
    console.error('Error deleting department from cloud:', err);
    throw err;
  }
};

window.cloudDeleteEmployee = async function(empId) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  try {
    const response = await apiFetch(`${baseUrl}/employees/${encodeURIComponent(empId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Employee could not be deleted.');
    return result.data;
  } catch (err) {
    console.error('Error deleting employee from cloud:', err);
    throw err;
  }
};

window.cloudDeleteRoom = async function(roomId) {
  if (!cloudSyncActive) return;
  const baseUrl = getApiBaseUrl();
  try {
    const response = await apiFetch(`${baseUrl}/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'Room could not be deleted.');
    return result.data;
  } catch (err) {
    console.error('Error deleting room from cloud:', err);
    throw err;
  }
};

window.cloudSyncUsers = async function(users) {
  if (!cloudSyncActive) return;
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
        passwordHash: u.passwordHash || u.password,
        fullName: u.fullName || u.name || u.username,
        role: u.role || 'cashier',
        status: u.status || 'PENDING_APPROVAL'
      })
    }).then(async response => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.success) throw new Error((result && result.error) || 'User could not be saved.');
    });
  }
};
window.cloudDeleteUser = async function(userId) {
  if (!cloudSyncActive) return;
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
