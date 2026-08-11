/* ==========================================================================
   DMCH Resto POS & MIS — Department Ledgers & Staff Credit Accounts
   ========================================================================== */

window.setLedgerMode = function(mode, deptId = null) {
  state.ledgerMode = mode;
  if (deptId !== null) state.selectedLedgerDeptId = deptId;
  renderDepartmentLedgers();
};

window.renderDepartmentLedgers = function() {
  const container = document.getElementById('ledgersOSContainer');
  if (!container) return;

  const totalOutstanding = state.employees.reduce((s, e) => s + e.currentBalance, 0);

  if (!state.ledgerMode || state.ledgerMode === 'home') {
    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center text-2xl shadow-lg">🖥️</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-[#F59E0B]/15 text-[#D97706] px-2.5 py-0.5 rounded-full border border-[#F59E0B]/30">Department & Staff Ledgers</span>
              </div>
              <h2 class="text-xl font-bold text-[#0F172A] mt-1">Department & Staff Ledgers</h2>
              <p class="text-xs text-[#475569]">Select a section below to browse department accounts, staff balances, or reports.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button onclick="openAddDepartmentModal()" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-sm">
              <span>➕</span> Add Department
            </button>
            <button onclick="openAddEmployeeModal()" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10">
              <span>👤</span> Add Staff Account
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div onclick="setLedgerMode('departments')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#F59E0B] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#F59E0B]/10 text-9xl font-extrabold transition-colors">🏛️</div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-[#111827] flex items-center justify-center text-2xl transition-all shadow-sm">📁</div>
                <span class="text-xs font-bold bg-[#F8FAFC] border border-black/[0.08] text-[#0F172A] px-3 py-1 rounded-full">${state.departments.length} Folders</span>
              </div>
              <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#F59E0B] transition-colors">Department Accounts</h3>
              <p class="text-xs text-[#475569] mt-1.5 leading-relaxed">Browse department folders, pull consumption lists, and export Excel reports.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#F59E0B] group-hover:translate-x-1 transition-transform">
              <span>Browse Departments</span>
              <span>→</span>
            </div>
          </div>

          <div onclick="setLedgerMode('staff')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#8B5CF6] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#8B5CF6]/10 text-9xl font-extrabold transition-colors">👥</div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-sm">👤</div>
                <span class="text-xs font-bold bg-[#F8FAFC] border border-black/[0.08] text-[#0F172A] px-3 py-1 rounded-full">${state.employees.length} Accounts</span>
              </div>
              <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors">Staff Accounts Directory</h3>
              <p class="text-xs text-[#475569] mt-1.5 leading-relaxed">View staff credit balances, settle tabs, and manage account access.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#8B5CF6] group-hover:translate-x-1 transition-transform">
              <span>View Staff Accounts</span>
              <span>→</span>
            </div>
          </div>

          <div onclick="setLedgerMode('patients')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#8B5CF6] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#8B5CF6]/10 text-9xl font-extrabold transition-colors">🏥</div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-sm">🏥</div>
                <span class="text-xs font-bold bg-[#8B5CF6]/10 text-[#8B5CF6] px-3 py-1 rounded-full border border-[#8B5CF6]/20">Inpatient Catering</span>
              </div>
              <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors">Patient Room Catering</h3>
              <p class="text-xs text-[#475569] mt-1.5 leading-relaxed">Track food & tea orders delivered to hospital rooms (Breakfast/Lunch/Dinner) & monthly reports.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#8B5CF6] group-hover:translate-x-1 transition-transform">
              <span>View Room Ledgers</span>
              <span>→</span>
            </div>
          </div>

          <div onclick="switchView('reports')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#10B981] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#10B981]/10 text-9xl font-extrabold transition-colors">📜</div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#10B981]/10 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-sm">📊</div>
                <span class="text-xs font-bold bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full border border-[#10B981]/20">Active</span>
              </div>
              <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#10B981] transition-colors">Reports & HR Exports</h3>
              <p class="text-xs text-[#475569] mt-1.5 leading-relaxed">Generate payroll deduction reports and detailed A4 audit statements.</p>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-[#10B981]">
              <span class="group-hover:translate-x-1 transition-transform">Launch Reports →</span>
              <span class="font-mono text-[#0F172A]">${formatMoney(totalOutstanding)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (state.ledgerMode === 'departments') {
    const search = (state.ledgerSearchQuery || '').toLowerCase();
    const filteredDepts = state.departments.filter(d => 
      d.name.toLowerCase().includes(search) || d.code.toLowerCase().includes(search)
    );

    const folderCardsHtml = filteredDepts.map(d => {
      const staffList = state.employees.filter(e => e.departmentId === d.id);
      const totalConsumed = staffList.reduce((s, e) => s + e.currentBalance, 0);

      return `
        <div class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#F59E0B] rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col justify-between gap-4 group">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="font-mono font-extrabold text-xs bg-[#0F172A] text-white px-2.5 py-1 rounded-lg">${d.code}</span>
              <div class="flex items-center gap-1">
                <button onclick="event.stopPropagation(); openAddEmployeeModal('${d.id}')" title="Add Staff to ${d.code}" class="p-1.5 text-xs text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">👤 +Staff</button>
                <button onclick="event.stopPropagation(); pullDepartmentConsumedList('${d.id}')" title="Print Consumed List" class="p-1.5 text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Report</button>
                <button onclick="event.stopPropagation(); exportDepartmentExcel('${d.id}')" title="Export Excel" class="p-1.5 text-xs text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Excel</button>
                <button onclick="event.stopPropagation(); deleteDepartment('${d.id}')" title="Delete Department" class="p-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">🗑️</button>
              </div>
            </div>
            
            <div onclick="setLedgerMode('dept_detail', '${d.id}')" class="cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="text-3xl group-hover:scale-110 transition-transform">📁</div>
                <div>
                  <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#F59E0B] transition-colors line-clamp-1">${d.name}</h3>
                  <p class="text-xs text-[#475569] mt-0.5">${staffList.length} Staff Member${staffList.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div onclick="setLedgerMode('dept_detail', '${d.id}')" class="cursor-pointer pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
            <span class="text-[#475569]">Unpaid Balance:</span>
            <span class="font-bold ${totalConsumed > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}">${formatMoney(totalConsumed)}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>📁</span> Department Accounts</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search department name or code..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#F59E0B] w-full sm:w-64">
            <button onclick="openAddDepartmentModal()" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              ➕ Add Dept
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          ${filteredDepts.length > 0 ? folderCardsHtml : `
            <div class="col-span-full bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-12 text-center text-[#475569]">
              <div class="text-4xl mb-2">📁</div>
              <p class="font-bold text-sm">No departments found.</p>
              <p class="text-xs mt-1">Click "+ Add Dept" to create a new hospital department folder.</p>
            </div>
          `}
        </div>
      </div>
    `;
    return;
  }

  if (state.ledgerMode === 'dept_detail') {
    const dept = state.departments.find(d => d.id === state.selectedLedgerDeptId);
    if (!dept) { setLedgerMode('departments'); return; }

    const staffList = state.employees.filter(e => e.departmentId === dept.id);
    const totalConsumed = staffList.reduce((s, e) => s + e.currentBalance, 0);

    const staffRowsHtml = staffList.map(emp => `
      <tr>
        <td><span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs">${emp.staffId}</span></td>
        <td class="font-bold text-slate-900">${emp.fullName}</td>
        <td><span class="font-mono font-extrabold ${emp.currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}">${formatMoney(emp.currentBalance)}</span></td>
        <td class="text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            <button onclick="openSettleModal('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-all active:scale-95">💵 Settle Tab</button>
            <button onclick="deleteEmployee('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('departments')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Departments
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span>Departments</span>
              <span>/</span>
              <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>📁</span> ${dept.name} (${dept.code})</span>
            </div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-3xl font-extrabold">📁</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-xs bg-[#0F172A] text-white px-2.5 py-0.5 rounded">${dept.code}</span>
                <span class="text-xs text-[#475569] font-medium">${staffList.length} Assigned Staff Member${staffList.length !== 1 ? 's' : ''}</span>
              </div>
              <h2 class="text-xl font-bold text-[#0F172A] mt-1">${dept.name}</h2>
              <p class="text-xs text-[#475569] mt-0.5">Total Unpaid Balance: <strong class="text-amber-600 font-mono font-bold">${formatMoney(totalConsumed)}</strong></p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button onclick="openAddEmployeeModal('${dept.id}')" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span>👤</span> Add Staff Account
            </button>
            <button onclick="pullDepartmentConsumedList('${dept.id}')" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span>📊</span> Pull Consumed List
            </button>
            <button onclick="exportDepartmentExcel('${dept.id}')" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span>📊</span> Excel (.xlsx)
            </button>
            <button onclick="deleteDepartment('${dept.id}')" class="bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5">
              <span>🗑️</span> Delete Dept
            </button>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><span>👤</span> Staff Accounts in ${dept.name}</h3>
            <button onclick="openAddEmployeeModal('${dept.id}')" class="text-xs font-bold text-[#F59E0B] hover:underline cursor-pointer bg-transparent border-none">+ Add Staff Account</button>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#475569] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Staff ID</th>
                  <th class="py-3 px-4 font-semibold">Employee Name</th>
                  <th class="py-3 px-4 font-semibold">Unpaid Balance</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${staffList.length > 0 ? staffRowsHtml : `
                  <tr>
                    <td colspan="4" class="py-8 text-center text-[#475569] italic">No staff assigned to this department yet. Click "+ Add Staff Account" to assign employees.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (state.ledgerMode === 'staff') {
    const search = (state.ledgerSearchQuery || '').toLowerCase();
    const filteredStaff = state.employees.filter(e => {
      const dept = state.departments.find(d => d.id === e.departmentId);
      const deptName = dept ? dept.name.toLowerCase() : '';
      return e.fullName.toLowerCase().includes(search) || e.staffId.toLowerCase().includes(search) || deptName.includes(search);
    });

    const staffRowsHtml = filteredStaff.map(emp => {
      const dept = state.departments.find(d => d.id === emp.departmentId);
      const deptName = dept ? dept.name : 'Unassigned';
      return `
        <tr>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs">${emp.staffId}</span></td>
          <td class="font-bold text-slate-900">${emp.fullName}</td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">${deptName}</span></td>
          <td><span class="font-mono font-extrabold ${emp.currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}">${formatMoney(emp.currentBalance)}</span></td>
          <td class="text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-2">
              <button onclick="openSettleModal('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-all active:scale-95">💵 Settle Tab</button>
              <button onclick="deleteEmployee('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>👥</span> Staff Account Directory</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search staff name or ID..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#8B5CF6] w-full sm:w-64">
            <button onclick="openAddEmployeeModal()" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              👤 Add Staff
            </button>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#475569] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Staff ID</th>
                  <th class="py-3 px-4 font-semibold">Employee Name</th>
                  <th class="py-3 px-4 font-semibold">Department</th>
                  <th class="py-3 px-4 font-semibold">Unpaid Balance</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${filteredStaff.length > 0 ? staffRowsHtml : `
                  <tr>
                    <td colspan="5" class="py-8 text-center text-[#475569] italic">No staff accounts found matching your search.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // MODE 5: PATIENT ROOM CATERING EXPLORER & DIRECTORY
  if (state.ledgerMode === 'patients') {
    const patientOrders = (state.orders || []).filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER');
    const search = (state.ledgerSearchQuery || '').toLowerCase();
    const selectedTierFilter = state.selectedRoomTierFilter || 'ALL';

    if (!state.rooms) {
      state.rooms = [];
    }

    const roomCards = state.rooms.map(roomObj => {
      const roomOrders = patientOrders.filter(o => (o.roomNumber || '').toLowerCase() === roomObj.roomNumber.toLowerCase());
      const totalRev = roomOrders.reduce((s, o) => s + (o.total || 0), 0);
      const breakfastCount = roomOrders.filter(o => o.mealType === 'Breakfast').length;
      const lunchCount = roomOrders.filter(o => o.mealType === 'Lunch').length;
      const dinnerCount = roomOrders.filter(o => o.mealType === 'Dinner').length;
      const teaCount = roomOrders.filter(o => o.mealType === 'Tea & Snack' || o.mealType === 'Tea/Snack' || o.mealType === 'Tea').length;

      return {
        ...roomObj,
        count: roomOrders.length,
        totalRev,
        breakfastCount,
        lunchCount,
        dinnerCount,
        teaCount,
        orders: roomOrders
      };
    });

    let filteredRooms = roomCards;

    if (selectedTierFilter !== 'ALL') {
      filteredRooms = filteredRooms.filter(r => r.tier === selectedTierFilter);
    }

    if (search) {
      filteredRooms = filteredRooms.filter(r => 
        r.roomNumber.toLowerCase().includes(search) || (r.tier || '').toLowerCase().includes(search)
      );
    }

    const tierBadgeClass = (tier) => {
      if (tier === 'VVIP Room') return 'bg-amber-500/15 text-amber-700 border-amber-300';
      if (tier === 'VIP Room') return 'bg-purple-500/15 text-purple-700 border-purple-300';
      if (tier === 'Private Room') return 'bg-blue-500/15 text-blue-700 border-blue-300';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const tierIcon = (tier) => {
      if (tier === 'VVIP Room') return '🌟';
      if (tier === 'VIP Room') return '👑';
      if (tier === 'Private Room') return '🔒';
      return '🏨';
    };

    const roomCardsHtml = filteredRooms.map(r => `
      <div class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#8B5CF6] rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col justify-between gap-4 group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="font-mono font-extrabold text-[0.7rem] px-2 py-0.5 rounded border ${tierBadgeClass(r.tier)}">${tierIcon(r.tier)} ${r.tier}</span>
            <div class="flex items-center gap-1">
              <button onclick="event.stopPropagation(); exportPatientCateringExcel('${r.roomNumber}')" title="Export Excel for ${r.roomNumber}" class="p-1 text-xs text-[#10B981] hover:bg-[#10B981]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Excel</button>
              <button onclick="event.stopPropagation(); openAddRoomModal('${r.id || r.roomNumber}')" title="Edit Room" class="p-1 text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold">✏️ Edit</button>
              <button onclick="event.stopPropagation(); deleteRoom('${r.id || r.roomNumber}')" title="Delete Room" class="p-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold">🗑️ Delete</button>
            </div>
          </div>
          
          <div onclick="setLedgerMode('patient_room_detail', '${r.roomNumber}')" class="cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="text-3xl group-hover:scale-110 transition-transform">${tierIcon(r.tier)}</div>
              <div>
                <h3 class="text-base font-bold text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors line-clamp-1">${r.roomNumber}</h3>
                <p class="text-xs text-[#475569] mt-0.5">${r.count} Catering Deliveries</p>
              </div>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mt-3 text-[0.65rem] font-bold">
              <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">🌅 ${r.breakfastCount} Bkfast</span>
              <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">☀️ ${r.lunchCount} Lunch</span>
              <span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">🌙 ${r.dinnerCount} Dinner</span>
              <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">☕ ${r.teaCount} Tea</span>
            </div>
          </div>
        </div>

        <div onclick="setLedgerMode('patient_room_detail', '${r.roomNumber}')" class="cursor-pointer pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
          <span class="text-[#475569]">Total Covered Perks:</span>
          <span class="font-mono font-extrabold text-[#8B5CF6]">${formatMoney(r.totalRev)}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>🏥</span> Patient Room Directory</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search room number or tier..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#F8FAFC] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#8B5CF6] w-full sm:w-64">
            <button onclick="openAddRoomModal()" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              ➕ Add Room
            </button>
            <button onclick="exportPatientCateringExcel()" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              📊 Monthly Excel
            </button>
            <button onclick="clearAllRooms()" title="Delete All Rooms" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap">
              🧹 Clear All
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button onclick="state.selectedRoomTierFilter='ALL'; renderDepartmentLedgers();" class="px-4 py-2 rounded-xl border border-black/[0.1] transition-all cursor-pointer ${selectedTierFilter==='ALL'?'bg-[#0F172A] text-white':'bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9]'}">🏢 All Rooms (${roomCards.length})</button>
          <button onclick="state.selectedRoomTierFilter='Normal Room'; renderDepartmentLedgers();" class="px-4 py-2 rounded-xl border border-black/[0.1] transition-all cursor-pointer ${selectedTierFilter==='Normal Room'?'bg-[#0F172A] text-white':'bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9]'}">🏨 Normal Room</button>
          <button onclick="state.selectedRoomTierFilter='Private Room'; renderDepartmentLedgers();" class="px-4 py-2 rounded-xl border border-black/[0.1] transition-all cursor-pointer ${selectedTierFilter==='Private Room'?'bg-[#0F172A] text-white':'bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9]'}">🔒 Private Room</button>
          <button onclick="state.selectedRoomTierFilter='VIP Room'; renderDepartmentLedgers();" class="px-4 py-2 rounded-xl border border-black/[0.1] transition-all cursor-pointer ${selectedTierFilter==='VIP Room'?'bg-[#0F172A] text-white':'bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9]'}">👑 VIP Room</button>
          <button onclick="state.selectedRoomTierFilter='VVIP Room'; renderDepartmentLedgers();" class="px-4 py-2 rounded-xl border border-black/[0.1] transition-all cursor-pointer ${selectedTierFilter==='VVIP Room'?'bg-[#0F172A] text-white':'bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9]'}">🌟 VVIP Room</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          ${filteredRooms.length > 0 ? roomCardsHtml : `
            <div class="col-span-full bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-12 text-center text-[#475569]">
              <div class="text-4xl mb-2">🏥</div>
              <p class="font-bold text-sm">No hospital rooms found matching your filter.</p>
              <p class="text-xs mt-1">Click "+ Add Room" to register a new room (Normal, Private, VIP, VVIP).</p>
            </div>
          `}
        </div>
      </div>
    `;
    return;
  }

  // MODE 6: PATIENT ROOM DETAIL EXPLORER
  if (state.ledgerMode === 'patient_room_detail') {
    const roomNum = state.selectedLedgerDeptId;
    const roomOrders = (state.orders || []).filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER' && o.roomNumber === roomNum);
    const totalRev = roomOrders.reduce((s, o) => s + (o.total || 0), 0);

    const orderRowsHtml = roomOrders.map(o => {
      const timeStr = new Date(o.timestamp).toLocaleString();
      const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'N/A';
      return `
        <tr>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">${o.id}</span></td>
          <td class="text-xs text-slate-500 font-medium">${timeStr}</td>
          <td>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ${o.mealType === 'Breakfast' ? '🌅 Breakfast' : o.mealType === 'Lunch' ? '☀️ Lunch' : o.mealType === 'Dinner' ? '🌙 Dinner' : '☕ Tea/Snack'}
            </span>
          </td>
          <td class="text-xs font-semibold text-slate-800">${itemsStr}</td>
          <td class="text-xs text-slate-600">${o.patientNotes || 'Standard Diet'}</td>
          <td class="font-mono font-extrabold text-slate-900">${formatMoney(o.total)}</td>
          <td class="text-right whitespace-nowrap">
            <button onclick="reprintReceipt('${o.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 cursor-pointer transition-all active:scale-95">📄 Ticket</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('patients')" class="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#0F172A] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Patient Rooms
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#475569]">
              <span>Patient Catering</span>
              <span>/</span>
              <span class="font-bold text-[#0F172A] flex items-center gap-1"><span>🏥</span> ${roomNum} Statement</span>
            </div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-3xl font-extrabold">🏥</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-xs bg-[#0F172A] text-white px-2.5 py-0.5 rounded">${roomNum}</span>
                <span class="text-xs text-[#475569] font-medium">${roomOrders.length} Meal Deliveries</span>
              </div>
              <h2 class="text-xl font-bold text-[#0F172A] mt-1">Catering Statement for ${roomNum}</h2>
              <p class="text-xs text-[#475569] mt-0.5">Total Covered Perk Amount: <strong class="text-purple-600 font-mono font-bold">${formatMoney(totalRev)}</strong></p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <button onclick="exportPatientCateringExcel('${roomNum}')" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center gap-1.5">
              <span>📊</span> Export Room Excel (.xlsx)
            </button>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#475569] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Order ID</th>
                  <th class="py-3 px-4 font-semibold">Date & Time</th>
                  <th class="py-3 px-4 font-semibold">Meal Category</th>
                  <th class="py-3 px-4 font-semibold">Items Consumed</th>
                  <th class="py-3 px-4 font-semibold">Notes / Diet</th>
                  <th class="py-3 px-4 font-semibold">Total (RWF)</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${roomOrders.length > 0 ? orderRowsHtml : `
                  <tr>
                    <td colspan="7" class="py-8 text-center text-[#475569] italic">No catering orders found for ${roomNum}.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return;
  }
}

window.deleteDepartment = function(deptId) {
  const dept = (state.departments || []).find(d => d && (d.id === deptId || String(d.id) === String(deptId)));
  if (!dept) return;

  const staffCount = (state.employees || []).filter(e => e && (e.departmentId === deptId || String(e.departmentId) === String(deptId))).length;
  const confirmMsg = staffCount > 0 
    ? `Are you sure you want to delete department "${dept.name}" (${dept.code})? ${staffCount} staff member(s) will be set as Unassigned.`
    : `Are you sure you want to delete department "${dept.name}" (${dept.code})?`;

  window.showConfirmModal({
    title: "🏛️ Delete Department",
    message: confirmMsg,
    confirmText: "Yes, Delete Department",
    icon: "🏛️",
    badgeText: "Department Ledger",
    isDanger: true,
    onConfirm: async () => {
      (state.employees || []).forEach(e => {
        if (e && (e.departmentId === deptId || String(e.departmentId) === String(deptId))) e.departmentId = '';
      });
      state.departments = (state.departments || []).filter(d => d && String(d.id) !== String(deptId));
      addAuditLog("Department Deleted", `Deleted department ${dept.name} (${dept.code})`);
      
      if (window.renderAllViews) window.renderAllViews();
      window.showToast(`Department "${dept.name}" was successfully deleted.`, 'success');

      if (window.cloudDeleteDepartment) {
        await window.cloudDeleteDepartment(deptId);
      }
      saveData();
    }
  });
};

window.deleteEmployee = function(empId) {
  const emp = (state.employees || []).find(e => e && (e.id === empId || String(e.id) === String(empId)));
  if (!emp) return;

  window.showConfirmModal({
    title: "👤 Delete Staff Account",
    message: `Are you sure you want to delete staff account "${emp.fullName}" (${emp.staffId})?`,
    confirmText: "Yes, Delete Staff Account",
    icon: "👤",
    badgeText: "Staff Account",
    isDanger: true,
    onConfirm: async () => {
      state.employees = (state.employees || []).filter(e => e && String(e.id) !== String(empId));
      state.tabReceipts = (state.tabReceipts || []).filter(r => r && String(r.employeeId) !== String(empId));
      addAuditLog("Staff Deleted", `Deleted staff account ${emp.fullName}`);
      
      if (window.renderAllViews) window.renderAllViews();
      window.showToast(`Staff account "${emp.fullName}" was successfully deleted.`, 'success');

      if (window.cloudDeleteEmployee) {
        await window.cloudDeleteEmployee(empId);
      }
      saveData();
    }
  });
};



window.openSettleModal = function(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (!emp) return;
  state.currentSettleEmployee = emp;
  const infoEl = document.getElementById('settleEmpInfo');
  const balEl = document.getElementById('settleBalance');
  const partEl = document.getElementById('settlePartialAmount');
  if (infoEl) infoEl.textContent = `${emp.fullName} (${emp.staffId})`;
  if (balEl) balEl.textContent = formatMoney(emp.currentBalance);
  if (partEl) partEl.value = '';
  window.openModal('modalSettleTab');
};

window.applyPartialSettle = function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  const amt = parseFloat(document.getElementById('settlePartialAmount').value) || 0;
  if (amt <= 0 || amt > emp.currentBalance) {
    window.showToast('Invalid amount', 'error');
    return;
  }
  emp.currentBalance -= amt;
  if (emp.currentBalance <= 0) { state.tabReceipts = state.tabReceipts.filter(r => r.employeeId !== emp.id); }
  addAuditLog("Tab Partial Settlement", `Settled RWF ${amt} for ${emp.fullName}`);
  saveData();
  window.closeModal('modalSettleTab');
  window.showToast(`Settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  renderAllViews();
};

window.applyFullSettle = function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  if (emp.currentBalance <= 0) {
    window.showToast('Balance is already zero', 'info');
    return;
  }
  const amt = emp.currentBalance;
  emp.currentBalance = 0;
  state.tabReceipts = state.tabReceipts.filter(r => r.employeeId !== emp.id);
  addAuditLog("Tab Full Settlement", `Fully settled RWF ${amt} for ${emp.fullName}`);
  saveData();
  window.closeModal('modalSettleTab');
  window.showToast(`Fully settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  renderAllViews();
};

window.autoGenerateDeptCode = function() {
  const nameInput = document.getElementById('addDeptName');
  const codeInput = document.getElementById('addDeptCode');
  if (!nameInput || !codeInput) return;
  const name = nameInput.value.trim().toUpperCase();
  if (name && !codeInput.dataset.userEdited) {
    const words = name.split(/\s+/).filter(w => w.length > 0 && w !== '&' && w !== 'AND');
    if (words.length >= 2) {
      codeInput.value = words.map(w => w[0]).join('').slice(0, 5);
    } else if (name.length >= 3) {
      codeInput.value = name.slice(0, 3);
    }
  }
};

window.generateDepartmentCode = function(name) {
  const words = (name || '').trim().split(/\s+/).filter(w => w.length > 0 && w !== '&' && w !== 'AND');
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').slice(0, 5);
  }
  return (name || 'DEPT').slice(0, 3).toUpperCase();
};

window.updateAutoStaffId = function() {
  const deptSelect = document.getElementById('addEmpDeptSelect');
  const staffIdInput = document.getElementById('addEmpStaffId');
  if (!deptSelect || !staffIdInput) return;
  const deptId = deptSelect.value;
  const dept = state.departments.find(d => d.id === deptId);
  const prefix = dept ? (dept.code || 'EMP') : 'EMP';
  const nextNum = (state.employees.filter(e => e.departmentId === deptId).length + 1).toString().padStart(3, '0');
  staffIdInput.value = `${prefix}-${nextNum}`;
};

window.openAddDepartmentModal = function() {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'admin');
  if (currentRole !== 'admin' && currentRole !== 'manager' && currentRole !== 'cashier') {
    window.showToast('Only authorized staff can add departments.', 'warning');
    return;
  }
  document.getElementById('addDeptName').value = '';
  document.getElementById('addDeptCode').value = '';
  window.openModal('modalAddDepartment');
};

window.saveNewDepartment = function() {
  const name = (document.getElementById('addDeptName').value || '').trim().toUpperCase();
  let code = (document.getElementById('addDeptCode').value || '').trim().toUpperCase();
  if (!code && name) {
    code = window.generateDepartmentCode ? window.generateDepartmentCode(name) : name.slice(0, 4);
  }

  if (!name || !code) {
    window.showToast('Department name and code are required.', 'error');
    return;
  }

  const newDept = {
    id: generateId('dept'),
    code: code,
    name: name
  };

  state.departments.push(newDept);
  addAuditLog("Department Created", `Created department ${name} (${code})`);
  saveData();
  window.closeModal('modalAddDepartment');
  window.showToast(`Department "${name}" created successfully!`, 'success');
  renderAllViews();
};

window.openAddEmployeeModal = function(defaultDeptId = null) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'admin');
  if (currentRole !== 'admin' && currentRole !== 'manager' && currentRole !== 'cashier') {
    window.showToast('Only authorized staff can add staff accounts.', 'warning');
    return;
  }

  const deptIdToUse = defaultDeptId || (state.ledgerMode === 'dept_detail' ? state.selectedLedgerDeptId : null);

  const deptSelect = document.getElementById('addEmpDeptSelect');
  if (deptSelect) {
    deptSelect.innerHTML = state.departments.map(d => `<option value="${d.id}" ${d.id === deptIdToUse ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('');
    if (deptIdToUse) {
      deptSelect.value = deptIdToUse;
    }
  }

  document.getElementById('addEmpFullName').value = '';
  document.getElementById('addEmpInitialBalance').value = '0';
  if (window.updateAutoStaffId) window.updateAutoStaffId();
  window.openModal('modalAddEmployee');
};

window.saveNewEmployee = function() {
  const fullName = (document.getElementById('addEmpFullName').value || '').trim().toUpperCase();
  const deptId = document.getElementById('addEmpDeptSelect').value;
  const staffId = (document.getElementById('addEmpStaffId').value || '').trim().toUpperCase();
  const initBal = parseFloat(document.getElementById('addEmpInitialBalance').value) || 0;

  if (!fullName || !staffId || !deptId) {
    window.showToast('Full name, department, and staff ID are required.', 'error');
    return;
  }

  if (state.employees.some(e => e.staffId === staffId)) {
    window.showToast(`Staff ID "${staffId}" already exists.`, 'error');
    return;
  }

  const newEmp = {
    id: generateId('emp'),
    staffId: staffId,
    fullName: fullName,
    departmentId: deptId,
    currentBalance: initBal
  };

  state.employees.push(newEmp);
  saveData();
  window.closeModal('modalAddEmployee');
  window.showToast(`Staff account "${fullName}" created successfully!`, 'success');
  renderAllViews();
};
