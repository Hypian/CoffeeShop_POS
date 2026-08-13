// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT MODULE (Admin Only)
// Handles viewing all registered users, pending account approvals/declines,
// role assignments, and password resets.
// ══════════════════════════════════════════════════════════════════════════════

window.renderUsers = function(isRefresh = false) {
  const container = document.getElementById('usersContent');
  if (!container) return;

  // Pull latest users from Render Cloud API if not already refreshing
  if (!isRefresh && window.pullCloudDataToState && !window._isPullingUsersForView) {
    window._isPullingUsersForView = true;
    window.pullCloudDataToState().then(() => {
      window._isPullingUsersForView = false;
      if (window.renderUsers) window.renderUsers(true);
    }).catch(() => {
      window._isPullingUsersForView = false;
    });
  }

  const users = getUsers();
  const searchInput = (document.getElementById('userSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('userStatusFilter')?.value || 'ALL';
  const roleFilter = document.getElementById('userRoleFilter')?.value || 'ALL';

  // Calculate statistics
  const totalCount = users.length;
  const pendingCount = users.filter(u => u.status === 'PENDING_APPROVAL').length;
  const approvedCount = users.filter(u => u.status === 'APPROVED' || !u.status).length;
  const declinedCount = users.filter(u => u.status === 'DECLINED').length;

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const status = u.status || 'APPROVED';
    const matchesSearch = !searchInput || 
      (u.fullName || '').toLowerCase().includes(searchInput) || 
      (u.username || '').toLowerCase().includes(searchInput) ||
      (u.role || '').toLowerCase().includes(searchInput);

    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingUsers = users.filter(u => u.status === 'PENDING_APPROVAL');

  container.innerHTML = `
    <!-- Top Header & Metric Cards -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-amber-400 flex items-center justify-center text-3xl font-extrabold shadow-lg">👥</div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-500/30">System Administration</span>
            <span class="text-xs text-slate-400 font-mono hidden sm:inline">• Account Approval & Security Center</span>
          </div>
          <h2 class="text-xl font-bold text-[#0F172A] mt-1">User & Access Control Directory</h2>
          <p class="text-xs text-[#475569]">Manage staff terminal accounts, approve or decline registration requests, and configure access roles.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 w-full lg:w-auto">
        <button onclick="openAddUserModal()" class="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white border-none rounded-xl px-5 py-3 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 w-full lg:w-auto transition-all active:scale-95">
          <span>➕</span> Add New User
        </button>
      </div>
    </div>

    <!-- Metric Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Total System Users</div>
        <div class="text-2xl font-extrabold text-[#0F172A]">${totalCount}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Registered staff terminals</div>
      </div>
      <div class="bg-[#FFFFFF] border ${pendingCount > 0 ? 'border-amber-400 bg-amber-50/20' : 'border-black/[0.1]'} rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center justify-between">
          <span>Pending Approvals</span>
          ${pendingCount > 0 ? `<span class="animate-pulse bg-amber-500 text-slate-950 font-extrabold text-[0.65rem] px-2 py-0.5 rounded-full">${pendingCount} REQUIRES ACTION</span>` : ''}
        </div>
        <div class="text-2xl font-extrabold text-amber-600">${pendingCount}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Awaiting admin review</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Approved & Active</div>
        <div class="text-2xl font-extrabold text-emerald-600">${approvedCount}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Granted full terminal access</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Declined Requests</div>
        <div class="text-2xl font-extrabold text-rose-600">${declinedCount}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Restricted from data access</div>
      </div>
    </div>

    <!-- Pending Approvals Highlight Banner (if any exist) -->
    ${pendingUsers.length > 0 ? `
      <div class="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-amber-900 flex items-center gap-2">
            <span>⏳</span> Pending Account Registration Requests (${pendingUsers.length})
          </h3>
          <span class="text-xs font-semibold text-amber-700">Action Required</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${pendingUsers.map(u => `
            <div class="bg-white border border-amber-300/80 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-sm border border-amber-300">
                  ${(u.fullName || u.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div class="text-sm font-bold text-slate-900">${u.fullName || u.username}</div>
                  <div class="text-xs text-slate-500 font-mono">@${u.username} • Role: <strong class="uppercase text-amber-700">${u.role}</strong></div>
                  <div class="text-[0.68rem] text-slate-400 mt-0.5">Requested: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recently'}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="setUserApprovalStatus('${u.id}', 'APPROVED')" class="bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                  ✅ Approve
                </button>
                <button onclick="setUserApprovalStatus('${u.id}', 'DECLINED')" class="bg-rose-600 hover:bg-rose-700 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                  ❌ Decline
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Search & Filter Controls -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        <input type="text" id="userSearchInput" value="${searchInput}" placeholder="Search name, username, role..." onkeyup="renderUsers()" class="w-full bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-[#F59E0B]">
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <select id="userStatusFilter" onchange="renderUsers()" class="bg-[#F8FAFC] border border-black/[0.1] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F59E0B]">
          <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="PENDING_APPROVAL" ${statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>⏳ Pending Approval</option>
          <option value="APPROVED" ${statusFilter === 'APPROVED' ? 'selected' : ''}>✅ Approved / Active</option>
          <option value="DECLINED" ${statusFilter === 'DECLINED' ? 'selected' : ''}>❌ Declined / Blocked</option>
        </select>

        <select id="userRoleFilter" onchange="renderUsers()" class="bg-[#F8FAFC] border border-black/[0.1] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F59E0B]">
          <option value="ALL" ${roleFilter === 'ALL' ? 'selected' : ''}>All Roles</option>
          <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>Administrator</option>
          <option value="cashier" ${roleFilter === 'cashier' ? 'selected' : ''}>Staff Cashier</option>
          <option value="waiter" ${roleFilter === 'waiter' ? 'selected' : ''}>Service Waiter</option>
        </select>
      </div>
    </div>

    <!-- Complete Users Directory Table -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-[#0F172A]">Registered Users (${filteredUsers.length})</h3>
        <span class="text-xs text-slate-400 font-mono">Total: ${users.length} System Accounts</span>
      </div>

      <div class="overflow-x-auto">
        <table class="data-table w-full text-left text-sm">
          <thead>
            <tr class="text-[#475569] border-b border-black/[0.1]">
              <th class="py-3 px-4 font-semibold">User Details</th>
              <th class="py-3 px-4 font-semibold">Role</th>
              <th class="py-3 px-4 font-semibold">Status</th>
              <th class="py-3 px-4 font-semibold">Registration Date</th>
              <th class="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.1]">
            ${filteredUsers.length > 0 ? filteredUsers.map(u => {
              const status = u.status || 'APPROVED';
              const isPending = status === 'PENDING_APPROVAL';
              const isDeclined = status === 'DECLINED';
              const isApproved = status === 'APPROVED';

              let roleBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Waiter</span>';
              if (u.role === 'admin') {
                roleBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Administrator</span>';
              } else if (u.role === 'cashier') {
                roleBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Cashier</span>';
              }

              let statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ Active / Approved</span>';
              if (isPending) {
                statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">⏳ Pending Approval</span>';
              } else if (isDeclined) {
                statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">❌ Declined / Blocked</span>';
              }

              const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'System Default';

              return `
                <tr class="${isPending ? 'bg-amber-50/30' : (isDeclined ? 'bg-rose-50/30 opacity-75' : '')}">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl ${u.role === 'admin' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'} font-extrabold flex items-center justify-center text-xs shadow-xs">
                        ${(u.fullName || u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-sm">${u.fullName || u.name || u.username}</div>
                        <div class="text-xs font-mono text-slate-500">@${u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">${roleBadge}</td>
                  <td class="py-3 px-4">${statusBadge}</td>
                  <td class="py-3 px-4 text-xs font-mono text-slate-500">${dateStr}</td>
                  <td class="py-3 px-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      ${isPending ? `
                        <button onclick="setUserApprovalStatus('${u.id}', 'APPROVED')" title="Approve Account" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-all active:scale-95">✅ Approve</button>
                        <button onclick="setUserApprovalStatus('${u.id}', 'DECLINED')" title="Decline Account" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all active:scale-95">❌ Decline</button>
                      ` : (isDeclined ? `
                        <button onclick="setUserApprovalStatus('${u.id}', 'APPROVED')" title="Re-approve Account" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-all active:scale-95">✅ Approve</button>
                      ` : `
                        <button onclick="setUserApprovalStatus('${u.id}', 'DECLINED')" title="Block / Decline Access" class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all active:scale-95">🚫 Block</button>
                      `)}

                      <button onclick="openResetPasswordModal('${u.id}')" title="Reset Password" class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-all active:scale-95">🔑 Reset</button>

                      ${u.username !== 'admin' ? `
                        <button onclick="deleteUserAccount('${u.id}')" title="Delete Account" class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all active:scale-95">🗑️</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="5" class="py-8 text-center text-slate-500 italic">No users found matching current filters.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Security & Audit Log Viewer -->
    <div id="auditLogContent"></div>
  `;

  // Render the security audit log viewer immediately after the user table
  if (window.renderSecurityAuditLog) {
    window.renderSecurityAuditLog('auditLogContent');
  }
};

window.setUserApprovalStatus = function(userId, newStatus) {
  const users = getUsers();
  const user = users.find(u => u && (u.id === userId || String(u.id) === String(userId) || (u.username && u.username.toLowerCase() === String(userId).toLowerCase())));
  if (!user) {
    showToast('User account not found.', 'error');
    return;
  }

  if (user.username === 'admin' && newStatus === 'DECLINED') {
    showToast('Cannot block or decline primary Administrator account.', 'error');
    return;
  }

  if (newStatus === 'DECLINED') {
    window.showConfirmModal({
      title: "🚫 Decline / Block User Account",
      message: `Are you sure you want to block or decline access for "${user.fullName || user.username}" (@${user.username})? They will be prevented from logging into the system.`,
      confirmText: "Yes, Block Account",
      icon: "🚫",
      badgeText: "Access Control",
      isDanger: true,
      onConfirm: async () => {
        user.status = 'DECLINED';
        saveUsers(users);
        if (window.addSecurityAuditLog) {
          window.addSecurityAuditLog('USER_MGMT', 'Account Declined / Blocked', `Admin blocked account @${user.username} (${user.role}). Access to system is revoked.`, 'CRITICAL');
        }
        showToast(`Account for @${user.username} has been declined / blocked.`, 'error');
        renderUsers();
      }
    });
  } else {
    user.status = newStatus;
    saveUsers(users);
    if (window.addSecurityAuditLog) {
      window.addSecurityAuditLog('USER_MGMT', 'Account Approved', `Admin approved account @${user.username} (${user.role}). System access granted.`, 'INFO');
    }
    showToast(`Account for @${user.username} has been approved and activated!`, 'success');
    renderUsers();
  }
};

window.deleteUserAccount = function(userId) {
  const users = getUsers();
  const user = users.find(u => u && (u.id === userId || String(u.id) === String(userId) || (u.username && u.username.toLowerCase() === String(userId).toLowerCase())));
  if (!user) {
    showToast('User account not found.', 'error');
    return;
  }

  if (user.username === 'admin') {
    showToast('Cannot delete primary Administrator account.', 'error');
    return;
  }

  window.showConfirmModal({
    title: "👥 Delete User Account",
    message: `Are you sure you want to permanently delete user account "${user.fullName || user.username}" (@${user.username})? This user will no longer be able to access the system.`,
    confirmText: "Yes, Delete Account",
    icon: "👤",
    badgeText: "User Management",
    isDanger: true,
    onConfirm: async () => {
      const updatedUsers = users.filter(u => u && String(u.id) !== String(user.id) && String(u.username).toLowerCase() !== String(user.username).toLowerCase());
      saveUsers(updatedUsers);
      if (window.cloudDeleteUser) {
        await window.cloudDeleteUser(user.id);
      }
      if (window.addSecurityAuditLog) {
        window.addSecurityAuditLog('USER_MGMT', 'Account Permanently Deleted', `Admin permanently deleted account @${user.username} (${user.role}). All system access permanently revoked.`, 'CRITICAL');
      }
      showToast(`User account @${user.username} deleted successfully.`, 'success');
      renderUsers();
    }
  });
};

window.openAddUserModal = function() {
  openModal('modalAddUser');
};

window.saveNewUserByAdmin = async function() {
  const fullName = (document.getElementById('adminNewUserFullName')?.value || '').trim().toUpperCase();
  const username = (document.getElementById('adminNewUserUsername')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('adminNewUserPassword')?.value || '').trim();
  const role = document.getElementById('adminNewUserRole')?.value || 'cashier';

  if (!fullName || !username || !password) {
    showToast('Please fill out all required fields.', 'error');
    return;
  }

  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username)) {
    showToast('Username already exists. Choose a different username.', 'error');
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
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  if (window.addSecurityAuditLog) {
    window.addSecurityAuditLog('USER_MGMT', 'Account Created by Admin', `Admin created pre-approved account @${username} with role: ${role.toUpperCase()}.`, 'INFO');
  }

  closeModal('modalAddUser');
  showToast(`User ${username} created and pre-approved as ${role.toUpperCase()}!`, 'success');
  renderUsers();

  // Clear inputs
  document.getElementById('adminNewUserFullName').value = '';
  document.getElementById('adminNewUserUsername').value = '';
  document.getElementById('adminNewUserPassword').value = '';
};

window.openResetPasswordModal = function(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  state.resetPasswordUserId = userId;
  document.getElementById('resetPasswordTargetUser').textContent = `${user.fullName || user.username} (@${user.username})`;
  document.getElementById('adminNewPasswordInput').value = '';
  openModal('modalResetPassword');
};

window.saveUserPasswordReset = async function() {
  const userId = state.resetPasswordUserId;
  const newPassword = (document.getElementById('adminNewPasswordInput')?.value || '').trim();

  if (!newPassword || newPassword.length < 4) {
    showToast('Password must be at least 4 characters long.', 'error');
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.passwordHash = hashedPassword;
  saveUsers(users);

  if (window.addSecurityAuditLog) {
    window.addSecurityAuditLog('USER_MGMT', 'Password Reset by Admin', `Admin reset password for account @${user.username} (${user.role}).`, 'WARNING');
  }

  closeModal('modalResetPassword');
  showToast(`Password for @${user.username} reset successfully!`, 'success');
  renderUsers();
};

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY AUDIT LOG VIEWER
// Renders a filterable, real-time security event log within User Management
// ══════════════════════════════════════════════════════════════════════════════

window.renderSecurityAuditLog = function(containerId = 'auditLogContent') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const allLogs = (state.auditLogs || []).filter(l => l.isSecurityEvent || l.action);
  const filterCat = document.getElementById('auditCategoryFilter')?.value || 'ALL';
  const filterSev = document.getElementById('auditSeverityFilter')?.value || 'ALL';

  const logs = allLogs.filter(l => {
    const matchCat = filterCat === 'ALL' || l.category === filterCat;
    const matchSev = filterSev === 'ALL' || l.severity === filterSev;
    return matchCat && matchSev;
  }).slice(0, 100); // Cap display at 100 most recent

  const categoryColors = {
    AUTH: 'bg-blue-100 text-blue-800 border-blue-200',
    ACCESS: 'bg-rose-100 text-rose-800 border-rose-200',
    USER_MGMT: 'bg-amber-100 text-amber-800 border-amber-200',
    FINANCIAL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DATA: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const severityColors = {
    INFO: 'text-blue-700',
    WARNING: 'text-amber-700',
    CRITICAL: 'text-rose-700'
  };
  const severityIcons = { INFO: 'ℹ️', WARNING: '⚠️', CRITICAL: '🚨' };

  container.innerHTML = `
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2">
          <span class="text-xl">🔐</span> Security & Access Event Log
          <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 ml-2">${allLogs.length} Events</span>
        </h3>
        <div class="flex items-center gap-2">
          <select id="auditCategoryFilter" onchange="renderSecurityAuditLog()" class="bg-[#F8FAFC] border border-black/[0.1] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F59E0B]">
            <option value="ALL">All Categories</option>
            <option value="AUTH">🔑 AUTH</option>
            <option value="ACCESS">🚫 ACCESS</option>
            <option value="USER_MGMT">👥 USER_MGMT</option>
            <option value="FINANCIAL">💰 FINANCIAL</option>
            <option value="DATA">📦 DATA</option>
          </select>
          <select id="auditSeverityFilter" onchange="renderSecurityAuditLog()" class="bg-[#F8FAFC] border border-black/[0.1] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:border-[#F59E0B]">
            <option value="ALL">All Severities</option>
            <option value="INFO">ℹ️ INFO</option>
            <option value="WARNING">⚠️ WARNING</option>
            <option value="CRITICAL">🚨 CRITICAL</option>
          </select>
        </div>
      </div>

      <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        ${logs.length === 0 ? `
          <div class="text-center py-10 text-slate-400 italic text-sm">No security events recorded yet. Events will appear here as system actions are performed.</div>
        ` : logs.map(l => {
          const ts = new Date(l.timestamp);
          const timeStr = ts.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const cat = l.category || 'DATA';
          const sev = l.severity || 'INFO';
          const catClass = categoryColors[cat] || categoryColors.DATA;
          const sevClass = severityColors[sev] || severityColors.INFO;
          const sevIcon = severityIcons[sev] || 'ℹ️';
          return `
            <div class="flex items-start gap-3 p-3 rounded-xl border ${sev === 'CRITICAL' ? 'bg-rose-50/50 border-rose-200' : (sev === 'WARNING' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100')}">
              <div class="text-lg shrink-0 mt-0.5">${sevIcon}</div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span class="text-xs font-extrabold ${sevClass}">${window.escapeHTML ? window.escapeHTML(l.action) : l.action}</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-bold border ${catClass}">${cat}</span>
                  <span class="text-[0.65rem] font-bold ${sevClass}">${sev}</span>
                </div>
                <div class="text-xs text-slate-600 leading-relaxed">${window.escapeHTML ? window.escapeHTML(l.details || '') : (l.details || '')}</div>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-[0.65rem] font-mono text-slate-400">👤 @${window.escapeHTML ? window.escapeHTML(l.user || 'system') : (l.user || 'system')}</span>
                  <span class="text-[0.65rem] font-mono text-slate-400">🕐 ${timeStr}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};
