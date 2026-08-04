'use strict';

const DEFAULT_CATEGORIES = [
  { id: 'cat-all', name: 'All Items', icon: '☕' },
  { id: 'cat-coffee', name: 'Coffee & Espresso', icon: '☕' },
  { id: 'cat-snacks', name: 'Snacks & Bites', icon: '🥪' },
  { id: 'cat-softdrinks', name: 'Soft Drinks & Soda', icon: '🥤' },
  { id: 'cat-freshjuice', name: 'Fresh Juice', icon: '🧃' },
  { id: 'cat-pastries', name: 'Pastries & Bakery', icon: '🥐' }
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Double Espresso', categoryId: 'cat-coffee', price: 3500, costPrice: 800, stock: 120, icon: '☕' },
  { id: 'p2', name: 'Cappuccino Large', categoryId: 'cat-coffee', price: 4800, costPrice: 1200, stock: 95, icon: '☕' },
  { id: 'p3', name: 'Iced Caramel Latte', categoryId: 'cat-coffee', price: 5500, costPrice: 1500, stock: 60, icon: '🥤' },
  { id: 'p4', name: 'Club Sandwich & Chips', categoryId: 'cat-snacks', price: 8500, costPrice: 3200, stock: 35, icon: '🥪' },
  { id: 'p5', name: 'Butter Croissant', categoryId: 'cat-pastries', price: 3200, costPrice: 900, stock: 40, icon: '🥐' },
  { id: 'p6', name: 'Fresh Passion Juice', categoryId: 'cat-freshjuice', price: 4000, costPrice: 1100, stock: 50, icon: '🧃' },
  { id: 'p7', name: 'Sparkling Mineral Water', categoryId: 'cat-softdrinks', price: 2500, costPrice: 600, stock: 150, icon: '🥤' },
  { id: 'p8', name: 'Classic Cold Brew', categoryId: 'cat-coffee', price: 4500, costPrice: 1100, stock: 80, icon: '🧊' },
  { id: 'p9', name: 'Chicken Avocado Wrap', categoryId: 'cat-snacks', price: 7800, costPrice: 2900, stock: 25, icon: '🌯' },
  { id: 'p10', name: 'Blueberry Muffin', categoryId: 'cat-pastries', price: 3500, costPrice: 850, stock: 30, icon: '🧁' }
];

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-fin', code: 'FIN', name: 'Finance & Accounting', monthlyCreditLimit: 1500000 },
  { id: 'dept-hr', code: 'HR', name: 'Human Resources', monthlyCreditLimit: 1200000 },
  { id: 'dept-it', code: 'IT', name: 'IT & Digital Systems', monthlyCreditLimit: 1800000 },
  { id: 'dept-med', code: 'MED', name: 'Clinical Services', monthlyCreditLimit: 2500000 },
  { id: 'dept-exec', code: 'EXEC', name: 'Executive Suite', monthlyCreditLimit: 3000000 }
];

const DEFAULT_EMPLOYEES = [
  { id: 'emp-101', staffId: 'EMP-8841', fullName: 'DR. SARAH JENNINGS', departmentId: 'dept-med', currentBalance: 142500 },
  { id: 'emp-102', staffId: 'EMP-8842', fullName: 'MICHAEL CHEN', departmentId: 'dept-it', currentBalance: 88000 },
  { id: 'emp-103', staffId: 'EMP-8843', fullName: 'ELIZABETH TAYLOR', departmentId: 'dept-fin', currentBalance: 215400 },
  { id: 'emp-104', staffId: 'EMP-8844', fullName: 'DAVID OKONKWO', departmentId: 'dept-hr', currentBalance: 45000 },
  { id: 'emp-105', staffId: 'EMP-8845', fullName: 'AMANDA STEVENS', departmentId: 'dept-exec', currentBalance: 310000 }
];

const DEFAULT_ORDERS = [
  {
    id: 'ORD-20260804-001',
    timestamp: '2026-08-04T08:30:00Z',
    cashierName: 'ALICE CASHIER',
    checkoutMode: 'DIRECT_PAYMENT',
    paymentMethod: 'CASH',
    subtotal: 13300, tax: 0, total: 13300,
    items: [
      { productId: 'p2', name: 'Cappuccino Large', price: 4800, qty: 1, subtotal: 4800 },
      { productId: 'p4', name: 'Club Sandwich & Chips', price: 8500, qty: 1, subtotal: 8500 }
    ],
    status: 'COMPLETED'
  },
  {
    id: 'ORD-20260804-002',
    timestamp: '2026-08-04T09:15:00Z',
    cashierName: 'ALICE CASHIER',
    checkoutMode: 'INSTITUTIONAL_TAB',
    paymentMethod: 'PAYROLL_DEDUCTION',
    departmentId: 'dept-med', departmentName: 'Clinical Services',
    employeeId: 'emp-101', employeeName: 'DR. SARAH JENNINGS', staffId: 'EMP-8841',
    subtotal: 11300, tax: 0, total: 11300,
    items: [
      { productId: 'p1', name: 'Double Espresso', price: 3500, qty: 1, subtotal: 3500 },
      { productId: 'p9', name: 'Chicken Avocado Wrap', price: 7800, qty: 1, subtotal: 7800 }
    ],
    status: 'COMPLETED',
    signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
];

let state = {
  currentUser: { name: 'CHIEF CASHIER', role: 'admin' },
  activeTab: 'pos',
  products: [],
  departments: [],
  employees: [],
  orders: [],
  cart: [],
  categories: [],
  auditLogs: [],
  archives: [],
  selectedCategory: 'cat-all',
  searchQuery: '',
  currentTabEmployee: null,
  currentSettleEmployee: null,
  lastReceiptOrder: null,
  currentSession: null
};

// ── Default User Accounts ──
const DEFAULT_USERS = [
  { username: 'cashier', password: '123', fullName: 'STAFF CASHIER', role: 'cashier' },
  { username: 'waiter', password: '123', fullName: 'SERVICE WAITER', role: 'waiter' },
  { username: 'admin', password: '123', fullName: 'CHIEF ADMIN', role: 'admin' }
];

// Utilities
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

function getCategoryName(catId) {
  const cat = state.categories.find(c => c.id === catId);
  return cat ? cat.name : 'Unknown';
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatMoney(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString()}`;
}
window.formatMoney = formatMoney;

function loadStorageData() {
  const d = localStorage.getItem('posData');
  if (d) {
    try {
      const parsed = JSON.parse(d);
      state.categories = (parsed.categories && parsed.categories.length) ? parsed.categories : DEFAULT_CATEGORIES;
      state.products = (parsed.products && parsed.products.length) ? parsed.products : DEFAULT_PRODUCTS;
      state.departments = (parsed.departments && parsed.departments.length) ? parsed.departments : DEFAULT_DEPARTMENTS;
      state.employees = (parsed.employees && parsed.employees.length) ? parsed.employees : DEFAULT_EMPLOYEES;
      state.orders = (parsed.orders && parsed.orders.length) ? parsed.orders : DEFAULT_ORDERS;
      state.auditLogs = parsed.auditLogs ? parsed.auditLogs : [];
      state.archives = parsed.archives ? parsed.archives : [];
      state.lastActiveDate = parsed.lastActiveDate || new Date().toLocaleDateString();
      state.auditLogs = parsed.auditLogs ? parsed.auditLogs : [];
      state.archives = parsed.archives ? parsed.archives : [];
      state.lastActiveDate = parsed.lastActiveDate || new Date().toLocaleDateString();
      
      // Auto-migrate old USD data to RWF
      if (state.products.some(p => p.price < 500)) {
        state.products = DEFAULT_PRODUCTS;
        state.departments = DEFAULT_DEPARTMENTS;
        state.employees = DEFAULT_EMPLOYEES;
        state.orders = DEFAULT_ORDERS;
        saveData();
      }
    } catch(e) {
      state.categories = [...DEFAULT_CATEGORIES];
      state.products = [...DEFAULT_PRODUCTS];
      state.departments = [...DEFAULT_DEPARTMENTS];
      state.employees = [...DEFAULT_EMPLOYEES];
      state.orders = [...DEFAULT_ORDERS];
      state.auditLogs = [];
      state.archives = [];
      state.lastActiveDate = new Date().toLocaleDateString();
      state.auditLogs = [];
      state.archives = [];
      state.lastActiveDate = new Date().toLocaleDateString();
    }
  } else {
    state.categories = [...DEFAULT_CATEGORIES];
    state.products = [...DEFAULT_PRODUCTS];
    state.departments = [...DEFAULT_DEPARTMENTS];
    state.employees = [...DEFAULT_EMPLOYEES];
    state.orders = [...DEFAULT_ORDERS];
    state.auditLogs = [];
    state.archives = [];
    state.lastActiveDate = new Date().toLocaleDateString();
    state.auditLogs = [];
    state.archives = [];
    state.lastActiveDate = new Date().toLocaleDateString();
  }
}

function saveData() {
  localStorage.setItem('posData', JSON.stringify({
    categories: state.categories,
    products: state.products,
    departments: state.departments,
    employees: state.employees,
    orders: state.orders
  }));
}


window.saveData = function() {
  if (!state.lastActiveDate) state.lastActiveDate = new Date().toLocaleDateString();
  localStorage.setItem('posData', JSON.stringify({
    categories: state.categories,
    products: state.products,
    departments: state.departments,
    employees: state.employees,
    orders: state.orders,
    auditLogs: state.auditLogs,
    archives: state.archives,
    lastActiveDate: state.lastActiveDate
  }));
}

// Navigation & Initialization
function switchView(viewName) {
  state.activeTab = viewName;
  document.querySelectorAll('.nav-tab').forEach(el => {
    if (el.dataset.view === viewName) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  document.querySelectorAll('.view-panel').forEach(el => {
    if (el.id === `view-${viewName}`) {
      el.classList.remove('hidden');
      el.classList.add('active');
    } else {
      el.classList.add('hidden');
      el.classList.remove('active');
    }
  });
  renderAllViews();
}

function updateUserBadge() {
  const nameEl = document.getElementById('topbarUserName');
  const roleEl = document.getElementById('topbarUserRole');
  const mNameEl = document.getElementById('mobileUserName');
  const mRoleEl = document.getElementById('mobileUserRole');
  
  const displayName = state.currentSession ? state.currentSession.fullName : state.currentUser.name;
  const displayRole = state.currentSession ? state.currentSession.role : state.currentUser.role;
  const roleText = displayRole === 'admin' ? 'Administrator' : 'Cashier';
  
  if (nameEl) nameEl.textContent = displayName;
  if (roleEl) roleEl.textContent = roleText;
  if (mNameEl) mNameEl.textContent = displayName;
  if (mRoleEl) mRoleEl.textContent = roleText;
}

window.toggleMobileMenu = function() {
  const menu = document.getElementById('mobileNavMenu');
  const btn = document.getElementById('hamburgerBtn');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (btn) btn.textContent = '✕';
  } else {
    menu.classList.add('hidden');
    if (btn) btn.textContent = '☰';
  }
};

function renderAllViews() {
  renderCategoryPills();
  renderProductGrid();
  renderCart();
  renderDashboard();
  renderDepartmentLedgers();
  renderProductManagement();
  renderReports();
}

// POS View
function renderCategoryPills() {
  const container = document.getElementById('categoryPillsContainer');
  if (!container) return;
  container.innerHTML = state.categories.map(cat => `
    <button class="cat-pill flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F1F5F9] border border-black/[0.1] text-sm font-semibold text-[#475569] cursor-pointer whitespace-nowrap ${state.selectedCategory === cat.id ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      <span>${cat.icon}</span> ${cat.name}
    </button>
  `).join('');
}

window.selectCategory = function(catId) {
  state.selectedCategory = catId;
  renderCategoryPills();
  renderProductGrid();
};

function renderProductGrid() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = state.products.filter(p => {
    const matchCat = state.selectedCategory === 'cat-all' || p.categoryId === state.selectedCategory;
    const matchQuery = p.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[#475569]">No products found.</div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 cursor-pointer relative select-none" onclick="addToCart('${p.id}')">
      <span class="absolute top-2.5 right-2.5 text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${p.stock < 15 ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#10B981]/10 text-[#10B981]'}">${p.stock} in stock</span>
      <div class="w-12 h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-2xl mb-3">${p.icon}</div>
      <div class="font-bold text-sm text-[#0F172A] mb-1">${p.name}</div>
      <div class="text-[0.7rem] text-[#475569] font-medium mb-3">${getCategoryName(p.categoryId)}</div>
      <div class="flex items-center justify-between pt-2 border-t border-black/[0.1]">
        <div class="font-extrabold text-base text-[#F59E0B]">${formatMoney(p.price)}</div>
        <button class="w-8 h-8 rounded-lg bg-[#F59E0B] text-black flex items-center justify-center font-bold text-lg hover:bg-[#FBBF24] transition-colors">+</button>
      </div>
    </div>
  `).join('');
}

window.addToCart = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const cartItem = state.cart.find(x => x.productId === productId);
  if (cartItem) {
    if (cartItem.qty >= p.stock) {
      window.showToast('Not enough stock available', 'error');
      return;
    }
    cartItem.qty += 1;
    cartItem.subtotal = cartItem.qty * cartItem.price;
  } else {
    if (p.stock <= 0) {
      window.showToast('Out of stock', 'error');
      return;
    }
    state.cart.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: 1,
      subtotal: p.price
    });
  }
  renderCart();
};

window.updateCartQty = function(productId, delta) {
  const cartItem = state.cart.find(x => x.productId === productId);
  if (!cartItem) return;
  const p = state.products.find(x => x.id === productId);
  
  if (delta > 0 && cartItem.qty + delta > p.stock) {
    window.showToast('Not enough stock available', 'error');
    return;
  }
  
  cartItem.qty += delta;
  if (cartItem.qty <= 0) {
    state.cart = state.cart.filter(x => x.productId !== productId);
  } else {
    cartItem.subtotal = cartItem.qty * cartItem.price;
  }
  renderCart();
};



window.clearCart = function() {
  state.cart = [];
  renderCart();
};

function calculateCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = 0; // Configurable if needed
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotalText');
  const totalEl = document.getElementById('cartTotalText');
  const btnDirect = document.getElementById('btnCheckoutDirect');
  const btnTab = document.getElementById('btnCheckoutTab');
  
  if (!list) return;

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-[#475569] text-center gap-3 py-10">
        <div class="text-5xl opacity-40">🛒</div>
        <p class="font-medium">Your order cart is empty.</p>
        <span class="text-xs">Tap items on the left to start building an order.</span>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = 'RWF 0';
    if (totalEl) totalEl.textContent = 'RWF 0';
    if (btnDirect) btnDirect.disabled = false;
    if (btnTab) btnTab.disabled = false;
    return;
  }

  list.innerHTML = state.cart.map(item => `
    <div class="cart-item-row flex items-center justify-between p-3 rounded-xl bg-[#F1F5F9] border border-black/[0.1]">
      <div class="flex-1 pr-3">
        <div class="font-bold text-sm text-[#0F172A]">${item.name}</div>
        <div class="text-xs text-[#475569]">${formatMoney(item.price)} each</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#F59E0B] hover:text-black transition-colors" onclick="updateCartQty('${item.productId}',-1)">−</button>
        <span class="text-sm font-bold w-5 text-center">${item.qty}</span>
        <button class="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#F59E0B] hover:text-black transition-colors" onclick="updateCartQty('${item.productId}',1)">+</button>
      </div>
      <div class="font-extrabold text-sm text-[#F59E0B] ml-3 min-w-[55px] text-right">${formatMoney(item.subtotal)}</div>
    </div>
  `).join('');

  const totals = calculateCartTotals();
  if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);
  if (totalEl) totalEl.textContent = formatMoney(totals.total);
  if (btnDirect) btnDirect.disabled = false;
  if (btnTab) btnTab.disabled = false;
}

// Checkout - Direct
window.handlePaymentMethodChange = function() {
  const method = document.getElementById('directPaymentMethod')?.value || 'CASH';
  const cashBox = document.getElementById('paymentDetailsCash');
  const cardBox = document.getElementById('paymentDetailsCard');
  const momoBox = document.getElementById('paymentDetailsMomo');
  
  if (cashBox) cashBox.classList.toggle('hidden', method !== 'CASH');
  if (cardBox) cardBox.classList.toggle('hidden', method !== 'CARD');
  if (momoBox) momoBox.classList.toggle('hidden', method !== 'MOBILE_MONEY');
};

window.openDirectCheckoutModal = function() {
  if (state.cart.length === 0) {
    window.showToast('Your cart is empty! Tap menu items on the left to add them.', 'warning');
    return;
  }
  const totals = calculateCartTotals();
  const totalEl = document.getElementById('directTotalText');
  const tenderedEl = document.getElementById('directCashTendered');
  
  if (totalEl) totalEl.textContent = formatMoney(totals.total);
  if (tenderedEl) tenderedEl.value = '';
  const methodSelect = document.getElementById('directPaymentMethod');
  if (methodSelect) methodSelect.value = 'CASH';
  
  window.handlePaymentMethodChange();
  window.calculateCashChange();
  window.openModal('modalDirectCheckout');
};

window.calculateCashChange = function() {
  const totals = calculateCartTotals();
  const tenderedEl = document.getElementById('directCashTendered');
  const changeEl = document.getElementById('directChangeDueText');
  if (!tenderedEl || !changeEl) return;
  
  const tendered = parseFloat(tenderedEl.value) || 0;
  const change = Math.max(0, tendered - totals.total);
  changeEl.textContent = formatMoney(change);
};

window.setCashPreset = function(amount) {
  const tenderedEl = document.getElementById('directCashTendered');
  if (tenderedEl) {
    tenderedEl.value = amount;
    window.calculateCashChange();
  }
};

window.processDirectPayment = function() {
  if (window.checkAutoRollover) window.checkAutoRollover();
  const method = document.getElementById('directPaymentMethod').value;
  const totals = calculateCartTotals();
  let paymentDetails = '';

  if (method === 'CASH') {
    const tendered = parseFloat(document.getElementById('directCashTendered').value) || 0;
    if (tendered < totals.total) {
      window.showToast('Cash tendered is less than order total', 'error');
      return;
    }
    paymentDetails = `Cash (${formatMoney(tendered)} tendered, ${formatMoney(tendered - totals.total)} change)`;
  } else if (method === 'CARD') {
    const cardRef = document.getElementById('directCardRef')?.value.trim() || 'POS-TERMINAL-OK';
    paymentDetails = `Card Payment (${cardRef})`;
  } else if (method === 'MOBILE_MONEY') {
    const provider = document.getElementById('directMomoProvider')?.value || 'MTN MoMo';
    const phone = document.getElementById('directMomoNumber')?.value.trim();
    paymentDetails = `${provider} ${phone ? `(${phone})` : '(Paid)'}`;
  }

  const order = {
    id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
    timestamp: new Date().toISOString(),
    cashierName: state.currentUser.name,
    checkoutMode: 'DIRECT_PAYMENT',
    paymentMethod: method,
    paymentDetails: paymentDetails,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    items: JSON.parse(JSON.stringify(state.cart)),
    status: 'COMPLETED'
  };

  state.cart.forEach(item => {
    const p = state.products.find(x => x.id === item.productId);
    if (p) p.stock -= item.qty;
  });

  state.orders.unshift(order);
  saveData();
  window.clearCart();
  window.closeModal('modalDirectCheckout');
  window.showToast(`Payment approved via ${method.replace('_', ' ')}`, 'success');
  renderAllViews();
  showReceiptModal(order);
};

// Checkout - Tab
window.openTabCheckoutModal = function() {
  if (state.cart.length === 0) {
    window.showToast('Your cart is empty! Tap menu items on the left to add them.', 'warning');
    return;
  }
  const totals = calculateCartTotals();
  const totalEl = document.getElementById('tabTotalText');
  const deptSelect = document.getElementById('checkoutDeptSelect');
  
  if (totalEl) totalEl.textContent = formatMoney(totals.total);
  
  if (deptSelect) {
    deptSelect.innerHTML = `<option value="">-- Select Department --</option>` + 
      state.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    deptSelect.value = '';
  }
  
  const empSelect = document.getElementById('checkoutEmpSelect');
  if (empSelect) {
    empSelect.innerHTML = `<option value="">-- Select Employee --</option>`;
    empSelect.disabled = true;
  }
  
  state.currentTabEmployee = null;
  window.updateEmployeeTabPreview(null);
  window.clearSignature();
  window.openModal('modalTabCheckout');
};

window.populateEmployeeDropdown = function(deptId) {
  const empSelect = document.getElementById('checkoutEmpSelect');
  if (!empSelect) return;
  if (!deptId) {
    empSelect.innerHTML = `<option value="">-- Select Employee --</option>`;
    empSelect.disabled = true;
    window.updateEmployeeTabPreview(null);
    return;
  }
  const emps = state.employees.filter(e => e.departmentId === deptId);
  empSelect.innerHTML = `<option value="">-- Select Employee --</option>` + 
    emps.map(e => `<option value="${e.id}">${e.fullName} (${e.staffId})</option>`).join('');
  empSelect.disabled = false;
  window.updateEmployeeTabPreview(null);
};

window.updateEmployeeTabPreview = function(empId) {
  state.currentTabEmployee = state.employees.find(e => e.id === empId) || null;
  const badge = document.getElementById('tabEmpCreditBadge');
  if (!badge) return;
  
  if (!state.currentTabEmployee) {
    badge.innerHTML = '';
    return;
  }
  
  const dept = state.departments.find(d => d.id === state.currentTabEmployee.departmentId);
  const limit = dept ? dept.monthlyCreditLimit : 0;
  const totalAfter = state.currentTabEmployee.currentBalance + calculateCartTotals().total;
  
  if (totalAfter > limit) {
    badge.innerHTML = `<span class="bg-[#EF4444]/20 text-[#EF4444] px-3 py-1 rounded-full text-xs font-bold border border-[#EF4444]/30">Limit Exceeded (${formatMoney(totalAfter)} / ${formatMoney(limit)})</span>`;
  } else {
    badge.innerHTML = `<span class="bg-[#10B981]/20 text-[#10B981] px-3 py-1 rounded-full text-xs font-bold border border-[#10B981]/30">Approved (${formatMoney(totalAfter)} / ${formatMoney(limit)})</span>`;
  }
};

let signatureCtx = null;
let isDrawing = false;

window.initSignatureCanvas = function() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  signatureCtx = canvas.getContext('2d');
  signatureCtx.lineWidth = 3;
  signatureCtx.lineCap = 'round';
  signatureCtx.strokeStyle = '#F59E0B';
  
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getPos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
    if (e.type === 'touchstart') e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
    if (e.type === 'touchmove') e.preventDefault();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // Mouse events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Touch events for smartphones & tablets
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
};

window.clearSignature = function() {
  const canvas = document.getElementById('signatureCanvas');
  if (canvas && signatureCtx) {
    signatureCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

window.processTabPayment = function() {
  if (window.checkAutoRollover) window.checkAutoRollover();
  if (!state.currentTabEmployee) {
    window.showToast('Please select an employee for tab checkout', 'error');
    return;
  }
  
  const totals = calculateCartTotals();
  const dept = state.departments.find(d => d.id === state.currentTabEmployee.departmentId);
  const limit = dept ? dept.monthlyCreditLimit : 0;
  const totalAfter = state.currentTabEmployee.currentBalance + totals.total;

  if (totalAfter > limit && state.currentUser.role !== 'admin') {
    window.showToast(`Credit limit exceeded! (${formatMoney(totalAfter)} / ${formatMoney(limit)}). Admin authorization required.`, 'error');
    return;
  }

  const canvas = document.getElementById('signatureCanvas');
  const signatureDataUrl = canvas ? canvas.toDataURL() : '';
  
  const order = {
    id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
    timestamp: new Date().toISOString(),
    cashierName: state.currentUser.name,
    checkoutMode: 'INSTITUTIONAL_TAB',
    paymentMethod: 'PAYROLL_DEDUCTION',
    departmentId: dept.id,
    departmentName: dept.name,
    employeeId: state.currentTabEmployee.id,
    employeeName: state.currentTabEmployee.fullName,
    staffId: state.currentTabEmployee.staffId,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    items: JSON.parse(JSON.stringify(state.cart)),
    status: 'COMPLETED',
    signatureDataUrl: signatureDataUrl
  };

  state.currentTabEmployee.currentBalance += totals.total;
  
  state.cart.forEach(item => {
    const p = state.products.find(x => x.id === item.productId);
    if (p) p.stock -= item.qty;
  });

  state.orders.unshift(order);
  saveData();
  window.clearCart();
  window.closeModal('modalTabCheckout');
  window.showToast(`Tab order authorized for ${state.currentTabEmployee.fullName}`, 'success');
  renderAllViews();
  showReceiptModal(order);
};

// Dashboard
function animateValue(obj, start, end, duration, prefix, decimals) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = progress * (end - start) + start;
    obj.innerHTML = `${prefix}${value.toFixed(decimals)}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function renderDashboard() {
  const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
  const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
  const totalRev = revDirect + revTab;
  
  animateValue(document.getElementById('kpiTotalRevenue'), 0, totalRev, 600, 'RWF ', 0);
  animateValue(document.getElementById('kpiCashRevenue'), 0, revDirect, 600, 'RWF ', 0);
  animateValue(document.getElementById('kpiCreditRevenue'), 0, revTab, 600, 'RWF ', 0);
  animateValue(document.getElementById('kpiTotalOrders'), 0, state.orders.length, 600, '', 0);

  const tbody = document.getElementById('recentOrdersTbody');
  if (!tbody) return;
  tbody.innerHTML = state.orders.slice(0, 50).map(o => {
    const time = new Date(o.timestamp).toLocaleString();
    return `
      <tr>
        <td><span class="font-mono font-bold text-[#F59E0B] text-xs">${o.id}</span></td>
        <td class="text-[#475569]">${time}</td>
        <td><span class="badge ${o.checkoutMode === 'DIRECT_PAYMENT' ? 'badge-cash' : 'badge-tab'}">${o.checkoutMode === 'DIRECT_PAYMENT' ? '💵 Direct' : '💳 Tab'}</span></td>
        <td>${o.employeeName ? `${o.employeeName} (${o.staffId})` : 'Walk-in Customer'}</td>
        <td class="font-bold">${formatMoney(o.total)}</td>
        <td><button class="text-xs font-semibold text-[#F59E0B] hover:underline cursor-pointer bg-transparent border-none" onclick="reprintReceipt('${o.id}')">View Receipt</button></td>
      </tr>
    `;
  }).join('');
}

// Ledgers
function renderDepartmentLedgers() {
  const tbody = document.getElementById('deptLedgerTbody');
  if (!tbody) return;
  tbody.innerHTML = state.employees.map(emp => {
    const dept = state.departments.find(d => d.id === emp.departmentId);
    const limit = dept ? dept.monthlyCreditLimit : 1;
    const usagePct = Math.min((emp.currentBalance / limit) * 100, 100);
    const deptName = dept ? dept.name : 'Unknown';
    return `
      <tr>
        <td><span class="font-mono font-bold text-xs">${emp.staffId}</span></td>
        <td class="font-semibold">${emp.fullName}</td>
        <td class="text-[#475569]">${deptName}</td>
        <td>${formatMoney(limit)}</td>
        <td><span class="font-bold" style="color:${emp.currentBalance > 0 ? '#F59E0B' : '#10B981'}">${formatMoney(emp.currentBalance)}</span></td>
        <td>
          <div class="progress-bar" style="width:100px; height:6px; background:#2A3350; border-radius:3px; overflow:hidden;">
            <div class="progress-fill" style="height:100%; width:${usagePct}%;background:${usagePct > 80 ? '#EF4444' : '#F59E0B'}"></div>
          </div>
        </td>
        <td><button class="text-xs font-bold text-[#10B981] hover:underline cursor-pointer bg-transparent border-none" onclick="openSettleModal('${emp.id}')">Settle Tab</button></td>
      </tr>
    `;
  }).join('');
}

window.openSettleModal = function(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (!emp) return;
  state.currentSettleEmployee = emp;
  const infoEl = document.getElementById('settleEmpInfo');
  const balEl = document.getElementById('settleBalance');
  const partEl = document.getElementById('settlePartialAmount');
  if (infoEl) infoEl.textContent = `${emp.fullName} (${emp.staffId})`;
  if (balEl) balEl.textContent = formatMoney(emp.currentBalance);
  if (partEl) partEl.value = '';
  window.openModal('modalSettleTab');
};

window.applyPartialSettle = function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  const amt = parseFloat(document.getElementById('settlePartialAmount').value) || 0;
  if (amt <= 0 || amt > emp.currentBalance) {
    window.showToast('Invalid amount', 'error');
    return;
  }
  emp.currentBalance -= amt;
  addAuditLog("Tab Partial Settlement", `Settled RWF ${amt} for ${emp.fullName}`);
  saveData();
  window.closeModal('modalSettleTab');
  window.showToast(`Settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  renderAllViews();
};

window.applyFullSettle = function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  if (emp.currentBalance <= 0) {
    window.showToast('Balance is already zero', 'info');
    return;
  }
  const amt = emp.currentBalance;
  emp.currentBalance = 0;
  addAuditLog("Tab Full Settlement", `Fully settled RWF ${amt} for ${emp.fullName}`);
  saveData();
  window.closeModal('modalSettleTab');
  window.showToast(`Fully settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  renderAllViews();
};

// Admin Department & Employee Management
window.openAddDepartmentModal = function() {
  if (state.currentSession && state.currentSession.role !== 'admin') {
    window.showToast('Only administrators can add departments.', 'warning');
    return;
  }
  document.getElementById('addDeptName').value = '';
  document.getElementById('addDeptCode').value = '';
  document.getElementById('addDeptLimit').value = '';
  window.openModal('modalAddDepartment');
};

window.saveNewDepartment = function() {
  const name = (document.getElementById('addDeptName').value || '').trim().toUpperCase();
  const code = (document.getElementById('addDeptCode').value || '').trim().toUpperCase();
  const limit = parseFloat(document.getElementById('addDeptLimit').value) || 0;

  if (!name || !code) {
    window.showToast('Department name and code are required.', 'error');
    return;
  }

  const newDept = {
    id: generateId('dept'),
    code: code,
    name: name,
    monthlyCreditLimit: limit
  };

  state.departments.push(newDept);
  saveData();
  window.closeModal('modalAddDepartment');
  window.showToast(`Department "${name}" created successfully!`, 'success');
  renderAllViews();
};

window.openAddEmployeeModal = function() {
  if (state.currentSession && state.currentSession.role !== 'admin') {
    window.showToast('Only administrators can add staff accounts.', 'warning');
    return;
  }

  const deptSelect = document.getElementById('addEmpDeptSelect');
  if (deptSelect) {
    deptSelect.innerHTML = state.departments.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
  }

  document.getElementById('addEmpFullName').value = '';
  document.getElementById('addEmpStaffId').value = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  document.getElementById('addEmpInitialBalance').value = '0';
  window.openModal('modalAddEmployee');
};

window.saveNewEmployee = function() {
  const fullName = (document.getElementById('addEmpFullName').value || '').trim().toUpperCase();
  const deptId = document.getElementById('addEmpDeptSelect').value;
  const staffId = (document.getElementById('addEmpStaffId').value || '').trim().toUpperCase();
  const initBal = parseFloat(document.getElementById('addEmpInitialBalance').value) || 0;

  if (!fullName || !staffId || !deptId) {
    window.showToast('Full name, department, and staff ID are required.', 'error');
    return;
  }

  if (state.employees.some(e => e.staffId === staffId)) {
    window.showToast(`Staff ID "${staffId}" already exists.`, 'error');
    return;
  }

  const newEmp = {
    id: generateId('emp'),
    staffId: staffId,
    fullName: fullName,
    departmentId: deptId,
    currentBalance: initBal
  };

  state.employees.push(newEmp);
  saveData();
  window.closeModal('modalAddEmployee');
  window.showToast(`Staff account "${fullName}" created successfully!`, 'success');
  renderAllViews();
};

// Inventory / Product Management
function renderProductManagement() {
  const tbody = document.getElementById('productsTableTbody');
  if (!tbody) return;
  tbody.innerHTML = state.products.map(p => {
    return `
      <tr>
        <td>${p.icon} <strong>${p.name}</strong></td>
        <td class="text-[#475569]">${getCategoryName(p.categoryId)}</td>
        <td class="font-bold">${formatMoney(p.price)}</td>
        <td class="font-mono text-[#475569]">${formatMoney(p.costPrice)}</td>
        <td><span class="badge ${p.stock < 15 ? 'badge-overdue' : 'badge-active'}">${p.stock} units</span></td>
        <td>
          <button onclick="editProduct('${p.id}')" class="text-xs font-semibold text-[#F59E0B] hover:underline cursor-pointer bg-transparent border-none mr-2">Edit</button>
          <button onclick="deleteProduct('${p.id}')" class="text-xs font-semibold text-[#EF4444] hover:underline cursor-pointer bg-transparent border-none">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddProductModal = function() {
  state.editingProductId = null;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = '➕ Add Product';
  
  const ids = ['addProdName', 'addProdPrice', 'addProdCostPrice', 'addProdStock', 'addProdIconPreview'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT') el.value = '';
      else if (id === 'addProdIconPreview') el.textContent = '📦';
    }
  });
  const cat = document.getElementById('addProdCategory');
  if (cat) {
    cat.innerHTML = state.categories.filter(c => c.id !== 'cat-all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  document.getElementById('addProdIcon').value = '📦';
  window.openModal('modalAddProduct');
};

window.editProduct = function(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  
  state.editingProductId = id;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = '✏️ Edit Product';
  
  const cat = document.getElementById('addProdCategory');
  if (cat) {
    cat.innerHTML = state.categories.filter(c => c.id !== 'cat-all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  document.getElementById('addProdName').value = product.name;
  document.getElementById('addProdCategory').value = product.categoryId;
  document.getElementById('addProdPrice').value = product.price;
  document.getElementById('addProdCostPrice').value = product.costPrice;
  document.getElementById('addProdStock').value = product.stock;
  document.getElementById('addProdIconPreview').textContent = product.icon;
  document.getElementById('addProdIcon').value = product.icon;
  
  window.openModal('modalAddProduct');
};

window.deleteProduct = function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    const product = state.products.find(p => p.id === id);
    if (product) addAuditLog("Product Deleted", `Deleted product ${product.name}`);
    state.products = state.products.filter(p => p.id !== id);
    saveData();
    window.showToast('Product deleted', 'success');
    renderAllViews();
  }
};

window.selectProductIcon = function(emoji) {
  document.getElementById('addProdIcon').value = emoji;
  document.getElementById('addProdIconPreview').textContent = emoji;
};

window.saveNewProduct = function() {
  const name = document.getElementById('addProdName').value.trim();
  const catId = document.getElementById('addProdCategory').value;
  const price = parseFloat(document.getElementById('addProdPrice').value) || 0;
  const cost = parseFloat(document.getElementById('addProdCostPrice').value) || 0;
  const stock = parseInt(document.getElementById('addProdStock').value) || 0;
  const icon = document.getElementById('addProdIcon').value || '📦';
  
  if (!name) { window.showToast('Product name is required', 'error'); return; }
  
  if (state.editingProductId) {
    const product = state.products.find(p => p.id === state.editingProductId);
    if (product) {
      product.name = name;
      product.categoryId = catId;
      product.price = price;
      product.costPrice = cost;
      product.stock = stock;
      product.icon = icon;
    }
    state.editingProductId = null;
    addAuditLog("Product Edited", `Updated details for ${name}`);
    window.showToast('Product updated successfully', 'success');
  } else {
    state.products.push({
      id: generateId('p'),
      name,
      categoryId: catId,
      price,
      costPrice: cost,
      stock,
      icon
    });
    addAuditLog("Product Added", `Added new product ${name}`);
    window.showToast('Product added successfully', 'success');
  }
  
  saveData();
  window.closeModal('modalAddProduct');
  renderAllViews();
};


window.closeShift = function() {
  if (confirm("Are you sure you want to close the shift? This will archive all current orders and reset the dashboard totals to RWF 0.")) {
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
      closedBy: state.currentSession ? state.currentSession.username : 'Admin'
    });
    
    addAuditLog("Shift Closed", `Closed shift with ${state.orders.length} orders totaling ${formatMoney(totalRev)}`);
    state.orders = []; // Clear current orders
    saveData();
    window.showToast('Shift closed successfully. Sales archived.', 'success');
    renderAllViews();
  }
};

// Reports View Renderer

window.printHRReport = function() {
  const depts = state.departments;
  let printHtml = `
    <div style="font-family:sans-serif; color:#000; padding:20px; max-width:800px; margin:0 auto;">
      <h1 style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px;">HR Payroll Deductions Report</h1>
      <p style="text-align:right; font-size:12px; color:#555;">Generated: ${new Date().toLocaleString()}</p>
      <p style="font-size:14px; margin-bottom:30px;">This report details the outstanding Tab/Credit balances for all employees, grouped by department, to be deducted from payroll.</p>
  `;
  
  let hasData = false;
  depts.forEach(d => {
    const emps = state.employees.filter(e => e.departmentId === d.id && e.currentBalance > 0);
    if (emps.length > 0) {
      hasData = true;
      printHtml += `
        <h3 style="margin-top:20px; background-color:#f1f5f9; padding:8px 12px; font-size:16px;">Department: ${d.name} (${d.code})</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:14px;">
          <tr style="border-bottom:2px solid #000;">
            <th style="text-align:left; padding:8px;">Staff ID</th>
            <th style="text-align:left; padding:8px;">Employee Name</th>
            <th style="text-align:right; padding:8px;">Amount to Deduct</th>
          </tr>
      `;
      let deptTotal = 0;
      emps.forEach(e => {
        deptTotal += e.currentBalance;
        printHtml += `
          <tr style="border-bottom:1px solid #ccc;">
            <td style="padding:8px;">${e.staffId || 'N/A'}</td>
            <td style="padding:8px;">${e.fullName}</td>
            <td style="text-align:right; padding:8px;">${formatMoney(e.currentBalance)}</td>
          </tr>
        `;
      });
      printHtml += `
          <tr style="font-weight:bold; background-color:#f8fafc;">
            <td colspan="2" style="padding:8px; text-align:right;">Department Total:</td>
            <td style="text-align:right; padding:8px;">${formatMoney(deptTotal)}</td>
          </tr>
        </table>
      `;
    }
  });

  if (!hasData) {
    printHtml += `<p style="text-align:center; font-style:italic; padding:30px 0;">No outstanding balances to report.</p>`;
  }

  const totalOutstanding = state.employees.reduce((s,e)=>s+e.currentBalance, 0);
  printHtml += `
      <div style="margin-top:30px; font-size:18px; font-weight:bold; text-align:right; border-top:2px solid #000; padding-top:10px;">
        Total Organization Deductions: ${formatMoney(totalOutstanding)}
      </div>
      
      <div style="margin-top:80px; display:flex; justify-content:space-between; font-size:14px;">
        <div style="width: 45%;">
          <p style="margin-bottom:40px;">Prepared By (Manager):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name & Signature</p>
        </div>
        <div style="width: 45%;">
          <p style="margin-bottom:40px;">Received By (HR Department):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
        </div>
      </div>
    </div>
  `;
  
  const printWindow = window.open('', '', 'width=800,height=800');
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

function renderReports() {
  const container = document.getElementById('reportsContent');
  if (!container) return;

  const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
  const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
  const totalRev = revDirect + revTab;
  const totalOrders = state.orders.length;
  const avgOrder = totalOrders > 0 ? (totalRev / totalOrders) : 0;
  const totalOutstanding = state.employees.reduce((s,e)=>s+e.currentBalance, 0);

  container.innerHTML = `
    <!-- Top Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Total Revenue</div>
        <div class="text-2xl font-extrabold text-[#10B981]">${formatMoney(totalRev)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">${totalOrders} transactions recorded</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Direct Sales (Cash)</div>
        <div class="text-2xl font-extrabold text-[#3B82F6]">${formatMoney(revDirect)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Paid directly</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Payroll Credit (Tabs)</div>
        <div class="text-2xl font-extrabold text-[#F59E0B]">${formatMoney(revTab)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Institutional charges</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Avg Order Value</div>
        <div class="text-2xl font-extrabold text-[#A855F7]">${formatMoney(avgOrder)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Per receipt</div>
      </div>
    </div>

    <!-- Official Report Banner & Action -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-2xl">📄</div>
        <div>
          <h3 class="text-base font-bold text-[#0F172A]">Official End-of-Day MIS Audit Report</h3>
          <p class="text-xs text-[#475569]">Generate & print full A4 management report with financial breakdown and department tab balances.</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="printDailyA4Report()" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#F59E0B]/20">
          <span>🖨</span> Print A4 Report
        </button>
      </div>
    </div>

    <!-- HR Export Banner -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-4 mb-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-2xl">👥</div>
        <div>
          <h3 class="text-base font-bold text-[#0F172A]">HR Payroll Deductions Export</h3>
          <p class="text-xs text-[#475569]">Print a grouped department-by-department report of all outstanding staff consumed tabs for salary deductions.</p>
        </div>
      </div>
      <button onclick="printHRReport()" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#8B5CF6]/20">
        🖨 Export HR Report
      </button>
    </div>

    <!-- Department Credit Balances Summary Table -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><span>🏛️</span> Department Tab Ledger Summary</h3>
        <span class="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/20">Total Outstanding: ${formatMoney(totalOutstanding)}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-[#475569] border-b border-black/[0.1] text-xs uppercase tracking-wider">
              <th class="py-2.5 px-3">Staff ID</th>
              <th class="py-2.5 px-3">Employee Name</th>
              <th class="py-2.5 px-3">Department</th>
              <th class="py-2.5 px-3">Monthly Limit</th>
              <th class="py-2.5 px-3">Current Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.1]">
            ${state.employees.map(e => {
              const dept = state.departments.find(d => d.id === e.departmentId);
              return `
                <tr>
                  <td class="py-3 px-3 font-mono text-xs text-[#F59E0B]">${e.staffId}</td>
                  <td class="py-3 px-3 font-semibold text-[#0F172A]">${e.fullName}</td>
                  <td class="py-3 px-3 text-[#475569]">${dept ? dept.name : e.departmentId}</td>
                  <td class="py-3 px-3 text-[#475569]">${formatMoney(dept ? dept.monthlyCreditLimit : 0)}</td>
                  <td class="py-3 px-3 font-bold ${e.currentBalance > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}">${formatMoney(e.currentBalance)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Receipt & Printing
function showReceiptModal(order) {
  state.lastReceiptOrder = order;
  const preview = document.getElementById('receiptPreviewContent');
  if (!preview) return;
  
  const itemsHtml = order.items.map(item => `
    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
      <span>${item.qty}x ${item.name}</span>
      <span>${formatMoney(item.subtotal)}</span>
    </div>
  `).join('');

  let paymentInfo = `Payment: ${order.paymentMethod}`;
  if (order.checkoutMode === 'INSTITUTIONAL_TAB') {
    paymentInfo = `Tab: ${order.employeeName} (${order.staffId})<br>Dept: ${order.departmentName}`;
  }

  preview.innerHTML = `
    <div style="text-align:center; font-family:monospace; color:#333;">
      <h3 style="margin:0; font-size:16px;">THE COFFEE SHOP</h3>
      <p style="margin:4px 0 12px; font-size:12px; color:#666;">Corporate HQ Campus</p>
      <div style="text-align:left; font-size:12px; border-bottom:1px dashed #ccc; padding-bottom:8px; margin-bottom:8px;">
        Order: ${order.id}<br>
        Date: ${new Date(order.timestamp).toLocaleString()}<br>
        Cashier: ${order.cashierName}
      </div>
      <div style="text-align:left; margin-bottom:12px; color:#000;">
        ${itemsHtml}
      </div>
      <div style="text-align:right; border-top:1px dashed #ccc; padding-top:8px; font-weight:bold;">
        TOTAL: ${formatMoney(order.total)}
      </div>
      <div style="text-align:left; font-size:12px; margin-top:12px; color:#555;">
        ${paymentInfo}
      </div>
      ${order.signatureDataUrl ? `<div style="margin-top:12px;"><img src="${order.signatureDataUrl}" style="max-height:40px; background:#eee;" alt="Signature"></div>` : ''}
      <div style="margin-top:16px; font-size:12px; text-align:center;">Thank you!</div>
    </div>
  `;
  window.openModal('modalReceipt');
}

window.reprintReceipt = function(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) showReceiptModal(order);
};

window.triggerPrintReceipt = function() {
  if (state.lastReceiptOrder) {
    print80mmReceipt(state.lastReceiptOrder);
  }
};

function print80mmReceipt(order) {
  const container = document.getElementById('print-container');
  if (!container) return;
  container.innerHTML = document.getElementById('receiptPreviewContent').innerHTML;
  window.print();
}

window.printDailyA4Report = function() {
  const container = document.getElementById('print-container');
  if (!container) return;
  
  const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
  const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
  
  container.innerHTML = `
    <div style="font-family:sans-serif; color:#000; padding:20px;">
      <h1 style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px;">Daily MIS Report</h1>
      <p style="text-align:right;">Date & Time: ${new Date().toLocaleString()}</p>
      
      <h2>Financial Summary</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <tr><td style="border:1px solid #000; padding:8px;">Total Revenue</td><td style="border:1px solid #000; padding:8px; font-weight:bold;">${formatMoney(revDirect+revTab)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">Direct Sales (Cash)</td><td style="border:1px solid #000; padding:8px;">${formatMoney(revDirect)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">Institutional Tabs (Credit)</td><td style="border:1px solid #000; padding:8px;">${formatMoney(revTab)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">Total Orders</td><td style="border:1px solid #000; padding:8px;">${state.orders.length}</td></tr>
      </table>
      
      <h2>Department Tab Balances</h2>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#eee;">
            <th style="border:1px solid #000; padding:8px; text-align:left;">Employee</th>
            <th style="border:1px solid #000; padding:8px; text-align:left;">Department</th>
            <th style="border:1px solid #000; padding:8px; text-align:right;">Outstanding Balance</th>
          </tr>
        </thead>
        <tbody>
          ${state.employees.filter(e => e.currentBalance > 0).map(e => `
            <tr>
              <td style="border:1px solid #000; padding:8px;">${e.fullName} (${e.staffId})</td>
              <td style="border:1px solid #000; padding:8px;">${getCategoryName(e.departmentId) || e.departmentId}</td>
              <td style="border:1px solid #000; padding:8px; text-align:right;">${formatMoney(e.currentBalance)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  window.print();
}

// Events
function setupEventListeners() {
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.addEventListener('click', () => switchView(el.dataset.view));
  });
  
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProductGrid();
    });
  }
  
  const deptSelect = document.getElementById('checkoutDeptSelect');
  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      window.populateEmployeeDropdown(e.target.value);
    });
  }
  
  const empSelect = document.getElementById('checkoutEmpSelect');
  if (empSelect) {
    empSelect.addEventListener('change', (e) => {
      window.updateEmployeeTabPreview(e.target.value);
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      if (state.cart.length > 0) window.openDirectCheckoutModal();
    } else if (e.key === 'F3') {
      e.preventDefault();
      if (state.cart.length > 0) window.openTabCheckoutModal();
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
  });
  
  const handleRoleToggle = () => {
    if (state.currentSession && state.currentSession.role !== 'admin') {
      showToast('Only administrators can switch roles.', 'warning');
      return;
    }
    const roles = ['admin', 'cashier', 'waiter'];
    const idx = roles.indexOf(state.currentUser.role);
    state.currentUser.role = roles[(idx + 1) % roles.length];
    
    if (state.currentSession) {
      state.currentSession.role = state.currentUser.role;
      sessionStorage.setItem('coffeeshop_session', JSON.stringify(state.currentSession));
    }
    updateUserBadge();
    applyRolePermissions();
    showToast(`Role switched to ${state.currentUser.role.toUpperCase()}`, 'info');
  };

  const roleToggle = document.getElementById('roleToggleBtn');
  if (roleToggle) roleToggle.addEventListener('click', handleRoleToggle);

  const mobileRoleToggle = document.getElementById('mobileRoleToggleBtn');
  if (mobileRoleToggle) mobileRoleToggle.addEventListener('click', handleRoleToggle);
  
  window.initSignatureCanvas();
}

// ── Authentication System ──
function seedDefaultUsers() {
  let existingUsers = JSON.parse(localStorage.getItem('coffeeshop_users'));
  if (!existingUsers) {
    existingUsers = [...DEFAULT_USERS];
  } else {
    // Merge any missing default users (e.g. newly added waiter)
    DEFAULT_USERS.forEach(defU => {
      if (!existingUsers.some(u => u.username === defU.username)) {
        existingUsers.push(defU);
      }
    });
  }
  localStorage.setItem('coffeeshop_users', JSON.stringify(existingUsers));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('coffeeshop_users')) || DEFAULT_USERS;
}

function saveUsers(users) {
  localStorage.setItem('coffeeshop_users', JSON.stringify(users));
}

function checkExistingSession() {
  const session = JSON.parse(sessionStorage.getItem('coffeeshop_session'));
  if (session) {
    state.currentSession = session;
    state.currentUser = { name: session.fullName, role: session.role };
    showMainApp();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  const authScreen = document.getElementById('authScreen');
  const mainApp = document.getElementById('mainAppContainer');
  if (authScreen) authScreen.classList.remove('hidden');
  if (mainApp) mainApp.classList.remove('authenticated');
}

function showMainApp() {
  const authScreen = document.getElementById('authScreen');
  const mainApp = document.getElementById('mainAppContainer');
  if (authScreen) authScreen.classList.add('hidden');
  if (mainApp) mainApp.classList.add('authenticated');
  
  loadStorageData();
  setupEventListeners();
  updateUserBadge();
  applyRolePermissions();
  switchView('pos');
}

function applyRolePermissions() {
  const role = state.currentUser.role || 'waiter';
  document.querySelectorAll('.nav-tab').forEach(el => {
    const view = el.dataset.view;
    let allowed = false;
    
    if (role === 'admin') {
      allowed = true;
    } else if (role === 'cashier') {
      allowed = ['pos', 'dashboard', 'ledgers'].includes(view);
    } else if (role === 'waiter') {
      allowed = ['pos'].includes(view);
    }
    
    if (allowed) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
      if (state.activeTab === view) {
        switchView('pos'); // Auto-redirect to POS if on forbidden tab
      }
    }
  });
}

window.handleLogin = function() {
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const errorDiv = document.getElementById('loginError');
  const errorText = document.getElementById('loginErrorText');
  
  const username = (usernameInput.value || '').trim().toLowerCase();
  const password = (passwordInput.value || '').trim();
  
  if (!username || !password) {
    errorText.textContent = 'Please enter both username and password.';
    errorDiv.classList.add('visible');
    return;
  }
  
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username && u.password === password);
  
  if (!user) {
    errorText.textContent = 'Invalid username or password. Please try again.';
    errorDiv.classList.add('visible');
    passwordInput.value = '';
    return;
  }
  
  const session = { username: user.username, fullName: user.fullName, role: user.role };
  sessionStorage.setItem('coffeeshop_session', JSON.stringify(session));
  state.currentSession = session;
  state.currentUser = { name: user.fullName, role: user.role };
  
  usernameInput.value = '';
  passwordInput.value = '';
  errorDiv.classList.remove('visible');
  
  showMainApp();
  showToast(`Welcome back, ${user.fullName}!`, 'success');
};

window.handleSignup = function() {
  const fullNameInput = document.getElementById('signupFullName');
  const usernameInput = document.getElementById('signupUsername');
  const passwordInput = document.getElementById('signupPassword');
  const confirmInput = document.getElementById('signupConfirmPassword');
  const roleSelect = document.getElementById('signupRole');
  const errorDiv = document.getElementById('signupError');
  const errorText = document.getElementById('signupErrorText');
  
  const fullName = (fullNameInput.value || '').trim();
  const username = (usernameInput.value || '').trim().toLowerCase();
  const password = (passwordInput.value || '').trim();
  const confirm = (confirmInput.value || '').trim();
  const role = roleSelect.value;
  
  if (!fullName || !username || !password || !confirm) {
    errorText.textContent = 'All fields are required.';
    errorDiv.classList.add('visible');
    return;
  }
  
  if (username.length < 3) {
    errorText.textContent = 'Username must be at least 3 characters.';
    errorDiv.classList.add('visible');
    return;
  }
  
  if (password !== confirm) {
    errorText.textContent = 'Passwords do not match.';
    errorDiv.classList.add('visible');
    confirmInput.value = '';
    return;
  }
  
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username)) {
    errorText.textContent = 'Username already exists. Choose a different one.';
    errorDiv.classList.add('visible');
    return;
  }
  
  const newUser = { username, password, fullName: fullName.toUpperCase(), role };
  users.push(newUser);
  saveUsers(users);
  
  fullNameInput.value = '';
  usernameInput.value = '';
  passwordInput.value = '';
  confirmInput.value = '';
  errorDiv.classList.remove('visible');
  
  showLoginForm();
  setTimeout(() => {
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');
    if (loginError && loginErrorText) {
      loginErrorText.textContent = '\u2705 Account created! Sign in with your credentials.';
      loginError.style.background = 'rgba(16,185,129,0.12)';
      loginError.style.color = '#10B981';
      loginError.style.borderColor = 'rgba(16,185,129,0.2)';
      loginError.classList.add('visible');
    }
  }, 100);
};

window.showLoginForm = function() {
  document.getElementById('loginForm').style.display = '';
  document.getElementById('signupForm').style.display = 'none';
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.classList.remove('visible');
    loginError.style.background = '';
    loginError.style.color = '';
    loginError.style.borderColor = '';
  }
};

window.showSignupForm = function() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = '';
  document.getElementById('signupError').classList.remove('visible');
};

window.logout = function() {
  sessionStorage.removeItem('coffeeshop_session');
  state.currentSession = null;
  state.currentUser = { name: 'GUEST', role: 'cashier' };
  state.cart = [];
  state.activeTab = 'pos';
  showAuthScreen();
  showLoginForm();
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  seedDefaultUsers();
  checkExistingSession();
  if (window.checkAutoRollover) window.checkAutoRollover();
});
