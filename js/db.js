/* ==========================================================================
   DMCH Resto POS & MIS — Unified Render Express REST API & Local Database Sync
   ========================================================================== */

let cloudSyncActive = false;
let _isSyncingFromCloud = false;

window.initCloudDatabase = async function() {
  const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:5000/api';

  try {
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    if (res.ok) {
      cloudSyncActive = true;
      console.log(`⚡ Connected to Render POS & MIS Backend API at ${baseUrl}`);
      pullCloudDataToState();
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Render API server unavailable. Running in offline/local storage mode.', err);
  }
  cloudSyncActive = false;
  return false;
};

window.pullCloudDataToState = async function() {
  const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:5000/api';
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
    const resOrders = await fetch(`${baseUrl}/orders`).catch(() => null);
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
          status: o.status
        }));
        const localOrders = Array.isArray(state.orders) ? state.orders : [];
        const unSyncedOrders = localOrders.filter(loc => !fetchedOrders.some(rem => rem.id === loc.id));
        state.orders = [...fetchedOrders, ...unSyncedOrders];
      }
    }

    // 2. Fetch Products
    const resProds = await fetch(`${baseUrl}/products`).catch(() => null);
    if (resProds && resProds.ok) {
      const result = await resProds.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedProds = result.data.map(p => ({
          id: p.id,
          name: p.name,
          categoryId: p.category_id,
          price: Number(p.price || 0),
          icon: p.icon || '☕',
          stock: Number(p.stock || 100)
        }));
        const localProds = Array.isArray(state.products) ? state.products : [];
        const unSyncedProds = localProds.filter(loc => !fetchedProds.some(rem => rem.id === loc.id));
        state.products = [...fetchedProds, ...unSyncedProds];
      }
    }

    // 3. Fetch Departments
    const resDepts = await fetch(`${baseUrl}/departments`).catch(() => null);
    if (resDepts && resDepts.ok) {
      const result = await resDepts.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedDepts = result.data.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          monthlyCreditLimit: Number(d.monthly_credit_limit || 100000)
        }));
        const localDepts = Array.isArray(state.departments) ? state.departments : [];
        const unSyncedDepts = localDepts.filter(loc => !fetchedDepts.some(rem => rem.id === loc.id));
        state.departments = [...fetchedDepts, ...unSyncedDepts];
      }
    }

    // 4. Fetch Employees
    const resEmps = await fetch(`${baseUrl}/employees`).catch(() => null);
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
        const localEmps = Array.isArray(state.employees) ? state.employees : [];
        const unSyncedEmps = localEmps.filter(loc => !fetchedEmps.some(rem => rem.id === loc.id));
        state.employees = [...fetchedEmps, ...unSyncedEmps];
      }
    }

    // 5. Fetch Rooms
    const resRooms = await fetch(`${baseUrl}/rooms`).catch(() => null);
    if (resRooms && resRooms.ok) {
      const result = await resRooms.json();
      if (result.success && Array.isArray(result.data)) {
        const fetchedRooms = result.data.map(r => ({
          id: r.id,
          roomNumber: r.room_number,
          tier: r.tier
        }));
        const localRooms = Array.isArray(state.rooms) ? state.rooms : [];
        const unSyncedRooms = localRooms.filter(loc => !fetchedRooms.some(rem => rem.id === loc.id));
        state.rooms = [...fetchedRooms, ...unSyncedRooms];
      }
    }

    // 6. Fetch Users
    const resUsers = await fetch(`${baseUrl}/users`).catch(() => null);
    if (resUsers && resUsers.ok) {
      const result = await resUsers.json();
      if (result.success && Array.isArray(result.data)) {
        let localUsers = JSON.parse(localStorage.getItem('dmch_resto_users')) || [];
        const fetchedUsers = result.data.map(u => ({
          id: u.id,
          username: u.username,
          fullName: (u.full_name || u.name || u.username).toUpperCase(),
          role: u.role
        }));

        const mergedUsers = [...localUsers];
        fetchedUsers.forEach(fUser => {
          const existingIdx = mergedUsers.findIndex(lUser => lUser.id === fUser.id || (lUser.username && lUser.username.toLowerCase() === fUser.username.toLowerCase()));
          if (existingIdx >= 0) {
            mergedUsers[existingIdx].role = fUser.role;
            if (!mergedUsers[existingIdx].fullName) mergedUsers[existingIdx].fullName = fUser.fullName;
          } else {
            mergedUsers.push(fUser);
          }
        });

        localStorage.setItem('dmch_resto_users', JSON.stringify(mergedUsers));
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
  const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:5000/api';
  _isPushingToCloud = true;

  try {
    // Push orders
    if (state.orders && state.orders.length > 0) {
      for (const o of state.orders) {
        await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(o)
        }).catch(() => null);
      }
    }

    // Push products
    if (state.products && state.products.length > 0) {
      await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.products)
      }).catch(() => null);
    }

    // Push departments
    if (state.departments && state.departments.length > 0) {
      await fetch(`${baseUrl}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.departments)
      }).catch(() => null);
    }

    // Push employees
    if (state.employees && state.employees.length > 0) {
      await fetch(`${baseUrl}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.employees)
      }).catch(() => null);
    }

    // Push rooms
    if (state.rooms && state.rooms.length > 0) {
      await fetch(`${baseUrl}/rooms`, {
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
  // Local state update handled in main app
};

window.cloudDeleteProduct = async function(productId) {
  // Local state update handled in main app
};

window.cloudDeleteDepartment = async function(deptId) {
  // Local state update handled in main app
};

window.cloudDeleteEmployee = async function(empId) {
  // Local state update handled in main app
};

window.cloudDeleteRoom = async function(roomId) {
  // Local state update handled in main app
};

window.cloudClearAllRooms = async function() {};
window.cloudSyncUsers = async function() {};
window.cloudDeleteUser = async function() {};

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
    if (window.loadStorageData) window.loadStorageData();
    if (window.renderAllViews) window.renderAllViews();
  }
}

// Stub functions
window.openCloudSyncModal = function() {};
window.saveCloudSyncSettings = function() {};
window.disconnectCloudSync = function() {};
window.copySqlSchemaToClipboard = function() {};
window.updateCloudStatusBadge = function() {};
