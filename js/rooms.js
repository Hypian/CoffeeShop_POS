/* ==========================================================================
   DMCH Resto POS & MIS — Hospital Room Directory Management
   ========================================================================== */

window.populateRoomDropdown = function(selectedRoomName = '') {
  const roomSelect = document.getElementById('patientRoomNumberSelect');
  if (!roomSelect) return;

  if (!state.rooms) {
    state.rooms = [];
  }

  const tiers = ['Normal Room', 'Private Room', 'VIP Room', 'VVIP Room'];
  let html = `<option value="">-- Select Hospital Room --</option>`;

  tiers.forEach(tier => {
    const roomsInTier = state.rooms.filter(r => r.tier === tier);
    if (roomsInTier.length > 0) {
      const tierIcon = tier === 'VVIP Room' ? '🌟' : tier === 'VIP Room' ? '👑' : tier === 'Private Room' ? '🔒' : '🏨';
      html += `<optgroup label="${tierIcon} ${tier}">`;
      roomsInTier.forEach(r => {
        const isSelected = (r.roomNumber === selectedRoomName || r.id === selectedRoomName) ? 'selected' : '';
        html += `<option value="${r.roomNumber}" ${isSelected}>${r.roomNumber} (${r.tier})</option>`;
      });
      html += `</optgroup>`;
    }
  });

  roomSelect.innerHTML = html;
};

window.openAddRoomModal = function(editId = null) {
  const title = document.getElementById('modalAddRoomTitle');
  const idInput = document.getElementById('editRoomId');
  const nameInput = document.getElementById('addRoomNumber');
  const tierSelect = document.getElementById('addRoomTier');

  if (editId) {
    const r = (state.rooms || []).find(x => x && (x.id === editId || x.roomNumber === editId));
    if (!r) return;
    if (title) title.textContent = '✏️ Edit Hospital Room';
    if (idInput) idInput.value = r.id || r.roomNumber;
    if (nameInput) nameInput.value = r.roomNumber;
    if (tierSelect) tierSelect.value = r.tier;
  } else {
    if (title) title.textContent = '🏨 Add Hospital Room';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (tierSelect) tierSelect.value = 'Normal Room';
  }

  window.openModal('modalAddRoom');
};

window.saveRoom = function() {
  const id = document.getElementById('editRoomId').value;
  const name = (document.getElementById('addRoomNumber').value || '').trim();
  const tier = document.getElementById('addRoomTier').value;

  if (!name) {
    window.showToast('Please enter a room number or name (e.g. Room 105).', 'error');
    return;
  }

  if (!state.rooms) state.rooms = [];

  if (id) {
    const room = state.rooms.find(x => x && (x.id === id || x.roomNumber === id));
    if (room) {
      room.roomNumber = name;
      room.tier = tier;
      addAuditLog("Room Updated", `Updated room ${name} (${tier})`);
    } else {
      state.rooms.push({ id: generateId('ROOM'), roomNumber: name, tier: tier });
      addAuditLog("Room Added", `Added room ${name} (${tier})`);
    }
  } else {
    const newRoom = {
      id: generateId('ROOM'),
      roomNumber: name,
      tier: tier
    };
    state.rooms.push(newRoom);
    addAuditLog("Room Added", `Added room ${name} (${tier})`);
  }

  saveData();
  window.closeModal('modalAddRoom');
  window.populateRoomDropdown(name);
  window.showToast(`Hospital room "${name}" (${tier}) saved!`, 'success');
  if (window.renderAllViews) window.renderAllViews();
};

window.deleteRoom = function(roomId) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'admin');
  const roleLower = (currentRole || '').toLowerCase();
  
  if (roleLower !== 'admin' && roleLower !== 'manager' && roleLower !== 'cashier') {
    window.showToast('🔒 Row Level Security: Administrator or Manager authorization required to delete room listings.', 'error');
    return;
  }

  if (!state.rooms) state.rooms = [];

  const room = state.rooms.find(r => r && (r.id === roomId || r.roomNumber === roomId || String(r.id) === String(roomId) || String(r.roomNumber) === String(roomId)));
  if (!room) {
    window.showToast('Hospital room listing not found.', 'error');
    return;
  }

  const targetId = room.id || roomId;
  const targetName = room.roomNumber || roomId;

  window.showConfirmModal({
    title: "🗑️ Delete Hospital Room",
    message: `Are you sure you want to delete room "${targetName}" (${room.tier || 'Room'})?`,
    confirmText: "Yes, Delete Room",
    onConfirm: () => {
      state.rooms = state.rooms.filter(r => r.id !== targetId && r.roomNumber !== targetName);
      if (window.cloudDeleteRoom) window.cloudDeleteRoom(targetId);
      addAuditLog("Room Deleted", `Deleted room ${targetName}`);
      saveData();
      window.populateRoomDropdown();
      window.showToast(`Room "${targetName}" deleted successfully.`, 'success');
      if (window.renderAllViews) window.renderAllViews();
    }
  });
};

window.clearAllRooms = function() {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'admin');
  const roleLower = (currentRole || '').toLowerCase();
  
  if (roleLower !== 'admin' && roleLower !== 'manager' && roleLower !== 'cashier') {
    window.showToast('🔒 Row Level Security: Administrator or Manager authorization required to clear room listings.', 'error');
    return;
  }

  window.showConfirmModal({
    title: "🧹 Clear All Hospital Rooms",
    message: "Are you sure you want to delete ALL hospital room listings?",
    confirmText: "Yes, Clear All Rooms",
    onConfirm: () => {
      state.rooms = [];
      if (window.cloudClearAllRooms) window.cloudClearAllRooms();
      addAuditLog("All Rooms Cleared", "Cleared all room listings");
      saveData();
      window.populateRoomDropdown();
      window.showToast("All room listings deleted successfully.", "success");
      if (window.renderAllViews) window.renderAllViews();
    }
  });
};
