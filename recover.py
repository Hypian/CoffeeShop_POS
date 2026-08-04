import os

js_path = 'C:/Users/kagin/OneDrive/Desktop/My Projects/CoffeeShop_POS/app.js'
with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_save_data = """window.saveData = function() {
  if (!state.lastActiveDate) state.lastActiveDate = new Date().toLocaleDateString();
  localStorage.setItem('posData', JSON.stringify({
    categories: state.categories,
    products: state.products,
    departments: state.departments,
    employees: state.employees,
    orders: state.orders,
    auditLogs: state.auditLogs,
    archives: state.archives,
    lastActiveDate: state.lastActiveDate
  }));
}"""

X = new_save_data + '\n\n'

parts = content.split(X)
# The original characters are the items in the split array (which should be mostly 1-character strings)
original_chars = [p for p in parts if len(p) == 1 or p == ""]
# Wait, if p is "", it means there was nothing between the two Xs, which happens at the start and end.
# Actually, let's just do content.replace(X, '')
recovered = content.replace(X, '')

with open('C:/Users/kagin/OneDrive/Desktop/My Projects/CoffeeShop_POS/app_recovered.js', 'w', encoding='utf-8') as f:
    f.write(recovered)
