/* ==========================================================================
   DMCH Resto POS & MIS — System Configuration & Default Master Data
   ========================================================================== */

const APP_LOGO_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const DEFAULT_CATEGORIES = [
  { id: "cat-all", name: "All Items", icon: "🍽️" },
  { id: "cat-coffee", name: "Hot & Cold Coffee", icon: "☕" },
  { id: "cat-beverage", name: "Fresh Juices & Drinks", icon: "🥤" },
  { id: "cat-[#F59E0B]", name: "Hospital Hot Meals", icon: "🍲" },
  { id: "cat-pastry", name: "Breakfast & Pastries", icon: "🥐" }
];

const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Espresso Single", categoryId: "cat-coffee", price: 2000, icon: "☕", stock: 150 },
  { id: "p2", name: "Café Latte", categoryId: "cat-coffee", price: 3000, icon: "🥛", stock: 120 },
  { id: "p3", name: "Cappuccino", categoryId: "cat-coffee", price: 3000, icon: "☕", stock: 100 },
  { id: "p4", name: "African Tea (Pot)", categoryId: "cat-coffee", price: 2500, icon: "🫖", stock: 80 },
  { id: "p5", name: "Fresh Passion Juice", categoryId: "cat-beverage", price: 2500, icon: "🥤", stock: 60 },
  { id: "p6", name: "Mineral Water 500ml", categoryId: "cat-beverage", price: 1000, icon: "💧", stock: 300 },
  { id: "p7", name: "Beef Stroganoff & Rice", categoryId: "cat-[#F59E0B]", price: 6500, icon: "🥩", stock: 40 },
  { id: "p8", name: "Grilled Chicken Breast", categoryId: "cat-[#F59E0B]", price: 7000, icon: "🍗", stock: 35 },
  { id: "p9", name: "Hospital Special Diet Soup", categoryId: "cat-[#F59E0B]", price: 4000, icon: "🥣", stock: 50 },
  { id: "p10", name: "Butter Croissant", categoryId: "cat-pastry", price: 2000, icon: "🥐", stock: 45 },
  { id: "p11", name: "Omelette & Toast", categoryId: "cat-pastry", price: 3500, icon: "🍳", stock: 50 }
];

const DEFAULT_DEPARTMENTS = [
  { id: "dept-1", code: "NURS", name: "NURSING & PATIENT CARE", monthlyCreditLimit: 150000 },
  { id: "dept-2", code: "SURG", name: "SURGERY & OPERATING THEATRE", monthlyCreditLimit: 200000 },
  { id: "dept-3", code: "LAB", name: "LABORATORY & PATHOLOGY", monthlyCreditLimit: 120000 },
  { id: "dept-4", code: "RAD", name: "RADIOLOGY & IMAGING", monthlyCreditLimit: 120000 },
  { id: "dept-5", code: "PHARM", name: "PHARMACY SERVICES", monthlyCreditLimit: 100000 },
  { id: "dept-6", code: "ADMIN", name: "EXECUTIVE & ADMINISTRATION", monthlyCreditLimit: 250000 }
];

const DEFAULT_ROOMS = [
  { id: "room-101", roomNumber: "Room 101", tier: "Normal Room", status: "Occupied" },
  { id: "room-102", roomNumber: "Room 102", tier: "Normal Room", status: "Available" },
  { id: "room-201", roomNumber: "Room 201", tier: "Private Room", status: "Occupied" },
  { id: "room-202", roomNumber: "Room 202", tier: "Private Room", status: "Available" },
  { id: "room-301", roomNumber: "VIP 301", tier: "VIP Room", status: "Occupied" },
  { id: "room-401", roomNumber: "VVIP Suite 401", tier: "VVIP Room", status: "Occupied" }
];

const DEFAULT_USERS = [
  { id: "u-admin", username: "admin", passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "admin", name: "System Administrator" },
  { id: "u-cashier", username: "cashier", passwordHash: "9049a04a3901b0b7aa8df6c2763f9157a31b4ab4b6008b8b0932267f8976451e", role: "cashier", name: "Main Cashier" }
];
