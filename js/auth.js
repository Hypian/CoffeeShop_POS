/* ==========================================================================
   DMCH Resto POS & MIS — Authentication & User Authorization Engine
   ========================================================================== */

async function hashPassword(str) {
  if (!str) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch(e) {
    console.warn('SubtleCrypto unavailable, using fallback hash:', e);
  }
  // Simple fallback hash for non-HTTPS / HTTP environments
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

function seedDefaultUsers() {
  if (!Array.isArray(state.users) || state.users.length === 0) {
    state.users = [...DEFAULT_USERS];
  }
}

function getUsers() {
  if (Array.isArray(state.users) && state.users.length > 0) {
    return state.users;
  }
  return DEFAULT_USERS;
}

function saveUsers(users) {
  state.users = users;
  if (window.cloudSyncUsers) {
    window.cloudSyncUsers(users);
  }
  if (window.broadcastLiveSync) {
    window.broadcastLiveSync({ type: 'USERS_UPDATED' });
  }
}

function checkExistingSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('dmch_resto_session'));
    if (session && session.username) {
      state.currentSession = session;
      state.currentUser = { name: session.fullName, role: session.role };
      showMainApp();
      return;
    }
  } catch (e) {}
  showAuthScreen();
}

function showAuthScreen() {
  document.documentElement.classList.remove('authenticated-session');
  const authScreen = document.getElementById('authScreen');
  const mainApp = document.getElementById('mainAppContainer');
  if (authScreen) authScreen.classList.remove('hidden');
  if (mainApp) mainApp.classList.remove('authenticated');
}

function showMainApp() {
  document.documentElement.classList.add('authenticated-session');
  const authScreen = document.getElementById('authScreen');
  const mainApp = document.getElementById('mainAppContainer');
  if (authScreen) authScreen.classList.add('hidden');
  if (mainApp) mainApp.classList.add('authenticated');
  
  if (window.loadStorageData) window.loadStorageData();
  if (window.setupEventListeners) window.setupEventListeners();
  updateUserBadge();
  applyRolePermissions();
  if (window.switchView) window.switchView('pos');
}

function updateUserBadge() {
  const user = state.currentUser || { name: 'CHIEF CASHIER', role: 'admin' };
  const badgeEl = document.getElementById('userRoleBadge');
  const nameEl = document.getElementById('currentUserName');
  const avatarEl = document.getElementById('userAvatarInitial');

  if (nameEl) nameEl.textContent = user.name || 'CASHIER';
  if (avatarEl) avatarEl.textContent = (user.name || 'C')[0].toUpperCase();

  if (badgeEl) {
    const roleUpper = (user.role || 'cashier').toUpperCase();
    if (user.role === 'admin') {
      badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20';
      badgeEl.textContent = `👑 ${roleUpper}`;
    } else if (user.role === 'cashier') {
      badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20';
      badgeEl.textContent = `💵 ${roleUpper}`;
    } else {
      badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20';
      badgeEl.textContent = `👤 ${roleUpper}`;
    }
  }
}

function applyRolePermissions() {
  const role = (state.currentUser && state.currentUser.role) || 'waiter';
  document.querySelectorAll('.nav-tab').forEach(el => {
    const view = el.dataset.view;
    let allowed = false;
    
    if (role === 'admin') {
      allowed = true;
    } else if (role === 'cashier') {
      allowed = ['pos', 'dashboard', 'ledgers', 'products', 'reports'].includes(view);
    } else if (role === 'waiter') {
      allowed = ['pos'].includes(view);
    }
    
    if (allowed) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
      if (state.activeTab === view && window.switchView) {
        window.switchView('pos');
      }
    }
  });
}

window.handleLogin = async function() {
  try {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    const errorIcon = document.getElementById('loginErrorIcon');
    
    if (!usernameInput || !passwordInput) return;
    const username = (usernameInput.value || '').trim().toLowerCase();
    const password = (passwordInput.value || '').trim();
    
    if (errorIcon) errorIcon.textContent = '❌';
    if (errorDiv) {
      errorDiv.style.background = '';
      errorDiv.style.color = '';
      errorDiv.style.borderColor = '';
    }

    if (!username || !password) {
      if (errorText) errorText.textContent = 'Please enter both username and password.';
      if (errorDiv) errorDiv.classList.add('visible');
      return;
    }
    
    const users = getUsers();
    let hashedInput = '';
    try { hashedInput = await hashPassword(password); } catch(e) {}

    let user = (users || []).find(u => 
      u && u.username && u.username.toLowerCase() === username && 
      (u.password === password || u.password === hashedInput || u.passwordHash === hashedInput || u.passwordHash === password)
    );

    // Fail-safe fallback for primary administrator account (admin / Dmc@123)
    if (!user && username === 'admin' && (password === 'Dmc@123' || hashedInput === '0097fbb12c3c7e6937143229912a1eb54c95a0934f93ce6c07a72f796cd8b8fb')) {
      user = DEFAULT_USERS.find(u => u.username === 'admin');
    }
    
    if (!user) {
      if (errorText) errorText.textContent = 'Invalid username or password. Click "Create Account" below to register a valid account.';
      if (errorIcon) errorIcon.textContent = '❌';
      if (errorDiv) errorDiv.classList.add('visible');
      if (passwordInput) passwordInput.value = '';
      if (window.addSecurityAuditLog) {
        window.addSecurityAuditLog('AUTH', 'Failed Login Attempt', `Unknown username attempted: "${username}"`, 'WARNING');
      }
      return;
    }

    // Enforce account approval status
    const userStatus = user.status || 'APPROVED';
    if (userStatus === 'PENDING_APPROVAL') {
      if (errorIcon) errorIcon.textContent = '⏳';
      if (errorText) errorText.textContent = 'Account Pending Approval: Your account request is currently awaiting administrator review.';
      if (errorDiv) {
        errorDiv.style.background = 'rgba(245,158,11,0.12)';
        errorDiv.style.color = '#D97706';
        errorDiv.style.borderColor = 'rgba(245,158,11,0.3)';
        errorDiv.classList.add('visible');
      }
      if (passwordInput) passwordInput.value = '';
      return;
    }

    if (userStatus === 'DECLINED') {
      if (errorIcon) errorIcon.textContent = '🚫';
      if (errorText) errorText.textContent = 'Access Denied: Your account request was declined by the administrator.';
      if (errorDiv) {
        errorDiv.style.background = 'rgba(239,68,68,0.12)';
        errorDiv.style.color = '#EF4444';
        errorDiv.style.borderColor = 'rgba(239,68,68,0.3)';
        errorDiv.classList.add('visible');
      }
      if (passwordInput) passwordInput.value = '';
      return;
    }
    
    const session = { username: user.username, fullName: user.fullName || user.name || user.username.toUpperCase(), role: user.role };
    sessionStorage.setItem('dmch_resto_session', JSON.stringify(session));
    state.currentSession = session;
    state.currentUser = { name: session.fullName, role: session.role };
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorDiv) errorDiv.classList.remove('visible');
    
    showMainApp();
    if (window.showToast) window.showToast(`Welcome back, ${session.fullName}!`, 'success');
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('AUTH', 'Successful Login', `User @${session.username} (${session.role}) signed in successfully.`, 'INFO');
    }
  } catch (err) {
    console.error('Error during login:', err);
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    if (errorText) errorText.textContent = 'An error occurred during sign in. Please try again.';
    if (errorDiv) errorDiv.classList.add('visible');
  }
};

window.handleSignup = async function() {
  try {
    const fullNameInput = document.getElementById('signupFullName');
    const usernameInput = document.getElementById('signupUsername');
    const passwordInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const roleSelect = document.getElementById('signupRole');
    const errorDiv = document.getElementById('signupError');
    const errorText = document.getElementById('signupErrorText');
    
    if (!fullNameInput || !usernameInput || !passwordInput || !confirmInput) return;
    const fullName = (fullNameInput.value || '').trim();
    const username = (usernameInput.value || '').trim().toLowerCase();
    const password = (passwordInput.value || '').trim();
    const confirm = (confirmInput.value || '').trim();
    let role = roleSelect ? roleSelect.value : 'waiter';

    if (role === 'admin') {
      role = 'cashier';
    }
    
    if (!fullName || !username || !password || !confirm) {
      if (errorText) errorText.textContent = 'All fields are required.';
      if (errorDiv) errorDiv.classList.add('visible');
      return;
    }
    
    if (username.length < 3) {
      if (errorText) errorText.textContent = 'Username must be at least 3 characters.';
      if (errorDiv) errorDiv.classList.add('visible');
      return;
    }
    
    if (password !== confirm) {
      if (errorText) errorText.textContent = 'Passwords do not match.';
      if (errorDiv) errorDiv.classList.add('visible');
      if (confirmInput) confirmInput.value = '';
      return;
    }
    
    const users = getUsers();
    if (users.find(u => u && u.username && u.username.toLowerCase() === username)) {
      if (errorText) errorText.textContent = 'Username already exists. Choose a different one.';
      if (errorDiv) errorDiv.classList.add('visible');
      return;
    }
    
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: `u-${Date.now()}`,
      username,
      password: hashedPassword,
      passwordHash: hashedPassword,
      fullName: fullName.toUpperCase(),
      role,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('USER_MGMT', 'New Account Registration', `New account registered: @${username} (${role}) — status: PENDING_APPROVAL.`, 'INFO');
    }
    
    fullNameInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    confirmInput.value = '';
    if (errorDiv) errorDiv.classList.remove('visible');
    
    showLoginForm();
    setTimeout(() => {
      const loginError = document.getElementById('loginError');
      const loginErrorText = document.getElementById('loginErrorText');
      const loginErrorIcon = document.getElementById('loginErrorIcon');
      if (loginError && loginErrorText) {
        if (loginErrorIcon) loginErrorIcon.textContent = '⏳';
        loginErrorText.textContent = 'Account Created! Your request is pending admin approval before you can sign in.';
        loginError.style.background = 'rgba(245,158,11,0.12)';
        loginError.style.color = '#D97706';
        loginError.style.borderColor = 'rgba(245,158,11,0.3)';
        loginError.classList.add('visible');
      }
    }, 100);
  } catch (err) {
    console.error('Error during signup:', err);
    const errorDiv = document.getElementById('signupError');
    const errorText = document.getElementById('signupErrorText');
    if (errorText) errorText.textContent = 'An error occurred during account creation. Please try again.';
    if (errorDiv) errorDiv.classList.add('visible');
  }
};

window.showLoginForm = function() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm) loginForm.style.display = 'block';
  if (signupForm) signupForm.style.display = 'none';
  const loginError = document.getElementById('loginError');
  const loginErrorIcon = document.getElementById('loginErrorIcon');
  if (loginErrorIcon) loginErrorIcon.textContent = '❌';
  if (loginError) {
    loginError.classList.remove('visible');
    loginError.style.background = '';
    loginError.style.color = '';
    loginError.style.borderColor = '';
  }
};

window.showSignupForm = function() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm) loginForm.style.display = 'none';
  if (signupForm) signupForm.style.display = 'block';
  const signupError = document.getElementById('signupError');
  if (signupError) signupError.classList.remove('visible');
};

window.logout = function() {
  if (window.addSecurityAuditLog && state.currentSession) {
    window.addSecurityAuditLog('AUTH', 'User Logout', `User @${state.currentSession.username} (${state.currentSession.role}) signed out.`, 'INFO');
  }
  document.documentElement.classList.remove('authenticated-session');
  sessionStorage.removeItem('dmch_resto_session');
  sessionStorage.removeItem('coffeeshop_session');
  state.currentSession = null;
  state.currentUser = { name: 'GUEST', role: 'cashier' };
  state.cart = [];
  state.activeTab = 'pos';
  showAuthScreen();
};
