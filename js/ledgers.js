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
            <div class="w-14 h-14 rounded-2xl bg-[#1A3A52] text-white flex items-center justify-center text-2xl shadow-lg"><i class='bx bx-desktop'></i></div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-[#1A3A52]/15 text-[#D4A574] px-2.5 py-0.5 rounded-full border border-[#1A3A52]/30">Department & Staff Ledgers</span>
              </div>
              <h2 class="text-xl font-bold text-[#1A3A52] mt-1">Department & Staff Ledgers</h2>
              <p class="text-xs text-[#6B7280]">Select a section below to browse department accounts, staff balances, or reports.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button onclick="openAddDepartmentModal()" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-sm">
              <span><i class='bx bx-plus'></i></span> Add Department
            </button>
            <button onclick="openAddEmployeeModal()" class="bg-[#1A3A52] hover:bg-[#D4A574] text-[#111827] border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10">
              <span><i class='bx bx-user'></i></span> Add Staff Account
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div onclick="setLedgerMode('departments')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#1A3A52] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#1A3A52]/10 text-9xl font-extrabold transition-colors"><i class='bx bx-building-house'></i></div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#1A3A52]/10 text-[#1A3A52] group-hover:bg-[#1A3A52] group-hover:text-[#111827] flex items-center justify-center text-2xl transition-all shadow-sm"><i class='bx bx-folder'></i></div>
                <span class="text-xs font-bold bg-[#FFFFFF] border border-black/[0.08] text-[#1A3A52] px-3 py-1 rounded-full">${state.departments.length} Folders</span>
              </div>
              <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#1A3A52] transition-colors">Department Accounts</h3>
              <p class="text-xs text-[#6B7280] mt-1.5 leading-relaxed">Browse department folders, pull consumption lists, and export Excel reports.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#1A3A52] group-hover:translate-x-1 transition-transform">
              <span>Browse Departments</span>
              <span>→</span>
            </div>
          </div>

          <div onclick="setLedgerMode('staff')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#1A3A52] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#1A3A52]/10 text-9xl font-extrabold transition-colors"><i class='bx bx-group'></i></div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#1A3A52]/10 text-[#1A3A52] group-hover:bg-[#1A3A52] group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-sm"><i class='bx bx-user'></i></div>
                <span class="text-xs font-bold bg-[#FFFFFF] border border-black/[0.08] text-[#1A3A52] px-3 py-1 rounded-full">${state.employees.length} Accounts</span>
              </div>
              <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#1A3A52] transition-colors">Staff Accounts Directory</h3>
              <p class="text-xs text-[#6B7280] mt-1.5 leading-relaxed">View staff credit balances, settle tabs, and manage account access.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#1A3A52] group-hover:translate-x-1 transition-transform">
              <span>View Staff Accounts</span>
              <span>→</span>
            </div>
          </div>

          <div onclick="setLedgerMode('patients')" class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#1A3A52] rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-56">
            <div class="absolute -right-6 -bottom-6 text-black/[0.03] group-hover:text-[#1A3A52]/10 text-9xl font-extrabold transition-colors">🏥</div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <div class="w-12 h-12 rounded-xl bg-[#1A3A52]/10 text-[#1A3A52] group-hover:bg-[#1A3A52] group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-sm">🏥</div>
                <span class="text-xs font-bold bg-[#1A3A52]/10 text-[#1A3A52] px-3 py-1 rounded-full border border-[#1A3A52]/20">Inpatient Catering</span>
              </div>
              <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#1A3A52] transition-colors">Patient Room Catering</h3>
              <p class="text-xs text-[#6B7280] mt-1.5 leading-relaxed">Track food & tea orders delivered to hospital rooms (Breakfast/Lunch/Dinner) & monthly reports.</p>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-[#1A3A52] group-hover:translate-x-1 transition-transform">
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
              <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#10B981] transition-colors">Reports & HR Exports</h3>
              <p class="text-xs text-[#6B7280] mt-1.5 leading-relaxed">Generate payroll deduction reports and detailed A4 audit statements.</p>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-[#10B981]">
              <span class="group-hover:translate-x-1 transition-transform">Launch Reports →</span>
              <span class="font-mono text-[#1A3A52]">${formatMoney(totalOutstanding)}</span>
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
        <div class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#1A3A52] rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col justify-between gap-4 group">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="font-mono font-extrabold text-xs bg-[#1A3A52] text-white px-2.5 py-1 rounded-lg">${d.code}</span>
              <div class="flex items-center gap-1">
                <button onclick="event.stopPropagation(); openAddEmployeeModal('${d.id}')" title="Add Staff to ${d.code}" class="p-1.5 text-xs text-[#1A3A52] hover:bg-[#1A3A52]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold"><i class='bx bx-user'></i> +Staff</button>
                <button onclick="event.stopPropagation(); pullDepartmentConsumedList('${d.id}')" title="Print Consumed List" class="p-1.5 text-xs text-[#1A3A52] hover:bg-[#1A3A52]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Report</button>
                <button onclick="event.stopPropagation(); exportDepartmentExcel('${d.id}')" title="Export Excel" class="p-1.5 text-xs text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Excel</button>
                <button onclick="event.stopPropagation(); deleteDepartment('${d.id}')" title="Delete Department" class="p-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-bold"><i class='bx bx-trash'></i></button>
              </div>
            </div>
            
            <div onclick="setLedgerMode('dept_detail', '${d.id}')" class="cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="text-3xl group-hover:scale-110 transition-transform"><i class='bx bx-folder'></i></div>
                <div>
                  <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#1A3A52] transition-colors line-clamp-1">${d.name}</h3>
                  <p class="text-xs text-[#6B7280] mt-0.5">${staffList.length} Staff Member${staffList.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div onclick="setLedgerMode('dept_detail', '${d.id}')" class="cursor-pointer pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
            <span class="text-[#6B7280]">Unpaid Balance:</span>
            <span class="font-bold ${totalConsumed > 0 ? 'text-[#1A3A52]' : 'text-[#10B981]'}">${formatMoney(totalConsumed)}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#1A3A52] flex items-center gap-1"><span><i class='bx bx-folder'></i></span> Department Accounts</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search department name or code..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full sm:w-64">
            <button onclick="openAddDepartmentModal()" class="bg-[#1A3A52] hover:bg-[#D4A574] text-[#111827] border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              <i class='bx bx-plus'></i> Add Dept
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          ${filteredDepts.length > 0 ? folderCardsHtml : `
            <div class="col-span-full bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-12 text-center text-[#6B7280]">
              <div class="text-4xl mb-2"><i class='bx bx-folder'></i></div>
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
            <button onclick="openSettleModal('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-all active:scale-95"><i class='bx bx-money'></i> Settle Tab</button>
            <button onclick="deleteEmployee('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95"><i class='bx bx-trash'></i> Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('departments')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Departments
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <span>Departments</span>
              <span>/</span>
              <span class="font-bold text-[#1A3A52] flex items-center gap-1"><span><i class='bx bx-folder'></i></span> ${dept.name} (${dept.code})</span>
            </div>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#1A3A52]/10 text-[#1A3A52] flex items-center justify-center text-3xl font-extrabold"><i class='bx bx-folder'></i></div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-xs bg-[#1A3A52] text-white px-2.5 py-0.5 rounded">${dept.code}</span>
                <span class="text-xs text-[#6B7280] font-medium">${staffList.length} Assigned Staff Member${staffList.length !== 1 ? 's' : ''}</span>
              </div>
              <h2 class="text-xl font-bold text-[#1A3A52] mt-1">${dept.name}</h2>
              <p class="text-xs text-[#6B7280] mt-0.5">Total Unpaid Balance: <strong class="text-amber-600 font-mono font-bold">${formatMoney(totalConsumed)}</strong></p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button onclick="openAddEmployeeModal('${dept.id}')" class="bg-[#1A3A52] hover:bg-[#D4A574] text-[#111827] border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span><i class='bx bx-user'></i></span> Add Staff Account
            </button>
            <button onclick="pullDepartmentConsumedList('${dept.id}')" class="bg-[#1A3A52] hover:bg-[#7C3AED] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span>📊</span> Pull Consumed List
            </button>
            <button onclick="exportDepartmentExcel('${dept.id}')" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5">
              <span>📊</span> Excel (.xlsx)
            </button>
            <button onclick="deleteDepartment('${dept.id}')" class="bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5">
              <span><i class='bx bx-trash'></i></span> Delete Dept
            </button>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-[#1A3A52] flex items-center gap-2"><span><i class='bx bx-user'></i></span> Staff Accounts in ${dept.name}</h3>
            <button onclick="openAddEmployeeModal('${dept.id}')" class="text-xs font-bold text-[#1A3A52] hover:underline cursor-pointer bg-transparent border-none">+ Add Staff Account</button>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#6B7280] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Staff ID</th>
                  <th class="py-3 px-4 font-semibold">Employee Name</th>
                  <th class="py-3 px-4 font-semibold">Unpaid Balance</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${staffList.length > 0 ? staffRowsHtml : `
                  <tr>
                    <td colspan="4" class="py-8 text-center text-[#6B7280] italic">No staff assigned to this department yet. Click "+ Add Staff Account" to assign employees.</td>
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
              <button onclick="openSettleModal('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-all active:scale-95"><i class='bx bx-money'></i> Settle Tab</button>
              <button onclick="deleteEmployee('${emp.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95"><i class='bx bx-trash'></i> Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#1A3A52] flex items-center gap-1"><span><i class='bx bx-group'></i></span> Staff Account Directory</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search staff name or ID..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full sm:w-64">
            <button onclick="openAddEmployeeModal()" class="bg-[#1A3A52] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              <i class='bx bx-user'></i> Add Staff
            </button>
          </div>
        </div>

        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#6B7280] border-b border-black/[0.1]">
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
                    <td colspan="5" class="py-8 text-center text-[#6B7280] italic">No staff accounts found matching your search.</td>
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
      if (tier === 'VIP Room') return "<i class=\'bx bx-crown\'></i>";
      if (tier === 'Private Room') return '🔒';
      return '🏨';
    };

    const roomCardsHtml = filteredRooms.map(r => `
      <div class="bg-[#FFFFFF] border border-black/[0.1] hover:border-[#1A3A52] rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col justify-between gap-4 group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="font-mono font-extrabold text-[0.7rem] px-2 py-0.5 rounded border ${tierBadgeClass(r.tier)}">${tierIcon(r.tier)} ${r.tier}</span>
            <div class="flex items-center gap-1">
              <button onclick="event.stopPropagation(); exportPatientCateringExcel('${r.roomNumber}')" title="Export Excel for ${r.roomNumber}" class="p-1 text-xs text-[#10B981] hover:bg-[#10B981]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold">📊 Excel</button>
              <button onclick="event.stopPropagation(); openAddRoomModal('${r.id || r.roomNumber}')" title="Edit Room" class="p-1 text-xs text-[#1A3A52] hover:bg-[#1A3A52]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold">✏️ Edit</button>
              <button onclick="event.stopPropagation(); deleteRoom('${r.id || r.roomNumber}')" title="Delete Room" class="p-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors border-none bg-transparent cursor-pointer font-bold"><i class='bx bx-trash'></i> Delete</button>
            </div>
          </div>
          
          <div onclick="setLedgerMode('patient_room_detail', '${r.roomNumber}')" class="cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="text-3xl group-hover:scale-110 transition-transform">${tierIcon(r.tier)}</div>
              <div>
                <h3 class="text-base font-bold text-[#1A3A52] group-hover:text-[#1A3A52] transition-colors line-clamp-1">${r.roomNumber}</h3>
                <p class="text-xs text-[#6B7280] mt-0.5">${r.count} Catering Deliveries</p>
              </div>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mt-3 text-[0.65rem] font-bold">
              <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">🌅 ${r.breakfastCount} Bkfast</span>
              <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">☀️ ${r.lunchCount} Lunch</span>
              <span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">🌙 ${r.dinnerCount} Dinner</span>
              <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"><i class='bx bx-coffee'></i> ${r.teaCount} Tea</span>
            </div>
          </div>
        </div>

        <div onclick="setLedgerMode('patient_room_detail', '${r.roomNumber}')" class="cursor-pointer pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
          <span class="text-[#6B7280]">Total Covered Perks:</span>
          <span class="font-mono font-extrabold text-[#1A3A52]">${formatMoney(r.totalRev)}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('home')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Overview
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <span>Ledgers</span>
              <span>/</span>
              <span class="font-bold text-[#1A3A52] flex items-center gap-1"><span>🏥</span> Patient Room Directory</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search room number or tier..." value="${state.ledgerSearchQuery || ''}" oninput="state.ledgerSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full sm:w-64">
            <button onclick="openAddRoomModal()" class="bg-[#1A3A52] hover:bg-[#7C3AED] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              <i class='bx bx-plus'></i> Add Room
            </button>
            <button onclick="exportPatientCateringExcel()" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap shadow-md">
              📊 Monthly Excel
            </button>
            <button onclick="clearAllRooms()" title="Delete All Rooms" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap">
              🧹 Clear All
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-3.5 shadow-xs">
          <div class="flex items-center gap-2 overflow-x-auto text-xs font-bold w-full sm:w-auto pb-1 sm:pb-0">
            <span class="text-slate-400 font-semibold px-1 flex items-center gap-1 shrink-0">🏷️ Tiers:</span>
            <button onclick="state.selectedRoomTierFilter='ALL'; renderDepartmentLedgers();" class="px-3.5 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter==='ALL'?'bg-[#1A3A52] text-white shadow-xs font-extrabold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">All Rooms (${roomCards.length})</button>
            <button onclick="state.selectedRoomTierFilter='Normal Room'; renderDepartmentLedgers();" class="px-3.5 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter==='Normal Room'?'bg-[#1A3A52] text-white shadow-xs font-extrabold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">Normal Room</button>
            <button onclick="state.selectedRoomTierFilter='Private Room'; renderDepartmentLedgers();" class="px-3.5 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter==='Private Room'?'bg-[#1A3A52] text-white shadow-xs font-extrabold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">Private Room</button>
            <button onclick="state.selectedRoomTierFilter='VIP Room'; renderDepartmentLedgers();" class="px-3.5 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter==='VIP Room'?'bg-[#1A3A52] text-white shadow-xs font-extrabold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">VIP Room</button>
            <button onclick="state.selectedRoomTierFilter='VVIP Room'; renderDepartmentLedgers();" class="px-3.5 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${selectedTierFilter==='VVIP Room'?'bg-[#1A3A52] text-white shadow-xs font-extrabold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">VVIP Room</button>
          </div>
          <div class="text-xs text-slate-500 font-semibold px-2 shrink-0">
            Showing <strong class="text-slate-900 font-extrabold">${filteredRooms.length}</strong> of ${state.rooms.length} Rooms
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          ${filteredRooms.length > 0 ? roomCardsHtml : `
            <div class="col-span-full bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-12 text-center text-[#6B7280]">
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

  // MODE 6: PATIENT ROOM DETAIL EXPLORER (IN-ROOM STATEMENT & FILTERS)
  if (state.ledgerMode === 'patient_room_detail') {
    const roomNum = state.selectedLedgerDeptId;
    const roomObj = (state.rooms || []).find(r => (r.roomNumber || '').toLowerCase() === roomNum.toLowerCase()) || { roomNumber: roomNum, tier: 'VIP Room' };

    const tierBadgeClass = (tier) => {
      if (tier === 'VVIP Room') return 'bg-amber-500/15 text-amber-700 border-amber-300';
      if (tier === 'VIP Room') return 'bg-purple-500/15 text-purple-700 border-purple-300';
      if (tier === 'Private Room') return 'bg-blue-500/15 text-blue-700 border-blue-300';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const tierIcon = (tier) => {
      if (tier === 'VVIP Room') return '🌟';
      if (tier === 'VIP Room') return "<i class=\'bx bx-crown\'></i>";
      if (tier === 'Private Room') return '🔒';
      return '🏨';
    };

    const allRoomOrders = (state.orders || []).filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER' && (o.roomNumber || '').toLowerCase() === roomNum.toLowerCase());
    let roomOrders = [...allRoomOrders];
    
    const dateFilter = state.patientDateFilter || 'ALL';
    const customDate = state.patientCustomDateFilter || '';
    const mealFilter = state.patientMealFilter || 'ALL';
    const roomSearch = (state.patientRoomSearchQuery || '').toLowerCase();

    // 1. In-Room Date Filter
    if (dateFilter === 'TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      roomOrders = roomOrders.filter(o => (o.timestamp || '').startsWith(todayStr));
    } else if (dateFilter === 'YESTERDAY') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      roomOrders = roomOrders.filter(o => (o.timestamp || '').startsWith(yestStr));
    } else if (dateFilter === 'THIS_MONTH') {
      const monthStr = new Date().toISOString().slice(0, 7);
      roomOrders = roomOrders.filter(o => (o.timestamp || '').startsWith(monthStr));
    } else if (dateFilter === 'CUSTOM' && customDate) {
      roomOrders = roomOrders.filter(o => (o.timestamp || '').startsWith(customDate));
    }

    // 2. In-Room Meal Category Filter
    if (mealFilter === 'Breakfast') {
      roomOrders = roomOrders.filter(o => o.mealType === 'Breakfast');
    } else if (mealFilter === 'Lunch') {
      roomOrders = roomOrders.filter(o => o.mealType === 'Lunch');
    } else if (mealFilter === 'Dinner') {
      roomOrders = roomOrders.filter(o => o.mealType === 'Dinner');
    } else if (mealFilter === 'Tea') {
      roomOrders = roomOrders.filter(o => o.mealType === 'Tea & Snack' || o.mealType === 'Tea/Snack' || o.mealType === 'Tea');
    }

    // 3. In-Room Search Query
    if (roomSearch) {
      roomOrders = roomOrders.filter(o => {
        const idMatch = (o.id || '').toLowerCase().includes(roomSearch);
        const pIdMatch = (o.patientId || '').toLowerCase().includes(roomSearch);
        const notesMatch = (o.patientNotes || o.customerName || '').toLowerCase().includes(roomSearch);
        const itemsMatch = Array.isArray(o.items) && o.items.some(i => (i.name || '').toLowerCase().includes(roomSearch));
        return idMatch || pIdMatch || notesMatch || itemsMatch;
      });
    }

    const totalRev = roomOrders.reduce((s, o) => s + (o.total || 0), 0);
    const bkCount = roomOrders.filter(o => o.mealType === 'Breakfast').length;
    const luCount = roomOrders.filter(o => o.mealType === 'Lunch').length;
    const dnCount = roomOrders.filter(o => o.mealType === 'Dinner').length;
    const teaCount = roomOrders.filter(o => o.mealType === 'Tea & Snack' || o.mealType === 'Tea/Snack' || o.mealType === 'Tea').length;

    const orderRowsHtml = roomOrders.map(o => {
      const timeStr = new Date(o.timestamp).toLocaleString();
      const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'N/A';
      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">${o.id}</span></td>
          <td class="text-xs text-slate-500 font-medium">${timeStr}</td>
          <td><span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${o.patientId || 'N/A'}</span></td>
          <td class="text-xs font-bold text-slate-900">${o.patientNotes || o.customerName || 'N/A'}</td>
          <td>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ${o.mealType === 'Breakfast' ? 'Breakfast' : o.mealType === 'Lunch' ? 'Lunch' : o.mealType === 'Dinner' ? 'Dinner' : 'Tea/Snack'}
            </span>
          </td>
          <td class="text-xs font-semibold text-slate-800">${itemsStr}</td>
          <td class="font-mono font-extrabold text-slate-900">${formatMoney(o.total)}</td>
          <td class="text-right whitespace-nowrap">
            <button onclick="reprintReceipt('${o.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 cursor-pointer transition-all active:scale-95">Ticket</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Breadcrumbs -->
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="setLedgerMode('patients')" class="bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5">
              <span>←</span> Patient Rooms
            </button>
            <div class="h-5 w-px bg-black/10"></div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <span>Patient Catering</span>
              <span>/</span>
              <span class="font-bold text-[#1A3A52] flex items-center gap-1">${roomNum} Statement</span>
            </div>
          </div>
        </div>

        <!-- Room Header Summary Card -->
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#1A3A52]/10 text-[#1A3A52] flex items-center justify-center text-2xl shrink-0 border border-[#1A3A52]/20 shadow-xs">
              ${tierIcon(roomObj.tier)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-xs bg-[#1A3A52] text-white px-2.5 py-0.5 rounded shadow-xs">${roomNum}</span>
                <span class="font-mono font-extrabold text-[0.7rem] px-2.5 py-0.5 rounded border ${tierBadgeClass(roomObj.tier)}">${tierIcon(roomObj.tier)} ${roomObj.tier || 'Room'}</span>
                <span class="text-xs text-[#6B7280] font-medium">• ${allRoomOrders.length} Total Deliveries</span>
              </div>
              <h2 class="text-xl font-bold text-[#1A3A52] mt-1">Catering Statement for Room ${roomNum}</h2>
              <div class="flex items-center gap-3 flex-wrap mt-2">
                <p class="text-xs text-[#6B7280]">Filtered Perk Total: <strong class="text-[#1A3A52] font-mono font-bold text-sm">${formatMoney(totalRev)}</strong></p>
                <div class="flex items-center gap-1.5 text-[0.65rem] font-bold">
                  <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">🌅 ${bkCount} Bkfast</span>
                  <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">☀️ ${luCount} Lunch</span>
                  <span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">🌙 ${dnCount} Dinner</span>
                  <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"><i class='bx bx-coffee'></i> ${teaCount} Tea</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button onclick="exportPatientCateringExcel('${roomNum}')" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors shadow-md flex items-center gap-1.5 whitespace-nowrap">
              📊 Export Room Excel (.xlsx)
            </button>
          </div>
        </div>

        <!-- IN-ROOM FILTER TOOLBAR -->
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
            <!-- Date Filter Pills -->
            <div class="flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
              <span class="text-slate-400 font-semibold px-1 flex items-center gap-1 shrink-0">📅 Date:</span>
              <button onclick="state.patientDateFilter='ALL'; state.patientCustomDateFilter=''; renderDepartmentLedgers();" class="px-3 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${dateFilter==='ALL'?'bg-[#1A3A52] text-white shadow-xs font-bold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">All Time</button>
              <button onclick="state.patientDateFilter='TODAY'; state.patientCustomDateFilter=''; renderDepartmentLedgers();" class="px-3 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${dateFilter==='TODAY'?'bg-[#1A3A52] text-white shadow-xs font-bold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">Today</button>
              <button onclick="state.patientDateFilter='YESTERDAY'; state.patientCustomDateFilter=''; renderDepartmentLedgers();" class="px-3 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${dateFilter==='YESTERDAY'?'bg-[#1A3A52] text-white shadow-xs font-bold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">Yesterday</button>
              <button onclick="state.patientDateFilter='THIS_MONTH'; state.patientCustomDateFilter=''; renderDepartmentLedgers();" class="px-3 py-1.5 rounded-xl border border-black/[0.1] transition-all cursor-pointer whitespace-nowrap ${dateFilter==='THIS_MONTH'?'bg-[#1A3A52] text-white shadow-xs font-bold':'bg-[#FFFFFF] text-[#6B7280] hover:bg-[#F8FAFC]'}">This Month</button>
              <input type="date" value="${customDate}" onchange="state.patientDateFilter='CUSTOM'; state.patientCustomDateFilter=this.value; renderDepartmentLedgers();" class="bg-[#FFFFFF] border border-slate-300 text-slate-900 font-semibold rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#1A3A52]">
            </div>

            <!-- Meal Category Filters -->
            <div class="flex items-center gap-1 overflow-x-auto text-xs font-bold bg-[#FFFFFF] border border-black/[0.1] rounded-xl p-1 scrollbar-none">
              <span class="text-slate-400 font-semibold px-2 shrink-0"><i class='bx bx-restaurant'></i> Meal:</span>
              <button onclick="state.patientMealFilter='ALL'; renderDepartmentLedgers();" class="px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${mealFilter==='ALL'?'bg-[#1A3A52] text-white shadow-xs':'text-slate-600 hover:bg-slate-200/60'}">All</button>
              <button onclick="state.patientMealFilter='Breakfast'; renderDepartmentLedgers();" class="px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${mealFilter==='Breakfast'?'bg-[#1A3A52] text-white shadow-xs':'text-slate-600 hover:bg-slate-200/60'}">🌅 Breakfast</button>
              <button onclick="state.patientMealFilter='Lunch'; renderDepartmentLedgers();" class="px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${mealFilter==='Lunch'?'bg-[#1A3A52] text-white shadow-xs':'text-slate-600 hover:bg-slate-200/60'}">☀️ Lunch</button>
              <button onclick="state.patientMealFilter='Dinner'; renderDepartmentLedgers();" class="px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${mealFilter==='Dinner'?'bg-[#1A3A52] text-white shadow-xs':'text-slate-600 hover:bg-slate-200/60'}">🌙 Dinner</button>
              <button onclick="state.patientMealFilter='Tea'; renderDepartmentLedgers();" class="px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${mealFilter==='Tea'?'bg-[#1A3A52] text-white shadow-xs':'text-slate-600 hover:bg-slate-200/60'}"><i class='bx bx-coffee'></i> Tea/Snack</button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <!-- In-Room Search Input -->
            <div class="relative w-full sm:w-80">
              <input type="text" placeholder="🔍 Search patient name, ID or items..." value="${state.patientRoomSearchQuery || ''}" oninput="state.patientRoomSearchQuery = this.value; renderDepartmentLedgers();" class="bg-[#FFFFFF] border border-black/[0.1] text-[#1A3A52] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1A3A52] w-full pr-8">
              ${state.patientRoomSearchQuery ? `
                <button onclick="state.patientRoomSearchQuery=''; renderDepartmentLedgers();" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs border-none bg-transparent cursor-pointer font-bold">✕</button>
              ` : ''}
            </div>

            <!-- In-Room Filter Status & Reset -->
            <div class="flex items-center gap-2 text-xs font-semibold text-[#6B7280] w-full sm:w-auto justify-between sm:justify-end">
              <span>Showing <strong class="text-[#1A3A52] font-extrabold">${roomOrders.length}</strong> of ${allRoomOrders.length} deliveries</span>
              ${(dateFilter !== 'ALL' || mealFilter !== 'ALL' || state.patientRoomSearchQuery || customDate) ? `
                <button onclick="state.patientDateFilter='ALL'; state.patientCustomDateFilter=''; state.patientMealFilter='ALL'; state.patientRoomSearchQuery=''; renderDepartmentLedgers();" class="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer border-none bg-transparent ml-2">Reset Filters</button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Room Statement Table -->
        <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
          <div class="overflow-x-auto">
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#6B7280] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Order ID</th>
                  <th class="py-3 px-4 font-semibold">Date & Time</th>
                  <th class="py-3 px-4 font-semibold">Patient ID</th>
                  <th class="py-3 px-4 font-semibold">Patient Name / Notes</th>
                  <th class="py-3 px-4 font-semibold">Meal Category</th>
                  <th class="py-3 px-4 font-semibold">Items Consumed</th>
                  <th class="py-3 px-4 font-semibold">Total (RWF)</th>
                  <th class="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${roomOrders.length > 0 ? orderRowsHtml : `
                  <tr>
                    <td colspan="8" class="py-10 text-center text-[#6B7280]">
                      <div class="text-2xl mb-1">🔍</div>
                      <p class="font-bold text-xs">No catering orders found for room ${roomNum} matching your active filters.</p>
                      ${(dateFilter !== 'ALL' || mealFilter !== 'ALL' || state.patientRoomSearchQuery || customDate) ? `
                        <button onclick="state.patientDateFilter='ALL'; state.patientCustomDateFilter=''; state.patientMealFilter='ALL'; state.patientRoomSearchQuery=''; renderDepartmentLedgers();" class="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer border border-slate-300">
                          Clear Active Filters
                        </button>
                      ` : ''}
                    </td>
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
    title: "<i class='bx bx-building-house'></i> Delete Department",
    message: confirmMsg,
    confirmText: "Yes, Delete Department",
    icon: "<i class='bx bx-building-house'></i>",
    badgeText: "Department Ledger",
    isDanger: true,
    onConfirm: async () => {
      (state.employees || []).forEach(e => {
        if (e && (e.departmentId === deptId || String(e.departmentId) === String(deptId))) e.departmentId = '';
      });
      state.departments = (state.departments || []).filter(d => d && String(d.id) !== String(deptId));
      addAuditLog("Department Deleted", `Deleted department ${dept.name} (${dept.code})`);
      saveData({ sync: false });
      if (window.refreshAllStaffDropdownsAndViews) window.refreshAllStaffDropdownsAndViews();
      else if (window.renderAllViews) window.renderAllViews();
      window.showToast(`Department "${dept.name}" was successfully deleted.`, 'success');

      try {
        if (window.cloudDeleteDepartment) {
          await window.cloudDeleteDepartment(deptId);
        }
      } catch (err) {
        console.warn('Cloud delete department notice:', err.message);
      }
    }
  });
};

window.deleteEmployee = function(empId) {
  const emp = (state.employees || []).find(e => e && (e.id === empId || String(e.id) === String(empId)));
  if (!emp) return;

  window.showConfirmModal({
    title: "<i class='bx bx-user'></i> Delete Staff Account",
    message: `Are you sure you want to delete staff account "${emp.fullName}" (${emp.staffId})?`,
    confirmText: "Yes, Delete Staff Account",
    icon: "<i class='bx bx-user'></i>",
    badgeText: "Staff Account",
    isDanger: true,
    onConfirm: async () => {
      state.employees = (state.employees || []).filter(e => e && String(e.id) !== String(empId));
      state.tabReceipts = (state.tabReceipts || []).filter(r => r && String(r.employeeId) !== String(empId));
      addAuditLog("Staff Deleted", `Deleted staff account ${emp.fullName}`);
      saveData({ sync: false });
      if (window.refreshAllStaffDropdownsAndViews) window.refreshAllStaffDropdownsAndViews();
      else if (window.renderAllViews) window.renderAllViews();
      window.showToast(`Staff account "${emp.fullName}" was successfully deleted.`, 'success');

      try {
        if (window.cloudDeleteEmployee) {
          await window.cloudDeleteEmployee(empId);
        }
      } catch (err) {
        console.warn('Cloud delete staff account notice:', err.message);
      }
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

window.applyPartialSettle = async function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  const amt = parseFloat(document.getElementById('settlePartialAmount').value) || 0;
  if (amt <= 0 || amt > (emp.currentBalance || 0)) {
    window.showToast('Invalid amount', 'error');
    return;
  }
  emp.currentBalance = Math.max(0, (emp.currentBalance || 0) - amt);
  if (emp.currentBalance <= 0) { state.tabReceipts = (state.tabReceipts || []).filter(r => r.employeeId !== emp.id); }

  addAuditLog("Tab Partial Settlement", `Settled RWF ${amt} for ${emp.fullName}`);
  saveData({ sync: false });
  window.closeModal('modalSettleTab');
  window.showToast(`Settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  if (window.renderAllViews) window.renderAllViews();

  try {
    if (window.cloudSaveEmployee) {
      await window.cloudSaveEmployee(emp);
    }
  } catch (err) {
    console.warn('Cloud save settlement notice:', err.message);
  }
};

window.applyFullSettle = async function() {
  const emp = state.currentSettleEmployee;
  if (!emp) return;
  if ((emp.currentBalance || 0) <= 0) {
    window.showToast('Balance is already zero', 'info');
    return;
  }
  const amt = emp.currentBalance;
  emp.currentBalance = 0;
  state.tabReceipts = (state.tabReceipts || []).filter(r => r.employeeId !== emp.id);

  addAuditLog("Tab Full Settlement", `Fully settled RWF ${amt} for ${emp.fullName}`);
  saveData({ sync: false });
  window.closeModal('modalSettleTab');
  window.showToast(`Fully settled ${formatMoney(amt)} for ${emp.fullName}`, 'success');
  if (window.renderAllViews) window.renderAllViews();

  try {
    if (window.cloudSaveEmployee) {
      await window.cloudSaveEmployee(emp);
    }
  } catch (err) {
    console.warn('Cloud save full settlement notice:', err.message);
  }
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
  const depts = state.departments || [];
  let maxSeq = depts.length;
  depts.forEach(d => {
    if (d && d.code) {
      const match = String(d.code).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });
  const nextSeq = maxSeq + 1;
  return `DPT-${String(nextSeq).padStart(3, '0')}`;
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
  document.getElementById('addDeptCode').value = window.generateDepartmentCode();
  window.openModal('modalAddDepartment');
};

window.saveNewDepartment = async function() {
  const name = (document.getElementById('addDeptName').value || '').trim().toUpperCase();
  let code = (document.getElementById('addDeptCode').value || '').trim().toUpperCase();
  if (!code) {
    code = window.generateDepartmentCode(name);
  }

  if (!name) {
    window.showToast('Department name is required.', 'error');
    return;
  }

  const newDept = {
    id: generateId('dept'),
    code: code,
    name: name,
    monthlyCreditLimit: 100000
  };

  if (!state.departments) state.departments = [];
  state.departments.push(newDept);
  addAuditLog("Department Created", `Created department ${name} (${code})`);
  saveData({ sync: false });
  window.closeModal('modalAddDepartment');
  window.showToast(`Department "${name}" (${code}) saved!`, 'success');
  if (window.renderAllViews) window.renderAllViews();

  try {
    if (window.cloudSaveDepartment) {
      await window.cloudSaveDepartment(newDept);
    }
  } catch (err) {
    console.warn('Cloud save department notice:', err.message);
  }

  if (window.refreshAllStaffDropdownsAndViews) {
    window.refreshAllStaffDropdownsAndViews(null, newDept.id);
  }
};

window.refreshAllStaffDropdownsAndViews = function(selectedEmpId = null, selectedDeptId = null) {
  // 1. Refresh POS Tab Checkout Dropdowns and Search Datalist
  if (window.populateTabCheckoutDropdowns) {
    window.populateTabCheckoutDropdowns(selectedDeptId || '', selectedEmpId || '');
  }

  // 2. Refresh Direct Checkout Payer Datalist
  const payerList = document.getElementById('payerNamesDatalist');
  if (payerList) {
    const names = new Set();
    (state.employees || []).forEach(e => { if (e && e.fullName) names.add(e.fullName); });
    (state.orders || []).forEach(o => {
      if (o && (o.payerName || o.customerName)) names.add(o.payerName || o.customerName);
    });
    payerList.innerHTML = Array.from(names).slice(0, 50).map(n => `<option value="${window.escapeHTML(n)}"></option>`).join('');
  }

  // 3. Refresh User Management Staff Datalist
  const userStaffList = document.getElementById('userStaffDatalist');
  if (userStaffList) {
    userStaffList.innerHTML = (state.employees || []).map(e => {
      const dept = (state.departments || []).find(d => d && d.id === e.departmentId);
      const deptTag = dept ? ` [${dept.code}]` : '';
      return `<option value="${window.escapeHTML(e.fullName)}">${e.staffId}${deptTag}</option>`;
    }).join('');
  }

  // 4. Refresh Reports Department & Staff Dropdowns
  const hrDeptSelect = document.getElementById('hrFilterDept');
  if (hrDeptSelect) {
    const currentHrDept = hrDeptSelect.value || 'ALL';
    hrDeptSelect.innerHTML = `<option value="ALL">All Departments (${state.departments.length})</option>` +
      (state.departments || []).map(d => `<option value="${d.id}" ${d.id === currentHrDept ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('');
    if (window.updateHREmployeeDropdown) {
      window.updateHREmployeeDropdown();
    }
  }

  // 5. Update Add Employee Department Select if modal is open
  const addEmpDeptSelect = document.getElementById('addEmpDeptSelect');
  if (addEmpDeptSelect && state.departments && state.departments.length > 0) {
    const currVal = addEmpDeptSelect.value;
    addEmpDeptSelect.innerHTML = (state.departments || []).map(d => `<option value="${d.id}" ${d.id === currVal ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('');
  }

  // 6. Re-render active views
  if (window.renderAllViews) {
    window.renderAllViews();
  }
};

window.openAddEmployeeModal = function(defaultDeptId = null, source = null) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'admin');
  if (currentRole !== 'admin' && currentRole !== 'manager' && currentRole !== 'cashier') {
    window.showToast('Only authorized staff can add staff accounts.', 'warning');
    return;
  }

  state._addEmpSource = source; // Track if opened from 'pos_tab'

  if (!state.departments || state.departments.length === 0) {
    window.showToast('Please create at least one department first.', 'warning');
    window.openAddDepartmentModal();
    return;
  }

  const deptIdToUse = defaultDeptId || (state.ledgerMode === 'dept_detail' ? state.selectedLedgerDeptId : state.departments[0].id);

  const deptSelect = document.getElementById('addEmpDeptSelect');
  if (deptSelect) {
    deptSelect.innerHTML = (state.departments || []).map(d => `<option value="${d.id}" ${d.id === deptIdToUse ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('');
    if (deptIdToUse) {
      deptSelect.value = deptIdToUse;
    }
  }

  const nameInput = document.getElementById('addEmpFullName');
  const initBalInput = document.getElementById('addEmpInitialBalance');
  if (nameInput) nameInput.value = '';
  if (initBalInput) initBalInput.value = '0';

  if (window.updateAutoStaffId) window.updateAutoStaffId();
  window.openModal('modalAddEmployee');
};

window.saveNewEmployee = async function() {
  const fullName = (document.getElementById('addEmpFullName').value || '').trim().toUpperCase();
  const deptSelect = document.getElementById('addEmpDeptSelect');
  const deptId = deptSelect ? deptSelect.value : '';
  let staffId = (document.getElementById('addEmpStaffId').value || '').trim().toUpperCase();
  const initBal = parseFloat(document.getElementById('addEmpInitialBalance').value) || 0;

  if (!fullName || !deptId) {
    window.showToast('Full name and department are required.', 'error');
    return;
  }

  if (!staffId) {
    const dept = (state.departments || []).find(d => d.id === deptId);
    const prefix = dept ? (dept.code || 'EMP') : 'EMP';
    const nextNum = ((state.employees || []).filter(e => e.departmentId === deptId).length + 1).toString().padStart(3, '0');
    staffId = `${prefix}-${nextNum}`;
  }

  if ((state.employees || []).some(e => e && e.staffId === staffId)) {
    window.showToast(`Staff ID "${staffId}" already exists. Please choose or generate another ID.`, 'error');
    return;
  }

  const newEmp = {
    id: generateId('emp'),
    staffId: staffId,
    fullName: fullName,
    departmentId: deptId,
    monthlyCreditLimit: 50000,
    currentBalance: initBal
  };

  if (!state.employees) state.employees = [];
  state.employees.push(newEmp);
  addAuditLog("Staff Account Created", `Created staff account ${fullName} (${staffId})`);
  saveData({ sync: false });
  window.closeModal('modalAddEmployee');
  
  // Instantly refresh all dropdowns, datalists, and views across the whole application
  if (window.refreshAllStaffDropdownsAndViews) {
    window.refreshAllStaffDropdownsAndViews(newEmp.id, newEmp.departmentId);
  }

  window.showToast(`Staff account "${fullName}" (${staffId}) created!`, 'success');

  // If opened directly from Tab Checkout, return back and auto-select the new staff member!
  if (state._addEmpSource === 'pos_tab') {
    state._addEmpSource = null;
    if (window.openTabCheckoutModal) {
      window.openTabCheckoutModal(newEmp.id);
    }
  }

  // Non-blocking cloud persistence
  try {
    if (window.cloudSaveEmployee) {
      await window.cloudSaveEmployee(newEmp);
    }
  } catch (err) {
    console.warn('Cloud save staff account notice:', err.message);
  }
};

