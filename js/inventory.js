/* ==========================================================================
   DMCH Resto POS & MIS — Inventory & Product Management
   ========================================================================== */

window.renderProductManagement = function() {
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
            <button onclick="editProduct('${p.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 cursor-pointer transition-all active:scale-95">Edit</button>
            <button onclick="deleteProduct('${p.id}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 cursor-pointer transition-all active:scale-95">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.populateCategoryDropdown = function(selectedCatId = '') {
  const cat = document.getElementById('addProdCategory');
  if (!cat) return;

  const cats = (state.categories || []).filter(c => c && c.id !== 'cat-all');
  if (cats.length === 0) {
    const fallbacks = [
      { id: 'cat-coffee', name: 'COFFEE & HOT BEVERAGES' },
      { id: 'cat-beverage', name: 'FRESH JUICES & DRINKS' },
      { id: 'cat-meal', name: 'HOSPITAL HOT MEALS' },
      { id: 'cat-pastry', name: 'BREAKFAST & PASTRIES' }
    ];
    cat.innerHTML = fallbacks.map(c => `<option value="${c.id}" ${c.id === selectedCatId ? 'selected' : ''}>${c.name}</option>`).join('');
    return;
  }

  cat.innerHTML = cats.map(c => {
    const isSel = (c.id === selectedCatId || c.name === selectedCatId) ? 'selected' : '';
    return `<option value="${c.id}" ${isSel}>${c.name.toUpperCase()}</option>`;
  }).join('');

  if (selectedCatId) {
    const match = cats.find(c => c.id === selectedCatId || c.name === selectedCatId);
    if (match) cat.value = match.id;
  }
};

window.openAddProductModal = function() {
  state.editingProductId = null;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = 'Add Product';
  
  const ids = ['addProdName', 'addProdPrice', 'addProdIconPreview'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT') el.value = '';
      else if (id === 'addProdIconPreview') el.innerHTML = "<i class=\'bx bx-coffee\'></i>";
    }
  });
  window.populateCategoryDropdown();
  document.getElementById('addProdIcon').value = "<i class=\'bx bx-coffee\'></i>";
  window.openModal('modalAddProduct');
};

window.editProduct = function(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  
  state.editingProductId = id;
  const title = document.getElementById('modalAddProductTitle');
  if (title) title.textContent = 'Edit Product';
  
  window.populateCategoryDropdown(product.categoryId);
  
  document.getElementById('addProdName').value = product.name;
  document.getElementById('addProdPrice').value = product.price;
  document.getElementById('addProdIconPreview').innerHTML = product.icon;
  document.getElementById('addProdIcon').value = product.icon;
  
  window.openModal('modalAddProduct');
};

window.deleteProduct = function(id) {
  const product = (state.products || []).find(p => p && (p.id === id || String(p.id) === String(id)));
  const prodName = product ? product.name : 'this product';

  window.showConfirmModal({
    title: "Delete Product",
    message: `Are you sure you want to permanently delete "${prodName}" from menu inventory?`,
    confirmText: "Yes, Delete Product",
    icon: "",
    badgeText: "Inventory Removal",
    isDanger: true,
    onConfirm: async () => {
      try {
        if (window.cloudDeleteProduct) {
          await window.cloudDeleteProduct(id);
        }
        if (product) addAuditLog("Product Deleted", `Deleted product ${product.name}`);
        state.products = (state.products || []).filter(p => p && String(p.id) !== String(id));
        if (window.renderAllViews) window.renderAllViews();
        saveData({ sync: false });
        window.showToast(`Product "${prodName}" was successfully deleted.`, 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        window.showToast('Product could not be deleted. Please try again.', 'error');
      }
    }
  });
};

window.selectProductIcon = function(emoji) {
  document.getElementById('addProdIcon').value = emoji;
  document.getElementById('addProdIconPreview').innerHTML = emoji;
};

window.saveNewProduct = async function() {
  const name = (document.getElementById('addProdName').value || '').trim().toUpperCase();
  const catId = document.getElementById('addProdCategory').value;
  const price = parseFloat(document.getElementById('addProdPrice').value) || 0;
  const icon = document.getElementById('addProdIcon').value || "<i class=\'bx bx-box\'></i>";
  
  if (!name) { window.showToast('Product name is required', 'error'); return; }
  
  let product;
  let originalProduct;
  const isEditing = Boolean(state.editingProductId);
  if (state.editingProductId) {
    product = state.products.find(p => p.id === state.editingProductId);
    if (product) {
      originalProduct = { ...product };
      product.name = name;
      product.categoryId = catId;
      product.price = price;
      product.icon = icon;
    }
    state.editingProductId = null;
    addAuditLog("Product Edited", `Updated details for ${name}`);
  } else {
    product = {
      id: generateId('p'),
      name,
      categoryId: catId,
      price,
      icon
    };
    state.products.push(product);
    addAuditLog("Product Added", `Added new product ${name}`);
  }

  try {
    if (window.cloudSaveProduct) {
      await window.cloudSaveProduct(product);
    } else {
      await window.syncStateToCloud();
    }
    saveData({ sync: false });
    window.closeModal('modalAddProduct');
    renderAllViews();
    window.showToast(isEditing ? 'Product updated successfully' : 'Product added successfully', 'success');
  } catch (error) {
    if (originalProduct) {
      Object.assign(product, originalProduct);
    } else {
      state.products = state.products.filter(item => item.id !== product.id);
    }
    renderAllViews();
    console.error('Error saving product:', error);
    window.showToast('Product could not be saved. Please try again.', 'error');
  }
};
