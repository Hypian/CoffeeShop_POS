/* ==========================================================================
   DMCH Resto POS & MIS — Void/Refund Workflow & Cash Drawer Settlement
   ========================================================================== */

window.openVoidOrderModal = function(orderId) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'cashier');
  if (currentRole !== 'admin') {
    window.showToast('🔒 Row Level Security: Only Administrator can void/refund transactions.', 'error');
    return;
  }

  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const idInput = document.getElementById('voidOrderId');
  const summaryEl = document.getElementById('voidOrderSummary');
  const amountEl = document.getElementById('voidOrderAmount');

  if (idInput) idInput.value = order.id;
  if (summaryEl) summaryEl.textContent = `Order ID: ${order.id} (${new Date(order.timestamp).toLocaleString()})`;
  if (amountEl) amountEl.textContent = formatMoney(order.total);

  window.openModal('modalVoidOrder');
};

window.confirmVoidOrder = function() {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'cashier');
  if (currentRole !== 'admin') {
    window.showToast('🔒 Row Level Security: Only Administrator can void transactions.', 'error');
    return;
  }

  const orderId = document.getElementById('voidOrderId').value;
  const reason = document.getElementById('voidReasonSelect').value;
  const notes = (document.getElementById('voidNotesInput').value || '').trim();

  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  if (order.checkoutMode === 'INSTITUTIONAL_TAB' && (order.employeeId || order.staffId)) {
    const emp = state.employees.find(e => e.id === order.employeeId || e.staffId === order.staffId);
    if (emp) {
      emp.currentBalance = Math.max(0, (emp.currentBalance || 0) - order.total);
    }
  }

  if (Array.isArray(order.items)) {
    order.items.forEach(item => {
      const prod = state.products.find(p => p.id === item.productId || p.name === item.name);
      if (prod && typeof prod.stock === 'number') {
        prod.stock += (item.qty || 1);
      }
    });
  }

  order.status = 'VOIDED';
  order.voidReason = reason;
  order.voidNotes = notes;
  order.voidedAt = new Date().toISOString();
  order.voidedBy = state.currentUser ? state.currentUser.name : 'Admin';

  addAuditLog("Order Voided", `Voided transaction ${order.id} (${formatMoney(order.total)}). Reason: ${reason}`);
  saveData();
  window.closeModal('modalVoidOrder');
  window.showToast(`Transaction ${order.id} voided & inventory restored!`, 'success');
  renderAllViews();
};

window.deleteOrder = function(orderId) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'cashier');
  if (currentRole !== 'admin') {
    window.showToast('🔒 Row Level Security: Only Administrator can delete financial transactions.', 'error');
    return;
  }

  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  if (confirm(`Are you sure you want to delete order "${order.id}" (${formatMoney(order.total)})?`)) {
    if (order.checkoutMode === 'INSTITUTIONAL_TAB' && (order.employeeId || order.staffId)) {
      const emp = state.employees.find(e => e.id === order.employeeId || e.staffId === order.staffId);
      if (emp) {
        emp.currentBalance = Math.max(0, (emp.currentBalance || 0) - order.total);
      }
    }

    state.orders = state.orders.filter(o => o.id !== orderId);
    state.tabReceipts = state.tabReceipts.filter(r => r.orderId !== orderId && r.id !== orderId);

    addAuditLog("Order Deleted", `Deleted transaction ${order.id} for ${formatMoney(order.total)}`);
    saveData();
    window.showToast(`Transaction "${order.id}" deleted successfully.`, 'success');
    renderAllViews();
  }
};

window.openShiftSettlementModal = function() {
  const directCashRev = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.paymentMethod === 'CASH' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const totalShiftReceipts = state.orders.filter(o => o.status !== 'VOIDED').length;

  const expectedEl = document.getElementById('shiftExpectedCash');
  const countEl = document.getElementById('shiftTotalReceipts');

  if (expectedEl) expectedEl.textContent = formatMoney(directCashRev);
  if (countEl) countEl.textContent = `${totalShiftReceipts} Receipts`;

  document.getElementById('shiftActualCash').value = '';
  document.getElementById('shiftOpeningFloat').value = '0';
  window.calculateShiftVariance();

  window.openModal('modalShiftSettlement');
};

window.calculateShiftVariance = function() {
  const directCashRev = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.paymentMethod === 'CASH' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const floatCash = parseFloat(document.getElementById('shiftOpeningFloat').value) || 0;
  const actualCash = parseFloat(document.getElementById('shiftActualCash').value) || 0;
  const expectedTotal = directCashRev + floatCash;
  const variance = actualCash - expectedTotal;

  const varEl = document.getElementById('shiftVarianceText');
  if (varEl) {
    if (variance === 0) {
      varEl.textContent = 'RWF 0 (Balanced ✅)';
      varEl.className = 'font-mono font-extrabold text-emerald-600 text-base';
    } else if (variance > 0) {
      varEl.textContent = `+${formatMoney(variance)} (Overage 📈)`;
      varEl.className = 'font-mono font-extrabold text-blue-600 text-base';
    } else {
      varEl.textContent = `${formatMoney(variance)} (Shortage ⚠️)`;
      varEl.className = 'font-mono font-extrabold text-rose-600 text-base';
    }
  }
};

window.saveShiftSettlement = function() {
  const directCashRev = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.paymentMethod === 'CASH' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const floatCash = parseFloat(document.getElementById('shiftOpeningFloat').value) || 0;
  const actualCash = parseFloat(document.getElementById('shiftActualCash').value) || 0;
  const expectedTotal = directCashRev + floatCash;
  const variance = actualCash - expectedTotal;

  addAuditLog("Shift Settlement", `Shift closed by ${state.currentUser ? state.currentUser.name : 'Cashier'}. Expected: ${formatMoney(expectedTotal)}, Actual: ${formatMoney(actualCash)}, Variance: ${formatMoney(variance)}`);

  window.closeModal('modalShiftSettlement');
  window.showToast("End-of-shift cash drawer reconciliation recorded!", "success");
  window.printDailyA4Report();
};
