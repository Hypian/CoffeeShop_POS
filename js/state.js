/* ==========================================================================
   DMCH Resto POS & MIS — Application State Management & Persistence
   ========================================================================== */

let state = {
  currentUser: { name: 'CHIEF CASHIER', role: 'admin' },
  activeTab: 'pos',
  products: [],
  departments: [],
  employees: [],
  rooms: [],
  orders: [],
  cart: [],
  categories: [],
  auditLogs: [],
  archives: [],
  tabReceipts: [],
  lastActiveDate: null,
  selectedCategory: 'cat-all',
  searchQuery: '',
  currentTabEmployee: null,
  currentSettleEmployee: null,
  lastReceiptOrder: null,
  currentSession: null,
  isProcessingPayment: false
};

// Toast Notifications & Action Verification Popups
window.showToast = function(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  
  let bgClass = '';
  let icon = '';
  let borderClass = '';
  let badgeTitle = 'Action Verified';

  switch(type) {
    case 'success': 
      bgClass = 'bg-[#0F172A] text-white'; 
      icon = '✅'; 
      borderClass = 'border-emerald-500/40 shadow-emerald-500/20';
      badgeTitle = 'Action Verified';
      break;
    case 'warning': 
      bgClass = 'bg-[#F59E0B] text-slate-950'; 
      icon = '⚠️'; 
      borderClass = 'border-amber-600/40 shadow-amber-500/20';
      badgeTitle = 'System Alert';
      break;
    case 'error': 
      bgClass = 'bg-[#EF4444] text-white'; 
      icon = '❌'; 
      borderClass = 'border-rose-600/40 shadow-rose-500/20';
      badgeTitle = 'Action Error';
      break;
    case 'info': 
      bgClass = 'bg-[#0F172A] text-white'; 
      icon = 'ℹ️'; 
      borderClass = 'border-blue-500/40 shadow-blue-500/20';
      badgeTitle = 'Information';
      break;
  }
  
  toast.className = `toast animate-toast-in flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${borderClass} min-w-[320px] max-w-[440px] ${bgClass} backdrop-blur-md z-[400]`;
  toast.innerHTML = `
    <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">${icon}</span>
    <div class="flex flex-col flex-1 gap-0.5">
      <span class="text-[0.65rem] font-extrabold uppercase tracking-wider opacity-75">${badgeTitle}</span>
      <span class="text-xs font-bold leading-snug">${message}</span>
    </div>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
};

// Modal Control Helpers
// The CSS uses the .hidden class to toggle opacity + pointer-events.
// We NEVER set inline display or opacity — that would fight the CSS rules.
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    // Clear any inline display/opacity overrides that may have been set previously
    modal.style.removeProperty('display');
    modal.style.removeProperty('opacity');
    modal.style.removeProperty('pointer-events');
    modal.style.removeProperty('visibility');
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    // Clear any inline overrides — CSS .hidden handles hiding via opacity:0 + pointer-events:none
    modal.style.removeProperty('display');
    modal.style.removeProperty('opacity');
    modal.style.removeProperty('pointer-events');
    modal.style.removeProperty('visibility');
  }
};

window.showConfirmModal = function({
  title = '⚠️ Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Yes, Confirm Action',
  isDanger = true,
  icon = '🗑️',
  badgeText = 'Irreversible Action',
  onConfirm = null
}) {
  const promptText = `${title}\n\n${message}`;
  if (window.confirm(promptText)) {
    if (typeof onConfirm === 'function') {
      try {
        onConfirm();
      } catch (err) {
        console.error('Error executing confirm action:', err);
      }
    }
  }
};

// Category Name Helper
function getCategoryName(catId) {
  const cat = state.categories.find(c => c.id === catId);
  return cat ? cat.name : 'Unknown';
}

// Utility Generators & Formatters
function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatMoney(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString()}`;
}
window.formatMoney = formatMoney;

/**
 * escapeHTML — XSS Prevention Utility
 * Sanitizes any user-generated string before injecting into innerHTML.
 * Use this on ALL untrusted dynamic data (names, notes, reasons, etc.)
 */
window.escapeHTML = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

function addAuditLog(action, details) {
  if (!state.auditLogs) state.auditLogs = [];
  state.auditLogs.unshift({
    id: generateId('log'),
    timestamp: new Date().toISOString(),
    action: action,
    details: details,
    user: state.currentSession ? state.currentSession.username : 'System'
  });
  // Keep audit log bounded to last 500 entries to prevent unbounded growth
  if (state.auditLogs.length > 500) state.auditLogs = state.auditLogs.slice(0, 500);
}
window.addAuditLog = addAuditLog;

/**
 * addSecurityAuditLog — Security-tier audit events
 * Records authentication, access control, and user management events.
 * category: 'AUTH' | 'ACCESS' | 'USER_MGMT' | 'FINANCIAL' | 'DATA'
 */
window.addSecurityAuditLog = function(category, action, details, severity = 'INFO') {
  if (!state.auditLogs) state.auditLogs = [];
  const actor = state.currentSession ? state.currentSession.username : 'System';
  const entry = {
    id: generateId('sec'),
    timestamp: new Date().toISOString(),
    category,      // 'AUTH' | 'ACCESS' | 'USER_MGMT' | 'FINANCIAL' | 'DATA'
    severity,      // 'INFO' | 'WARNING' | 'CRITICAL'
    action,
    details,
    user: actor,
    role: (state.currentSession && state.currentSession.role) || 'unknown',
    isSecurityEvent: true
  };
  // Prepend so newest events are always at the top
  state.auditLogs.unshift(entry);
  if (state.auditLogs.length > 500) state.auditLogs = state.auditLogs.slice(0, 500);
  // Persist immediately so security events survive page refreshes
  if (window.saveData) window.saveData();
};

// Storage Data Persistence & Cloud Synchronization
window.loadStorageData = function() {
  const d = localStorage.getItem('dmch_resto_posData') || localStorage.getItem('posData');
  if (d) {
    try {
      const parsed = JSON.parse(d);
      state.categories = Array.isArray(parsed.categories) ? parsed.categories : [...DEFAULT_CATEGORIES];
      state.products = Array.isArray(parsed.products) ? parsed.products : [...DEFAULT_PRODUCTS];
      state.departments = Array.isArray(parsed.departments) ? parsed.departments : [...DEFAULT_DEPARTMENTS];
      state.employees = Array.isArray(parsed.employees) ? parsed.employees : [...DEFAULT_EMPLOYEES];
      state.rooms = Array.isArray(parsed.rooms) ? parsed.rooms : [...DEFAULT_ROOMS];
      state.orders = Array.isArray(parsed.orders) ? parsed.orders : [];
      state.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
      state.archives = Array.isArray(parsed.archives) ? parsed.archives : [];
      state.tabReceipts = Array.isArray(parsed.tabReceipts) ? parsed.tabReceipts : [];
      state.lastActiveDate = parsed.lastActiveDate || new Date().toLocaleDateString();
    } catch(e) {
      console.error("Failed to parse storage data:", e);
      state.categories = [...DEFAULT_CATEGORIES];
      state.products = [...DEFAULT_PRODUCTS];
      state.departments = [...DEFAULT_DEPARTMENTS];
      state.employees = [...DEFAULT_EMPLOYEES];
      state.rooms = [...DEFAULT_ROOMS];
      state.orders = [];
      state.auditLogs = [];
      state.archives = [];
      state.tabReceipts = [];
      state.lastActiveDate = new Date().toLocaleDateString();
    }
  } else {
    state.categories = [...DEFAULT_CATEGORIES];
    state.products = [...DEFAULT_PRODUCTS];
    state.departments = [...DEFAULT_DEPARTMENTS];
    state.employees = [...DEFAULT_EMPLOYEES];
    state.rooms = [...DEFAULT_ROOMS];
    state.orders = [];
    state.auditLogs = [];
    state.archives = [];
    state.tabReceipts = [];
    state.lastActiveDate = new Date().toLocaleDateString();
  }

  // Populate sample orders if no orders exist, to ensure historical days have data out of the box
  if (!state.orders || state.orders.length === 0) {
    const todayObj = new Date();
    const yesterdayObj = new Date(todayObj.getTime() - 86400000);
    const formatDateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayKey = formatDateKey(todayObj);
    const yesterdayKey = formatDateKey(yesterdayObj);

    state.orders = [
      {
        id: 'ORD-882101',
        timestamp: `${yesterdayKey}T08:30:00.000Z`,
        cashierName: 'CHIEF CASHIER',
        checkoutMode: 'DIRECT_PAYMENT',
        paymentMethod: 'CASH',
        items: [
          { productId: 'p1', name: 'Café Espresso', price: 2000, qty: 2, subtotal: 4000 },
          { productId: 'p5', name: 'Butter Croissant', price: 1500, qty: 1, subtotal: 1500 }
        ],
        total: 5500,
        status: 'COMPLETED'
      },
      {
        id: 'ORD-882102',
        timestamp: `${yesterdayKey}T12:15:00.000Z`,
        cashierName: 'CHIEF CASHIER',
        checkoutMode: 'INSTITUTIONAL_TAB',
        paymentMethod: 'TAB',
        employeeName: 'JEAN-PAUL HABIMANA',
        staffId: 'EMP-1001',
        departmentName: 'ENGINEERING & MAINTENANCE',
        items: [
          { productId: 'p2', name: 'Cappuccino', price: 2500, qty: 1, subtotal: 2500 },
          { productId: 'p6', name: 'Club Sandwich', price: 4500, qty: 1, subtotal: 4500 }
        ],
        total: 7000,
        status: 'COMPLETED'
      },
      {
        id: 'ORD-882103',
        timestamp: `${yesterdayKey}T18:45:00.000Z`,
        cashierName: 'CHIEF CASHIER',
        checkoutMode: 'PATIENT_ROOM_ORDER',
        paymentMethod: 'ROOM_PERK',
        roomNumber: 'Room 204 (VIP)',
        mealType: 'Dinner',
        billingType: 'COVERED_PERK',
        patientNotes: 'Patient Soft Diet',
        items: [
          { productId: 'p3', name: 'Fresh Fruit Juice', price: 3000, qty: 1, subtotal: 3000 },
          { productId: 'p7', name: 'Chicken Soup', price: 5000, qty: 1, subtotal: 5000 }
        ],
        total: 8000,
        status: 'COMPLETED'
      },
      {
        id: 'ORD-882104',
        timestamp: `${todayKey}T09:10:00.000Z`,
        cashierName: 'CHIEF CASHIER',
        checkoutMode: 'DIRECT_PAYMENT',
        paymentMethod: 'MOBILE_MONEY',
        items: [
          { productId: 'p1', name: 'Café Latte', price: 2500, qty: 2, subtotal: 5000 }
        ],
        total: 5000,
        status: 'COMPLETED'
      },
      {
        id: 'ORD-882105',
        timestamp: `${todayKey}T13:20:00.000Z`,
        cashierName: 'CHIEF CASHIER',
        checkoutMode: 'INSTITUTIONAL_TAB',
        paymentMethod: 'TAB',
        employeeName: 'DR. MARIE CLAIRE',
        staffId: 'EMP-1002',
        departmentName: 'LABORATORY & PATHOLOGY',
        items: [
          { productId: 'p4', name: 'Black Tea', price: 1500, qty: 1, subtotal: 1500 },
          { productId: 'p6', name: 'Club Sandwich', price: 4500, qty: 1, subtotal: 4500 }
        ],
        total: 6000,
        status: 'COMPLETED'
      }
    ];
    saveData();
  }

  // Initialize Unified Cloud Sync & Start 10s Fallback Sync Polling
  if (window.initCloudDatabase) {
    window.initCloudDatabase();
  }
  
  if (!window._cloudPollTimer) {
    window._cloudPollTimer = setInterval(() => {
      if (window.pullCloudDataToState) {
        window.pullCloudDataToState();
      }
    }, 10000);
  }
};

window.saveData = function() {
  if (!state.lastActiveDate) state.lastActiveDate = new Date().toLocaleDateString();
  localStorage.setItem('dmch_resto_posData', JSON.stringify({
    menuVersion: '6.0',
    categories: state.categories,
    products: state.products,
    departments: state.departments,
    employees: state.employees,
    rooms: state.rooms,
    orders: state.orders,
    auditLogs: state.auditLogs,
    archives: state.archives,
    tabReceipts: state.tabReceipts,
    lastActiveDate: state.lastActiveDate
  }));

  // Broadcast live sync event across connected terminals
  if (window.broadcastLiveSync && !_isSyncingFromCloud) {
    window.broadcastLiveSync({ type: 'DATA_UPDATED' });
  }

  // Only push to cloud if this save was initiated locally (not from a cloud pull)
  if (typeof _isSyncingFromCloud !== 'undefined' && _isSyncingFromCloud) return;
  if (window.syncStateToCloud) {
    window.syncStateToCloud();
  }
};

window.checkAutoRollover = function() {
  const today = new Date().toLocaleDateString();
  if (state.lastActiveDate && state.lastActiveDate !== today) {
    if (state.orders.length > 0) {
      const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
      const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
      const totalRev = revDirect + revTab;
      
      state.archives.push({
        id: generateId('shift'),
        timestamp: new Date().toISOString(),
        ordersCount: state.orders.length,
        totalRevenue: totalRev,
        directSales: revDirect,
        tabCredits: revTab,
        closedBy: 'System Auto-Rollover'
      });
      
      addAuditLog("Auto-Shift Closed", "System auto-archived " + state.orders.length + " orders for " + state.lastActiveDate);
    }
    state.lastActiveDate = today;
    saveData();
  }
};
