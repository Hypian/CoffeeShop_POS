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

window.saveRoom = async function() {
  const id = document.getElementById('editRoomId').value;
  const name = (document.getElementById('addRoomNumber').value || '').trim().toUpperCase();
  const tier = document.getElementById('addRoomTier').value;

  if (!name) {
    window.showToast('Please enter a room number or name (e.g. Room 105).', 'error');
    return;
  }

  if (!state.rooms) state.rooms = [];

  const roomId = id || generateId('ROOM');
  const roomObj = { id: roomId, roomNumber: name, tier: tier };

  try {
    if (window.cloudSaveRoom) {
      await window.cloudSaveRoom(roomObj);
    }

    const existingIndex = state.rooms.findIndex(x => x && (x.id === roomId || x.roomNumber === name));
    if (existingIndex >= 0) {
      state.rooms[existingIndex] = roomObj;
      addAuditLog("Room Updated", `Updated room ${name} (${tier})`);
    } else {
      state.rooms.push(roomObj);
      addAuditLog("Room Added", `Added room ${name} (${tier})`);
    }

    window.closeModal('modalAddRoom');
    window.populateRoomDropdown(name);
    window.showToast(`Hospital room "${name}" (${tier}) saved to cloud!`, 'success');
    if (window.renderAllViews) window.renderAllViews();
  } catch (err) {
    console.error('Error saving room to cloud:', err);
    window.showToast('Failed to save room to cloud database. Please try again.', 'error');
  }
};

window.deleteRoom = function(roomId) {
  if (!state.rooms) state.rooms = [];

  const room = state.rooms.find(r => r && (r.id === roomId || r.roomNumber === roomId || String(r.id) === String(roomId) || String(r.roomNumber) === String(roomId)));
  if (!room) {
    window.showToast('Hospital room listing not found.', 'error');
    return;
  }

  const targetId = room.id || roomId;
  const targetName = room.roomNumber || roomId;

  window.showConfirmModal({
    title: "<i class='bx bx-trash'></i> Delete Hospital Room",
    message: `Are you sure you want to delete room "${targetName}" (${room.tier || 'Room'})?`,
    confirmText: "Yes, Delete Room",
    icon: "🏥",
    badgeText: "Room Directory",
    isDanger: true,
    onConfirm: async () => {
      try {
        if (window.cloudDeleteRoom) {
          await window.cloudDeleteRoom(targetId);
        }

        state.rooms = state.rooms.filter(r => {
          if (!r) return false;
          const matchId = (r.id && String(r.id) === String(targetId)) || (roomId && String(r.id) === String(roomId));
          const matchNum = (r.roomNumber && String(r.roomNumber) === String(targetName)) || (roomId && String(r.roomNumber) === String(roomId));
          return !matchId && !matchNum;
        });

        addAuditLog("Room Deleted", `Deleted room ${targetName}`);
        if (window.populateRoomDropdown) window.populateRoomDropdown();
        if (window.renderAllViews) window.renderAllViews();
        window.showToast(`Hospital room "${targetName}" was permanently deleted.`, 'success');
      } catch (err) {
        console.error('Error deleting room:', err);
        window.showToast('Could not delete room from cloud database. Please try again.', 'error');
      }
    }
  });
};

window.clearAllRooms = function() {
  window.showConfirmModal({
    title: "🧹 Clear All Hospital Rooms",
    message: "Are you sure you want to delete ALL hospital room listings?",
    confirmText: "Yes, Clear All Rooms",
    icon: "🧹",
    badgeText: "Bulk Directory Reset",
    isDanger: true,
    onConfirm: async () => {
      state.rooms = [];
      addAuditLog("All Rooms Cleared", "Cleared all room listings");
      if (window.populateRoomDropdown) window.populateRoomDropdown();
      if (window.renderAllViews) window.renderAllViews();
      window.showToast("All room listings were successfully cleared.", 'success');

      if (window.cloudClearAllRooms) {
        await window.cloudClearAllRooms();
      }
      saveData();
    }
  });
};
