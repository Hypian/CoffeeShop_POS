/* ==========================================================================
   DMCH Resto POS & MIS — MIS Audit Reports, A4 Statements & Excel Exports
   ========================================================================== */

async function exportExcelWithLogo(workbookTitle, headers, rows, filename) {
  try {
    if (typeof ExcelJS === 'undefined') {
      window.showToast('Excel exporter library is loading, please try again in a moment.', 'info');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    const isJpeg = APP_LOGO_DATA_URI.startsWith('data:image/jpeg') || APP_LOGO_DATA_URI.startsWith('data:image/jpg');
    const imageExt = isJpeg ? 'jpeg' : 'png';
    const b64Data = APP_LOGO_DATA_URI.split(',')[1];
    const imageId = workbook.addImage({
      base64: b64Data,
      extension: imageExt
    });

    worksheet.getColumn(1).width = 14;
    worksheet.getColumn(2).width = 14;

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 140, height: 45 }
    });

    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(3).height = 18;

    worksheet.getCell('C1').value = 'DMCH RESTO - DREAM MEDICAL CENTER HOSPITAL';
    worksheet.getCell('C1').font = { bold: true, size: 13, color: { argb: 'FF0F172A' } };

    worksheet.getCell('C2').value = workbookTitle;
    worksheet.getCell('C2').font = { bold: true, size: 11, color: { argb: 'FFF59E0B' } };

    worksheet.getCell('C3').value = `Generated: ${new Date().toLocaleString()}`;
    worksheet.getCell('C3').font = { italic: true, size: 9, color: { argb: 'FF64748B' } };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    rows.forEach(r => {
      const row = worksheet.addRow(r);
      const isGrandTotal = r[0] === 'GRAND TOTAL' || (typeof r[0] === 'string' && r[0].startsWith('GRAND TOTAL'));
      row.eachCell((cell, colIndex) => {
        if (isGrandTotal) {
          cell.font = { bold: true, color: { argb: 'FF92400E' }, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }
          };
        }
        if (typeof cell.value === 'number') {
          cell.numFmt = '"RWF "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    worksheet.columns.forEach(column => {
      let maxLen = 12;
      column.eachCell({ includeEmpty: false }, cell => {
        const strVal = cell.value ? cell.value.toString() : '';
        if (strVal.length > maxLen) maxLen = Math.min(strVal.length, 45);
      });
      column.width = maxLen + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.showToast(`Excel report exported: ${filename}`, 'success');
  } catch (err) {
    console.error('Excel Export Error:', err);
    window.showToast('Failed to export Excel file. See console for details.', 'error');
  }
}

window.exportHRExcel = async function() {
  const deptId = document.getElementById('hrFilterDept')?.value || 'ALL';
  const empId = document.getElementById('hrFilterEmp')?.value || 'ALL';

  if (empId !== 'ALL') {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;
    const dept = state.departments.find(d => d.id === emp.departmentId);
    const receipts = state.tabReceipts.filter(r => r.employeeId === empId);

    const workbookTitle = `DETAILED STATEMENT OF ACCOUNT - ${emp.fullName} (${emp.staffId})`;
    const headers = ["Order ID", "Date & Time", "Department", "Items Consumed", "Amount (RWF)"];
    const rows = [];
    let grandTotal = 0;

    receipts.slice().reverse().forEach(r => {
      const timeStr = new Date(r.timestamp).toLocaleString();
      const itemsStr = r.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ');
      rows.push([r.id, timeStr, dept ? dept.name : 'N/A', itemsStr, r.total]);
      grandTotal += r.total;
    });

    rows.push([]);
    rows.push(["GRAND TOTAL TO DEDUCT", "", "", "", grandTotal]);

    const filename = `Staff_Statement_${emp.staffId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  } else {
    let deptsToExport = state.departments;
    if (deptId !== 'ALL') {
      deptsToExport = state.departments.filter(d => d.id === deptId);
    }

    const workbookTitle = `HR PAYROLL DEDUCTIONS SUMMARY REPORT`;
    const headers = ["Department Code", "Department Name", "Staff ID", "Employee Name", "Current Outstanding Tab (RWF)"];
    const rows = [];
    let grandTotal = 0;

    deptsToExport.forEach(d => {
      const emps = state.employees.filter(e => e.departmentId === d.id && e.currentBalance > 0);
      emps.forEach(e => {
        rows.push([d.code, d.name, e.staffId || 'N/A', e.fullName, e.currentBalance]);
        grandTotal += e.currentBalance;
      });
    });

    rows.push([]);
    rows.push(["GRAND TOTAL PAYROLL DEDUCTIONS", "", "", "", grandTotal]);

    const filename = `HR_Payroll_Deductions_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  }
};

window.exportDepartmentExcel = async function(deptId) {
  const dept = state.departments.find(d => d.id === deptId);
  if (!dept) return;

  const staffList = state.employees.filter(e => e.departmentId === deptId);
  const staffIds = staffList.map(e => e.id);
  const receipts = state.tabReceipts.filter(r => staffIds.includes(r.employeeId) || r.departmentId === deptId);

  const workbookTitle = `DEPARTMENT CONSUMPTION REPORT - ${dept.name.toUpperCase()} (${dept.code})`;
  const headers = ["Staff ID", "Employee Name", "Order ID", "Date & Time", "Items Consumed", "Amount (RWF)"];
  const rows = [];
  let grandTotal = 0;

  receipts.slice().reverse().forEach(r => {
    const timeStr = new Date(r.timestamp).toLocaleString();
    const itemsStr = r.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ');
    rows.push([r.staffId || 'N/A', r.employeeName || 'Staff', r.id, timeStr, itemsStr, r.total]);
    grandTotal += r.total;
  });

  rows.push([]);
  rows.push(["GRAND TOTAL CONSUMED", "", "", "", "", grandTotal]);

  const filename = `Department_Consumption_${dept.code}_${new Date().toISOString().split('T')[0]}.xlsx`;
  await exportExcelWithLogo(workbookTitle, headers, rows, filename);
};

window.exportPatientCateringExcel = async function(targetRoomNum = null) {
  let patientOrders = (state.orders || []).filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER');
  
  if (targetRoomNum) {
    patientOrders = patientOrders.filter(o => (o.roomNumber || '').toLowerCase() === targetRoomNum.toLowerCase());
  }

  const workbookTitle = targetRoomNum 
    ? `HOSPITAL INPATIENT CATERING STATEMENT - ${targetRoomNum.toUpperCase()}`
    : `MONTHLY INPATIENT CATERING & MEAL DELIVERIES REPORT`;

  const headers = ["Order ID", "Date & Time", "Room Number", "Meal Category", "Items Consumed", "Diet / Notes", "Covered Amount (RWF)"];
  const rows = [];
  let grandTotal = 0;

  patientOrders.slice().reverse().forEach(o => {
    const timeStr = new Date(o.timestamp).toLocaleString();
    const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ') : 'N/A';
    rows.push([o.id, timeStr, o.roomNumber || 'N/A', o.mealType || 'Meal', itemsStr, o.patientNotes || 'Standard', o.total]);
    grandTotal += o.total;
  });

  rows.push([]);
  rows.push(["GRAND TOTAL COVERED PERKS", "", "", "", "", "", grandTotal]);

  const filename = targetRoomNum 
    ? `Patient_Catering_${targetRoomNum.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Monthly_Patient_Catering_${new Date().toISOString().split('T')[0]}.xlsx`;

  await exportExcelWithLogo(workbookTitle, headers, rows, filename);
};

window.updateHREmployeeDropdown = function() {
  const deptSelect = document.getElementById('hrFilterDept');
  const empSelect = document.getElementById('hrFilterEmp');
  if (!deptSelect || !empSelect) return;
  
  if (deptSelect.value === 'ALL') {
    empSelect.innerHTML = '<option value="ALL">All Staff</option>';
    empSelect.disabled = true;
  } else {
    const emps = state.employees.filter(e => e.departmentId === deptSelect.value && e.currentBalance > 0);
    empSelect.innerHTML = '<option value="ALL">All Staff in Dept</option>' + emps.map(e => `<option value="${e.id}">${e.fullName}</option>`).join('');
    empSelect.disabled = false;
  }
};

window.printHRReport = function() {
  const deptId = document.getElementById('hrFilterDept')?.value || 'ALL';
  const empId = document.getElementById('hrFilterEmp')?.value || 'ALL';
  
  if (empId !== 'ALL') {
    const emp = state.employees.find(e => e.id === empId);
    const dept = state.departments.find(d => d.id === emp.departmentId);
    const receipts = state.tabReceipts.filter(r => r.employeeId === empId);
    let totalProducts = 0;

    receipts.forEach(r => {
      totalProducts += r.items.reduce((s, i) => s + (i.qty || 1), 0);
    });
    
    let printHtml = `
      <div style="font-family:sans-serif; color:#000; padding:20px; max-width:850px; margin:0 auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:20px;">
          <div>
            <img src="${APP_LOGO_DATA_URI}" style="max-height:50px; width:auto; display:block; margin-bottom:6px;" alt="Logo">
            <h2 style="margin:0; font-size:20px; font-weight:800;">DMCH RESTO</h2>
            <p style="margin:2px 0 0 0; font-size:12px; color:#555;">Dream Medical Center Hospital</p>
          </div>
          <div style="text-align:right;">
            <h1 style="margin:0; font-size:20px; font-weight:bold;">Detailed Statement of Account</h1>
            <p style="margin:4px 0 0 0; font-size:12px; color:#555;">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background-color:#FEF3C7; border:1px solid #F59E0B; padding:15px; margin:20px 0; border-radius:8px; display:flex; justify-content:space-between;">
          <div>
            <h2 style="margin:0 0 6px 0; font-size:18px; color:#0F172A;">${emp.fullName}</h2>
            <p style="margin:0 0 4px 0; font-size:13px;"><strong>Staff ID:</strong> ${emp.staffId || 'N/A'}</p>
            <p style="margin:0; font-size:13px;"><strong>Department:</strong> ${dept ? dept.name : 'Unknown'}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 4px 0; font-size:13px;"><strong>Total Products Consumed:</strong> ${totalProducts} items</p>
            <p style="margin:0; font-size:18px; color:#D97706;"><strong>Grand Total to Deduct: ${formatMoney(emp.currentBalance)}</strong></p>
          </div>
        </div>
        
        <h3 style="margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">Itemized Receipt History</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:14px;">
          <tr style="border-bottom:2px solid #000; background-color:#f8fafc;">
            <th style="text-align:left; padding:8px;">Date & Time</th>
            <th style="text-align:left; padding:8px;">Order ID</th>
            <th style="text-align:left; padding:8px;">Items Consumed</th>
            <th style="text-align:right; padding:8px;">Amount</th>
          </tr>
    `;
    
    if (receipts.length > 0) {
      let sum = 0;
      receipts.reverse().forEach(r => {
        sum += r.total;
        const itemsStr = r.items.map(i => `${i.qty}x ${state.products.find(p=>p.id===i.productId)?.name || 'Item'}`).join(', ');
        printHtml += `
          <tr style="border-bottom:1px solid #ccc;">
            <td style="padding:8px;">${new Date(r.timestamp).toLocaleString()}</td>
            <td style="padding:8px; font-size:11px;">${r.id}</td>
            <td style="padding:8px;">${itemsStr}</td>
            <td style="text-align:right; padding:8px;">${formatMoney(r.total)}</td>
          </tr>
        `;
      });
      printHtml += `
          <tr style="font-weight:bold; background-color:#FEF3C7; color:#92400E; font-size:14px; border-top:2px solid #F59E0B;">
            <td colspan="2" style="padding:10px 8px;">GRAND TOTAL (${receipts.length} Orders)</td>
            <td style="padding:10px 8px;">${totalProducts} Total Products Consumed</td>
            <td style="text-align:right; padding:10px 8px; font-size:15px; color:#D97706;">${formatMoney(sum)}</td>
          </tr>
      `;
    } else {
      printHtml += `<tr><td colspan="4" style="padding:20px; text-align:center; font-style:italic;">No detailed receipts found for this balance.</td></tr>`;
    }
    
    printHtml += `
        </table>
        <div style="margin-top:60px; display:flex; justify-content:space-between; font-size:14px;">
          <div style="width: 45%;">
            <p style="margin-bottom:40px;">Employee Acknowledgement:</p>
            <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
          </div>
          <div style="width: 45%;">
            <p style="margin-bottom:40px;">Prepared By (HR / Admin):</p>
            <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
          </div>
        </div>
      </div>
    `;
    openPrintWindow(printHtml);
    return;
  }

  let deptsToPrint = state.departments;
  if (deptId !== 'ALL') {
    deptsToPrint = state.departments.filter(d => d.id === deptId);
  }
  
  let printHtml = `
    <div style="font-family:sans-serif; color:#000; padding:20px; max-width:850px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:20px;">
        <div>
          <img src="${APP_LOGO_DATA_URI}" style="max-height:50px; width:auto; display:block; margin-bottom:6px;" alt="Logo">
          <h2 style="margin:0; font-size:20px; font-weight:800;">DMCH RESTO</h2>
          <p style="margin:2px 0 0 0; font-size:12px; color:#555;">Dream Medical Center Hospital</p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0; font-size:20px; font-weight:bold;">HR Payroll Deductions Report</h1>
          <p style="margin:4px 0 0 0; font-size:12px; color:#555;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
      <p style="font-size:14px; margin-bottom:30px;">This report details the outstanding Tab/Credit balances for employees to be deducted from payroll.</p>
  `;
  
  let hasData = false;
  let overallTotal = 0;
  let overallStaffCount = 0;
  deptsToPrint.forEach(d => {
    const emps = state.employees.filter(e => e.departmentId === d.id && e.currentBalance > 0);
    if (emps.length > 0) {
      hasData = true;
      printHtml += `
        <h3 style="margin-top:20px; background-color:#f1f5f9; padding:8px 12px; font-size:16px;">Department: ${d.name} (${d.code})</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:14px;">
          <tr style="border-bottom:2px solid #000;">
            <th style="text-align:left; padding:8px;">Staff ID</th>
            <th style="text-align:left; padding:8px;">Employee Name</th>
            <th style="text-align:right; padding:8px;">Amount to Deduct</th>
          </tr>
      `;
      let deptTotal = 0;
      emps.forEach(e => {
        deptTotal += e.currentBalance;
        overallTotal += e.currentBalance;
        overallStaffCount++;
        printHtml += `
          <tr style="border-bottom:1px solid #ccc;">
            <td style="padding:8px;">${e.staffId || 'N/A'}</td>
            <td style="padding:8px;">${e.fullName}</td>
            <td style="text-align:right; padding:8px;">${formatMoney(e.currentBalance)}</td>
          </tr>
        `;
      });
      printHtml += `
          <tr style="font-weight:bold; background-color:#f8fafc;">
            <td colspan="2" style="padding:8px; text-align:right;">Department Total:</td>
            <td style="text-align:right; padding:8px;">${formatMoney(deptTotal)}</td>
          </tr>
        </table>
      `;
    }
  });

  if (!hasData) {
    printHtml += `<p style="text-align:center; font-style:italic; padding:30px 0;">No outstanding balances found for the selected criteria.</p>`;
  }

  printHtml += `
      <div style="margin-top:30px; font-size:16px; font-weight:bold; background-color:#FEF3C7; border:1px solid #F59E0B; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <span>GRAND TOTAL PAYROLL DEDUCTIONS (${overallStaffCount} Staff Members):</span>
        <span style="font-size:20px; color:#D97706;">${formatMoney(overallTotal)}</span>
      </div>
      
      <div style="margin-top:60px; display:flex; justify-content:space-between; font-size:14px;">
        <div style="width: 45%;">
          <p style="margin-bottom:40px;">Prepared By (Manager):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name & Signature</p>
        </div>
        <div style="width: 45%;">
          <p style="margin-bottom:40px;">Received By (HR Department):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
        </div>
      </div>
    </div>
  `;
  openPrintWindow(printHtml);
};

function openPrintWindow(html) {
  const printWindow = window.open('', '', 'width=800,height=800');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

window.renderReports = function() {
  const container = document.getElementById('reportsContent');
  if (!container) return;

  const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
  const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
  const revPatient = state.orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER').reduce((s,o)=>s+o.total,0);
  const totalRev = revDirect + revTab + revPatient;
  const totalOrders = state.orders.length;
  const totalOutstanding = state.employees.reduce((s,e)=>s+e.currentBalance, 0);

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Total System Volume</div>
        <div class="text-2xl font-extrabold text-[#10B981]">${formatMoney(totalRev)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">${totalOrders} transactions recorded</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Direct Sales (Cash/Momo)</div>
        <div class="text-2xl font-extrabold text-[#3B82F6]">${formatMoney(revDirect)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Paid directly at register</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Staff Payroll Tabs</div>
        <div class="text-2xl font-extrabold text-[#F59E0B]">${formatMoney(revTab)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Institutional staff credit</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Hospital Room Perks</div>
        <div class="text-2xl font-extrabold text-[#8B5CF6]">${formatMoney(revPatient)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Covered inpatient catering</div>
      </div>
    </div>

    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-2xl">📄</div>
        <div>
          <h3 class="text-base font-bold text-[#0F172A]">Official End-of-Day MIS Audit Report</h3>
          <p class="text-xs text-[#475569]">Generate & print full A4 management report with financial breakdown and department tab balances.</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="printDailyA4Report()" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#F59E0B]/20">
          <span>🖨</span> Print A4 Report
        </button>
      </div>
    </div>

    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4 mb-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-2xl">👥</div>
        <div>
          <h3 class="text-base font-bold text-[#0F172A]">HR Payroll & Statement Export</h3>
          <p class="text-xs text-[#475569]">Print grouped department reports or detailed individual staff statements.</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-2 items-center w-full md:w-auto">
        <select id="hrFilterDept" class="bg-[#F8FAFC] border border-black/[0.1] text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B5CF6] w-full md:w-auto" onchange="window.updateHREmployeeDropdown()">
          <option value="ALL">All Departments</option>
          ${state.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
        <select id="hrFilterEmp" class="bg-[#F8FAFC] border border-black/[0.1] text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B5CF6] w-full md:w-auto" disabled>
          <option value="ALL">All Staff</option>
        </select>
        <button onclick="exportHRExcel()" class="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-[#10B981]/20 w-full md:w-auto">
          📊 Excel (.xlsx)
        </button>
        <button onclick="printHRReport()" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-[#8B5CF6]/20 w-full md:w-auto">
          🖨 Export
        </button>
      </div>
    </div>

    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><span>🏛️</span> Department Tab Ledger Summary</h3>
        <span class="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/20">Total Outstanding: ${formatMoney(totalOutstanding)}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table w-full text-left text-sm">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Current Balance</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${state.employees.map(e => {
              const dept = state.departments.find(d => d.id === e.departmentId);
              return `
                <tr>
                  <td>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs">${e.staffId}</span>
                  </td>
                  <td class="font-bold text-slate-900">${e.fullName}</td>
                  <td>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">${dept ? dept.name : e.departmentId}</span>
                  </td>
                  <td>
                    <span class="font-mono font-extrabold ${e.currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}">${formatMoney(e.currentBalance)}</span>
                  </td>
                  <td class="text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-2">
                      <button onclick="openSettleModal('${e.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-all active:scale-95">💵 Settle Tab</button>
                      <button onclick="deleteEmployee('${e.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.showReceiptModal = function(order) {
  state.lastReceiptOrder = order;
  const preview = document.getElementById('receiptPreviewContent');
  if (!preview) return;
  
  const itemsHtml = order.items.map(item => `
    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
      <span>${item.qty}x ${item.name}</span>
      <span>${formatMoney(item.subtotal)}</span>
    </div>
  `).join('');

  let paymentInfo = `Payment: ${order.paymentMethod}`;
  if (order.checkoutMode === 'INSTITUTIONAL_TAB') {
    paymentInfo = `Tab: ${order.employeeName} (${order.staffId})<br>Dept: ${order.departmentName}`;
  } else if (order.checkoutMode === 'PATIENT_ROOM_ORDER') {
    paymentInfo = `Catering Delivery: ${order.roomNumber}<br>Meal Category: ${order.mealType}<br>Billing: ${order.billingType === 'COVERED_PERK' ? 'Hospital Covered Perk' : 'Direct Pay'}${order.patientNotes ? `<br>Notes: ${order.patientNotes}` : ''}`;
  }

  preview.innerHTML = `
    <div style="text-align:center; font-family:monospace; color:#333;">
      <img src="${APP_LOGO_DATA_URI}" style="max-width:140px; height:auto; margin:0 auto 8px; display:block;" alt="Logo">
      <h3 style="margin:0; font-size:16px; font-weight:bold; letter-spacing:0.5px;">DMCH RESTO</h3>
      <div style="text-align:left; font-size:12px; border-bottom:1px dashed #ccc; padding-bottom:8px; margin-bottom:8px;">
        Order: ${order.id}<br>
        Date: ${new Date(order.timestamp).toLocaleString()}<br>
        Cashier: ${order.cashierName}
      </div>
      <div style="text-align:left; margin-bottom:12px; color:#000;">
        ${itemsHtml}
      </div>
      <div style="text-align:right; border-top:1px dashed #ccc; padding-top:8px; font-weight:bold;">
        TOTAL: ${formatMoney(order.total)}
      </div>
      <div style="text-align:left; font-size:12px; margin-top:12px; color:#555;">
        ${paymentInfo}
      </div>
      ${order.signatureDataUrl ? `<div style="margin-top:12px; text-align:center;"><img src="${order.signatureDataUrl}" style="max-height:48px; width:auto; background:transparent; display:inline-block;" alt="Signature"></div>` : ''}
      <div style="margin-top:16px; font-size:12px; text-align:center;">Thank you!</div>
    </div>
  `;
  window.openModal('modalReceipt');
};

window.reprintReceipt = function(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) window.showReceiptModal(order);
};

window.triggerPrintReceipt = function() {
  if (state.lastReceiptOrder) {
    window.print80mmReceipt(state.lastReceiptOrder);
  }
};

window.print80mmReceipt = function(order) {
  const container = document.getElementById('print-container');
  if (!container) return;
  container.innerHTML = document.getElementById('receiptPreviewContent').innerHTML;
  window.print();
};

window.printDailyA4Report = function() {
  const container = document.getElementById('print-container');
  if (!container) return;
  
  const revDirect = state.orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT').reduce((s,o)=>s+o.total,0);
  const revTab = state.orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB').reduce((s,o)=>s+o.total,0);
  const revPatient = state.orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER').reduce((s,o)=>s+o.total,0);
  const totalRev = revDirect + revTab + revPatient;
  
  container.innerHTML = `
    <div style="font-family:sans-serif; color:#000; padding:20px; max-width:850px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:20px;">
        <div>
          <img src="${APP_LOGO_DATA_URI}" style="max-height:50px; width:auto; display:block; margin-bottom:6px;" alt="Logo">
          <h2 style="margin:0; font-size:20px; font-weight:800;">DMCH RESTO</h2>
          <p style="margin:2px 0 0 0; font-size:12px; color:#555;">Dream Medical Center Hospital — Staff Lounge & Cafeteria</p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0; font-size:20px; font-weight:bold;">Daily MIS Audit Report</h1>
          <p style="margin:4px 0 0 0; font-size:12px; color:#555;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
      
      <h2>Financial Breakdown</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <tr><td style="border:1px solid #000; padding:8px; font-weight:bold;">Total System Transaction Volume</td><td style="border:1px solid #000; padding:8px; font-weight:bold;">${formatMoney(totalRev)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">💵 Direct Sales (Cash & Mobile Register)</td><td style="border:1px solid #000; padding:8px;">${formatMoney(revDirect)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">💳 Institutional Staff Tabs (Payroll Deductions)</td><td style="border:1px solid #000; padding:8px;">${formatMoney(revTab)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px; font-weight:bold; color:#7C3AED;">🏥 Hospital Inpatient Catering (Covered Room Perks)</td><td style="border:1px solid #000; padding:8px; font-weight:bold; color:#7C3AED;">${formatMoney(revPatient)}</td></tr>
        <tr><td style="border:1px solid #000; padding:8px;">Total Receipts Processed</td><td style="border:1px solid #000; padding:8px;">${state.orders.length}</td></tr>
      </table>
      
      <h2>Department Tab Balances</h2>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#eee;">
            <th style="border:1px solid #000; padding:8px; text-align:left;">Employee</th>
            <th style="border:1px solid #000; padding:8px; text-align:left;">Department</th>
            <th style="border:1px solid #000; padding:8px; text-align:right;">Outstanding Balance</th>
          </tr>
        </thead>
        <tbody>
          ${state.employees.filter(e => e.currentBalance > 0).map(e => `
            <tr>
              <td style="border:1px solid #000; padding:8px;">${e.fullName} (${e.staffId})</td>
              <td style="border:1px solid #000; padding:8px;">${getCategoryName(e.departmentId) || e.departmentId}</td>
              <td style="border:1px solid #000; padding:8px; text-align:right;">${formatMoney(e.currentBalance)}</td>
            </tr>
          `).join('')}
          <tr style="font-weight:bold; background:#FEF3C7; color:#92400E;">
            <td colspan="2" style="border:1px solid #000; padding:10px; text-align:right;">GRAND TOTAL TO BE DEDUCTED FROM PAYROLL:</td>
            <td style="border:1px solid #000; padding:10px; text-align:right; font-size:15px; color:#D97706;">${formatMoney(state.employees.reduce((s, e) => s + e.currentBalance, 0))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  window.print();
};
