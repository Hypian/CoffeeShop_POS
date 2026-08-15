/* ==========================================================================
   DMCH Resto POS & MIS — Application Router & Main Bootstrapper
   ========================================================================== */

// Hardened RBAC-enforced view router
// Defines the allowed views per role — any unlisted view is silently blocked.

const ROLE_ALLOWED_VIEWS = {
  admin:   ['pos', 'dashboard', 'ledgers', 'products', 'reports', 'users'],
  cashier: ['pos', 'dashboard', 'ledgers', 'products', 'reports'],
  waiter:  ['pos']
};

window.switchView = function(viewName) {
  const role = (state.currentUser && state.currentUser.role) || 'waiter';
  const allowed = ROLE_ALLOWED_VIEWS[role] || ['pos'];

  // RBAC Guard — block unauthorized view access
  if (!allowed.includes(viewName)) {
    // Log unauthorized access attempt
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog(
        'ACCESS',
        'Unauthorized View Access Attempt',
        `User @${(state.currentSession && state.currentSession.username) || 'unknown'} (${role}) attempted to access restricted view: "${viewName}"`,
        'WARNING'
      );
    }
    if (window.showToast) {
      window.showToast(`Access denied: "${viewName}" view requires elevated permissions.`, 'error');
    }
    // Redirect to POS terminal — the universal safe default
    viewName = 'pos';
  }

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
  window.renderAllViews();
};

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

window.renderAllViews = function() {
  const activeTab = state.activeTab || 'pos';

  // Only render POS components if POS is the active view
  if (activeTab === 'pos') {
    if (window.renderCategoryPills) window.renderCategoryPills();
    if (window.renderProductGrid) window.renderProductGrid();
    if (window.renderCart) window.renderCart();
  }

  // Render active tab view to eliminate unnecessary DOM recalculations
  if (activeTab === 'dashboard' && window.renderDashboard) window.renderDashboard();
  else if (activeTab === 'ledgers' && window.renderDepartmentLedgers) window.renderDepartmentLedgers();
  else if (activeTab === 'products' && window.renderProductManagement) window.renderProductManagement();
  else if (activeTab === 'reports' && window.renderReports) window.renderReports();
  else if (activeTab === 'users' && window.debouncedRenderUsers) {
    window.debouncedRenderUsers();
  } else if (activeTab === 'users' && window.renderUsers) {
    window.renderUsers();
  }
};

window.forceRenderAllViews = function() {
  if (window.renderCategoryPills) window.renderCategoryPills();
  if (window.renderProductGrid) window.renderProductGrid();
  if (window.renderCart) window.renderCart();
  if (window.renderDashboard) window.renderDashboard();
  if (window.renderDepartmentLedgers) window.renderDepartmentLedgers();
  if (window.renderProductManagement) window.renderProductManagement();
  if (window.renderReports) window.renderReports();
  if (window.renderUsers) window.renderUsers();
};

window.setupEventListeners = function() {
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.addEventListener('click', () => switchView(el.dataset.view));
  });
  
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', window.debounce((e) => {
      state.searchQuery = e.target.value;
      renderProductGrid();
    }, 250));
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

  let inactivityTimer = null;
  const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes terminal timeout

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (state.currentUser || sessionStorage.getItem('dmch_resto_session')) {
      inactivityTimer = setTimeout(() => {
        window.showToast('⏱️ Terminal Session Timed Out (20 mins inactivity). Auto-logged out for terminal security.', 'warning');
        window.logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }

  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1' || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p')) {
      e.preventDefault();
      switchView('pos');
    } else if (e.key === 'F2') {
      e.preventDefault();
      if (state.cart.length > 0) window.openDirectCheckoutModal();
    } else if (e.key === 'F3') {
      e.preventDefault();
      if (state.cart.length > 0) window.openTabCheckoutModal();
    } else if (e.key === 'F4') {
      e.preventDefault();
      if (state.cart.length > 0) window.openPatientCheckoutModal();
    } else if (e.key === 'F5' || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      switchView('reports');
    } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      switchView('dashboard');
    } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      switchView('ledgers');
    } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      switchView('products');
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  seedDefaultUsers();
  checkExistingSession();
  if (window.checkAutoRollover) window.checkAutoRollover();
  
  // Ripple Effect for buttons
  document.body.addEventListener('click', function(e) {
    const target = e.target.closest('button, .nav-tab, .product-card, .cat-pill');
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    // Ensure the ripple is large enough to cover the whole element
    const diameter = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x - diameter/2}px`;
    ripple.style.top = `${y - diameter/2}px`;
    
    target.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 500);
  });
});
