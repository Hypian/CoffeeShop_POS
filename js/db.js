/* ==========================================================================
   DMCH Resto POS & MIS — Unified Real-Time Cloud Database Sync (Supabase Engine)
   ========================================================================== */

let supabaseClient = null;
let cloudSyncActive = false;

window.initCloudDatabase = function() {
  if (typeof supabase === 'undefined') {
    console.warn('Supabase JS SDK not loaded. Running in local mode.');
    return false;
  }

  const url = window.SUPABASE_URL || (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '');
  const key = window.SUPABASE_ANON_KEY || (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '');

  if (!url || !key || url.includes('your-supabase-project-id') || key.includes('your-supabase-anon-key')) {
    console.log('Supabase cloud credentials not configured yet. Running in offline/local storage mode.');
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
        console.log('🔔 Realtime Cloud Update Received:', payload);
        pullCloudDataToState();
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime channel error:', err);
  }
}

window.pullCloudDataToState = async function() {
  if (!supabaseClient) return;

  try {
    // 1. Fetch Orders
    const { data: dbOrders, error: errOrders } = await supabaseClient.from('orders').select('*').order('timestamp', { ascending: false });
    if (!errOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
      state.orders = dbOrders.map(o => ({
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
    }

    // 2. Fetch Products
    const { data: dbProducts, error: errProds } = await supabaseClient.from('products').select('*');
    if (!errProds && Array.isArray(dbProducts) && dbProducts.length > 0) {
      state.products = dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.category_id,
        price: Number(p.price || 0),
        icon: p.icon || '☕',
        stock: Number(p.stock || 100)
      }));
    }

    // 3. Fetch Departments
    const { data: dbDepts, error: errDepts } = await supabaseClient.from('departments').select('*');
    if (!errDepts && Array.isArray(dbDepts) && dbDepts.length > 0) {
      state.departments = dbDepts.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        monthlyCreditLimit: Number(d.monthly_credit_limit || 100000)
      }));
    }

    // 4. Fetch Employees
    const { data: dbEmps, error: errEmps } = await supabaseClient.from('employees').select('*');
    if (!errEmps && Array.isArray(dbEmps) && dbEmps.length > 0) {
      state.employees = dbEmps.map(e => ({
        id: e.id,
        staffId: e.staff_id,
        fullName: e.full_name,
        departmentId: e.department_id,
        monthlyCreditLimit: Number(e.monthly_credit_limit || 50000),
        currentBalance: Number(e.current_balance || 0)
      }));
    }

    // 5. Fetch Rooms
    const { data: dbRooms, error: errRooms } = await supabaseClient.from('rooms').select('*');
    if (!errRooms && Array.isArray(dbRooms) && dbRooms.length > 0) {
      state.rooms = dbRooms.map(r => ({
        id: r.id,
        roomNumber: r.room_number,
        tier: r.tier
      }));
    }

    // Update local storage backup and refresh UI views
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
  }
};

window.syncStateToCloud = async function() {
  if (!supabaseClient) return;

  try {
    // Upsert latest orders
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
        cashier: o.cashier || null,
        employee_id: o.employeeId || null,
        department_id: o.departmentId || null,
        room_number: o.roomNumber || null,
        meal_type: o.mealType || null,
        patient_notes: o.patientNotes || null,
        status: o.status || 'COMPLETED'
      }));
      await supabaseClient.from('orders').upsert(dbOrders, { onConflict: 'id' });
    }

    // Upsert products
    if (state.products && state.products.length > 0) {
      const dbProds = state.products.map(p => ({
        id: p.id,
        name: p.name,
        category_id: p.categoryId,
        price: p.price,
        icon: p.icon,
        stock: p.stock
      }));
      await supabaseClient.from('products').upsert(dbProds, { onConflict: 'id' });
    }

    // Upsert employees
    if (state.employees && state.employees.length > 0) {
      const dbEmps = state.employees.map(e => ({
        id: e.id,
        staff_id: e.staffId,
        full_name: e.fullName,
        department_id: e.departmentId || null,
        monthly_credit_limit: e.monthlyCreditLimit,
        current_balance: e.currentBalance
      }));
      await supabaseClient.from('employees').upsert(dbEmps, { onConflict: 'id' });
    }

    // Upsert rooms
    if (state.rooms && state.rooms.length > 0) {
      const dbRooms = state.rooms.map(r => ({
        id: r.id,
        room_number: r.roomNumber,
        tier: r.tier
      }));
      await supabaseClient.from('rooms').upsert(dbRooms, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Error pushing data to cloud:', err);
  }
};

window.cloudDeleteOrder = async function(orderId) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('orders').delete().eq('id', orderId);
  } catch (err) {
    console.error('Cloud delete order error:', err);
  }
};

window.cloudDeleteProduct = async function(productId) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('products').delete().eq('id', productId);
  } catch (err) {
    console.error('Cloud delete product error:', err);
  }
};

window.cloudDeleteDepartment = async function(deptId) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('departments').delete().eq('id', deptId);
  } catch (err) {
    console.error('Cloud delete department error:', err);
  }
};

window.cloudDeleteEmployee = async function(empId) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('employees').delete().eq('id', empId);
  } catch (err) {
    console.error('Cloud delete employee error:', err);
  }
};

window.cloudDeleteRoom = async function(roomId) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('rooms').delete().eq('id', roomId);
  } catch (err) {
    console.error('Cloud delete room error:', err);
  }
};

window.cloudClearAllRooms = async function() {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('rooms').delete().neq('id', '___none___');
  } catch (err) {
    console.error('Cloud clear all rooms error:', err);
  }
};
