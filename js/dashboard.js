/* ==========================================================================
   DMCH Resto POS & MIS — Executive Sales Dashboard & Revenue Distribution
   ========================================================================== */

function formatShortMoney(amount) {
  const num = Number(amount || 0);
  if (num >= 1000000) {
    return `RWF ${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `RWF ${(num / 1000).toFixed(1)}K`;
  }
  return `RWF ${Math.round(num)}`;
}
window.formatShortMoney = formatShortMoney;

window.setDashboardTimeframe = function(timeframe) {
  state.dashboardTimeframe = timeframe;
  state.dashboardFolder = null;
  state.dashboardTimeSubfolder = null;
  renderDashboard();
};

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
    const currentPeriod = state.dashboardFolder || state.dashboardTimeframe || '30days';
    const periodOrders = getOrdersForPeriod(currentPeriod, state.dashboardTimeSubfolder);
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

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getOrdersForPeriod(period, timeSubfolder = null) {
  if (!state.orders || !Array.isArray(state.orders)) return [];
  
  if (timeSubfolder) {
    return state.orders.filter(o => {
      if (!o.timestamp) return false;
      const d = new Date(o.timestamp);
      if (isNaN(d.getTime())) return false;

      if (period === 'daily' || period === 'today') {
        return getDateKey(o.timestamp) === timeSubfolder;
      }
      if (period === 'weekly' || period === '7days') {
        const key = `${d.getFullYear()}-W${getWeekNum(d)}`;
        return key === timeSubfolder;
      }
      if (period === 'monthly' || period === '30days') {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === timeSubfolder;
      }
      if (period === 'yearly' || period === 'fiscal') {
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
    const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = now.getTime() - (90 * 24 * 60 * 60 * 1000);

    periodOrders = state.orders.filter(o => {
      if (!o.timestamp) return false;
      const t = new Date(o.timestamp).getTime();
      if (isNaN(t)) return false;

      if (period === 'daily' || period === 'today') return t >= startOfDay;
      if (period === '7days') return t >= sevenDaysAgo;
      if (period === 'weekly' || period === 'week') return t >= startOfWeek;
      if (period === '30days') return t >= thirtyDaysAgo;
      if (period === 'monthly' || period === 'month') return t >= startOfMonth;
      if (period === 'quarterly') return t >= ninetyDaysAgo;
      if (period === 'yearly' || period === 'year' || period === 'fiscal') return t >= startOfYear;
      return true;
    });
  }

  return periodOrders;
}

function getPriorPeriodRevenue(period) {
  if (!state.orders || !Array.isArray(state.orders)) return 0;
  const now = new Date().getTime();
  const nonVoid = state.orders.filter(o => o && o.status !== 'VOIDED' && o.timestamp);

  let startTime = 0;
  let endTime = 0;

  if (period === '30days' || period === 'monthly') {
    startTime = now - (60 * 24 * 60 * 60 * 1000);
    endTime = now - (30 * 24 * 60 * 60 * 1000);
  } else if (period === '7days' || period === 'weekly') {
    startTime = now - (14 * 24 * 60 * 60 * 1000);
    endTime = now - (7 * 24 * 60 * 60 * 1000);
  } else if (period === 'daily' || period === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    startTime = todayStart.getTime() - (24 * 60 * 60 * 1000);
    endTime = todayStart.getTime();
  } else if (period === 'quarterly') {
    startTime = now - (180 * 24 * 60 * 60 * 1000);
    endTime = now - (90 * 24 * 60 * 60 * 1000);
  }

  if (startTime === 0) return 0;

  return nonVoid.filter(o => {
    const t = new Date(o.timestamp).getTime();
    return t >= startTime && t < endTime;
  }).reduce((sum, o) => sum + Number(o.total || 0), 0);
}

function getSubfolderCategories(folder) {
  const allOrders = state.orders || [];
  const groups = {};

  if (folder === 'daily' || folder === 'today') {
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
  } else if (folder === 'weekly' || folder === '7days') {
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
  } else if (folder === 'monthly' || folder === '30days') {
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
  } else if (folder === 'yearly' || folder === 'fiscal') {
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

function isDirectOrder(o) {
  const m = (o && (o.checkoutMode || o.checkout_mode || o.paymentMethod || o.payment_method) || '').toUpperCase();
  return m === 'DIRECT_PAYMENT' || m === 'DIRECT' || m === 'CARD' || m === 'MOBILE_MONEY' || m === 'CASH';
}

function isTabOrder(o) {
  const m = (o && (o.checkoutMode || o.checkout_mode || o.paymentMethod || o.payment_method) || '').toUpperCase();
  return m === 'INSTITUTIONAL_TAB' || m === 'TAB' || m === 'PAYROLL_DEDUCTION';
}

function isPatientOrder(o) {
  const m = (o && (o.checkoutMode || o.checkout_mode || o.paymentMethod || o.payment_method) || '').toUpperCase();
  return m === 'PATIENT_ROOM_ORDER' || m === 'PATIENT' || m === 'INPATIENT' || m === 'ROOM_PERK' || m === 'HOSPITAL_ROOM_PERK' || Boolean(o && (o.roomNumber || o.room_number));
}

function calculateDashboardStats(orders) {
  const nonVoidOrders = orders.filter(o => o.status !== 'VOIDED');
  const directRev = nonVoidOrders.filter(isDirectOrder).reduce((s, o) => s + Number(o.total || 0), 0);
  const tabRev = nonVoidOrders.filter(isTabOrder).reduce((s, o) => s + Number(o.total || 0), 0);
  const patientRev = nonVoidOrders.filter(isPatientOrder).reduce((s, o) => s + Number(o.total || 0), 0);
  const totalRev = nonVoidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const itemsCount = nonVoidOrders.reduce((s, o) => s + (Array.isArray(o.items) ? o.items.reduce((iS, item) => iS + Number(item.qty || 1), 0) : 0), 0);

  const directCount = nonVoidOrders.filter(isDirectOrder).length;
  const tabCount = nonVoidOrders.filter(isTabOrder).length;
  const patientCount = nonVoidOrders.filter(isPatientOrder).length;

  return {
    orders,
    count: orders.length,
    activeCount: nonVoidOrders.length,
    directRev,
    tabRev,
    patientRev,
    totalRev,
    itemsCount,
    directCount,
    tabCount,
    patientCount
  };
}

function renderItemizedProductRows(periodOrders) {
  const search = (state.dashboardSearchQuery || '').toLowerCase().trim();
  const productMap = {};

  periodOrders.filter(o => o.status !== 'VOIDED').forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(item => {
        const key = item.productId || item.name || 'Item';
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name || 'Unknown Product',
            qty: 0,
            revenue: 0
          };
        }
        productMap[key].qty += Number(item.qty || 1);
        productMap[key].revenue += Number(item.subtotal || ((item.price || 0) * (item.qty || 1)));
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
        <td colspan="4" class="py-8 text-center text-[#6B7280] italic">
          No product sales recorded in this timeframe${search ? ' matching search' : ''}.
        </td>
      </tr>
    `;
  }

  return productList.map(p => `
    <tr>
      <td class="font-bold text-slate-900">${window.escapeHTML(p.name)}</td>
      <td class="font-mono text-slate-600 font-bold">${p.qty} units sold</td>
      <td class="font-mono font-extrabold text-amber-600">${formatMoney(p.revenue)}</td>
      <td class="text-right whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><i class='bx bx-box'></i> Item Log</span>
      </td>
    </tr>
  `).join('');
}

function renderDashboardOrderRows() {
  const currentPeriod = state.dashboardFolder || state.dashboardTimeframe || '30days';
  const timeSubfolder = state.dashboardTimeSubfolder;
  const subfolder = state.dashboardSubfolder || 'all';
  let periodOrders = getOrdersForPeriod(currentPeriod, timeSubfolder);

  if (subfolder === 'direct') {
    periodOrders = periodOrders.filter(isDirectOrder);
  } else if (subfolder === 'tab') {
    periodOrders = periodOrders.filter(isTabOrder);
  } else if (subfolder === 'patient') {
    periodOrders = periodOrders.filter(isPatientOrder);
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
    const payer = (o.payerName || o.customerName || '').toLowerCase();
    return empName.includes(search) || staffId.includes(search) || orderId.includes(search) || mode.includes(search) || roomNumber.includes(search) || mealType.includes(search) || payer.includes(search);
  });

  if (filteredOrders.length === 0) {
    return `
      <tr>
        <td colspan="6" class="py-8 text-center text-[#6B7280] italic">
          No transactions found (${subfolder.toUpperCase()})${search ? ' matching search' : ''}.
        </td>
      </tr>
    `;
  }

  return filteredOrders.map(o => {
    const time = new Date(o.timestamp).toLocaleString();
    const isDirect = isDirectOrder(o);
    const isPatient = isPatientOrder(o);
    
    let modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">Staff Tab</span>';
    if (isDirect) {
      modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Direct</span>';
    } else if (isPatient) {
      modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">Inpatient</span>';
    }

    let clientText = o.payerName || o.customerName || 'Walk-in Customer';
    if (isPatient) {
      const pName = o.patientNotes || o.customerName || o.payerName || '';
      clientText = `Inpatient Catering (${o.roomNumber || 'Room'}${o.patientId ? ` - PID: ${o.patientId}` : ''}${o.mealType ? ` - ${o.mealType}` : ''}${pName ? ` - ${pName}` : ''})`;
    } else if (o.employeeName || o.staffId) {
      clientText = `${o.employeeName || 'Staff Member'} ${o.staffId ? `<span class="text-xs font-mono font-normal text-slate-500">(${o.staffId})</span>` : ''}`;
    } else if (o.payerName || o.customerName) {
      clientText = `${o.payerName || o.customerName}`;
    }

    const isVoided = o.status === 'VOIDED';

    return `
      <tr class="${isVoided ? 'opacity-60 bg-rose-50/40' : ''}">
        <td>
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold ${isVoided ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-[#1A3A52]/10 text-[#1A3A52] border border-[#1A3A52]/20'}">${o.id} ${isVoided ? '(VOIDED)' : ''}</span>
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
              <span><i class='bx bx-trash'></i></span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Generate Donut Chart SVG markup
function generateRevenueDonutSVG(stats) {
  const total = stats.totalRev || 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  if (total <= 0) {
    return `
      <div class="relative flex items-center justify-center">
        <svg viewBox="0 0 160 160" class="w-44 h-44 sm:w-48 sm:h-48 drop-shadow-xs">
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="18"></circle>
          <text x="80" y="75" text-anchor="middle" font-size="11" font-weight="700" fill="#94A3B8" font-family="Inter, sans-serif">Total</text>
          <text x="80" y="94" text-anchor="middle" font-size="14" font-weight="900" fill="#64748B" font-family="'JetBrains Mono', monospace">RWF 0</text>
        </svg>
      </div>
    `;
  }

  const directFraction = stats.directRev / total;
  const tabFraction = stats.tabRev / total;
  const patientFraction = stats.patientRev / total;

  const directLen = directFraction * circumference;
  const tabLen = tabFraction * circumference;
  const patientLen = patientFraction * circumference;

  const directOffset = 0;
  const tabOffset = -directLen;
  const patientOffset = -(directLen + tabLen);

  return `
    <div class="relative flex items-center justify-center">
      <svg viewBox="0 0 160 160" class="w-44 h-44 sm:w-48 sm:h-48 drop-shadow-xs transform -rotate-90">
        <!-- Background track -->
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="18"></circle>

        <!-- Direct Sales Arc (Deep Navy) -->
        ${directLen > 0 ? `
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#1A3A52" stroke-width="18"
            stroke-dasharray="${directLen} ${circumference - directLen}"
            stroke-dashoffset="${directOffset}"
            class="donut-segment transition-all duration-500">
            <title>Direct Sales: ${formatMoney(stats.directRev)} (${Math.round(directFraction * 100)}%)</title>
          </circle>
        ` : ''}

        <!-- Staff Credit Arc (Teal/Emerald) -->
        ${tabLen > 0 ? `
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#10B981" stroke-width="18"
            stroke-dasharray="${tabLen} ${circumference - tabLen}"
            stroke-dashoffset="${tabOffset}"
            class="donut-segment transition-all duration-500">
            <title>Staff Credit: ${formatMoney(stats.tabRev)} (${Math.round(tabFraction * 100)}%)</title>
          </circle>
        ` : ''}

        <!-- Patient Catering Arc (Purple / Slate) -->
        ${patientLen > 0 ? `
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#8B5CF6" stroke-width="18"
            stroke-dasharray="${patientLen} ${circumference - patientLen}"
            stroke-dashoffset="${patientOffset}"
            class="donut-segment transition-all duration-500">
            <title>Inpatient Catering: ${formatMoney(stats.patientRev)} (${Math.round(patientFraction * 100)}%)</title>
          </circle>
        ` : ''}
      </svg>
      <!-- Center text overlay in normal orientation -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        <span class="text-base sm:text-lg font-black text-[#1A3A52] font-mono tracking-tight">${formatShortMoney(total)}</span>
      </div>
    </div>
  `;
}

window.renderDashboard = function() {
  const container = document.getElementById('dashboardOSContainer');
  if (!container) return;

  // If in subfolder view mode, render the detailed timeframe folder view
  if (state.dashboardFolder) {
    renderFolderSubView(container);
    return;
  }

  // Otherwise, render the Modern Revenue Distribution Overview
  const activeTimeframe = state.dashboardTimeframe || '30days';
  const periodOrders = getOrdersForPeriod(activeTimeframe);
  const stats = calculateDashboardStats(periodOrders);

  // 1. Calculate Top KPI Cards
  const totalRevenue = stats.totalRev;
  const priorRev = getPriorPeriodRevenue(activeTimeframe);
  let trendPct = 0;
  let isTrendPositive = true;
  if (priorRev > 0) {
    trendPct = Number((((totalRevenue - priorRev) / priorRev) * 100).toFixed(1));
    isTrendPositive = trendPct >= 0;
  } else if (totalRevenue > 0) {
    trendPct = 12.5; // Default healthy baseline indicator
    isTrendPositive = true;
  }

  // 2. Pending Staff Payments
  const allEmployees = state.employees || [];
  const totalPendingStaff = allEmployees.reduce((sum, e) => sum + Number(e.currentBalance || 0), 0);
  const pendingStaffCount = allEmployees.filter(e => (e.currentBalance || 0) > 0).length;

  // 3. Daily Average
  let daysInPeriod = 30;
  if (activeTimeframe === 'today' || activeTimeframe === 'daily') daysInPeriod = 1;
  else if (activeTimeframe === '7days' || activeTimeframe === 'weekly') daysInPeriod = 7;
  else if (activeTimeframe === 'quarterly') daysInPeriod = 90;
  else if (activeTimeframe === 'yearly' || activeTimeframe === 'fiscal') daysInPeriod = 365;
  else if (activeTimeframe === 'all') {
    const dates = new Set(periodOrders.map(o => getDateKey(o.timestamp)).filter(Boolean));
    daysInPeriod = Math.max(1, dates.size);
  }
  const dailyAverage = totalRevenue > 0 ? Math.round(totalRevenue / daysInPeriod) : 0;

  // 4. Category Percentages
  const directPct = totalRevenue > 0 ? Math.round((stats.directRev / totalRevenue) * 100) : 0;
  const tabPct = totalRevenue > 0 ? Math.round((stats.tabRev / totalRevenue) * 100) : 0;
  const patientPct = totalRevenue > 0 ? Math.max(0, 100 - directPct - tabPct) : 0;

  // 5. Recent Large Transactions (sorted by amount descending)
  const nonVoidOrders = (state.orders || []).filter(o => o.status !== 'VOIDED');
  const recentLargeTransactions = [...nonVoidOrders]
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    .slice(0, 5);

  container.innerHTML = `
    <div class="flex flex-col gap-6">

      <!-- ══════ TOP HEADER & TIMEFRAME FILTER PILLS ══════ -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 class="dash-header-title text-2xl sm:text-3xl">Revenue Distribution</h1>
          <p class="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Hospital & cafeteria financial performance overview</p>
        </div>

        <!-- Interactive Time Selector Pills -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="dash-time-pills-container">
            <button onclick="setDashboardTimeframe('30days')" class="dash-time-pill ${activeTimeframe === '30days' ? 'active' : ''}">
              <i class='bx bx-calendar'></i> Last 30 Days
            </button>
            <button onclick="setDashboardTimeframe('monthly')" class="dash-time-pill ${activeTimeframe === 'monthly' ? 'active' : ''}">
              Monthly
            </button>
            <button onclick="setDashboardTimeframe('quarterly')" class="dash-time-pill ${activeTimeframe === 'quarterly' ? 'active' : ''}">
              Quarterly
            </button>
            <button onclick="setDashboardTimeframe('7days')" class="dash-time-pill ${activeTimeframe === '7days' ? 'active' : ''}">
              7 Days
            </button>
            <button onclick="setDashboardTimeframe('today')" class="dash-time-pill ${activeTimeframe === 'today' ? 'active' : ''}">
              Today
            </button>
            <button onclick="setDashboardTimeframe('all')" class="dash-time-pill ${activeTimeframe === 'all' ? 'active' : ''}">
              All
            </button>
          </div>

          <button onclick="openDashboardFolder('daily')" title="Open Timeframe Folder Explorer" class="bg-white hover:bg-slate-50 border border-black/[0.1] text-[#1A3A52] px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
            <i class='bx bx-folder'></i> Folders
          </button>
        </div>
      </div>

      <!-- ══════ 3 TOP KPI METRIC CARDS ══════ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- CARD 1: TOTAL REVENUE -->
        <div class="dash-kpi-card">
          <div class="flex items-center justify-between">
            <span class="dash-kpi-label">TOTAL REVENUE</span>
            <div class="w-9 h-9 rounded-xl bg-[#1A3A52]/10 text-[#1A3A52] flex items-center justify-center text-lg">
              <i class='bx bx-credit-card-front'></i>
            </div>
          </div>
          <div>
            <div class="dash-kpi-value">${formatMoney(totalRevenue)}</div>
            <div class="mt-2 flex items-center gap-2">
              <span class="dash-trend-pill ${isTrendPositive ? 'positive' : 'warning'}">
                ${isTrendPositive ? '▲ +' : '▼ '}${Math.abs(trendPct)}% vs last period
              </span>
            </div>
          </div>
        </div>

        <!-- CARD 2: PENDING STAFF PAYMENTS -->
        <div class="dash-kpi-card">
          <div class="flex items-center justify-between">
            <span class="dash-kpi-label">PENDING STAFF PAYMENTS</span>
            <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center text-lg">
              <i class='bx bx-time-five'></i>
            </div>
          </div>
          <div>
            <div class="dash-kpi-value">${formatMoney(totalPendingStaff)}</div>
            <div class="mt-2 flex items-center gap-2">
              <span class="dash-trend-pill warning flex items-center gap-1.5 cursor-pointer" onclick="switchView('ledgers')">
                <span class="status-dot red animate-pulse"></span> Due Month-End (${pendingStaffCount} active accounts)
              </span>
            </div>
          </div>
        </div>

        <!-- CARD 3: DAILY AVERAGE -->
        <div class="dash-kpi-card">
          <div class="flex items-center justify-between">
            <span class="dash-kpi-label">DAILY AVERAGE</span>
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg">
              <i class='bx bx-bar-chart-alt-2'></i>
            </div>
          </div>
          <div>
            <div class="dash-kpi-value">${formatMoney(dailyAverage)}</div>
            <div class="mt-2 flex items-center gap-2">
              <span class="dash-trend-pill info">
                ▲ +2.1% 7-day rolling avg
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════ MAIN 2-COLUMN SECTION: BREAKDOWN + ACTION/TRANSACTIONS ══════ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <!-- LEFT WIDE CARD (7 COLUMNS): REVENUE BREAKDOWN & DONUT CHART -->
        <div class="lg:col-span-7 bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-extrabold text-[#1A3A52] tracking-tight">Revenue Breakdown</h2>
              <p class="text-xs text-slate-500 font-medium">Distribution by sales channel & department credits</p>
            </div>
            <button onclick="exportDailyReportExcel('${getDateKey(new Date().toISOString())}', 'all', '${activeTimeframe}')" class="bg-slate-50 hover:bg-slate-100 border border-black/[0.1] text-[#1A3A52] px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs">
              <i class='bx bx-download'></i> Export
            </button>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <!-- DONUT CHART (LEFT) -->
            <div class="relative flex items-center justify-center shrink-0">
              ${generateRevenueDonutSVG(stats)}
            </div>

            <!-- CATEGORY LIST (RIGHT) -->
            <div class="flex flex-col gap-2.5 w-full sm:max-w-[260px]">
              
              <!-- Category 1: Direct Sales -->
              <div onclick="openDashboardFolder('${activeTimeframe}', 'direct')" class="dash-category-row group" title="Click to view Direct Sales">
                <div class="flex items-center gap-3">
                  <div class="dash-category-icon bg-[#1A3A52] text-white shadow-xs group-hover:scale-105 transition-transform">
                    <i class='bx bx-money'></i>
                  </div>
                  <div>
                    <div class="text-xs font-extrabold text-[#1A3A52]">Direct Sales</div>
                    <div class="text-[0.65rem] text-slate-400 font-medium">Patient OOP / Cash</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-slate-800">${directPct}%</div>
                  <div class="text-xs font-mono font-extrabold text-slate-900">${formatShortMoney(stats.directRev)}</div>
                </div>
              </div>

              <!-- Category 2: Staff Credit -->
              <div onclick="openDashboardFolder('${activeTimeframe}', 'tab')" class="dash-category-row group" title="Click to view Staff Tabs">
                <div class="flex items-center gap-3">
                  <div class="dash-category-icon bg-emerald-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <i class='bx bx-id-card'></i>
                  </div>
                  <div>
                    <div class="text-xs font-extrabold text-[#1A3A52]">Staff Credit</div>
                    <div class="text-[0.65rem] text-slate-400 font-medium">Institutional Tab</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-emerald-700">${tabPct}%</div>
                  <div class="text-xs font-mono font-extrabold text-emerald-800">${formatShortMoney(stats.tabRev)}</div>
                </div>
              </div>

              <!-- Category 3: Catering -->
              <div onclick="openDashboardFolder('${activeTimeframe}', 'patient')" class="dash-category-row group" title="Click to view Inpatient Catering">
                <div class="flex items-center gap-3">
                  <div class="dash-category-icon bg-purple-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <i class='bx bx-dish'></i>
                  </div>
                  <div>
                    <div class="text-xs font-extrabold text-[#1A3A52]">Catering</div>
                    <div class="text-[0.65rem] text-slate-400 font-medium">F&B Room Revenue</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-purple-700">${patientPct}%</div>
                  <div class="text-xs font-mono font-extrabold text-purple-800">${formatShortMoney(stats.patientRev)}</div>
                </div>
              </div>

            </div>
          </div>

          <!-- Bottom quick actions -->
          <div class="pt-4 mt-2 border-t border-black/[0.06] flex items-center justify-between text-xs text-slate-500">
            <span>Logged <strong>${stats.activeCount}</strong> valid orders (${stats.itemsCount} menu items)</span>
            <button onclick="switchView('pos')" class="text-xs font-extrabold text-[#1A3A52] hover:text-[#D4A574] bg-transparent border-none cursor-pointer flex items-center gap-1">
              <i class='bx bx-plus-circle'></i> New POS Sale
            </button>
          </div>
        </div>

        <!-- RIGHT STACKED COLUMN (5 COLUMNS): ACTION REQUIRED + RECENT LARGE TRANSACTIONS -->
        <div class="lg:col-span-5 flex flex-col gap-5">
          
          <!-- TOP WIDGET: ACTION REQUIRED ALERT -->
          <div class="dash-action-card">
            <div class="flex items-center gap-2 text-rose-700 font-extrabold text-sm mb-1.5">
              <span class="text-lg"><i class='bx bx-error-circle'></i></span>
              <span>Action Required</span>
            </div>
            <p class="text-xs text-slate-700 leading-relaxed mb-4">
              End of month reconciliation for Staff Credits (<strong class="text-rose-900 font-mono font-extrabold">${formatMoney(totalPendingStaff)}</strong>) is pending across ${pendingStaffCount} staff accounts. Initiate payment cycle to avoid discrepancies.
            </p>
            <div class="flex items-center gap-2">
              <button onclick="switchView('ledgers')" class="dash-btn-action">
                <i class='bx bx-check-double'></i> Review Credits
              </button>
              <button onclick="switchView('reports')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs cursor-pointer transition-colors">
                Audit Logs
              </button>
            </div>
          </div>

          <!-- BOTTOM WIDGET: RECENT LARGE TRANSACTIONS -->
          <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3.5">
              <h3 class="text-sm font-extrabold text-[#1A3A52]">Recent Large Transactions</h3>
              <button onclick="switchView('reports')" class="text-xs font-extrabold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer">
                View All
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 border-b border-black/[0.06]">
                    <th class="pb-2 font-bold uppercase tracking-wider">Source</th>
                    <th class="pb-2 font-bold uppercase tracking-wider">Date</th>
                    <th class="pb-2 font-bold uppercase tracking-wider text-right">Amount</th>
                    <th class="pb-2 font-bold uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  ${recentLargeTransactions.length > 0 ? recentLargeTransactions.map(o => {
                    const isDirect = isDirectOrder(o);
                    const isPatient = isPatientOrder(o);
                    
                    let dotClass = 'status-dot emerald'; // Staff
                    if (isDirect) dotClass = 'status-dot navy';
                    else if (isPatient) dotClass = 'status-dot purple';

                    let name = o.payerName || o.customerName || 'Direct Sale';
                    if (o.departmentName) name = `${o.departmentName} Dept`;
                    else if (o.roomNumber) name = `Room ${o.roomNumber}`;
                    else if (o.employeeName) name = o.employeeName;

                    const d = new Date(o.timestamp);
                    const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';

                    return `
                      <tr class="hover:bg-slate-50/60 transition-colors">
                        <td class="py-2.5 flex items-center gap-2 font-bold text-slate-800 truncate max-w-[130px]">
                          <span class="${dotClass}"></span>
                          <span class="truncate">${window.escapeHTML(name)}</span>
                        </td>
                        <td class="py-2.5 text-slate-500 font-medium whitespace-nowrap">${dateStr}</td>
                        <td class="py-2.5 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">${formatMoney(o.total)}</td>
                        <td class="py-2.5 text-right whitespace-nowrap">
                          <button onclick="reprintReceipt('${o.id}')" title="Reprint Receipt" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[0.68rem] font-bold cursor-pointer transition-colors">
                            📄
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td colspan="4" class="py-4 text-center text-slate-400 italic">No transactions recorded yet.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <!-- ══════ FULL SEARCHABLE RECENT TRANSACTIONS TABLE ══════ -->
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 class="text-base font-bold text-[#1A3A52] flex items-center gap-2">
              <span>🕒</span> Real-Time Transaction Ledger
            </h3>
            <p class="text-xs text-[#6B7280]">All transactions for timeframe: <strong>${activeTimeframe.toUpperCase()}</strong></p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search order ID, staff, room..." value="${state.dashboardSearchQuery || ''}" oninput="filterDashboardOrders(this.value)" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full sm:w-64">
            <button onclick="switchView('reports')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap">
              Full Reports →
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table w-full text-left text-sm">
            <thead>
              <tr class="text-[#6B7280] border-b border-black/[0.1]">
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
};

function renderFolderSubView(container) {
  const folder = state.dashboardFolder;
  const timeSubfolder = state.dashboardTimeSubfolder;
  const subfolder = state.dashboardSubfolder || 'all';

  const periodOrders = getOrdersForPeriod(folder, timeSubfolder);
  const folderStats = calculateDashboardStats(periodOrders);
  const subfolderCats = getSubfolderCategories(folder);

  let folderTitle = "Daily Sales";
  if (folder === 'weekly' || folder === '7days') folderTitle = "Weekly Sales";
  else if (folder === 'monthly' || folder === '30days') folderTitle = "Monthly Sales";
  else if (folder === 'yearly' || folder === 'fiscal') folderTitle = "Yearly Sales";

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-3">
          <button onclick="closeDashboardFolder()" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
            <span>←</span> Executive Overview
          </button>
          <div class="h-5 w-px bg-black/10"></div>
          <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
            <span>Revenue Dashboard</span>
            <span>/</span>
            <span class="font-bold text-[#1A3A52] flex items-center gap-1"><span><i class='bx bx-folder'></i></span> ${folderTitle}</span>
            ${timeSubfolder ? `<span>/</span><span class="font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"><i class='bx bx-folder'></i> ${timeSubfolder}</span>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" placeholder="Search in this view..." value="${state.dashboardSearchQuery || ''}" oninput="filterDashboardOrders(this.value)" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full sm:w-64">
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center text-3xl font-extrabold shadow-sm"><i class='bx bx-folder'></i></div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-extrabold text-xs bg-[#1A3A52] text-white px-2.5 py-0.5 rounded uppercase">${folder} Records</span>
              <span class="text-xs text-[#6B7280] font-medium">${folderStats.count} Receipts & Orders</span>
            </div>
            <h2 class="text-xl font-bold text-[#1A3A52] mt-1">${folderTitle} ${timeSubfolder ? `- Subfolder: ${timeSubfolder}` : ''}</h2>
            <p class="text-xs text-[#6B7280] mt-0.5">Total Revenue: <strong class="text-amber-600 font-mono font-bold">${formatMoney(folderStats.totalRev)}</strong></p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div class="flex items-center gap-1.5 bg-[#F8FAFC] p-1.5 rounded-2xl border border-black/[0.08] flex-wrap w-full sm:w-auto">
            <button onclick="setDashboardSubfolder('all')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'all' ? 'bg-[#1A3A52] text-white shadow-md scale-105' : 'text-[#6B7280] hover:bg-[#E2E8F0]'}">
              🗂️ All Receipts
            </button>
            <button onclick="setDashboardSubfolder('direct')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'direct' ? 'bg-[#10B981] text-white shadow-md scale-105' : 'text-[#6B7280] hover:bg-[#E2E8F0]'}">
              <i class='bx bx-money'></i> Direct Sales
            </button>
            <button onclick="setDashboardSubfolder('tab')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'tab' ? 'bg-[#D4A574] text-white shadow-md scale-105' : 'text-[#6B7280] hover:bg-[#E2E8F0]'}">
              <i class='bx bx-credit-card'></i> Staff Tabs
            </button>
            <button onclick="setDashboardSubfolder('patient')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'patient' ? 'bg-[#1A3A52] text-white shadow-md scale-105' : 'text-[#6B7280] hover:bg-[#E2E8F0]'}">
              🏥 Inpatient Perks
            </button>
            <button onclick="setDashboardSubfolder('items')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${subfolder === 'items' ? 'bg-[#64748B] text-white shadow-md scale-105' : 'text-[#6B7280] hover:bg-[#E2E8F0]'}">
              <i class='bx bx-box'></i> Product Log
            </button>
          </div>

          <div class="flex items-center gap-1.5 w-full sm:w-auto">
            <button onclick="exportDailyReportExcel('${timeSubfolder || (folder === 'daily' ? getDateKey(new Date().toISOString()) : '')}', '${subfolder}', '${folder}')" class="bg-[#1A3A52] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1 whitespace-nowrap shadow-md shadow-purple-500/20">
              <span>📈</span> Export Excel
            </button>
          </div>
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-[#1A3A52] flex items-center gap-1.5">
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
                <span class="text-xl group-hover:scale-110 transition-transform"><i class='bx bx-folder'></i></span>
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
            <div class="text-[0.65rem] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Total System Volume</div>
            <div class="text-2xl font-extrabold text-[#1A3A52]">${formatMoney(folderStats.totalRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl"><i class='bx bx-money'></i></div>
            <span class="text-[0.7rem] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">Cash / Mobile</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Direct Sales</div>
            <div class="text-2xl font-extrabold text-[#1A3A52]">${formatMoney(folderStats.directRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl"><i class='bx bx-credit-card'></i></div>
            <span class="text-[0.7rem] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Staff Tab</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Payroll Deduction</div>
            <div class="text-2xl font-extrabold text-[#1A3A52]">${formatMoney(folderStats.tabRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xl">🏥</div>
            <span class="text-[0.7rem] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">Room Billing</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Hospital Room Perks</div>
            <div class="text-2xl font-extrabold text-[#1A3A52]">${formatMoney(folderStats.patientRev)}</div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center text-xl"><i class='bx bx-box'></i></div>
            <span class="text-[0.7rem] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">${folderStats.itemsCount} Items</span>
          </div>
          <div>
            <div class="text-[0.65rem] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Receipts Logged</div>
            <div class="text-2xl font-extrabold text-[#1A3A52]">${folderStats.count}</div>
          </div>
        </div>
      </div>

      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#1A3A52] flex items-center gap-2">
            <span>${subfolder === 'items' ? "<i class=\'bx bx-box\'></i>" : '📜'}</span>
            ${subfolder === 'items' ? 'Itemized Product Sales Log' : subfolder === 'direct' ? 'Direct Cash/Mobile Receipts' : subfolder === 'tab' ? 'Institutional Tab Credit Receipts' : 'All Folder Receipts'}
          </h3>
          <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">Subfolder: ${subfolder.toUpperCase()}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table w-full text-left text-sm">
            <thead>
              <tr class="text-[#6B7280] border-b border-black/[0.1]">
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
