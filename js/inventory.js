/* ==========================================================================
   DMCH Resto POS & MIS — Inventory & Product Management
   ========================================================================== */

function renderProductManagement() {
  const tbody = document.getElementById('productsTableTbody');
  if (!tbody) return;
  tbody.innerHTML = state.products.map(p => {
    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">${p.icon}</span>
            <span class="font-bold text-slate-900">${p.name}</span>
          </div>
        </td>
        <td>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">${getCategoryName(p.categoryId)}</span>
        </td>
        <td>
          <span class="font-mono font-extrabold text-slate-900">${formatMoney(p.price)}</span>
        </td>
        <td class="text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            <button onclick="editProduct('${p.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 cursor-pointer transition-all active:scale-95">✏️ Edit</button>
            <button onclick="deleteProduct('${p.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddProductModal = function() {
  state.editingProductId = null;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = '➕ Add Product';
  
  const ids = ['addProdName', 'addProdPrice', 'addProdIconPreview'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT') el.value = '';
      else if (id === 'addProdIconPreview') el.textContent = '📦';
    }
  });
  const cat = document.getElementById('addProdCategory');
  if (cat) {
    cat.innerHTML = state.categories.filter(c => c.id !== 'cat-all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  document.getElementById('addProdIcon').value = '📦';
  window.openModal('modalAddProduct');
};

window.editProduct = function(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  
  state.editingProductId = id;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = '✏️ Edit Product';
  
  const cat = document.getElementById('addProdCategory');
  if (cat) {
    cat.innerHTML = state.categories.filter(c => c.id !== 'cat-all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  document.getElementById('addProdName').value = product.name;
  document.getElementById('addProdCategory').value = product.categoryId;
  document.getElementById('addProdPrice').value = product.price;
  document.getElementById('addProdIconPreview').textContent = product.icon;
  document.getElementById('addProdIcon').value = product.icon;
  
  window.openModal('modalAddProduct');
};

window.deleteProduct = function(id) {
  const currentRole = state.currentSession ? state.currentSession.role : (state.currentUser ? state.currentUser.role : 'cashier');
  if (currentRole !== 'admin') {
    window.showToast('🔒 Row Level Security: Only Administrator can delete inventory products.', 'error');
    return;
  }

  const product = state.products.find(p => p.id === id);
  const prodName = product ? product.name : 'this product';

  showConfirmModal({
    title: "📦 Delete Product",
    message: `Are you sure you want to delete product "${prodName}" from menu inventory?`,
    confirmText: "Yes, Delete Product",
    onConfirm: () => {
      if (product) addAuditLog("Product Deleted", `Deleted product ${product.name}`);
      state.products = state.products.filter(p => p.id !== id);
      saveData();
      window.showToast(`Product "${prodName}" deleted`, 'success');
      renderAllViews();
    }
  });
};

window.selectProductIcon = function(emoji) {
  document.getElementById('addProdIcon').value = emoji;
  document.getElementById('addProdIconPreview').textContent = emoji;
};

window.saveNewProduct = function() {
  const name = document.getElementById('addProdName').value.trim();
  const catId = document.getElementById('addProdCategory').value;
  const price = parseFloat(document.getElementById('addProdPrice').value) || 0;
  const icon = document.getElementById('addProdIcon').value || '📦';
  
  if (!name) { window.showToast('Product name is required', 'error'); return; }
  
  if (state.editingProductId) {
    const product = state.products.find(p => p.id === state.editingProductId);
    if (product) {
      product.name = name;
      product.categoryId = catId;
      product.price = price;
      product.icon = icon;
    }
    state.editingProductId = null;
    addAuditLog("Product Edited", `Updated details for ${name}`);
    window.showToast('Product updated successfully', 'success');
  } else {
    state.products.push({
      id: generateId('p'),
      name,
      categoryId: catId,
      price,
      icon
    });
    addAuditLog("Product Added", `Added new product ${name}`);
    window.showToast('Product added successfully', 'success');
  }
  
  saveData();
  window.closeModal('modalAddProduct');
  renderAllViews();
};
