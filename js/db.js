/* ==========================================================================
   DMCH Resto POS & MIS — Unified Real-Time Cloud Database Sync (Supabase Engine)
   ========================================================================== */

let supabaseClient = null;
let cloudSyncActive = false;
let _isSyncingFromCloud = false; // prevents re-entrant save loops

window.initCloudDatabase = function() {
  if (typeof supabase === 'undefined') {
    console.warn('Supabase JS SDK not loaded. Running in local mode.');
    return false;
  }

  const url = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '';
  const key = (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : '';

  if (!url || !key || url.includes('your-supabase-project-id') || key.includes('your-supabase-anon-key')) {
    console.log('Supabase cloud credentials not configured. Running in offline/local storage mode.');
    return false;
  }

  try {
    supabaseClient = supabase.createClient(url, key);
    cloudSyncActive = true;
    console.log('⚡ Unified Cloud Database Sync Connected via Supabase!');
    setupRealtimeListeners();
    pullCloudDataToState();
    return true;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return false;
  }
};

function setupRealtimeListeners() {
  if (!supabaseClient) return;

  try {
    supabaseClient
      .channel('dmch-resto-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('🔔 Realtime Cloud Update Received:', payload.table, payload.eventType);
        pullCloudDataToState();
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
  } catch (err) {
    console.warn('Realtime channel error:', err);
  }
}

window.pullCloudDataToState = async function() {
  if (!supabaseClient) return;

  _isSyncingFromCloud = true;

  try {
    // 1. Fetch Orders
    const { data: dbOrders, error: errOrders } = await supabaseClient.from('orders').select('*').order('timestamp', { ascending: false });
    if (!errOrders && Array.isArray(dbOrders)) {
      const fetchedOrders = dbOrders.map(o => ({
        id: o.id,
        timestamp: o.timestamp,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
        subtotal: Number(o.subtotal || 0),
        tax: Number(o.tax || 0),
        total: Number(o.total || 0),
        paymentMethod: o.payment_method,
        checkoutMode: o.checkout_mode,
        cashier: o.cashier,
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

    // 2. Fetch Products
    const { data: dbProducts, error: errProds } = await supabaseClient.from('products').select('*');
    if (!errProds && Array.isArray(dbProducts)) {
      const fetchedProds = dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.category_id,
        price: Number(p.price || 0),
        icon: p.icon || '☕',
        stock: Number(p.stock || 100)
      }));
      const localProds = Array.isArray(state.products) ? state.products : [];
      const unSyncedProds = localProds.filter(loc => !fetchedProds.some(rem => rem.id === loc.id));
      state.products = [...fetchedProds, ...unSyncedProds].filter(p => p && !/^p\d+$/.test(String(p.id)));
    }

    // 3. Fetch Departments
    const { data: dbDepts, error: errDepts } = await supabaseClient.from('departments').select('*');
    if (!errDepts && Array.isArray(dbDepts)) {
      const fetchedDepts = dbDepts.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        monthlyCreditLimit: Number(d.monthly_credit_limit || 100000)
      }));
      const localDepts = Array.isArray(state.departments) ? state.departments : [];
      const unSyncedDepts = localDepts.filter(loc => !fetchedDepts.some(rem => rem.id === loc.id));
      state.departments = [...fetchedDepts, ...unSyncedDepts].filter(d => d && !/^dept-\d+$/.test(String(d.id)));
    }

    // 4. Fetch Employees — Smart Merge so locally created staff NEVER vanish
    const { data: dbEmps, error: errEmps } = await supabaseClient.from('employees').select('*');
    if (!errEmps && Array.isArray(dbEmps)) {
      const fetchedEmps = dbEmps.map(e => ({
        id: e.id,
        staffId: e.staff_id,
        fullName: e.full_name,
        departmentId: e.department_id,
        monthlyCreditLimit: Number(e.monthly_credit_limit || 50000),
        currentBalance: Number(e.current_balance || 0)
      }));

      const localEmps = Array.isArray(state.employees) ? state.employees : [];
      const unSyncedEmps = localEmps.filter(loc => 
        !fetchedEmps.some(rem => rem.id === loc.id || (loc.staffId && rem.staffId === loc.staffId))
      );
      state.employees = [...fetchedEmps, ...unSyncedEmps].filter(e => e && !/^emp-\d+$/.test(String(e.id)));
    }

    // 5. Fetch Rooms
    const { data: dbRooms, error: errRooms } = await supabaseClient.from('rooms').select('*');
    if (!errRooms && Array.isArray(dbRooms)) {
      const fetchedRooms = dbRooms.map(r => ({
        id: r.id,
        roomNumber: r.room_number,
        tier: r.tier
      }));
      const localRooms = Array.isArray(state.rooms) ? state.rooms : [];
      const unSyncedRooms = localRooms.filter(loc => 
        !fetchedRooms.some(rem => rem.id === loc.id || (loc.roomNumber && rem.room_number === loc.roomNumber))
      );
      state.rooms = [...fetchedRooms, ...unSyncedRooms].filter(r => r && !/^room-\d+$/.test(String(r.id)));
    }

    // 6. Fetch Users — Smart Merge so user accounts created on live cloud server sync down
    const { data: dbUsers, error: errUsers } = await supabaseClient.from('users').select('*');
    if (!errUsers && Array.isArray(dbUsers)) {
      let localUsers = JSON.parse(localStorage.getItem('dmch_resto_users')) || [];
      const sampleUserIds = ['u-cashier', 'u-claire', 'u-jean', 'u-grace', 'u-david', 'u-samuel'];
      
      const fetchedUsers = dbUsers
        .filter(u => u && !sampleUserIds.includes(u.id))
        .map(u => ({
          id: u.id,
          username: u.username,
          fullName: (u.full_name || u.name || u.username).toUpperCase(),
          role: u.role,
          status: u.status || 'APPROVED',
          createdAt: u.created_at || new Date().toISOString()
        }));

      const mergedUsers = [...localUsers];
      fetchedUsers.forEach(fUser => {
        const existingIdx = mergedUsers.findIndex(lUser => lUser.id === fUser.id || (lUser.username && lUser.username.toLowerCase() === fUser.username.toLowerCase()));
        if (existingIdx >= 0) {
          mergedUsers[existingIdx].status = fUser.status;
          mergedUsers[existingIdx].role = fUser.role;
          if (!mergedUsers[existingIdx].fullName) mergedUsers[existingIdx].fullName = fUser.fullName;
        } else {
          mergedUsers.push(fUser);
        }
      });

      localStorage.setItem('dmch_resto_users', JSON.stringify(mergedUsers));
      if (window.renderUsers) window.renderUsers();
    }

    // Update local storage backup
    localStorage.setItem('dmch_resto_posData', JSON.stringify({
      orders: state.orders,
      products: state.products,
      categories: state.categories,
      departments: state.departments,
      employees: state.employees,
      tabReceipts: state.tabReceipts,
      rooms: state.rooms,
      auditLogs: state.auditLogs
    }));

    if (window.renderAllViews) window.renderAllViews();
  } catch (err) {
    console.error('Error pulling cloud data:', err);
  } finally {
    _isSyncingFromCloud = false;
  }
};

window.syncStateToCloud = async function() {
  if (!supabaseClient || _isSyncingFromCloud) return;

  try {
    // Upsert orders
    if (state.orders && state.orders.length > 0) {
      const dbOrders = state.orders.map(o => ({
        id: o.id,
        timestamp: o.timestamp,
        items: JSON.stringify(o.items || []),
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
        payment_method: o.paymentMethod || null,
        checkout_mode: o.checkoutMode,
        cashier: o.cashier || o.cashierName || null,
        employee_id: o.employeeId || null,
        department_id: o.departmentId || null,
        room_number: o.roomNumber || null,
        meal_type: o.mealType || null,
        patient_notes: o.patientNotes || null,
        status: o.status || 'COMPLETED'
      }));
      const { error } = await supabaseClient.from('orders').upsert(dbOrders, { onConflict: 'id' });
      if (error) console.error('Orders upsert error:', error);
    }

    // Upsert products or clear table if empty
    if (state.products && state.products.length > 0) {
      const dbProds = state.products.map(p => ({
        id: p.id,
        name: p.name,
        category_id: p.categoryId,
        price: p.price,
        icon: p.icon,
        stock: p.stock || 100
      }));
      const { error } = await supabaseClient.from('products').upsert(dbProds, { onConflict: 'id' });
      if (error) console.error('Products upsert error:', error);
    } else if (Array.isArray(state.products) && state.products.length === 0) {
      await supabaseClient.from('products').delete().neq('id', '___none___');
    }

    // Upsert departments or clear table if empty
    if (state.departments && state.departments.length > 0) {
      const dbDepts = state.departments.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        monthly_credit_limit: d.monthlyCreditLimit || 100000
      }));
      const { error } = await supabaseClient.from('departments').upsert(dbDepts, { onConflict: 'id' });
      if (error) console.error('Departments upsert error:', error);
    } else if (Array.isArray(state.departments) && state.departments.length === 0) {
      await supabaseClient.from('departments').delete().neq('id', '___none___');
    }

    // Upsert employees or clear table if empty
    if (state.employees && state.employees.length > 0) {
      const dbEmps = state.employees.map(e => ({
        id: e.id,
        staff_id: e.staffId,
        full_name: e.fullName,
        department_id: e.departmentId || null,
        monthly_credit_limit: e.monthlyCreditLimit || 50000,
        current_balance: e.currentBalance || 0
      }));
      const { error } = await supabaseClient.from('employees').upsert(dbEmps, { onConflict: 'id' });
      if (error) console.error('Employees upsert error:', error);
    } else if (Array.isArray(state.employees) && state.employees.length === 0) {
      await supabaseClient.from('employees').delete().neq('id', '___none___');
    }

    // Upsert rooms or clear table if empty
    if (state.rooms && state.rooms.length > 0) {
      const dbRooms = state.rooms.map(r => ({
        id: r.id,
        room_number: r.roomNumber,
        tier: r.tier
      }));
      const { error } = await supabaseClient.from('rooms').upsert(dbRooms, { onConflict: 'id' });
      if (error) console.error('Rooms upsert error:', error);
    } else if (Array.isArray(state.rooms) && state.rooms.length === 0) {
      await supabaseClient.from('rooms').delete().neq('id', '___none___');
    }
  } catch (err) {
    console.error('Error pushing data to cloud:', err);
  }
};

window.cloudDeleteOrder = async function(orderId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('orders').delete().eq('id', orderId);
    if (error) console.error('Cloud delete order error:', error);
  } catch (err) {
    console.error('Cloud delete order error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudDeleteProduct = async function(productId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('products').delete().eq('id', productId);
    if (error) console.error('Cloud delete product error:', error);
  } catch (err) {
    console.error('Cloud delete product error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudDeleteDepartment = async function(deptId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('departments').delete().eq('id', deptId);
    if (error) console.error('Cloud delete department error:', error);
  } catch (err) {
    console.error('Cloud delete department error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudDeleteEmployee = async function(empId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('employees').delete().eq('id', empId);
    if (error) console.error('Cloud delete employee error:', error);
  } catch (err) {
    console.error('Cloud delete employee error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudDeleteRoom = async function(roomId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error: e1 } = await supabaseClient.from('rooms').delete().eq('id', roomId);
    if (e1) console.error('Cloud delete room by id error:', e1);
    const { error: e2 } = await supabaseClient.from('rooms').delete().eq('room_number', roomId);
    if (e2) console.error('Cloud delete room by room_number error:', e2);
  } catch (err) {
    console.error('Cloud delete room error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudClearAllRooms = async function() {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('rooms').delete().neq('id', '___none___');
    if (error) console.error('Cloud clear all rooms error:', error);
  } catch (err) {
    console.error('Cloud clear all rooms error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

window.cloudSyncUsers = async function(users) {
  if (!supabaseClient || _isSyncingFromCloud) return;
  try {
    if (users && users.length > 0) {
      const dbUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        full_name: u.fullName || u.name || u.username,
        role: u.role,
        status: u.status || 'APPROVED',
        created_at: u.createdAt || new Date().toISOString()
      }));
      const { error } = await supabaseClient.from('users').upsert(dbUsers, { onConflict: 'id' });
      if (error) console.warn('Cloud sync users warning:', error);
    }
  } catch(err) {
    console.warn('Cloud sync users error:', err);
  }
};

window.cloudDeleteUser = async function(userId) {
  if (!supabaseClient) return;
  _isSyncingFromCloud = true;
  try {
    const { error } = await supabaseClient.from('users').delete().eq('id', userId);
    if (error) console.warn('Cloud delete user warning:', error);
  } catch(err) {
    console.warn('Cloud delete user error:', err);
  } finally {
    setTimeout(() => { _isSyncingFromCloud = false; }, 2000);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// REAL-TIME CROSS-TERMINAL LIVE BROADCAST ENGINE
// Instant zero-refresh sync across all connected windows, tabs, & terminals
// ══════════════════════════════════════════════════════════════════════════════

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

// Storage event listener fallback for cross-tab local storage changes
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
  // Local invocation in current tab
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

// Stub functions for removed cloud sync modal (keeps app from throwing errors)
window.openCloudSyncModal = function() {};
window.saveCloudSyncSettings = function() {};
window.disconnectCloudSync = function() {};
window.copySqlSchemaToClipboard = function() {};
window.updateCloudStatusBadge = function() {};
