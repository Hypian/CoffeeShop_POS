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

// Toast Notifications
window.showToast = function(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  
  let bgClass = '';
  let icon = '';
  switch(type) {
    case 'success': bgClass = 'bg-[#10B981]'; icon = '✅'; break;
    case 'warning': bgClass = 'bg-[#F59E0B] text-black'; icon = '⚠️'; break;
    case 'error': bgClass = 'bg-[#EF4444]'; icon = '❌'; break;
    case 'info': bgClass = 'bg-[#3B82F6]'; icon = 'ℹ️'; break;
  }
  
  toast.className = `toast animate-toast-in flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border border-black/[0.1] min-w-[300px] max-w-[420px] ${bgClass}`;
  toast.innerHTML = `<span class="text-lg">${icon}</span><span class="text-sm font-semibold flex-1">${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
};

// Modal Control Helpers
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('active');
  }
};

window.showConfirmModal = function({ title = '⚠️ Confirm Action', message = 'Are you sure?', confirmText = 'Yes, Delete', isDanger = true, onConfirm = null }) {
  const titleEl = document.getElementById('confirmDialogTitle');
  const msgEl = document.getElementById('confirmDialogMessage');
  const btnEl = document.getElementById('confirmDialogBtn');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  if (btnEl) {
    btnEl.textContent = confirmText;
    if (isDanger) {
      btnEl.className = 'bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl px-5 py-2.5 text-xs font-extrabold cursor-pointer border-none shadow-lg shadow-rose-500/20';
    } else {
      btnEl.className = 'bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] rounded-xl px-5 py-2.5 text-xs font-extrabold cursor-pointer border-none shadow-lg shadow-amber-500/20';
    }
    btnEl.onclick = async function() {
      window.closeModal('modalConfirmDialog');
      if (typeof onConfirm === 'function') {
        try {
          await onConfirm();
        } catch (e) {
          console.error('Error executing confirm action:', e);
        }
      }
    };
  }

  window.openModal('modalConfirmDialog');
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

function addAuditLog(action, details) {
  if (!state.auditLogs) state.auditLogs = [];
  state.auditLogs.unshift({
    id: generateId('log'),
    timestamp: new Date().toISOString(),
    action: action,
    details: details,
    user: state.currentSession ? state.currentSession.username : 'System'
  });
}
window.addAuditLog = addAuditLog;

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
      state.orders = [];
    }
    state.lastActiveDate = today;
    saveData();
  }
};
