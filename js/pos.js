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
  const query = state.searchQuery.toLowerCase();
  const filtered = state.products.filter(p => {
    const matchCat = state.selectedCategory === 'cat-all' || p.categoryId === state.selectedCategory;
    const matchQuery = p.name.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-[#475569]">No products found.</div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 cursor-pointer relative select-none" onclick="addToCart('${p.id}')">
      <div class="w-12 h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-2xl mb-3">${p.icon}</div>
      <div class="font-bold text-sm text-[#0F172A] mb-1">${p.name}</div>
      <div class="text-[0.7rem] text-[#475569] font-medium mb-3">${getCategoryName(p.categoryId)}</div>
      <div class="flex items-center justify-between pt-2 border-t border-black/[0.1]">
        <div class="font-extrabold text-base text-[#F59E0B]">${formatMoney(p.price)}</div>
        <button class="w-8 h-8 rounded-lg bg-[#F59E0B] text-black flex items-center justify-center font-bold text-lg hover:bg-[#FBBF24] transition-colors">+</button>
      </div>
    </div>
  `).join('');
};

window.addToCart = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const cartItem = state.cart.find(x => x.productId === productId);
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
  const cartItem = state.cart.find(x => x.productId === productId);
  if (!cartItem) return;
  
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
      <div class="flex flex-col items-center justify-center h-full text-[#475569] text-center gap-3 py-10">
        <div class="text-5xl opacity-40">🛒</div>
        <p class="font-medium">Your order cart is empty.</p>
        <span class="text-xs text-[#64748B]">Tap items on the left to start building an order.</span>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = 'RWF 0';
    if (totalEl) totalEl.textContent = 'RWF 0';
    if (btnDirect) btnDirect.disabled = false;
    if (btnTab) btnTab.disabled = false;
    if (btnPatient) btnPatient.disabled = false;
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
  if (btnPatient) btnPatient.disabled = false;
}

// Checkout - Direct Payment
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
  if (state.isProcessingPayment) return;
  state.isProcessingPayment = true;

  try {
    if (window.checkAutoRollover) window.checkAutoRollover();
    const method = document.getElementById('directPaymentMethod').value;
    const totals = calculateCartTotals();
    const rawPayer = (document.getElementById('directPayerName')?.value || document.getElementById('directMomoNumber')?.value || '').trim().toUpperCase();
    const payerName = rawPayer || 'DIRECT CUSTOMER';

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

    const order = {
      id: `ORD-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}`,
      timestamp: new Date().toISOString(),
      cashierName: state.currentUser.name,
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
    setTimeout(() => { state.isProcessingPayment = false; }, 1000);
  }
};

// Checkout - Staff Tab
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
  
  const totalAfter = state.currentTabEmployee.currentBalance + calculateCartTotals().total;
  badge.innerHTML = `<span class="bg-[#10B981]/20 text-[#10B981] px-3 py-1 rounded-full text-xs font-bold border border-[#10B981]/30">Approved (New Balance: ${formatMoney(totalAfter)})</span>`;
};

let signatureCtx = null;
let isDrawing = false;

window.initSignatureCanvas = function() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  signatureCtx = canvas.getContext('2d');
  signatureCtx.lineWidth = 2.5;
  signatureCtx.lineCap = 'round';
  signatureCtx.lineJoin = 'round';
  signatureCtx.strokeStyle = '#000000';
  
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

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

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
  if (state.isProcessingPayment) return;
  state.isProcessingPayment = true;

  try {
    if (window.checkAutoRollover) window.checkAutoRollover();
    if (!state.currentTabEmployee) {
      window.showToast('Please select an employee for tab checkout', 'error');
      state.isProcessingPayment = false;
      return;
    }
    
    const totals = calculateCartTotals();
    const dept = state.departments.find(d => d.id === state.currentTabEmployee.departmentId);

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
    
    state.orders.unshift(order);
    state.tabReceipts.unshift(order);
    saveData();
    window.clearCart();
    window.closeModal('modalTabCheckout');
    window.showToast(`Tab order authorized for ${state.currentTabEmployee.fullName}`, 'success');
    renderAllViews();
    if (window.showReceiptModal) window.showReceiptModal(order);
  } finally {
    setTimeout(() => { state.isProcessingPayment = false; }, 1000);
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

  window.populateRoomDropdown();

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
    const notes = document.getElementById('patientNameNotes') ? (document.getElementById('patientNameNotes').value || '').trim() : '';
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

  let checkoutLabel = 'DIRECT CASH / CARD SALE';
  if (order.checkoutMode === 'INSTITUTIONAL_TAB') {
    checkoutLabel = `STAFF TAB: ${order.employeeName || 'Staff'} (${order.staffId || ''})`;
  } else if (order.checkoutMode === 'PATIENT_ROOM_ORDER') {
    checkoutLabel = `PATIENT PERK: ${order.roomNumber || 'Room'} (${order.mealType || 'Meal'})`;
  }

  const itemsHtml = Array.isArray(order.items) ? order.items.map(item => `
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
      <span style="flex:1;">${item.qty}x ${item.name}</span>
      <span style="font-weight:bold;">${formatMoney(item.subtotal)}</span>
    </div>
  `).join('') : '<div style="font-size:11px; color:#666;">No items listed</div>';

  const logoSrc = (typeof APP_LOGO_DATA_URI !== 'undefined' && APP_LOGO_DATA_URI) ? APP_LOGO_DATA_URI : 'logo.png';

  container.innerHTML = `
    <div style="text-align:center; padding-bottom:8px; border-bottom:1px dashed #000; margin-bottom:10px;">
      <img src="${logoSrc}" style="max-height:48px; width:auto; display:block; margin:0 auto 6px auto; object-fit:contain;" alt="DMCH Logo" onerror="this.style.display='none'">
      <div style="font-size:15px; font-weight:900; letter-spacing:1px; color:#0F172A;">DMCH RESTO</div>
      <div style="font-size:10px; text-transform:uppercase; color:#475569; font-weight:700;">Dream Medical Center Hospital</div>
      <div style="font-size:9px; color:#64748B; margin-top:2px;">Kigali, Rwanda • MIS POS Terminal</div>
    </div>

    <div style="font-size:11px; margin-bottom:8px; line-height:1.5; color:#0F172A;">
      <div><strong>Receipt #:</strong> ${order.id}</div>
      <div><strong>Date:</strong> ${dateStr}</div>
      <div><strong>Cashier:</strong> ${order.cashierName || order.cashier || 'Staff'}</div>
      <div><strong>Mode:</strong> ${checkoutLabel}</div>
      ${order.patientNotes ? `<div><strong>Notes:</strong> ${order.patientNotes}</div>` : ''}
    </div>

    <div style="border-top:1px dashed #000; border-bottom:1px dashed #000; padding:8px 0; margin-bottom:8px;">
      ${itemsHtml}
    </div>

    <div style="font-size:12px; font-weight:bold; display:flex; justify-content:space-between; margin-bottom:4px; color:#0F172A;">
      <span>TOTAL AMOUNT:</span>
      <span style="font-size:14px; font-weight:900; color:#D97706;">${formatMoney(order.total)}</span>
    </div>

    <div style="font-size:10px; color:#475569; text-align:center; margin-top:12px; border-top:1px dashed #000; padding-top:8px;">
      <div>Thank you for dining at DMCH Resto!</div>
      <div style="font-size:9px; margin-top:2px; font-weight:700; color:#0F172A;">~ Official Hospital Catering Ticket ~</div>
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

  const printFrame = document.getElementById('print-container');
  if (printFrame) {
    printFrame.innerHTML = container.innerHTML;
  }
  window.print();
};
