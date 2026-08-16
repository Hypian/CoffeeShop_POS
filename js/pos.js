/* ==========================================================================
   DMCH Resto POS & MIS — POS Interface, Cart & Payment Checkout Handlers
   ========================================================================== */

window.renderCategoryPills = function() {
  const container = document.getElementById('categoryPillsContainer');
  if (!container) return;
  container.innerHTML = state.categories.map(cat => `
    <button class="cat-pill ${state.selectedCategory === cat.id ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      <span class="text-sm sm:text-base leading-none">${cat.icon}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');
};

window.selectCategory = function(catId) {
  state.selectedCategory = catId;
  renderCategoryPills();
  renderProductGrid();
};

window.renderProductGrid = function() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const query = (state.searchQuery || '').toLowerCase();
  const filtered = state.products.filter(p => {
    const matchCat = state.selectedCategory === 'cat-all' || p.categoryId === state.selectedCategory;
    const matchQuery = p.name.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[#6B7280]">No products found.</div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(p => {
    const safeProdId = String(p.id).replace(/'/g, "\\'");
    return `
    <div class="product-card bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 cursor-pointer relative select-none flex flex-col hover:border-[#1A3A52]/30 hover:shadow-lg transition-all" onclick="addToCart('${safeProdId}')">
      <div class="w-12 h-12 mx-auto rounded-xl bg-[#1A3A52]/5 text-[#1A3A52] flex items-center justify-center text-2xl mb-3 shadow-sm border border-black/[0.05]">${p.icon}</div>
      <div class="font-bold text-sm text-[#1A3A52] mb-0.5 text-center leading-tight truncate">${p.name}</div>
      <div class="text-[0.65rem] text-[#6B7280] font-semibold mb-3 text-center uppercase tracking-wider truncate">${getCategoryName(p.categoryId)}</div>
      <div class="mt-auto flex items-center justify-between pt-2.5 border-t border-black/[0.05]">
        <div class="font-extrabold text-sm text-[#1A3A52]">${formatMoney(p.price)}</div>
        <button class="w-7 h-7 rounded-md bg-[#1A3A52] text-[#D4A574] flex items-center justify-center font-bold text-base hover:bg-[#D4A574] hover:text-[#1A3A52] transition-colors shadow-sm" onclick="event.stopPropagation(); addToCart('${safeProdId}')">+</button>
      </div>
    </div>
  `}).join('');
};

window.addToCart = function(productId) {
  const p = state.products.find(x => String(x.id) === String(productId));
  if (!p) return;
  const cartItem = state.cart.find(x => String(x.productId) === String(productId));
  if (cartItem) {
    cartItem.qty += 1;
    cartItem.subtotal = cartItem.qty * cartItem.price;
  } else {
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
  const cartItem = state.cart.find(x => String(x.productId) === String(productId));
  if (!cartItem) return;
  
  cartItem.qty += delta;
  if (cartItem.qty <= 0) {
    state.cart = state.cart.filter(x => String(x.productId) !== String(productId));
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
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

window.renderCart = function() {
  const list = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotalText');
  const totalEl = document.getElementById('cartTotalText');
  const btnDirect = document.getElementById('btnCheckoutDirect');
  const btnTab = document.getElementById('btnCheckoutTab');
  const btnPatient = document.getElementById('btnCheckoutPatient');
  
  if (!list) return;

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-[#6B7280] text-center gap-3 py-10">
        <div class="text-5xl opacity-40">🛒</div>
        <p class="font-medium">Your order cart is empty.</p>
        <span class="text-xs text-[#64748B]">Tap items on the left to start building an order.</span>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = 'RWF 0';
    if (totalEl) totalEl.textContent = 'RWF 0';
    if (btnDirect) { btnDirect.disabled = false; btnDirect.classList.remove('opacity-50', 'cursor-not-allowed'); }
    if (btnTab) { btnTab.disabled = false; btnTab.classList.remove('opacity-50', 'cursor-not-allowed'); }
    if (btnPatient) { btnPatient.disabled = false; btnPatient.classList.remove('opacity-50', 'cursor-not-allowed'); }
    return;
  }

  list.innerHTML = state.cart.map(item => {
    const safeProdId = String(item.productId).replace(/'/g, "\\'");
    return `
    <div class="cart-item-row flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-black/[0.1]">
      <div class="flex-1 pr-3">
        <div class="font-bold text-sm text-[#1A3A52]">${item.name}</div>
        <div class="text-xs text-[#6B7280]">${formatMoney(item.price)} each</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#1A3A52] hover:text-black transition-colors" onclick="updateCartQty('${safeProdId}',-1)">−</button>
        <span class="text-sm font-bold w-5 text-center">${item.qty}</span>
        <button class="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#1A3A52] hover:text-black transition-colors" onclick="updateCartQty('${safeProdId}',1)">+</button>
      </div>
      <div class="font-extrabold text-sm text-[#1A3A52] ml-3 min-w-[55px] text-right">${formatMoney(item.subtotal)}</div>
    </div>
  `}).join('');

  const totals = calculateCartTotals();
  if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);
  if (totalEl) totalEl.textContent = formatMoney(totals.total);
  if (btnDirect) { btnDirect.disabled = false; btnDirect.classList.remove('opacity-50', 'cursor-not-allowed'); }
  if (btnTab) { btnTab.disabled = false; btnTab.classList.remove('opacity-50', 'cursor-not-allowed'); }
  if (btnPatient) { btnPatient.disabled = false; btnPatient.classList.remove('opacity-50', 'cursor-not-allowed'); }
};

// Checkout - Direct Payment
window.handlePaymentMethodChange = function() {
  const method = document.getElementById('directPaymentMethod')?.value || 'CARD';
  const cardBox = document.getElementById('paymentDetailsCard');
  const momoBox = document.getElementById('paymentDetailsMomo');
  
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
  const methodSelect = document.getElementById('directPaymentMethod');
  if (methodSelect) methodSelect.value = 'CARD';

  // Populate Payer Datalist with all employees and past clients for instant autofill
  const payerList = document.getElementById('payerNamesDatalist');
  if (payerList) {
    const names = new Set();
    (state.employees || []).forEach(e => { if (e && e.fullName) names.add(e.fullName); });
    (state.orders || []).forEach(o => {
      if (o && (o.payerName || o.customerName)) names.add(o.payerName || o.customerName);
    });
    payerList.innerHTML = Array.from(names).slice(0, 50).map(n => `<option value="${window.escapeHTML(n)}"></option>`).join('');
  }
  
  window.handlePaymentMethodChange();
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
  if (state.isProcessingPayment) return;
  state.isProcessingPayment = true;

  try {
    if (window.checkAutoRollover) window.checkAutoRollover();
    const method = document.getElementById('directPaymentMethod').value;
    const totals = calculateCartTotals();
    const rawPayer = (document.getElementById('directPayerName')?.value || '').trim().toUpperCase();
    const payerName = rawPayer || 'Walk-in Customer';

    let paymentDetails = '';

    if (method === 'CASH') {
      const tendered = parseFloat(document.getElementById('directCashTendered').value) || 0;
      if (tendered < totals.total) {
        window.showToast('Cash tendered is less than order total', 'error');
        state.isProcessingPayment = false;
        return;
      }
      paymentDetails = `Cash (${formatMoney(tendered)} tendered, ${formatMoney(tendered - totals.total)} change) - Payer: ${payerName}`;
    } else if (method === 'CARD') {
      const cardRef = document.getElementById('directCardRef')?.value.trim() || 'POS-TERMINAL-OK';
      paymentDetails = `Card Payment (${cardRef}) - Payer: ${payerName}`;
    } else if (method === 'MOBILE_MONEY') {
      const provider = document.getElementById('directMomoProvider')?.value || 'MTN MoMo';
      paymentDetails = `${provider} (Payer: ${payerName})`;
    }

    const cashierName = state.currentUser ? (state.currentUser.name || state.currentUser.username || 'Cashier') : 'Cashier';

    const order = {
      id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
      timestamp: new Date().toISOString(),
      cashierName: cashierName,
      checkoutMode: 'DIRECT_PAYMENT',
      paymentMethod: method,
      paymentDetails: paymentDetails,
      payerName: payerName,
      customerName: payerName,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      items: JSON.parse(JSON.stringify(state.cart)),
      status: 'COMPLETED'
    };

    state.orders.unshift(order);
    state.tabReceipts.unshift(order);
    saveData();
    window.clearCart();
    window.closeModal('modalDirectCheckout');
    window.showToast(`Payment approved via ${method.replace('_', ' ')}`, 'success');
    renderAllViews();
    if (window.showReceiptModal) window.showReceiptModal(order);
  } finally {
    setTimeout(() => { state.isProcessingPayment = false; }, 500);
  }
};

// ==========================================================================
// Checkout - Institutional Staff Tab (Smart Bidirectional Autofill Engine)
// ==========================================================================

window.populateTabCheckoutDropdowns = function(selectedDeptId = '', selectedEmpId = '') {
  const deptSelect = document.getElementById('checkoutDeptSelect');
  const empSelect = document.getElementById('checkoutEmpSelect');
  const datalist = document.getElementById('staffAutofillDatalist');
  const searchInput = document.getElementById('checkoutStaffSearch');

  const depts = state.departments || [];
  const emps = state.employees || [];

  // 1. Populate Department Dropdown
  if (deptSelect) {
    deptSelect.innerHTML = `<option value="">-- All Departments (${depts.length}) --</option>` + 
      depts.map(d => `<option value="${d.id}" ${d.id === selectedDeptId ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('');
    if (selectedDeptId) deptSelect.value = selectedDeptId;
  }

  // 2. Populate Employee Dropdown (Filtered by dept if selected, or all emps)
  if (empSelect) {
    const filteredEmps = selectedDeptId ? emps.filter(e => e && e.departmentId === selectedDeptId) : emps;
    empSelect.innerHTML = `<option value="">-- Select Staff Account (${filteredEmps.length}) --</option>` + 
      filteredEmps.map(e => {
        const dept = depts.find(d => d.id === e.departmentId);
        const deptCode = dept ? ` [${dept.code}]` : '';
        return `<option value="${e.id}" ${e.id === selectedEmpId ? 'selected' : ''}>${e.fullName} (${e.staffId})${deptCode}</option>`;
      }).join('');

    if (selectedEmpId) {
      empSelect.value = selectedEmpId;
    }
  }

  // 3. Populate Search Autocomplete Datalist
  if (datalist) {
    datalist.innerHTML = emps.map(e => {
      const dept = depts.find(d => d.id === e.departmentId);
      const deptText = dept ? `${dept.name} (${dept.code})` : 'Unassigned';
      return `<option value="${e.fullName} (${e.staffId})">${deptText}</option><option value="${e.staffId}">${e.fullName} - ${deptText}</option>`;
    }).join('');
  }

  // 4. Update Search Input Text if an employee is selected
  if (searchInput && selectedEmpId) {
    const targetEmp = emps.find(e => e && e.id === selectedEmpId);
    if (targetEmp) {
      searchInput.value = `${targetEmp.fullName} (${targetEmp.staffId})`;
    }
  }
};

window.openTabCheckoutModal = function(initialEmpId = null) {
  if (state.cart.length === 0) {
    window.showToast('Your cart is empty! Tap menu items on the left to add them.', 'warning');
    return;
  }
  const totals = calculateCartTotals();
  const totalEl = document.getElementById('tabTotalText');
  const searchInput = document.getElementById('checkoutStaffSearch');
  
  if (totalEl) totalEl.textContent = formatMoney(totals.total);
  if (searchInput && !initialEmpId) searchInput.value = '';

  const targetEmp = initialEmpId ? (state.employees || []).find(e => e && e.id === initialEmpId) : state.currentTabEmployee;
  const initialDeptId = targetEmp ? targetEmp.departmentId : '';
  const empIdToUse = targetEmp ? targetEmp.id : '';

  window.populateTabCheckoutDropdowns(initialDeptId, empIdToUse);
  window.updateEmployeeTabPreview(empIdToUse || null);
  window.openModal('modalTabCheckout');
};

window.handleStaffSearchAutofill = function(query) {
  if (!query) return;
  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery.length === 0) return;

  const emps = state.employees || [];
  // Search by exact staffId, staffId substring, fullName substring, or full display format "NAME (ID)"
  const matchedEmp = emps.find(e => {
    if (!e) return false;
    const nameMatch = (e.fullName || '').toLowerCase().includes(cleanQuery);
    const idMatch = (e.staffId || '').toLowerCase().includes(cleanQuery);
    const fullTag = `${(e.fullName || '').toLowerCase()} (${(e.staffId || '').toLowerCase()})`;
    return nameMatch || idMatch || fullTag.includes(cleanQuery) || cleanQuery.includes((e.staffId || '').toLowerCase());
  });

  if (matchedEmp) {
    state.currentTabEmployee = matchedEmp;
    const deptSelect = document.getElementById('checkoutDeptSelect');
    const empSelect = document.getElementById('checkoutEmpSelect');

    if (deptSelect && matchedEmp.departmentId) {
      deptSelect.value = matchedEmp.departmentId;
    }
    if (empSelect) {
      window.populateTabCheckoutDropdowns(matchedEmp.departmentId, matchedEmp.id);
    }
    window.updateEmployeeTabPreview(matchedEmp.id);
  }
};

window.onCheckoutDepartmentChange = function(deptId) {
  const empSelect = document.getElementById('checkoutEmpSelect');
  const searchInput = document.getElementById('checkoutStaffSearch');
  
  window.populateTabCheckoutDropdowns(deptId, '');
  if (searchInput) searchInput.value = '';
  state.currentTabEmployee = null;
  window.updateEmployeeTabPreview(null);
};

window.onCheckoutEmployeeSelect = function(empId) {
  if (!empId) {
    state.currentTabEmployee = null;
    window.updateEmployeeTabPreview(null);
    return;
  }
  const emp = (state.employees || []).find(e => e && e.id === empId);
  if (emp) {
    state.currentTabEmployee = emp;
    const deptSelect = document.getElementById('checkoutDeptSelect');
    if (deptSelect && emp.departmentId && deptSelect.value !== emp.departmentId) {
      deptSelect.value = emp.departmentId;
    }
    const searchInput = document.getElementById('checkoutStaffSearch');
    if (searchInput) {
      searchInput.value = `${emp.fullName} (${emp.staffId})`;
    }
    window.updateEmployeeTabPreview(emp.id);
  }
};

window.quickAddStaffFromCheckout = function() {
  const currentDept = document.getElementById('checkoutDeptSelect')?.value || null;
  window.closeModal('modalTabCheckout');
  window.openAddEmployeeModal(currentDept, 'pos_tab');
};

window.populateEmployeeDropdown = function(deptId) {
  window.onCheckoutDepartmentChange(deptId);
};

window.updateEmployeeTabPreview = function(empId) {
  state.currentTabEmployee = (state.employees || []).find(e => e && e.id === empId) || null;
  const badge = document.getElementById('tabEmpCreditBadge');
  if (!badge) return;
  
  if (!state.currentTabEmployee) {
    badge.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
        <span><i class='bx bx-info-circle text-base text-slate-400'></i></span>
        <span>Search or select a staff member above to verify approved tab limit and balance.</span>
      </div>
    `;
    return;
  }

  const emp = state.currentTabEmployee;
  const dept = (state.departments || []).find(d => d && d.id === emp.departmentId);
  const cartTotal = calculateCartTotals().total;
  const currBal = emp.currentBalance || 0;
  const newBal = currBal + cartTotal;
  const limit = emp.monthlyCreditLimit || 50000;
  const isNearLimit = newBal >= (limit * 0.9);

  badge.innerHTML = `
    <div class="bg-emerald-50/80 border border-emerald-300/80 rounded-xl p-3.5 flex flex-col gap-2 shadow-xs animate-toast-in">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs"><i class='bx bx-user-check'></i></span>
          <div>
            <div class="text-xs font-extrabold text-emerald-950">${window.escapeHTML(emp.fullName)} <span class="font-mono text-[0.7rem] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">${emp.staffId}</span></div>
            <div class="text-[0.68rem] text-emerald-700 font-semibold">${dept ? `${dept.name} (${dept.code})` : 'Hospital Staff'}</div>
          </div>
        </div>
        <span class="text-[0.65rem] font-extrabold uppercase px-2 py-0.5 rounded-full ${isNearLimit ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}">Approved Tab</span>
      </div>
      
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
        <div>
          <span class="text-[0.65rem] text-slate-500 font-medium block">Current Tab:</span>
          <span class="font-mono font-extrabold text-slate-900">${formatMoney(currBal)}</span>
        </div>
        <div class="text-right">
          <span class="text-[0.65rem] text-slate-500 font-medium block">New Balance After:</span>
          <span class="font-mono font-extrabold text-emerald-800 text-sm">${formatMoney(newBal)}</span>
        </div>
      </div>
    </div>
  `;
};

window.processTabPayment = async function() {
  if (state.isProcessingPayment) return;
  state.isProcessingPayment = true;

  try {
    if (window.checkAutoRollover) window.checkAutoRollover();
    if (!state.currentTabEmployee) {
      window.showToast('Please search or select an authorized staff member for tab charge.', 'error');
      state.isProcessingPayment = false;
      return;
    }
    
    const totals = calculateCartTotals();
    const emp = state.currentTabEmployee;
    const dept = (state.departments || []).find(d => d && d.id === emp.departmentId);
    const cashierName = state.currentUser ? (state.currentUser.name || state.currentUser.username || 'Cashier') : 'Cashier';

    const order = {
      id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
      timestamp: new Date().toISOString(),
      cashierName: cashierName,
      checkoutMode: 'INSTITUTIONAL_TAB',
      paymentMethod: 'PAYROLL_DEDUCTION',
      departmentId: dept ? dept.id : null,
      departmentName: dept ? dept.name : 'Hospital Dept',
      employeeId: emp.id,
      employeeName: emp.fullName,
      staffId: emp.staffId,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      items: JSON.parse(JSON.stringify(state.cart)),
      status: 'COMPLETED'
    };

    emp.currentBalance = (emp.currentBalance || 0) + totals.total;

    const empInState = (state.employees || []).find(e => e && String(e.id) === String(emp.id));
    if (empInState) {
      empInState.currentBalance = emp.currentBalance;
    }

    state.orders.unshift(order);
    state.tabReceipts.unshift(order);
    saveData();
    window.clearCart();
    window.closeModal('modalTabCheckout');
    window.showToast(`Staff tab authorized for ${emp.fullName} (${formatMoney(totals.total)})`, 'success');
    if (window.renderAllViews) window.renderAllViews();
    if (window.showReceiptModal) window.showReceiptModal(order);

    try {
      if (window.cloudSaveEmployee) {
        await window.cloudSaveEmployee(emp);
      }
    } catch (e) {
      console.warn('Cloud employee balance sync notice:', e.message);
    }
  } catch (err) {
    console.error('Error processing staff tab payment:', err);
    window.showToast('Could not process tab checkout. Please try again.', 'error');
  } finally {
    setTimeout(() => { state.isProcessingPayment = false; }, 500);
  }
};


// Checkout - Patient Room Catering
window.openPatientCheckoutModal = function() {
  if (state.cart.length === 0) {
    window.showToast('Your cart is empty! Tap menu items on the left to add them.', 'warning');
    return;
  }
  const totals = calculateCartTotals();
  const totalEl = document.getElementById('patientTotalText');
  if (totalEl) totalEl.textContent = formatMoney(totals.total);

  if (window.populateRoomDropdown) window.populateRoomDropdown();

  const notesInput = document.getElementById('patientNameNotes');
  const mealSelect = document.getElementById('patientMealType');
  const billingSelect = document.getElementById('patientBillingType');

  if (notesInput) notesInput.value = '';
  if (mealSelect) mealSelect.value = 'Breakfast';
  if (billingSelect) billingSelect.value = 'COVERED_PERK';

  window.openModal('modalPatientCheckout');
};

window.processPatientPayment = function() {
  if (state.isProcessingPayment) return;
  state.isProcessingPayment = true;

  try {
    const roomSelect = document.getElementById('patientRoomNumberSelect');
    const roomNumber = roomSelect ? (roomSelect.value || '').trim() : '';
    const mealType = document.getElementById('patientMealType') ? document.getElementById('patientMealType').value : 'Breakfast';
    const notes = document.getElementById('patientNameNotes') ? (document.getElementById('patientNameNotes').value || '').trim().toUpperCase() : '';
    const patientId = document.getElementById('patientIdInput') ? (document.getElementById('patientIdInput').value || '').trim().toUpperCase() : '';
    const billingType = document.getElementById('patientBillingType') ? document.getElementById('patientBillingType').value : 'COVERED_PERK';

    if (!roomNumber) {
      window.showToast('Please select a hospital room from the dropdown list.', 'error');
      state.isProcessingPayment = false;
      return;
    }

    const roomObj = (state.rooms || []).find(r => r.roomNumber === roomNumber);
    const roomTier = roomObj ? roomObj.tier : 'Normal Room';

    const totals = calculateCartTotals();

    const order = {
      id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
      timestamp: new Date().toISOString(),
      cashierName: state.currentUser ? state.currentUser.name : 'Cashier',
      checkoutMode: 'PATIENT_ROOM_ORDER',
      paymentMethod: billingType === 'COVERED_PERK' ? 'HOSPITAL_ROOM_PERK' : 'PATIENT_DIRECT_PAY',
      roomNumber: roomNumber,
      roomTier: roomTier,
      mealType: mealType,
      patientId: patientId,
      patientNotes: notes,
      billingType: billingType,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      items: JSON.parse(JSON.stringify(state.cart)),
      status: 'COMPLETED'
    };

    state.orders.unshift(order);
    state.tabReceipts.unshift(order);
    saveData();
    window.clearCart();
    window.closeModal('modalPatientCheckout');
    window.showToast(`Catering order for ${roomNumber} (${roomTier} - ${mealType}) processed!`, 'success');
    renderAllViews();
    if (window.showReceiptModal) window.showReceiptModal(order);
  } finally {
    setTimeout(() => { state.isProcessingPayment = false; }, 1000);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// RECEIPT PREVIEW, PRINTING & TICKET REPRINT ENGINE
// ══════════════════════════════════════════════════════════════════════════════

window.showReceiptModal = function(order) {
  if (!order) return;
  state.lastReceiptOrder = order;

  const container = document.getElementById('receiptPreviewContent');
  if (!container) return;

  const dateStr = new Date(order.timestamp || Date.now()).toLocaleString([], {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  // Resolve Staff & Dept Info if missing from ID
  let empName = order.employeeName || order.employee_name || '';
  let stfId = order.staffId || order.staff_id || '';
  let deptName = order.departmentName || order.department_name || '';

  if (!empName && order.employeeId && Array.isArray(state.employees)) {
    const emp = state.employees.find(e => String(e.id) === String(order.employeeId));
    if (emp) {
      empName = emp.fullName;
      stfId = emp.staffId || stfId;
      if (!deptName && emp.departmentId && Array.isArray(state.departments)) {
        const d = state.departments.find(dept => String(dept.id) === String(emp.departmentId));
        if (d) deptName = d.name;
      }
    }
  }

  let checkoutLabel = 'DIRECT SALE';
  let paymentMethodLabel = order.paymentMethod || 'DIRECT PAYMENT';

  if (order.paymentMethod === 'MOBILE_MONEY') {
    checkoutLabel = 'DIRECT MOBILE MONEY (MoMo) SALE';
    paymentMethodLabel = 'Mobile Money (MoMo)';
  } else if (order.paymentMethod === 'CARD') {
    checkoutLabel = 'DIRECT CARD SALE';
    paymentMethodLabel = 'Credit / Debit Card';
  } else if (order.paymentMethod === 'CASH') {
    checkoutLabel = 'DIRECT CASH SALE';
    paymentMethodLabel = 'Cash';
  }

  if (order.checkoutMode === 'INSTITUTIONAL_TAB') {
    checkoutLabel = `STAFF TAB: ${empName || 'Staff'} ${stfId ? `(${stfId})` : ''}`;
    paymentMethodLabel = 'Staff Payroll Tab';
  } else if (order.checkoutMode === 'PATIENT_ROOM_ORDER') {
    checkoutLabel = `PATIENT CATERING: ${order.roomNumber || 'Room'} (${order.mealType || 'Meal'})`;
    paymentMethodLabel = 'Hospital Inpatient Room Perk';
  }

  const cashierName = order.cashierName || order.cashier || (state.currentUser ? state.currentUser.name : 'Cashier');
  const payerName = order.payerName || order.customerName || order.customer_name || '';
  const patientId = order.patientId || order.patient_id || '';
  const patientNotes = order.patientNotes || order.patient_notes || '';

  let clientSectionHtml = '';

  if (order.checkoutMode === 'INSTITUTIONAL_TAB') {
    clientSectionHtml = `
      <div><strong>Staff Member:</strong> ${empName || 'Hospital Staff'} ${stfId ? `(${stfId})` : ''}</div>
      ${deptName ? `<div><strong>Department:</strong> ${deptName}</div>` : ''}
    `;
  } else if (order.checkoutMode === 'PATIENT_ROOM_ORDER') {
    clientSectionHtml = `
      <div><strong>Room Number:</strong> ${order.roomNumber || 'N/A'} ${order.roomTier ? `(${order.roomTier})` : ''}</div>
      <div><strong>Meal Category:</strong> ${order.mealType || 'Meal'}</div>
      ${patientId ? `<div><strong>Patient ID / MRN:</strong> ${patientId}</div>` : ''}
      ${patientNotes ? `<div><strong>Patient Name / Notes:</strong> ${patientNotes}</div>` : ''}
    `;
  } else {
    clientSectionHtml = `
      <div><strong>Client / Payer:</strong> ${payerName || 'Direct Walk-in Customer'}</div>
    `;
  }

  const itemsHtml = Array.isArray(order.items) ? order.items.map(item => `
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
      <span style="flex:1;">${item.qty}x ${item.name}</span>
      <span style="font-weight:bold;">${formatMoney(item.subtotal || ((item.price || 0) * (item.qty || 1)))}</span>
    </div>
  `).join('') : '<div style="font-size:11px; color:#666;">No items listed</div>';

  const logoSrc = (typeof APP_LOGO_DATA_URI !== 'undefined' && APP_LOGO_DATA_URI) ? APP_LOGO_DATA_URI : 'logo.png';

  container.innerHTML = `
    <div style="text-align:center; padding-bottom:8px; border-bottom:1px dashed #000; margin-bottom:10px;">
      <img src="${logoSrc}" style="max-height:48px; width:auto; display:block; margin:0 auto 6px auto; object-fit:contain;" alt="DMCH Logo" onerror="this.style.display='none'">
      <div style="font-size:15px; font-weight:900; letter-spacing:1px; color:#1A3A52;">DMCH RESTO</div>
      <div style="font-size:10px; text-transform:uppercase; color:#6B7280; font-weight:700;">Dream Medical Center Hospital</div>
      <div style="font-size:9px; color:#64748B; margin-top:2px;">Kigali, Rwanda • MIS POS Terminal</div>
    </div>

    <div style="font-size:11px; margin-bottom:8px; line-height:1.5; color:#1A3A52;">
      <div><strong>Receipt #:</strong> ${order.id}</div>
      <div><strong>Date & Time:</strong> ${dateStr}</div>
      <div><strong>Cashier:</strong> ${cashierName}</div>
      <div><strong>Checkout Mode:</strong> ${checkoutLabel}</div>
      <div><strong>Payment Method:</strong> ${paymentMethodLabel}</div>
      ${order.paymentDetails ? `<div><strong>Pay Info:</strong> ${order.paymentDetails}</div>` : ''}
      ${clientSectionHtml}
    </div>

    <div style="border-top:1px dashed #000; border-bottom:1px dashed #000; padding:8px 0; margin-bottom:8px;">
      ${itemsHtml}
    </div>

    <div style="font-size:12px; font-weight:bold; display:flex; justify-content:space-between; margin-bottom:4px; color:#1A3A52;">
      <span>TOTAL AMOUNT:</span>
      <span style="font-size:14px; font-weight:900; color:#D4A574;">${formatMoney(order.total)}</span>
    </div>

    <div style="font-size:10px; color:#6B7280; text-align:center; margin-top:12px; border-top:1px dashed #000; padding-top:8px;">
      <div>Thank you for dining at DMCH Resto!</div>
      <div style="font-size:9px; margin-top:2px; font-weight:700; color:#1A3A52;">~ Official Hospital Catering Ticket ~</div>
    </div>
  `;

  window.openModal('modalReceipt');
};

window.reprintReceipt = function(orderId) {
  const order = (state.orders || []).find(o => o && (o.id === orderId || String(o.id) === String(orderId)));
  if (!order) {
    window.showToast('Order receipt not found.', 'error');
    return;
  }
  window.showReceiptModal(order);
};

window.triggerPrintReceipt = function() {
  const container = document.getElementById('receiptPreviewContent');
  if (!container) return;
  // Prefer using the reusable print helper used by reports (opens a new window)
  const receiptHtml = `
    <div class="receipt-80mm" style="padding:10px; font-family:'Courier New', Courier, monospace; background:#ffffff; color:#000000; width:100%; max-width:80mm; margin:0 auto; box-sizing:border-box;">
      ${container.innerHTML}
    </div>
  `;

  if (typeof openPrintWindow === 'function') {
    openPrintWindow(receiptHtml);
    return;
  }

  // Fallback: use inline print container
  const printFrame = document.getElementById('print-container');
  if (printFrame) {
    printFrame.classList.remove('hidden');
    printFrame.removeAttribute('hidden');
    printFrame.style.display = 'block';
    printFrame.style.visibility = 'visible';
    printFrame.innerHTML = receiptHtml;
  }

  // Allow DOM paint before invoking browser print dialog
  setTimeout(() => {
    window.print();
  }, 100);
};
