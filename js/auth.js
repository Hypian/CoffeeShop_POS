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
  let currentUsers = (Array.isArray(state.users) && state.users.length > 0) ? state.users : [...DEFAULT_USERS];
  
  // Ensure the default admin is always present if no admin exists
  if (!currentUsers.some(u => u && u.username === 'admin')) {
    const defaultAdmin = DEFAULT_USERS.find(u => u.username === 'admin');
    if (defaultAdmin) {
      currentUsers = [defaultAdmin, ...currentUsers];
    }
  }
  
  return currentUsers;
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
    const session = JSON.parse(sessionStorage.getItem('dmch_resto_session') || localStorage.getItem('dmch_resto_session'));
    if (session && session.username) {
      state.currentSession = session;
      state.currentUser = { name: session.fullName, role: session.role };
      showMainApp();
      if (window.pullCloudDataToState) {
        window.pullCloudDataToState();
      }
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
  try {
    document.documentElement.classList.add('authenticated-session');
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainAppContainer');
    if (authScreen) authScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.add('authenticated');
    
    if (window.loadStorageData) {
      try { window.loadStorageData(); } catch(e) { console.error('Error in loadStorageData:', e); }
    }
    if (window.setupEventListeners) {
      try { window.setupEventListeners(); } catch(e) { console.error('Error in setupEventListeners:', e); }
    }
    try { updateUserBadge(); } catch(e) { console.error('Error in updateUserBadge:', e); }
    try { applyRolePermissions(); } catch(e) { console.error('Error in applyRolePermissions:', e); }
    if (window.switchView) {
      try { window.switchView('pos'); } catch(e) { console.error('Error in switchView:', e); }
    }
  } catch(err) {
    console.error('Error displaying main application:', err);
  }
}

function showLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm) loginForm.style.display = 'block';
  if (signupForm) signupForm.style.display = 'none';
  const loginError = document.getElementById('loginError');
  const loginErrorIcon = document.getElementById('loginErrorIcon');
  if (loginErrorIcon) loginErrorIcon.innerHTML = "<i class='bx bx-x'></i>";
  if (loginError) {
    loginError.classList.remove('visible');
    loginError.style.background = '';
    loginError.style.color = '';
    loginError.style.borderColor = '';
  }
}

function showSignupForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm) loginForm.style.display = 'none';
  if (signupForm) signupForm.style.display = 'block';
  const signupError = document.getElementById('signupError');
  if (signupError) signupError.classList.remove('visible');
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
      badgeEl.innerHTML = `<i class='bx bx-crown'></i> ${roleUpper}`;
    } else if (user.role === 'cashier') {
      badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20';
      badgeEl.innerHTML = `<i class='bx bx-money'></i> ${roleUpper}`;
    } else {
      badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20';
      badgeEl.innerHTML = `<i class='bx bx-user'></i> ${roleUpper}`;
    }
  }
}

function applyRolePermissions() {
  const role = ((state.currentUser && state.currentUser.role) || 'waiter').toLowerCase();
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

let _authLoadingTimer = null;

function showAuthLoading(title = 'Connecting to Cloud Terminal...', subtext = 'Authenticating credentials & waking up secure server...') {
  const overlay = document.getElementById('authLoadingOverlay');
  const subtextEl = document.getElementById('authLoadingSubtext');
  const titleEl = document.querySelector('#authLoadingOverlay .auth-loading-title');
  if (titleEl) titleEl.textContent = title;
  if (subtextEl) subtextEl.textContent = subtext;
  if (overlay) overlay.style.display = 'flex';

  if (_authLoadingTimer) clearTimeout(_authLoadingTimer);
  _authLoadingTimer = setTimeout(() => {
    if (subtextEl && overlay && overlay.style.display !== 'none') {
      subtextEl.textContent = 'Database container is waking up from idle, almost there...';
    }
  }, 2500);
}

function hideAuthLoading() {
  if (_authLoadingTimer) {
    clearTimeout(_authLoadingTimer);
    _authLoadingTimer = null;
  }
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

async function handleLogin() {
  try {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    const errorIcon = document.getElementById('loginErrorIcon');
    
    if (!usernameInput || !passwordInput) return;
    const username = (usernameInput.value || '').trim().toLowerCase();
    const password = (passwordInput.value || '').trim();
    
    if (errorIcon) errorIcon.innerHTML = "<i class='bx bx-x'></i>";
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
    
    // Show themed Hamster loading animation
    showAuthLoading('Connecting to Cloud Terminal...', 'Verifying credentials & establishing secure session...');

    // Call backend API for login
    let user = null;
    try {
      const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : 'http://localhost:5000/api';
      const fetchFn = typeof apiFetch === 'function' ? apiFetch : fetch;
      const res = await fetchFn(`${baseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        user = data.user;
        if (data.token) {
          if (window.setAuthToken) window.setAuthToken(data.token);
          else {
            sessionStorage.setItem('jwtToken', data.token);
            localStorage.setItem('jwtToken', data.token);
          }
        }
      } else {
        throw new Error(`BACKEND_AUTH_FAILED: ${(data && data.error) || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.warn('Backend login notice:', err);
      // If the backend actively rejected the credentials, don't let them in!
      if (window.cloudSyncActive && err.message && err.message.startsWith('BACKEND_AUTH_FAILED:')) {
        hideAuthLoading();
        const errorMsg = err.message.replace('BACKEND_AUTH_FAILED: ', '');
        if (errorIcon) errorIcon.textContent = '❌';
        if (errorText) errorText.textContent = errorMsg;
        if (errorIcon) errorIcon.innerHTML = "<i class='bx bx-x'></i>";
        if (errorDiv) errorDiv.classList.add('visible');
        if (passwordInput) passwordInput.value = '';
        return;
      }
      
      // Fallback local logic for offline mode
      let hashedInput = '';
      try { hashedInput = await hashPassword(password); } catch(e) {}

      const users = typeof getUsers === 'function' ? getUsers() : (state.users || []);
      user = users.find(u =>
        u && u.username && u.username.toLowerCase() === username &&
        (u.passwordHash === hashedInput || u.password === password)
      );

      if (!user && username === 'admin' && password === 'Dmc@123') {
        const adminExists = (state.users || []).some(u => u && u.username === 'admin');
        if (!adminExists) {
          user = typeof DEFAULT_USERS !== 'undefined' ? DEFAULT_USERS.find(u => u.username === 'admin') : { username: 'admin', role: 'admin', status: 'APPROVED' };
        }
      }
      
      if (!user) {
        hideAuthLoading();
        if (errorIcon) errorIcon.textContent = '❌';
        if (errorText) errorText.textContent = err.message ? err.message.replace('BACKEND_AUTH_FAILED: ', '') : 'Invalid username or password.';
        if (errorIcon) errorIcon.innerHTML = "<i class='bx bx-x'></i>";
        if (errorDiv) errorDiv.classList.add('visible');
        if (passwordInput) passwordInput.value = '';
        return;
      }
      
      const userStatus = user.status || 'APPROVED';
      if (userStatus === 'PENDING_APPROVAL') {
        hideAuthLoading();
        if (errorIcon) errorIcon.textContent = '⏳';
        if (errorText) errorText.textContent = 'Account Pending Approval.';
        if (errorDiv) errorDiv.classList.add('visible');
        return;
      }
      if (userStatus === 'DECLINED') {
        hideAuthLoading();
        if (errorIcon) errorIcon.textContent = '🚫';
        if (errorText) errorText.textContent = 'Access Denied: Account declined.';
        if (errorDiv) errorDiv.classList.add('visible');
        return;
      }
    }

    hideAuthLoading();
    if (errorDiv) errorDiv.classList.remove('visible');

    const session = {
      username: user.username,
      fullName: user.full_name || user.fullName || user.username,
      role: user.role,
      loginTime: new Date().toISOString()
    };
    try {
      sessionStorage.setItem('dmch_resto_session', JSON.stringify(session));
      localStorage.setItem('dmch_resto_session', JSON.stringify(session));
    } catch(e) {}

    // Populate state so applyRolePermissions works immediately
    state.currentSession = session;
    state.currentUser = { name: session.fullName, role: session.role };

    showMainApp();
    
    // Automatically pull fresh cloud data upon login
    if (window.pullCloudDataToState) {
      window.pullCloudDataToState();
    }

    if (window.showToast) window.showToast(`Welcome back, ${session.fullName}!`, 'success');
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('AUTH', 'Successful Login', `User @${session.username} (${session.role}) signed in successfully.`, 'INFO');
    }
  } catch (err) {
    hideAuthLoading();
    console.error('Error during login:', err);
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    if (errorText) errorText.textContent = 'An error occurred during sign in. Please try again.';
    if (errorDiv) errorDiv.classList.add('visible');
  }
}

async function handleSignup() {
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
    
    showAuthLoading('Creating Staff Account...', 'Registering credentials with secure database...');

    const users = getUsers();
    if (users.find(u => u && u.username && u.username.toLowerCase() === username)) {
      hideAuthLoading();
      if (errorText) errorText.textContent = 'Username already exists. Choose a different one.';
      if (errorDiv) errorDiv.classList.add('visible');
      return;
    }
    
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: `u-${Date.now()}`,
      username,
      password: password,
      passwordHash: hashedPassword,
      fullName: fullName.toUpperCase(),
      role,
      status: 'APPROVED', // Pre-approved for seamless team workflow
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('USER_MGMT', 'New Account Registration', `New account registered: @${username} (${role}).`, 'INFO');
    }
    
    fullNameInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    confirmInput.value = '';
    if (errorDiv) errorDiv.classList.remove('visible');
    
    hideAuthLoading();
    showLoginForm();
    if (window.showToast) window.showToast(`Account @${username} created successfully! You can now sign in.`, 'success');
  } catch (err) {
    hideAuthLoading();
    console.error('Error during signup:', err);
    const errorDiv = document.getElementById('signupError');
    const errorText = document.getElementById('signupErrorText');
    if (errorText) errorText.textContent = 'An error occurred during account creation. Please try again.';
    if (errorDiv) errorDiv.classList.add('visible');
  }
}

function logout() {
  if (window.addSecurityAuditLog && state.currentSession) {
    window.addSecurityAuditLog('AUTH', 'User Logout', `User @${state.currentSession.username} (${state.currentSession.role}) signed out.`, 'INFO');
  }
  document.documentElement.classList.remove('authenticated-session');
  try {
    sessionStorage.removeItem('dmch_resto_session');
    sessionStorage.removeItem('coffeeshop_session');
    localStorage.removeItem('dmch_resto_session');
  } catch(e) {}
  
  if (window.setAuthToken) {
    window.setAuthToken(null);
  } else {
    sessionStorage.removeItem('jwtToken');
    localStorage.removeItem('jwtToken');
  }

  state.currentSession = null;
  state.currentUser = { name: 'GUEST', role: 'cashier' };
  state.cart = [];
  state.activeTab = 'pos';
  showAuthScreen();
}

// Expose all functions to global window object
window.hashPassword = hashPassword;
window.seedDefaultUsers = seedDefaultUsers;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.checkExistingSession = checkExistingSession;
window.showAuthScreen = showAuthScreen;
window.showMainApp = showMainApp;
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.updateUserBadge = updateUserBadge;
window.applyRolePermissions = applyRolePermissions;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.logout = logout;
