/* ==========================================================================
   DMCH Resto POS & MIS — Sales Dashboard & Timeframe Folder Explorer
   ========================================================================== */

window.openDashboardFolder = function(folder, subfolder = 'all') {
  state.dashboardFolder = folder;
  state.dashboardTimeSubfolder = null;
  state.dashboardSubfolder = subfolder;
  renderDashboard();
};

window.closeDashboardFolder = function() {
  state.dashboardFolder = null;
  state.dashboardTimeSubfolder = null;
  state.dashboardSubfolder = 'all';
  renderDashboard();
};

window.setDashboardSubfolder = function(subfolder) {
  state.dashboardSubfolder = subfolder;
  renderDashboard();
};

window.setDashboardTimeSubfolder = function(timeSubfolder) {
  state.dashboardTimeSubfolder = (state.dashboardTimeSubfolder === timeSubfolder) ? null : timeSubfolder;
  renderDashboard();
};

window.filterDashboardOrders = function(query) {
  state.dashboardSearchQuery = query;
  const tbody = document.getElementById('recentOrdersTbody');
  if (tbody) {
    const periodOrders = getOrdersForPeriod(state.dashboardFolder || 'all', state.dashboardTimeSubfolder);
    if (state.dashboardSubfolder === 'items') {
      tbody.innerHTML = renderItemizedProductRows(periodOrders);
    } else {
      tbody.innerHTML = renderDashboardOrderRows();
    }
  }
};

function getDateKey(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
window.getDateKey = getDateKey;

function getOrdersForPeriod(period, timeSubfolder = null) {
  if (!state.orders || !Array.isArray(state.orders)) return [];
  
  if (timeSubfolder) {
    return state.orders.filter(o => {
      if (!o.timestamp) return false;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return false;

      if (period === 'daily') {
        return getDateKey(o.timestamp) === timeSubfolder;
      }
      if (period === 'weekly') {
        const key = `${d.getFullYear()}-W${getWeekNum(d)}`;
        return key === timeSubfolder;
      }
      if (period === 'monthly') {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === timeSubfolder;
      }
      if (period === 'yearly') {
        return String(d.getFullYear()) === timeSubfolder;
      }
      return true;
    });
  }

  let periodOrders = state.orders;
  if (period !== 'all') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay();
    const distanceToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMon).getTime();
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    periodOrders = state.orders.filter(o => {
      if (!o.timestamp) return false;
      const t = new Date(o.timestamp).getTime();
      if (isNaN(t)) return false;

      if (period === 'daily' || period === 'today') return t >= startOfDay;
      if (period === 'weekly' || period === 'week') return t >= startOfWeek;
      if (period === 'monthly' || period === 'month') return t >= startOfMonth;
      if (period === 'yearly' || period === 'year') return t >= startOfYear;
      return true;
    });
  }

  return periodOrders;
}

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getSubfolderCategories(folder) {
  const allOrders = state.orders || [];
  const groups = {};

  if (folder === 'daily') {
    const todayStr = new Date().toISOString().split('T')[0];
    allOrders.forEach(o => {
      if (!o.timestamp) return;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key === todayStr) label = `Today (${label})`;

      if (!groups[key]) groups[key] = { key, label, count: 0, totalRev: 0 };
      groups[key].count++;
      groups[key].totalRev += (o.total || 0);
    });
  } else if (folder === 'weekly') {
    allOrders.forEach(o => {
      if (!o.timestamp) return;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return;
      const wNum = getWeekNum(d);
      const key = `${d.getFullYear()}-W${wNum}`;
      const label = `Week ${wNum}`;

      if (!groups[key]) groups[key] = { key, label, count: 0, totalRev: 0 };
      groups[key].count++;
      groups[key].totalRev += (o.total || 0);
    });
  } else if (folder === 'monthly') {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    allOrders.forEach(o => {
      if (!o.timestamp) return;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;

      if (!groups[key]) groups[key] = { key, label, count: 0, totalRev: 0 };
      groups[key].count++;
      groups[key].totalRev += (o.total || 0);
    });
  } else if (folder === 'yearly') {
    allOrders.forEach(o => {
      if (!o.timestamp) return;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return;
      const key = String(d.getFullYear());
      const label = `Year ${key}`;

      if (!groups[key]) groups[key] = { key, label, count: 0, totalRev: 0 };
      groups[key].count++;
      groups[key].totalRev += (o.total || 0);
    });
  }

  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

function calculateDashboardStats(orders) {
  const directRev = orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s, o) => s + (o.total || 0), 0);
  const tabRev = orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s, o) => s + (o.total || 0), 0);
  const patientRev = orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER').reduce((s, o) => s + (o.total || 0), 0);
  const totalRev = directRev + tabRev + patientRev;
  const itemsCount = orders.reduce((s, o) => s + (Array.isArray(o.items) ? o.items.reduce((iS, item) => iS + (item.qty || 1), 0) : 0), 0);
  return {
    orders,
    count: orders.length,
    directRev,
    tabRev,
    patientRev,
    totalRev,
    itemsCount
  };
}

function renderItemizedProductRows(periodOrders) {
  const search = (state.dashboardSearchQuery || '').toLowerCase().trim();
  const productMap = {};

  periodOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(item => {
        const key = item.productId || item.name;
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name || 'Unknown Product',
            qty: 0,
            revenue: 0
          };
        }
        productMap[key].qty += (item.qty || 1);
        productMap[key].revenue += (item.subtotal || ((item.price || 0) * (item.qty || 1)));
      });
    }
  });

  let productList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  if (search) {
    productList = productList.filter(p => p.name.toLowerCase().includes(search));
  }

  if (productList.length === 0) {
    return `
      <tr>
        <td colspan="4" class="py-8 text-center text-[#475569] italic">
          No product sales recorded in this timeframe${search ? ' matching search' : ''}.
        </td>
      </tr>
    `;
  }

  return productList.map(p => `
    <tr>
      <td class="font-bold text-slate-900">${p.name}</td>
      <td class="font-mono text-slate-600 font-bold">${p.qty} units sold</td>
      <td class="font-mono font-extrabold text-amber-600">${formatMoney(p.revenue)}</td>
      <td class="text-right whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">📦 Item Log</span>
      </td>
    </tr>
  `).join('');
}

function renderDashboardOrderRows() {
  const currentPeriod = state.dashboardFolder || 'all';
  const timeSubfolder = state.dashboardTimeSubfolder;
  const subfolder = state.dashboardSubfolder || 'all';
  let periodOrders = getOrdersForPeriod(currentPeriod, timeSubfolder);

  if (subfolder === 'direct') {
    periodOrders = periodOrders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT');
  } else if (subfolder === 'tab') {
    periodOrders = periodOrders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB');
  } else if (subfolder === 'patient') {
    periodOrders = periodOrders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER');
  }

  const search = (state.dashboardSearchQuery || '').toLowerCase().trim();

  const filteredOrders = periodOrders.filter(o => {
    if (!search) return true;
    const empName = (o.employeeName || '').toLowerCase();
    const staffId = (o.staffId || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();
    const mode = (o.checkoutMode || '').toLowerCase();
    const roomNumber = (o.roomNumber || '').toLowerCase();
    const mealType = (o.mealType || '').toLowerCase();
    return empName.includes(search) || staffId.includes(search) || orderId.includes(search) || mode.includes(search) || roomNumber.includes(search) || mealType.includes(search);
  });

  if (filteredOrders.length === 0) {
    return `
      <tr>
        <td colspan="6" class="py-8 text-center text-[#475569] italic">
          No transactions found for subfolder (${subfolder.toUpperCase()})${search ? ' matching search' : ''}.
        </td>
      </tr>
    `;
  }

  return filteredOrders.map(o => {
    const time = new Date(o.timestamp).toLocaleString();
    const isDirect = o.checkoutMode === 'DIRECT_PAYMENT';
    const isPatient = o.checkoutMode === 'PATIENT_ROOM_ORDER';
    
    let modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">💳 Tab</span>';
    if (isDirect) {
      modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">💵 Direct</span>';
    } else if (isPatient) {
      modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">🏥 Inpatient</span>';
    }

    let clientText = 'Walk-in Customer';
    if (isPatient) {
      clientText = `🏥 Inpatient Order (${o.roomNumber}${o.mealType ? ` - ${o.mealType}` : ''})`;
    } else if (o.employeeName) {
      clientText = `${o.employeeName} <span class="text-xs font-mono font-normal text-slate-500">(${o.staffId})</span>`;
    }

    const isVoided = o.status === 'VOIDED';

    return `
      <tr class="${isVoided ? 'opacity-60 bg-rose-50/40' : ''}">
        <td>
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold ${isVoided ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'}">${o.id} ${isVoided ? '(VOIDED)' : ''}</span>
        </td>
        <td class="text-xs text-slate-500 font-medium">${time}</td>
        <td>
          ${isVoided ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">🚫 Voided</span>' : modePill}
        </td>
        <td>
          <span class="text-sm font-semibold text-slate-800">${clientText}</span>
          ${isVoided && o.voidReason ? `<div class="text-[0.65rem] text-rose-600 font-medium">Reason: ${o.voidReason}</div>` : ''}
        </td>
        <td>
          <span class="font-mono font-extrabold ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}">${formatMoney(o.total)}</span>
        </td>
        <td class="text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="reprintReceipt('${o.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer shadow-xs active:scale-95">
              <span>📄</span> Receipt
            </button>
            ${!isVoided ? `
              <button onclick="openVoidOrderModal('${o.id}')" title="Void / Refund Order" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 cursor-pointer transition-all active:scale-95">
                <span>🔄</span> Void
              </button>
            ` : ''}
            <button onclick="deleteOrder('${o.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.renderDashboard = function() {
  const container = document.getElementById('dashboardOSContainer');
  if (!container) return;

  const todayStats = calculateDashboardStats(getOrdersForPeriod('daily'));
  const weekStats = calculateDashboardStats(getOrdersForPeriod('weekly'));
  const monthStats = calculateDashboardStats(getOrdersForPeriod('monthly'));
  const yearStats = calculateDashboardStats(getOrdersForPeriod('yearly'));

  if (!state.dashboardFolder) {
    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center text-3xl font-extrabold shadow-lg">📈</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-500/30">Sales & Revenue</span>
                <span class="text-xs text-slate-400 font-mono hidden sm:inline">• Live Dashboard</span>
              </div>
              <h2 class="text-xl font-extrabold text-[#0F172A] mt-1">Cafeteria Sales Overview</h2>
              <p class="text-xs text-[#475569]">Select any sales timeframe below to view detailed transactions, cash sales, and credit logs.</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button onclick="switchView('pos')" class="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer border-none shadow-md transition-colors flex items-center gap-1.5">
              <span>➕</span> New Sale (F2)
            </button>
            <button onclick="switchView('reports')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>📊</span> Reports Center
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div onclick="openDashboardFolder('daily')" class="group bg-[#FFFFFF] hover:bg-slate-50/80 border border-black/[0.1] hover:border-amber-500/50 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden active:scale-98">
            <div class="flex items-start justify-between gap-2">
              <div class="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shadow-xs">📁</div>
              <span class="text-[0.6rem] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-md border border-amber-500/20">Today</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-amber-600 transition-colors flex items-center gap-1">Daily Sales</h3>
              <p class="text-[0.65rem] text-[#475569] mt-0.5 leading-tight">Today's transactions & receipts</p>
            </div>
            <div class="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span class="font-medium text-[#0F172A] text-[0.7rem]">${todayStats.count} Orders</span>
              <span class="font-mono font-bold text-amber-600 text-[0.75rem]">${formatMoney(todayStats.totalRev)}</span>
            </div>
          </div>

          <div onclick="openDashboardFolder('weekly')" class="group bg-[#FFFFFF] hover:bg-slate-50/80 border border-black/[0.1] hover:border-blue-500/50 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden active:scale-98">
            <div class="flex items-start justify-between gap-2">
              <div class="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shadow-xs">📁</div>
              <span class="text-[0.6rem] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-md border border-blue-500/20">7 Days</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors flex items-center gap-1">Weekly Sales</h3>
              <p class="text-[0.65rem] text-[#475569] mt-0.5 leading-tight">Current week revenue logs</p>
            </div>
            <div class="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span class="font-medium text-[#0F172A] text-[0.7rem]">${weekStats.count} Orders</span>
              <span class="font-mono font-bold text-blue-600 text-[0.75rem]">${formatMoney(weekStats.totalRev)}</span>
            </div>
          </div>

          <div onclick="openDashboardFolder('monthly')" class="group bg-[#FFFFFF] hover:bg-slate-50/80 border border-black/[0.1] hover:border-purple-500/50 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden active:scale-98">
            <div class="flex items-start justify-between gap-2">
              <div class="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shadow-xs">📁</div>
              <span class="text-[0.6rem] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 px-2 py-0.5 rounded-md border border-purple-500/20">30 Days</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-purple-600 transition-colors flex items-center gap-1">Monthly Sales</h3>
              <p class="text-[0.65rem] text-[#475569] mt-0.5 leading-tight">Month payroll deductions & sales</p>
            </div>
            <div class="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span class="font-medium text-[#0F172A] text-[0.7rem]">${monthStats.count} Orders</span>
              <span class="font-mono font-bold text-purple-600 text-[0.75rem]">${formatMoney(monthStats.totalRev)}</span>
            </div>
          </div>

          <div onclick="openDashboardFolder('yearly')" class="group bg-[#FFFFFF] hover:bg-slate-50/80 border border-black/[0.1] hover:border-emerald-500/50 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden active:scale-98">
            <div class="flex items-start justify-between gap-2">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shadow-xs">📁</div>
              <span class="text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">Fiscal Year</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-emerald-600 transition-colors flex items-center gap-1">Yearly Sales</h3>
              <p class="text-[0.65rem] text-[#475569] mt-0.5 leading-tight">Annual sales & archived logs</p>
            </div>
            <div class="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span class="font-medium text-[#0F172A] text-[0.7rem]">${yearStats.count} Orders</span>
              <span class="font-mono font-bold text-emerald-600 text-[0.75rem]">${formatMoney(yearStats.totalRev)}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div>
              <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><span>🕒</span> Recent System Transactions</h3>
              <p class="text-xs text-[#475569]">All-time real-time transaction history</p>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <input type="text" placeholder="Search order ID or staff..." value="${state.dashboardSearchQuery || ''}" oninput="filterDashboardOrders(this.value)" class="bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#F59E0B] w-full sm:w-64">
              <button onclick="switchView('reports')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap">View All Reports →</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#475569] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Order ID</th>
                  <th class="py-3 px-4 font-semibold">Time</th>
                  <th class="py-3 px-4 font-semibold">Mode</th>
                  <th class="py-3 px-4 font-semibold">Client/Staff</th>
                  <th class="py-3 px-4 font-semibold">Total</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody id="recentOrdersTbody" class="divide-y divide-black/[0.1]">
                ${renderDashboardOrderRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const folder = state.dashboardFolder;
  const timeSubfolder = state.dashboardTimeSubfolder;
  const subfolder = state.dashboardSubfolder || 'all';

  const periodOrders = getOrdersForPeriod(folder, timeSubfolder);
  const folderStats = calculateDashboardStats(periodOrders);
  const subfolderCats = getSubfolderCategories(folder);

  let folderTitle = "Daily Sales";
  if (folder === 'weekly') folderTitle = "Weekly Sales";
  else if (folder === 'monthly') folderTitle = "Monthly Sales";
  else if (folder === 'yearly') folderTitle = "Yearly Sales";

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-3">
          <button onclick="closeDashboardFolder()" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
            <span>←</span> All Timeframes
          </button>
          <div class="h-5 w-px bg-black/10"></div>
          <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
            <span>Sales Dashboard</span>
            <span>/</span>
            <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>📁</span> ${folderTitle}</span>
            ${timeSubfolder ? `<span>/</span><span class="font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">📁 ${timeSubfolder}</span>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" placeholder="Search in this view..." value="${state.dashboardSearchQuery || ''}" oninput="filterDashboardOrders(this.value)" class="bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#F59E0B] w-full sm:w-64">
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center text-3xl font-extrabold shadow-sm">📁</div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-extrabold text-xs bg-[#0F172A] text-white px-2.5 py-0.5 rounded uppercase">${folder} Records</span>
              <span class="text-xs text-[#475569] font-medium">${folderStats.count} Receipts & Orders</span>
            </div>
            <h2 class="text-xl font-bold text-[#0F172A] mt-1">${folderTitle} ${timeSubfolder ? `- Subfolder: ${timeSubfolder}` : ''}</h2>
            <p class="text-xs text-[#475569] mt-0.5">Total Revenue: <strong class="text-amber-600 font-mono font-bold">${formatMoney(folderStats.totalRev)}</strong></p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div class="flex items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border border-black/[0.08] flex-wrap w-full sm:w-auto">
            <button onclick="setDashboardSubfolder('all')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'all' ? 'bg-[#F59E0B] text-slate-950 shadow-md scale-105' : 'text-[#475569] hover:bg-[#E2E8F0]'}">
              🗂️ All Receipts
            </button>
            <button onclick="setDashboardSubfolder('direct')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'direct' ? 'bg-[#10B981] text-white shadow-md scale-105' : 'text-[#475569] hover:bg-[#E2E8F0]'}">
              💵 Direct Sales
            </button>
            <button onclick="setDashboardSubfolder('tab')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'tab' ? 'bg-[#D97706] text-white shadow-md scale-105' : 'text-[#475569] hover:bg-[#E2E8F0]'}">
              💳 Staff Tabs
            </button>
            <button onclick="setDashboardSubfolder('patient')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'patient' ? 'bg-[#8B5CF6] text-white shadow-md scale-105' : 'text-[#475569] hover:bg-[#E2E8F0]'}">
              🏥 Inpatient Perks
            </button>
            <button onclick="setDashboardSubfolder('items')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'items' ? 'bg-[#64748B] text-white shadow-md scale-105' : 'text-[#475569] hover:bg-[#E2E8F0]'}">
              📦 Product Log
            </button>
          </div>

          <div class="flex items-center gap-1.5 w-full sm:w-auto">
            <button onclick="exportDailyReportPDF('${timeSubfolder || (folder === 'daily' ? getDateKey(new Date().toISOString()) : '')}', '${subfolder}', '${folder}')" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1 whitespace-nowrap shadow-md shadow-amber-500/20">
              <span>🖨️</span> PDF
            </button>
            <button onclick="exportDailyReportCSV('${timeSubfolder || (folder === 'daily' ? getDateKey(new Date().toISOString()) : '')}', '${subfolder}', '${folder}')" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1 whitespace-nowrap shadow-md shadow-emerald-500/20">
              <span>📊</span> CSV
            </button>
            <button onclick="exportDailyReportExcel('${timeSubfolder || (folder === 'daily' ? getDateKey(new Date().toISOString()) : '')}', '${subfolder}', '${folder}')" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1 whitespace-nowrap shadow-md shadow-purple-500/20">
              <span>📈</span> Excel
            </button>
          </div>
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
            <span>📂</span> ${folderTitle} Subfolders (${subfolderCats.length} Available)
          </h3>
          ${timeSubfolder ? `
            <button onclick="setDashboardTimeSubfolder(null)" class="text-xs font-bold text-amber-600 hover:underline cursor-pointer bg-transparent border-none">
              View All Subfolders
            </button>
          ` : ''}
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          ${subfolderCats.length > 0 ? subfolderCats.map(sf => `
            <div onclick="setDashboardTimeSubfolder('${sf.key}')" class="p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group ${timeSubfolder === sf.key ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30' : 'bg-slate-50/70 hover:bg-slate-100 border-black/[0.08]'}">
              <div class="flex items-center justify-between">
                <span class="text-xl group-hover:scale-110 transition-transform">📁</span>
                <span class="text-[0.6rem] font-bold text-slate-500 font-mono">${sf.count} orders</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">${sf.label}</h4>
                <div class="text-[0.7rem] font-mono font-extrabold text-amber-600 mt-0.5">${formatMoney(sf.totalRev)}</div>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-full py-4 text-center text-xs text-slate-500 italic">No time subfolders available for this period yet.</div>
          `}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">💰</div>
            <span class="text-[0.7rem] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Volume</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#475569] font-bold uppercase tracking-widest mb-1">Total System Volume</div>
            <div class="text-2xl font-extrabold text-[#0F172A]">${formatMoney(folderStats.totalRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl">💵</div>
            <span class="text-[0.7rem] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">Cash / Mobile</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#475569] font-bold uppercase tracking-widest mb-1">Direct Sales</div>
            <div class="text-2xl font-extrabold text-[#0F172A]">${formatMoney(folderStats.directRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">💳</div>
            <span class="text-[0.7rem] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Staff Tab</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#475569] font-bold uppercase tracking-widest mb-1">Payroll Deduction</div>
            <div class="text-2xl font-extrabold text-[#0F172A]">${formatMoney(folderStats.tabRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xl">🏥</div>
            <span class="text-[0.7rem] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">Room Billing</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#475569] font-bold uppercase tracking-widest mb-1">Hospital Room Perks</div>
            <div class="text-2xl font-extrabold text-[#8B5CF6]">${formatMoney(folderStats.patientRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center text-xl">📦</div>
            <span class="text-[0.7rem] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">${folderStats.itemsCount} Items</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#475569] font-bold uppercase tracking-widest mb-1">Receipts Logged</div>
            <div class="text-2xl font-extrabold text-[#0F172A]">${folderStats.count}</div>
          </div>
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <span>${subfolder === 'items' ? '📦' : '📜'}</span>
            ${subfolder === 'items' ? 'Itemized Product Sales Log' : subfolder === 'direct' ? 'Direct Cash/Mobile Receipts' : subfolder === 'tab' ? 'Institutional Tab Credit Receipts' : 'All Folder Receipts'}
          </h3>
          <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">Subfolder: ${subfolder.toUpperCase()}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table w-full text-left text-sm">
            <thead>
              <tr class="text-[#475569] border-b border-black/[0.1]">
                ${subfolder === 'items' ? `
                  <th class="py-3 px-4 font-semibold">Product Name</th>
                  <th class="py-3 px-4 font-semibold">Quantity Sold</th>
                  <th class="py-3 px-4 font-semibold">Total Revenue</th>
                  <th class="py-3 px-4 font-semibold text-right">Type</th>
                ` : `
                  <th class="py-3 px-4 font-semibold">Order ID</th>
                  <th class="py-3 px-4 font-semibold">Time</th>
                  <th class="py-3 px-4 font-semibold">Mode</th>
                  <th class="py-3 px-4 font-semibold">Client/Staff</th>
                  <th class="py-3 px-4 font-semibold">Total</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                `}
              </tr>
            </thead>
            <tbody id="recentOrdersTbody" class="divide-y divide-black/[0.1]">
              ${subfolder === 'items' ? renderItemizedProductRows(periodOrders) : renderDashboardOrderRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
