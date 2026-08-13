/* ==========================================================================
   DMCH Resto POS & MIS — MIS Audit Reports, A4 Statements & Excel Exports
   ========================================================================== */

function exportCSVFallback(headers, rows, filename) {
  let csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n';
  rows.forEach(r => {
    csvContent += r.map(v => `"${(v === null || v === undefined) ? '' : String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const downloadName = filename.endsWith('.csv') ? filename : filename.replace(/\.xlsx$/, '.csv');
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast(`CSV report exported: ${downloadName}`, 'success');
}

async function exportExcelWithLogo(workbookTitle, headers, rows, filename) {
  try {
    if (typeof ExcelJS === 'undefined') {
      window.showToast('Excel exporter library loading; generating CSV report fallback...', 'info');
      return exportCSVFallback(headers, rows, filename);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (typeof APP_LOGO_DATA_URI === 'string' && APP_LOGO_DATA_URI.startsWith('data:image')) {
      try {
        const isJpeg = APP_LOGO_DATA_URI.startsWith('data:image/jpeg') || APP_LOGO_DATA_URI.startsWith('data:image/jpg');
        const imageExt = isJpeg ? 'jpeg' : 'png';
        const parts = APP_LOGO_DATA_URI.split(',');
        if (parts.length > 1) {
          const b64Data = parts[1];
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
        }
      } catch (imgErr) {
        console.warn('Skipping logo embedding in Excel:', imgErr);
      }
    }

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
    exportCSVFallback(headers, rows, filename.replace(/\.xlsx$/, '.csv'));
  }
}

// Helper to generate dynamic date/month titles and clean file tags for exports
function formatReportDateTag(dateFilter = 'ALL', customDate = '') {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  const currentMonthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const currentMonthTag = `${monthNames[now.getMonth()]}_${now.getFullYear()}`;

  if (dateFilter === 'TODAY') {
    const todayStr = now.toISOString().split('T')[0];
    return { title: `Today (${todayStr})`, tag: `Today_${todayStr}` };
  } else if (dateFilter === 'YESTERDAY') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];
    return { title: `Yesterday (${yestStr})`, tag: `Yesterday_${yestStr}` };
  } else if (dateFilter === 'THIS_MONTH') {
    return { title: currentMonthStr, tag: currentMonthTag };
  } else if (dateFilter === 'CUSTOM' && customDate) {
    const cleanDate = String(customDate).replace(/[^a-zA-Z0-9_-]/g, '_');
    return { title: customDate, tag: cleanDate };
  } else {
    return { title: currentMonthStr, tag: currentMonthTag };
  }
}

function formatPeriodSubTitle(dateSub) {
  if (!dateSub) {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return { title: `${monthNames[now.getMonth()]} ${now.getFullYear()}`, fileTag: `${monthNames[now.getMonth()]}_${now.getFullYear()}` };
  }
  
  if (/^\d{4}-\d{2}$/.test(dateSub)) {
    const [y, m] = dateSub.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
    return { title: `${monthName} ${y}`, fileTag: `${monthName}_${y}` };
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateSub)) {
    const [y, m, d] = dateSub.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const formatted = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return { title: formatted, fileTag: dateSub };
  }

  return { title: dateSub, fileTag: String(dateSub).replace(/[^a-zA-Z0-9_-]/g, '_') };
}

window.exportHRExcel = async function() {
  const deptId = document.getElementById('hrFilterDept')?.value || 'ALL';
  const empId = document.getElementById('hrFilterEmp')?.value || 'ALL';
  const timeTag = formatReportDateTag('THIS_MONTH');

  if (empId !== 'ALL') {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;
    const dept = state.departments.find(d => d.id === emp.departmentId);
    const receipts = state.tabReceipts.filter(r => r.employeeId === empId);

    const workbookTitle = `STAFF STATEMENT OF ACCOUNT - ${emp.fullName.toUpperCase()} (${emp.staffId || 'N/A'}) - ${timeTag.title.toUpperCase()}`;
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

    const cleanStaffId = (emp.staffId || emp.fullName).replace(/\s+/g, '_');
    const filename = `HR_Staff_Statement_${cleanStaffId}_${timeTag.tag}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  } else {
    let deptsToExport = state.departments;
    let deptTag = 'All_Depts';
    if (deptId !== 'ALL') {
      deptsToExport = state.departments.filter(d => d.id === deptId);
      const selectedDept = state.departments.find(d => d.id === deptId);
      if (selectedDept) deptTag = selectedDept.code;
    }

    const workbookTitle = `HR PAYROLL DEDUCTIONS SUMMARY REPORT - ${timeTag.title.toUpperCase()}`;
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

    const filename = `HR_Payroll_Deductions_${deptTag}_${timeTag.tag}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  }
};

window.exportDepartmentExcel = async function(deptId) {
  const dept = state.departments.find(d => d.id === deptId);
  if (!dept) return;

  const timeTag = formatReportDateTag('THIS_MONTH');
  const staffList = state.employees.filter(e => e.departmentId === deptId);
  const staffIds = staffList.map(e => e.id);
  const receipts = state.tabReceipts.filter(r => staffIds.includes(r.employeeId) || r.departmentId === deptId);

  const workbookTitle = `DEPARTMENT CONSUMPTION REPORT - ${dept.name.toUpperCase()} (${dept.code}) - ${timeTag.title.toUpperCase()}`;
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

  const filename = `Department_Consumption_${dept.code}_${timeTag.tag}.xlsx`;
  await exportExcelWithLogo(workbookTitle, headers, rows, filename);
};

window.exportPatientCateringExcel = async function(targetRoomNum = null) {
  let patientOrders = (state.orders || []).filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER');
  
  const dateFilter = state.patientDateFilter || 'ALL';
  const customDate = state.patientCustomDateFilter || '';
  const mealFilter = state.patientMealFilter || 'ALL';
  const roomSearch = (state.patientRoomSearchQuery || '').toLowerCase();

  const timeTag = formatReportDateTag(dateFilter, customDate);

  if (dateFilter === 'TODAY') {
    const todayStr = new Date().toISOString().split('T')[0];
    patientOrders = patientOrders.filter(o => (o.timestamp || '').startsWith(todayStr));
  } else if (dateFilter === 'YESTERDAY') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];
    patientOrders = patientOrders.filter(o => (o.timestamp || '').startsWith(yestStr));
  } else if (dateFilter === 'THIS_MONTH') {
    const monthStr = new Date().toISOString().slice(0, 7);
    patientOrders = patientOrders.filter(o => (o.timestamp || '').startsWith(monthStr));
  } else if (dateFilter === 'CUSTOM' && customDate) {
    patientOrders = patientOrders.filter(o => (o.timestamp || '').startsWith(customDate));
  }

  let mealTitleSub = '';
  let mealTagFile = '';

  if (targetRoomNum) {
    patientOrders = patientOrders.filter(o => (o.roomNumber || '').toLowerCase() === targetRoomNum.toLowerCase());
    
    // Apply in-room meal filter if specified
    if (mealFilter !== 'ALL') {
      if (mealFilter === 'Breakfast') {
        patientOrders = patientOrders.filter(o => o.mealType === 'Breakfast');
      } else if (mealFilter === 'Lunch') {
        patientOrders = patientOrders.filter(o => o.mealType === 'Lunch');
      } else if (mealFilter === 'Dinner') {
        patientOrders = patientOrders.filter(o => o.mealType === 'Dinner');
      } else if (mealFilter === 'Tea') {
        patientOrders = patientOrders.filter(o => o.mealType === 'Tea & Snack' || o.mealType === 'Tea/Snack' || o.mealType === 'Tea');
      }
      mealTitleSub = ` (${mealFilter.toUpperCase()})`;
      mealTagFile = `_${mealFilter}`;
    }

    // Apply in-room search query if specified
    if (roomSearch) {
      patientOrders = patientOrders.filter(o => {
        const idMatch = (o.id || '').toLowerCase().includes(roomSearch);
        const pIdMatch = (o.patientId || '').toLowerCase().includes(roomSearch);
        const notesMatch = (o.patientNotes || o.customerName || '').toLowerCase().includes(roomSearch);
        const itemsMatch = Array.isArray(o.items) && o.items.some(i => (i.name || '').toLowerCase().includes(roomSearch));
        return idMatch || pIdMatch || notesMatch || itemsMatch;
      });
    }
  }

  const cleanRoomNum = targetRoomNum ? targetRoomNum.toUpperCase().replace(/\s+/g, '_') : '';

  const workbookTitle = targetRoomNum 
    ? `PATIENT ROOM CATERING STATEMENT - ROOM ${targetRoomNum.toUpperCase()}${mealTitleSub} - ${timeTag.title.toUpperCase()}`
    : `MONTHLY PATIENT ROOM CATERING DIRECTORY REPORT - ${timeTag.title.toUpperCase()}`;

  const headers = ["Order ID", "Date & Time", "Room Number", "Patient ID / MRN #", "Patient Name / Diet Notes", "Meal Category", "Items Consumed", "Covered Amount (RWF)"];
  const rows = [];
  let grandTotal = 0;

  patientOrders.slice().reverse().forEach(o => {
    const timeStr = new Date(o.timestamp).toLocaleString();
    const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ') : 'N/A';
    const pId = o.patientId || 'N/A';
    const pNameNotes = o.patientNotes || o.customerName || o.payerName || 'N/A';
    rows.push([o.id, timeStr, o.roomNumber || 'N/A', pId, pNameNotes, o.mealType || 'Meal', itemsStr, o.total]);
    grandTotal += o.total;
  });

  rows.push([]);
  rows.push(["GRAND TOTAL COVERED PERKS", "", "", "", "", "", "", grandTotal]);

  const filename = targetRoomNum 
    ? `Patient_Room_Catering_Room_${cleanRoomNum}${mealTagFile}_${timeTag.tag}.xlsx`
    : `Monthly_Patient_Room_Catering_${timeTag.tag}.xlsx`;

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

window.getFilteredOrdersForReport = function(targetDateStr = null, subfolderFilter = null, folderPeriod = null) {
  const period = folderPeriod || state.dashboardFolder || 'daily';
  const dateSub = targetDateStr || state.dashboardTimeSubfolder || state.selectedReportDate || getDateKey(new Date().toISOString());
  const sub = subfolderFilter || state.dashboardSubfolder || state.selectedReportSubfolder || 'all';

  let orders = getOrdersForPeriod(period, dateSub);

  if (sub === 'direct') {
    orders = orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT');
  } else if (sub === 'tab') {
    orders = orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB');
  } else if (sub === 'patient') {
    orders = orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER');
  }

  return { orders, period, dateSub, sub };
};

window.exportDailyReportCSV = function(targetDateStr = null, subfolderFilter = null, folderPeriod = null) {
  const { orders, dateSub, sub } = getFilteredOrdersForReport(targetDateStr, subfolderFilter, folderPeriod);
  const periodTag = formatPeriodSubTitle(dateSub);

  let filterTitle = "ALL RECEIPTS";
  if (sub === 'direct') filterTitle = "DIRECT SALES (CASH / MOMO / CARD)";
  else if (sub === 'tab') filterTitle = "INSTITUTIONAL STAFF TABS (PAYROLL DEDUCTIONS)";
  else if (sub === 'patient') filterTitle = "HOSPITAL INPATIENT ROOM PERKS";
  else if (sub === 'items') filterTitle = "ITEMIZED PRODUCT SALES LOG";

  let csvContent = "";
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Header branding metadata
  csvContent += `${escapeCsv('DMCH RESTO - DREAM MEDICAL CENTER HOSPITAL')}\n`;
  csvContent += `${escapeCsv(`MIS AUDIT REPORT [${filterTitle}] - ${periodTag.title}`)}\n`;
  csvContent += `${escapeCsv(`Generated: ${new Date().toLocaleString()}`)}\n\n`;

  if (sub === 'items') {
    const productMap = {};
    orders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const key = item.productId || item.name;
          if (!productMap[key]) {
            productMap[key] = { name: item.name || 'Item', qty: 0, revenue: 0 };
          }
          productMap[key].qty += (item.qty || 1);
          productMap[key].revenue += (item.subtotal || ((item.price || 0) * (item.qty || 1)));
        });
      }
    });

    const productList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    let totalQty = 0;
    let totalRev = 0;

    csvContent += `${escapeCsv('PRODUCT SALES LOG SUMMARY')}\n`;
    csvContent += `${escapeCsv('Product Name')},${escapeCsv('Quantity Sold')},${escapeCsv('Total Revenue (RWF)')}\n`;

    productList.forEach(p => {
      csvContent += [p.name, p.qty, p.revenue].map(escapeCsv).join(',') + '\n';
      totalQty += p.qty;
      totalRev += p.revenue;
    });

    csvContent += `\n${escapeCsv('TOTAL UNITS SOLD')},${totalQty},${escapeCsv('TOTAL REVENUE')},${totalRev}\n`;
  } else {
    const revDirect = orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
    const revTab = orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
    const revPatient = orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
    const totalRev = revDirect + revTab + revPatient;

    csvContent += `${escapeCsv('FINANCIAL SUMMARY FOR FILTER')}\n`;
    csvContent += `${escapeCsv('Metric')},${escapeCsv('Amount (RWF)')}\n`;
    csvContent += `${escapeCsv('Total Filter Volume')},${totalRev}\n`;
    csvContent += `${escapeCsv('Direct Sales (Cash/Mobile)')},${revDirect}\n`;
    csvContent += `${escapeCsv('Institutional Staff Tabs')},${revTab}\n`;
    csvContent += `${escapeCsv('Hospital Room Perks')},${revPatient}\n`;
    csvContent += `${escapeCsv('Total Receipts Processed')},${orders.length}\n\n`;

    csvContent += `${escapeCsv('ITEMIZED TRANSACTIONS')}\n`;
    csvContent += [
      'Order ID',
      'Date & Time',
      'Checkout Mode',
      'Client / Staff / Room',
      'Cashier',
      'Status',
      'Items Consumed',
      'Amount (RWF)'
    ].map(escapeCsv).join(',') + '\n';

    let grandTotal = 0;
    orders.forEach(o => {
      const timeStr = new Date(o.timestamp).toLocaleString();
      let mode = 'Direct Pay';
      if (o.checkoutMode === 'INSTITUTIONAL_TAB') mode = 'Staff Tab';
      else if (o.checkoutMode === 'PATIENT_ROOM_ORDER') mode = 'Inpatient Room Order';

      let client = o.payerName || o.customerName || 'Walk-in Customer';
      if (o.checkoutMode === 'PATIENT_ROOM_ORDER') {
        client = `Room: ${o.roomNumber || 'N/A'}${o.patientId ? ` (PID: ${o.patientId})` : ''}${o.mealType ? ` (${o.mealType})` : ''}${o.patientNotes ? ` - ${o.patientNotes}` : ''}`;
      } else if (o.employeeName) {
        client = `${o.employeeName} (${o.staffId || 'N/A'}) - ${o.departmentName || ''}`;
      } else if (o.payerName || o.customerName) {
        client = `${o.payerName || o.customerName}`;
      }

      const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join('; ') : 'N/A';
      const statusStr = o.status === 'VOIDED' ? `VOIDED (${o.voidReason || 'Voided'})` : 'COMPLETED';

      csvContent += [
        o.id,
        timeStr,
        mode,
        client,
        o.cashierName || 'Cashier',
        statusStr,
        itemsStr,
        o.total || 0
      ].map(escapeCsv).join(',') + '\n';

      if (o.status !== 'VOIDED') grandTotal += (o.total || 0);
    });

    csvContent += `\n${escapeCsv('GRAND TOTAL')},,,,,,,${grandTotal}\n`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const isMonthly = /^\d{4}-\d{2}$/.test(dateSub);
  const filePrefix = isMonthly ? "Monthly" : "Daily";
  const filename = `${filePrefix}_MIS_Report_${sub.toUpperCase()}_${periodTag.fileTag}.csv`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (window.showToast) {
    window.showToast(`CSV report exported for ${filterTitle}: ${filename}`, 'success');
  }
};

window.exportDailyReportExcel = async function(targetDateStr = null, subfolderFilter = null, folderPeriod = null) {
  const { orders, dateSub, sub } = getFilteredOrdersForReport(targetDateStr, subfolderFilter, folderPeriod);
  const periodTag = formatPeriodSubTitle(dateSub);

  let filterTitle = "ALL RECEIPTS";
  if (sub === 'direct') filterTitle = "DIRECT SALES";
  else if (sub === 'tab') filterTitle = "STAFF TABS";
  else if (sub === 'patient') filterTitle = "INPATIENT PERKS";
  else if (sub === 'items') filterTitle = "PRODUCT LOG";

  const isMonthly = /^\d{4}-\d{2}$/.test(dateSub);
  const reportPrefix = isMonthly ? "MONTHLY MIS AUDIT REPORT" : "DAILY MIS AUDIT REPORT";
  const workbookTitle = `${reportPrefix} [${filterTitle}] - ${periodTag.title.toUpperCase()}`;

  if (sub === 'items') {
    const productMap = {};
    orders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const key = item.productId || item.name;
          if (!productMap[key]) {
            productMap[key] = { name: item.name || 'Item', qty: 0, revenue: 0 };
          }
          productMap[key].qty += (item.qty || 1);
          productMap[key].revenue += (item.subtotal || ((item.price || 0) * (item.qty || 1)));
        });
      }
    });

    const productList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    const headers = ["Product Name", "Quantity Sold", "Total Revenue (RWF)"];
    const rows = [];
    let grandTotal = 0;

    productList.forEach(p => {
      rows.push([p.name, p.qty, p.revenue]);
      grandTotal += p.revenue;
    });

    rows.push([]);
    rows.push(["GRAND TOTAL", "", grandTotal]);

    const filePrefix = isMonthly ? "Monthly" : "Daily";
    const filename = `${filePrefix}_MIS_Product_Log_${periodTag.fileTag}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  } else {
    const headers = ["Order ID", "Date & Time", "Mode", "Client / Staff / Room", "Cashier", "Status", "Items Consumed", "Amount (RWF)"];
    const rows = [];
    let grandTotal = 0;

    orders.forEach(o => {
      const timeStr = new Date(o.timestamp).toLocaleString();
      let mode = 'Direct Pay';
      if (o.checkoutMode === 'INSTITUTIONAL_TAB') mode = 'Staff Tab';
      else if (o.checkoutMode === 'PATIENT_ROOM_ORDER') mode = 'Inpatient Perk';

      let client = 'Walk-in Customer';
      if (o.checkoutMode === 'PATIENT_ROOM_ORDER') {
        client = `Room: ${o.roomNumber || 'N/A'}${o.mealType ? ` (${o.mealType})` : ''}`;
      } else if (o.employeeName) {
        client = `${o.employeeName} (${o.staffId || 'N/A'})`;
      }

      const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ') : 'N/A';
      const statusStr = o.status === 'VOIDED' ? 'VOIDED' : 'COMPLETED';

      rows.push([o.id, timeStr, mode, client, o.cashierName || 'Cashier', statusStr, itemsStr, o.total || 0]);
      if (o.status !== 'VOIDED') grandTotal += (o.total || 0);
    });

    rows.push([]);
    rows.push(["GRAND TOTAL", "", "", "", "", "", "", grandTotal]);

    const filePrefix = isMonthly ? "Monthly" : "Daily";
    const filename = `${filePrefix}_MIS_Audit_${sub.toUpperCase()}_${periodTag.fileTag}.xlsx`;
    await exportExcelWithLogo(workbookTitle, headers, rows, filename);
  }
};

window.exportDailyReportPDF = function(targetDateStr = null, subfolderFilter = null, folderPeriod = null) {
  const { orders, dateSub, sub } = getFilteredOrdersForReport(targetDateStr, subfolderFilter, folderPeriod);

  let filterTitle = "Daily MIS Audit Report (All Receipts)";
  if (sub === 'direct') filterTitle = "Daily Direct Sales Report (Cash / Momo / Card)";
  else if (sub === 'tab') filterTitle = "Daily Staff Tabs Audit Report (Payroll Deductions)";
  else if (sub === 'patient') filterTitle = "Daily Inpatient Catering Statement (Room Perks)";
  else if (sub === 'items') filterTitle = "Itemized Product Sales Log Report";

  const revDirect = orders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
  const revTab = orders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
  const revPatient = orders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER' && o.status !== 'VOIDED').reduce((s,o)=>s+(o.total||0),0);
  const totalRev = revDirect + revTab + revPatient;

  const displayDate = new Date(dateSub + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let printHtml = `
    <div style="font-family:sans-serif; color:#0F172A; padding:24px; max-width:900px; margin:0 auto; background:#fff;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #0F172A; padding-bottom:14px; margin-bottom:20px;">
        <div>
          <img src="${APP_LOGO_DATA_URI}" style="max-height:55px; width:auto; display:block; margin-bottom:8px;" alt="Logo">
          <h2 style="margin:0; font-size:22px; font-weight:800; color:#0F172A;">DMCH RESTO</h2>
          <p style="margin:2px 0 0 0; font-size:12px; color:#475569; font-weight:600;">Dream Medical Center Hospital — Staff Lounge & Cafeteria</p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0; font-size:20px; font-weight:800; color:#0F172A;">${filterTitle}</h1>
          <div style="display:inline-block; background:#FEF3C7; color:#D97706; border:1px solid #F59E0B; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:bold; margin-top:6px;">
            Date: ${displayDate} | Filter: ${sub.toUpperCase()}
          </div>
          <p style="margin:6px 0 0 0; font-size:11px; color:#64748B;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
  `;

  if (sub === 'items') {
    const productMap = {};
    orders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const key = item.productId || item.name;
          if (!productMap[key]) {
            productMap[key] = { name: item.name || 'Item', qty: 0, revenue: 0 };
          }
          productMap[key].qty += (item.qty || 1);
          productMap[key].revenue += (item.subtotal || ((item.price || 0) * (item.qty || 1)));
        });
      }
    });

    const productList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    let totalQty = 0;
    let totalRevProduct = 0;

    printHtml += `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0F172A; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">Product Sales Breakdown</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#0F172A; color:#FFFFFF;">
              <th style="padding:8px; text-align:left;">Product Name</th>
              <th style="padding:8px; text-align:center;">Quantity Sold</th>
              <th style="padding:8px; text-align:right;">Total Revenue (RWF)</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (productList.length > 0) {
      productList.forEach((p, idx) => {
        totalQty += p.qty;
        totalRevProduct += p.revenue;
        const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        printHtml += `
          <tr style="background:${bgColor}; border-bottom:1px solid #E2E8F0;">
            <td style="padding:8px; font-weight:bold;">${p.name}</td>
            <td style="padding:8px; text-align:center; font-family:monospace;">${p.qty} units</td>
            <td style="padding:8px; text-align:right; font-family:monospace; font-weight:bold; color:#D97706;">${formatMoney(p.revenue)}</td>
          </tr>
        `;
      });

      printHtml += `
        <tr style="font-weight:bold; background:#FEF3C7; color:#92400E; border-top:2px solid #F59E0B;">
          <td style="padding:10px;">TOTAL (${productList.length} Products)</td>
          <td style="padding:10px; text-align:center; font-family:monospace;">${totalQty} Total Units</td>
          <td style="text-align:right; padding:10px; font-size:14px; color:#D97706; font-family:monospace;">${formatMoney(totalRevProduct)}</td>
        </tr>
      `;
    } else {
      printHtml += `<tr><td colspan="3" style="padding:20px; text-align:center; font-style:italic; color:#64748B;">No product sales recorded for this date and filter.</td></tr>`;
    }

    printHtml += `
          </tbody>
        </table>
      </div>
    `;
  } else {
    printHtml += `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0F172A; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">Financial Breakdown</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <tr style="background:#F8FAFC; border:1px solid #CBD5E1;">
            <td style="padding:10px; font-weight:bold;">Total Filter Volume</td>
            <td style="padding:10px; font-weight:extrabold; text-align:right; color:#10B981; font-size:15px;">${formatMoney(totalRev)}</td>
          </tr>
          <tr style="border:1px solid #E2E8F0;">
            <td style="padding:8px 10px;">💵 Direct Sales (Cash & Mobile Register)</td>
            <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#3B82F6;">${formatMoney(revDirect)}</td>
          </tr>
          <tr style="border:1px solid #E2E8F0;">
            <td style="padding:8px 10px;">💳 Institutional Staff Tabs (Payroll Deductions)</td>
            <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#F59E0B;">${formatMoney(revTab)}</td>
          </tr>
          <tr style="border:1px solid #E2E8F0;">
            <td style="padding:8px 10px;">🏥 Hospital Inpatient Catering (Covered Room Perks)</td>
            <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#8B5CF6;">${formatMoney(revPatient)}</td>
          </tr>
          <tr style="background:#F8FAFC; border:1px solid #CBD5E1; font-weight:bold;">
            <td style="padding:8px 10px;">Total Receipts Processed</td>
            <td style="padding:8px 10px; text-align:right;">${orders.length} Orders</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0F172A; border-bottom:1px solid #E2E8F0; padding-bottom:6px;">Itemized Daily Transactions (${orders.length})</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#0F172A; color:#FFFFFF;">
              <th style="padding:8px; text-align:left;">Order ID</th>
              <th style="padding:8px; text-align:left;">Time</th>
              <th style="padding:8px; text-align:left;">Mode</th>
              <th style="padding:8px; text-align:left;">Client / Staff</th>
              <th style="padding:8px; text-align:left;">Items Consumed</th>
              <th style="padding:8px; text-align:right;">Amount (RWF)</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (orders.length > 0) {
      orders.forEach((o, index) => {
        const timeStr = new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isDirect = o.checkoutMode === 'DIRECT_PAYMENT';
        const isPatient = o.checkoutMode === 'PATIENT_ROOM_ORDER';
        const isVoided = o.status === 'VOIDED';

        let modeLabel = 'Staff Tab';
        if (isDirect) modeLabel = 'Direct';
        else if (isPatient) modeLabel = 'Room';

        let clientText = o.payerName || o.customerName || 'Walk-in';
        if (isPatient) clientText = `Room ${o.roomNumber || ''}${o.patientId ? ` (PID: ${o.patientId})` : ''}`;
        else if (o.employeeName) clientText = `${o.employeeName} (${o.staffId || ''})`;
        else if (o.payerName || o.customerName) clientText = `${o.payerName || o.customerName}`;

        const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ') : 'N/A';
        const bgColor = isVoided ? '#FEF2F2' : (index % 2 === 0 ? '#FFFFFF' : '#F8FAFC');

        printHtml += `
          <tr style="background:${bgColor}; border-bottom:1px solid #E2E8F0;">
            <td style="padding:8px; font-family:monospace; font-weight:bold;">${o.id}${isVoided ? ' (VOID)' : ''}</td>
            <td style="padding:8px;">${timeStr}</td>
            <td style="padding:8px;">${modeLabel}</td>
            <td style="padding:8px; font-weight:600;">${clientText}</td>
            <td style="padding:8px;">${itemsStr}</td>
            <td style="padding:8px; text-align:right; font-family:monospace; font-weight:bold; ${isVoided ? 'text-decoration:line-through; color:#94A3B8;' : ''}">${formatMoney(o.total)}</td>
          </tr>
        `;
      });

      printHtml += `
        <tr style="font-weight:bold; background:#FEF3C7; color:#92400E; border-top:2px solid #F59E0B;">
          <td colspan="4" style="padding:10px;">GRAND TOTAL (${orders.length} Transactions)</td>
          <td style="padding:10px;">Filter Volume</td>
          <td style="text-align:right; padding:10px; font-size:14px; color:#D97706; font-family:monospace;">${formatMoney(totalRev)}</td>
        </tr>
      `;
    } else {
      printHtml += `<tr><td colspan="6" style="padding:20px; text-align:center; font-style:italic; color:#64748B;">No transactions recorded for this date and filter.</td></tr>`;
    }

    printHtml += `
          </tbody>
        </table>
      </div>
    `;
  }

  printHtml += `
      <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:13px;">
        <div style="width: 42%;">
          <p style="margin-bottom:40px; font-weight:bold;">Prepared By (Cashier / Shift Supervisor):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
        </div>
        <div style="width: 42%;">
          <p style="margin-bottom:40px; font-weight:bold;">Approved By (Resto Manager / HR):</p>
          <p style="border-top:1px solid #000; padding-top:5px;">Name, Date & Signature</p>
        </div>
      </div>
    </div>
  `;

  openPrintWindow(printHtml);
};

window.printDailyA4Report = function() {
  window.exportDailyReportPDF(state.selectedReportDate || getDateKey(new Date().toISOString()), state.selectedReportSubfolder || 'all');
};

window.setSelectedReportDate = function(dateStr) {
  state.selectedReportDate = dateStr;
  renderReports();
};

window.setSelectedReportSubfolder = function(subfolderStr) {
  state.selectedReportSubfolder = subfolderStr;
  renderReports();
};

window.renderReports = function() {
  const container = document.getElementById('reportsContent');
  if (!container) return;

  // Build unique date subfolders list from all orders
  const datesSet = new Set();
  const todayStr = getDateKey(new Date().toISOString());
  datesSet.add(todayStr);

  (state.orders || []).forEach(o => {
    if (o.timestamp) {
      const key = getDateKey(o.timestamp);
      if (key) datesSet.add(key);
    }
  });

  const availableDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  if (!state.selectedReportDate || !datesSet.has(state.selectedReportDate)) {
    state.selectedReportDate = availableDates[0] || todayStr;
  }
  if (!state.selectedReportSubfolder) {
    state.selectedReportSubfolder = 'all';
  }

  const selectedDate = state.selectedReportDate;
  const selectedSub = state.selectedReportSubfolder;

  const { orders: filteredOrders } = getFilteredOrdersForReport(selectedDate, selectedSub, 'daily');
  const dayAllOrders = (state.orders || []).filter(o => o.timestamp && getDateKey(o.timestamp) === selectedDate);

  const revDirect = dayAllOrders.filter(o => o.checkoutMode === 'DIRECT_PAYMENT' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const revTab = dayAllOrders.filter(o => o.checkoutMode === 'INSTITUTIONAL_TAB' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const revPatient = dayAllOrders.filter(o => o.checkoutMode === 'PATIENT_ROOM_ORDER' && o.status !== 'VOIDED').reduce((s,o)=>s+o.total,0);
  const totalRev = revDirect + revTab + revPatient;
  const totalOrders = dayAllOrders.length;
  const totalOutstanding = state.employees.reduce((s,e)=>s+e.currentBalance, 0);

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  container.innerHTML = `
    <!-- Top Date Subfolder & Report Selector -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center text-3xl font-extrabold shadow-lg">📄</div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-500/30">Official Audit Reports</span>
            <span class="text-xs text-slate-400 font-mono hidden sm:inline">• Branded PDF & Excel</span>
          </div>
          <h2 class="text-xl font-bold text-[#0F172A] mt-1">Daily Audit Report & Historical Subfolders</h2>
          <p class="text-xs text-[#475569]">Select any day subfolder & filter below to view transactions and extract matching PDF or Excel downloads.</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
        <div class="flex items-center gap-2 bg-[#F8FAFC] border border-black/[0.1] rounded-xl px-3 py-2 w-full sm:w-auto">
          <span class="text-xs font-bold text-[#475569]">📅 Day Subfolder:</span>
          <select class="bg-transparent border-none text-xs font-extrabold text-[#0F172A] focus:outline-none cursor-pointer" onchange="window.setSelectedReportDate(this.value)">
            ${availableDates.map(d => `
              <option value="${d}" ${d === selectedDate ? 'selected' : ''}>
                ${d === todayStr ? `Today (${d})` : d}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button onclick="exportDailyReportPDF('${selectedDate}', '${selectedSub}')" class="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 w-full sm:w-auto">
            <span>🖨️</span> PDF (A4)
          </button>
          <button onclick="exportDailyReportExcel('${selectedDate}', '${selectedSub}')" class="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 w-full sm:w-auto">
            <span>📈</span> Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Pills for Reports View -->
    <div class="flex items-center gap-2 bg-[#FFFFFF] p-2 rounded-2xl border border-black/[0.1] shadow-xs flex-wrap">
      <span class="text-xs font-extrabold text-[#0F172A] px-2">Filter View:</span>
      <button onclick="setSelectedReportSubfolder('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSub === 'all' ? 'bg-[#F59E0B] text-slate-950 shadow-md' : 'text-[#475569] hover:bg-[#F1F5F9]'}">
        🗂️ All Receipts
      </button>
      <button onclick="setSelectedReportSubfolder('direct')" class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSub === 'direct' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#475569] hover:bg-[#F1F5F9]'}">
        💵 Direct Sales
      </button>
      <button onclick="setSelectedReportSubfolder('tab')" class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSub === 'tab' ? 'bg-[#D97706] text-white shadow-md' : 'text-[#475569] hover:bg-[#F1F5F9]'}">
        💳 Staff Tabs
      </button>
      <button onclick="setSelectedReportSubfolder('patient')" class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSub === 'patient' ? 'bg-[#8B5CF6] text-white shadow-md' : 'text-[#475569] hover:bg-[#F1F5F9]'}">
        🏥 Inpatient Perks
      </button>
      <button onclick="setSelectedReportSubfolder('items')" class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSub === 'items' ? 'bg-[#64748B] text-white shadow-md' : 'text-[#475569] hover:bg-[#F1F5F9]'}">
        📦 Product Log
      </button>
    </div>

    <!-- Summary Metrics for Selected Date -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Day Volume (${selectedDate})</div>
        <div class="text-2xl font-extrabold text-[#10B981]">${formatMoney(totalRev)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">${totalOrders} transactions on ${formattedSelectedDate}</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Direct Sales (Cash/Momo)</div>
        <div class="text-2xl font-extrabold text-[#3B82F6]">${formatMoney(revDirect)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Direct register payments</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Staff Payroll Tabs</div>
        <div class="text-2xl font-extrabold text-[#F59E0B]">${formatMoney(revTab)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Institutional staff credit</div>
      </div>
      <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-xs">
        <div class="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Hospital Room Perks</div>
        <div class="text-2xl font-extrabold text-[#8B5CF6]">${formatMoney(revPatient)}</div>
        <div class="text-[0.7rem] text-[#475569] mt-1">Covered inpatient catering</div>
      </div>
    </div>

    <!-- Complete Transactions or Product Log Table for Selected Day & Filter -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 shadow-sm">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <span>${selectedSub === 'items' ? '📦' : '📜'}</span>
            ${selectedSub === 'items' ? 'Itemized Product Sales Log' : `Transactions Log — Date: ${selectedDate}`}
          </h3>
          <p class="text-xs text-[#475569]">Showing data for subfolder filter <strong class="text-amber-600 font-mono font-bold">${selectedSub.toUpperCase()}</strong> on ${formattedSelectedDate}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            ${selectedSub === 'items' ? 'Product Breakdown' : `${filteredOrders.length} Orders Logged`}
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        ${selectedSub === 'items' ? (function() {
          const productMap = {};
          filteredOrders.forEach(o => {
            if (Array.isArray(o.items)) {
              o.items.forEach(item => {
                const key = item.productId || item.name;
                if (!productMap[key]) {
                  productMap[key] = { name: item.name || 'Item', qty: 0, revenue: 0 };
                }
                productMap[key].qty += (item.qty || 1);
                productMap[key].revenue += (item.subtotal || ((item.price || 0) * (item.qty || 1)));
              });
            }
          });
          const productList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

          return `
            <table class="data-table w-full text-left text-sm">
              <thead>
                <tr class="text-[#475569] border-b border-black/[0.1]">
                  <th class="py-3 px-4 font-semibold">Product Name</th>
                  <th class="py-3 px-4 font-semibold">Quantity Sold</th>
                  <th class="py-3 px-4 font-semibold">Total Revenue (RWF)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/[0.1]">
                ${productList.length > 0 ? productList.map(p => `
                  <tr>
                    <td class="font-bold text-slate-900">${p.name}</td>
                    <td class="font-mono text-slate-600 font-bold">${p.qty} units sold</td>
                    <td class="font-mono font-extrabold text-amber-600">${formatMoney(p.revenue)}</td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="3" class="py-8 text-center text-[#475569] italic">No product sales recorded for this date & filter.</td></tr>
                `}
              </tbody>
            </table>
          `;
        })() : `
          <table class="data-table w-full text-left text-sm">
            <thead>
              <tr class="text-[#475569] border-b border-black/[0.1]">
                <th class="py-3 px-4 font-semibold">Order ID</th>
                <th class="py-3 px-4 font-semibold">Time</th>
                <th class="py-3 px-4 font-semibold">Mode</th>
                <th class="py-3 px-4 font-semibold">Client / Staff</th>
                <th class="py-3 px-4 font-semibold">Items Consumed</th>
                <th class="py-3 px-4 font-semibold">Total</th>
                <th class="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/[0.1]">
              ${filteredOrders.length > 0 ? filteredOrders.map(o => {
                const time = new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isDirect = o.checkoutMode === 'DIRECT_PAYMENT';
                const isPatient = o.checkoutMode === 'PATIENT_ROOM_ORDER';
                const isVoided = o.status === 'VOIDED';

                let modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">Tab</span>';
                if (isDirect) {
                  modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Direct</span>';
                } else if (isPatient) {
                  modePill = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">Inpatient</span>';
                }

                let clientText = o.payerName || o.customerName || 'Walk-in Customer';
                if (isPatient) {
                  clientText = `Inpatient Order (${o.roomNumber}${o.patientId ? ` - PID: ${o.patientId}` : ''}${o.mealType ? ` - ${o.mealType}` : ''})`;
                } else if (o.employeeName) {
                  clientText = `${o.employeeName} <span class="text-xs font-mono font-normal text-slate-500">(${o.staffId})</span>`;
                } else if (o.payerName || o.customerName) {
                  clientText = `${o.payerName || o.customerName}`;
                }

                const itemsStr = Array.isArray(o.items) ? o.items.map(i => `${i.qty}x ${i.name || 'Item'}`).join(', ') : 'N/A';

                return `
                  <tr class="${isVoided ? 'opacity-60 bg-rose-50/40' : ''}">
                    <td>
                      <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold ${isVoided ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'}">${o.id} ${isVoided ? '(VOIDED)' : ''}</span>
                    </td>
                    <td class="text-xs text-slate-500 font-medium">${time}</td>
                    <td>${isVoided ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">🚫 Voided</span>' : modePill}</td>
                    <td><span class="text-sm font-semibold text-slate-800">${clientText}</span></td>
                    <td class="text-xs text-slate-600">${itemsStr}</td>
                    <td><span class="font-mono font-extrabold ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}">${formatMoney(o.total)}</span></td>
                    <td class="text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="reprintReceipt('${o.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer shadow-xs active:scale-95">📄 Receipt</button>
                        ${!isVoided ? `<button onclick="openVoidOrderModal('${o.id}')" title="Void / Refund Order" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 cursor-pointer transition-all active:scale-95">🔄 Void</button>` : ''}
                        <button onclick="deleteOrder('${o.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" class="py-8 text-center text-[#475569] italic">No transactions recorded for subfolder filter ${selectedSub.toUpperCase()} on ${selectedDate}.</td>
                </tr>
              `}
            </tbody>
          </table>
        `}
      </div>
    </div>

    <!-- HR Payroll & Statement Export Section -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
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

    <!-- Department Tab Ledger Summary -->
    <div class="bg-[#FFFFFF] border border-black/[0.1] rounded-2xl p-5 mt-6">
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
};
