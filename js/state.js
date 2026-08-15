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
  users: [],
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
      bgClass = 'bg-[#1A3A52] text-white'; 
      icon = "<i class=\'bx bx-check\'></i>"; 
      borderClass = 'border-emerald-500/40 shadow-emerald-500/20';
      badgeTitle = 'Action Verified';
      break;
    case 'warning': 
      bgClass = 'bg-[#1A3A52] text-slate-950'; 
      icon = "<i class=\'bx bx-error\'></i>"; 
      borderClass = 'border-amber-600/40 shadow-amber-500/20';
      badgeTitle = 'System Alert';
      break;
    case 'error': 
      bgClass = 'bg-[#EF4444] text-white'; 
      icon = "<i class=\'bx bx-x\'></i>"; 
      borderClass = 'border-rose-600/40 shadow-rose-500/20';
      badgeTitle = 'Action Error';
      break;
    case 'info': 
      bgClass = 'bg-[#1A3A52] text-white'; 
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

let _pendingConfirmCallback = null;

window.executeConfirmAction = function() {
  window.closeModal('modalConfirmDialog');
  if (typeof _pendingConfirmCallback === 'function') {
    const cb = _pendingConfirmCallback;
    _pendingConfirmCallback = null;
    try {
      cb();
    } catch (err) {
      console.error('Error executing confirm action:', err);
    }
  }
};

window.showConfirmModal = function({
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Yes, Confirm Action',
  isDanger = true,
  icon = '',
  badgeText = 'Irreversible Action',
  onConfirm = null
}) {
  _pendingConfirmCallback = onConfirm;

  const titleEl = document.getElementById('confirmDialogTitleText');
  const msgEl = document.getElementById('confirmDialogMessage');
  const btnEl = document.getElementById('confirmDialogBtn');
  const badgeEl = document.getElementById('confirmDialogBadge');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (badgeEl) badgeEl.textContent = badgeText;

  if (btnEl) {
    btnEl.textContent = confirmText;
    btnEl.onclick = function() {
      window.executeConfirmAction();
    };
  }

  const modal = document.getElementById('modalConfirmDialog');
  if (modal) {
    window.openModal('modalConfirmDialog');
  } else {
    if (window.confirm(`${title}\n\n${message}`)) {
      window.executeConfirmAction();
    }
  }
};

// Category Name Helper
function getCategoryName(catId) {
  if (!catId) return 'GENERAL';
  if (!Array.isArray(state.categories)) return String(catId).toUpperCase();
  const cat = state.categories.find(c => c && (c.id === catId || (c.name && c.name.toLowerCase() === String(catId).toLowerCase())));
  if (cat && cat.name) return cat.name.toUpperCase();
  return String(catId).toUpperCase();
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
  // 1. Initialize empty state
  state.categories = [...DEFAULT_CATEGORIES];
  state.products = [];
  state.departments = [];
  state.employees = [];
  state.rooms = [];
  state.orders = [];
  state.auditLogs = [];
  state.archives = [];
  state.tabReceipts = [];
  state.lastActiveDate = new Date().toLocaleDateString();

  // 2. Try to load from localStorage
  try {
    const localData = localStorage.getItem('dmch_resto_posData');
    if (localData) {
      const parsed = JSON.parse(localData);
      // Preserve current active session and user before assigning
      const activeSession = state.currentSession;
      const activeUser = state.currentUser;
      
      Object.assign(state, parsed);
      
      // Restore active session and user
      if (activeSession) state.currentSession = activeSession;
      if (activeUser) state.currentUser = activeUser;
    }
  } catch(e) {}
  
  // 2b. Reset volatile UI state flags that should not persist across sessions/reloads
  state.isProcessingPayment = false;

  // 3. Initialize Cloud Database Connection & Fetch Live PostgreSQL Data
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



window.saveData = function({ sync = true } = {}) {
  if (!state.lastActiveDate) state.lastActiveDate = new Date().toLocaleDateString();

  try {
    localStorage.setItem('dmch_resto_posData', JSON.stringify(state));
  } catch(e) {}

  // Broadcast live sync event across connected terminals
  if (window.broadcastLiveSync) {
    window.broadcastLiveSync({ type: 'DATA_UPDATED' });
  }

  // Always push directly to Render cloud database API
  if (sync && window.syncStateToCloud) {
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
