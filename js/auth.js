async function hashPassword(str) {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function seedDefaultUsers() {
  let existingUsers = JSON.parse(localStorage.getItem('dmch_resto_users'));
  if (!existingUsers || existingUsers.length === 0) {
    existingUsers = [...DEFAULT_USERS];
  } else {
    // Ensure admin user credentials (username: 'admin', password: 'Dmc@123') and APPROVED status
    const adminUser = existingUsers.find(u => u.username && u.username.toLowerCase() === 'admin');
    if (adminUser) {
      adminUser.password = 'Dmc@123';
      adminUser.passwordHash = '0097fbb12c3c7e6937143229912a1eb54c95a0934f93ce6c07a72f796cd8b8fb';
      adminUser.role = 'admin';
      adminUser.status = 'APPROVED';
    } else {
      existingUsers.unshift({
        id: 'u-admin',
        username: 'admin',
        password: 'Dmc@123',
        passwordHash: '0097fbb12c3c7e6937143229912a1eb54c95a0934f93ce6c07a72f796cd8b8fb',
        role: 'admin',
        name: 'System Administrator',
        fullName: 'SYSTEM ADMINISTRATOR',
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      });
    }

    // Ensure default in-service cashiers and waiters exist in the users list
    DEFAULT_USERS.forEach(defUser => {
      if (!existingUsers.some(u => u.username && u.username.toLowerCase() === defUser.username.toLowerCase())) {
        existingUsers.push({ ...defUser });
      }
    });

    // Ensure every existing user has a status and fullName property
    existingUsers.forEach(u => {
      if (!u.status) u.status = 'APPROVED';
      if (!u.fullName && u.name) u.fullName = u.name.toUpperCase();
      if (!u.fullName && u.username) u.fullName = u.username.toUpperCase();
    });
  }

  // CRITICAL FIX: Assign stable id to any user missing one (handles legacy localStorage records)
  // Without an id, Block/Delete/Reset buttons cannot look up the user by userId
  existingUsers.forEach((u, i) => {
    if (!u.id) {
      u.id = `u-legacy-${(u.username || i).toString().toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }
  });

  localStorage.setItem('dmch_resto_users', JSON.stringify(existingUsers));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('dmch_resto_users')) || DEFAULT_USERS;
}

function saveUsers(users) {
  localStorage.setItem('dmch_resto_users', JSON.stringify(users));
  if (window.cloudSyncUsers) {
    window.cloudSyncUsers(users);
  }
  if (window.broadcastLiveSync) {
    window.broadcastLiveSync({ type: 'USERS_UPDATED' });
  }
}

function checkExistingSession() {
  const session = JSON.parse(sessionStorage.getItem('dmch_resto_session'));
  if (session) {
    state.currentSession = session;
    state.currentUser = { name: session.fullName, role: session.role };
    showMainApp();
  } else {
    showAuthScreen();
  }
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
  
  loadStorageData();
  setupEventListeners();
  updateUserBadge();
  applyRolePermissions();
  switchView('pos');
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
      // Administrator has full access including User Management ('users')
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
      if (state.activeTab === view) {
        switchView('pos');
      }
    }
  });
}

window.handleLogin = async function() {
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const errorDiv = document.getElementById('loginError');
  const errorText = document.getElementById('loginErrorText');
  const errorIcon = document.getElementById('loginErrorIcon');
  
  const username = (usernameInput.value || '').trim().toLowerCase();
  const password = (passwordInput.value || '').trim();
  
  if (errorIcon) errorIcon.textContent = '❌';
  if (errorDiv) {
    errorDiv.style.background = '';
    errorDiv.style.color = '';
    errorDiv.style.borderColor = '';
  }

  if (!username || !password) {
    errorText.textContent = 'Please enter both username and password.';
    errorDiv.classList.add('visible');
    return;
  }
  
  const users = getUsers();
  const hashedInput = await hashPassword(password);

  const user = users.find(u => 
    u.username.toLowerCase() === username && 
    (u.password === password || u.password === hashedInput || u.passwordHash === hashedInput || u.passwordHash === password)
  );
  
  if (!user) {
    errorText.textContent = 'Invalid username or password. Click "Create Account" below to register a valid account.';
    if (errorIcon) errorIcon.textContent = '❌';
    errorDiv.classList.add('visible');
    passwordInput.value = '';
    // Security audit — failed login attempt
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('AUTH', 'Failed Login Attempt', `Unknown username attempted: "${username}"`, 'WARNING');
    }
    return;
  }

  // Enforce account approval status
  const userStatus = user.status || 'APPROVED';
  if (userStatus === 'PENDING_APPROVAL') {
    if (errorIcon) errorIcon.textContent = '⏳';
    errorText.textContent = 'Account Pending Approval: Your account request is currently awaiting administrator review. System data access is restricted until approved.';
    errorDiv.style.background = 'rgba(245,158,11,0.12)';
    errorDiv.style.color = '#D97706';
    errorDiv.style.borderColor = 'rgba(245,158,11,0.3)';
    errorDiv.classList.add('visible');
    passwordInput.value = '';
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('AUTH', 'Blocked Login — Pending Approval', `User @${user.username} (${user.role}) attempted login while PENDING_APPROVAL.`, 'WARNING');
    }
    return;
  }

  if (userStatus === 'DECLINED') {
    if (errorIcon) errorIcon.textContent = '🚫';
    errorText.textContent = 'Access Denied: Your account request was declined by the administrator. Please contact management.';
    errorDiv.style.background = 'rgba(239,68,68,0.12)';
    errorDiv.style.color = '#EF4444';
    errorDiv.style.borderColor = 'rgba(239,68,68,0.3)';
    errorDiv.classList.add('visible');
    passwordInput.value = '';
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('AUTH', 'Blocked Login — Account Declined', `User @${user.username} attempted login with DECLINED account status.`, 'CRITICAL');
    }
    return;
  }
  
  const session = { username: user.username, fullName: user.fullName || user.name || user.username.toUpperCase(), role: user.role };
  sessionStorage.setItem('dmch_resto_session', JSON.stringify(session));
  state.currentSession = session;
  state.currentUser = { name: session.fullName, role: session.role };
  
  usernameInput.value = '';
  passwordInput.value = '';
  errorDiv.classList.remove('visible');
  
  showMainApp();
  showToast(`Welcome back, ${session.fullName}!`, 'success');
  // Security audit — successful login
  if (window.addSecurityAuditLog) {
    window.addSecurityAuditLog('AUTH', 'Successful Login', `User @${session.username} (${session.role}) signed in successfully.`, 'INFO');
  }
};

window.handleSignup = async function() {
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
  let role = roleSelect ? roleSelect.value : 'waiter';

  // Prevent creation of admin role via sign up form
  if (role === 'admin') {
    role = 'cashier';
  }
  
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

  // Security audit — new registration
  if (window.addSecurityAuditLog) {
    window.addSecurityAuditLog('USER_MGMT', 'New Account Registration', `New account registered: @${username} (${role}) — status: PENDING_APPROVAL. Awaiting admin review.`, 'INFO');
  }
  
  fullNameInput.value = '';
  usernameInput.value = '';
  passwordInput.value = '';
  confirmInput.value = '';
  errorDiv.classList.remove('visible');
  
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
};

window.showLoginForm = function() {
  document.getElementById('loginForm').style.display = '';
  document.getElementById('signupForm').style.display = 'none';
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
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = '';
  document.getElementById('signupError').classList.remove('visible');
};

window.logout = function() {
  // Security audit — logout event
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
  showLoginForm();
};
