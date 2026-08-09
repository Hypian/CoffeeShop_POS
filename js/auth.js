/* ==========================================================================
   DMCH Resto POS & MIS — Authentication, Roles & Session Inactivity Timeout
   ========================================================================== */

function seedDefaultUsers() {
  let existingUsers = JSON.parse(localStorage.getItem('dmch_resto_users') || localStorage.getItem('coffeeshop_users'));
  if (!existingUsers) {
    existingUsers = [...DEFAULT_USERS];
  } else {
    DEFAULT_USERS.forEach(defU => {
      if (!existingUsers.some(u => u.username === defU.username)) {
        existingUsers.push(defU);
      }
    });
  }
  localStorage.setItem('dmch_resto_users', JSON.stringify(existingUsers));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('dmch_resto_users') || localStorage.getItem('coffeeshop_users')) || DEFAULT_USERS;
}

function saveUsers(users) {
  localStorage.setItem('dmch_resto_users', JSON.stringify(users));
}

function checkExistingSession() {
  const session = JSON.parse(sessionStorage.getItem('dmch_resto_session') || sessionStorage.getItem('coffeeshop_session'));
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
  const role = state.currentUser.role || 'waiter';
  document.querySelectorAll('.nav-tab').forEach(el => {
    const view = el.dataset.view;
    let allowed = false;
    
    if (role === 'admin' || role === 'cashier') {
      allowed = true;
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

window.handleLogin = function() {
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
  const user = users.find(u => u.username.toLowerCase() === username && u.password === password);
  
  if (!user) {
    errorText.textContent = 'Invalid username or password. Please try again.';
    errorDiv.classList.add('visible');
    passwordInput.value = '';
    return;
  }
  
  const session = { username: user.username, fullName: user.fullName, role: user.role };
  sessionStorage.setItem('dmch_resto_session', JSON.stringify(session));
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
    const loginErrorIcon = document.getElementById('loginErrorIcon');
    if (loginError && loginErrorText) {
      if (loginErrorIcon) loginErrorIcon.textContent = '✅';
      loginErrorText.textContent = 'Account created! Sign in with your credentials.';
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
