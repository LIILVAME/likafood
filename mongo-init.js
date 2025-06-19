// MongoDB initialization script
db = db.getSiblingDB('likafood');

// Create collections
db.createCollection('users');
db.createCollection('dishes');
db.createCollection('orders');
db.createCollection('expenses');

// Create indexes for better performance
db.users.createIndex({ "phone": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { sparse: true });
db.dishes.createIndex({ "vendorId": 1 });
db.dishes.createIndex({ "category": 1 });
db.orders.createIndex({ "vendorId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.expenses.createIndex({ "vendorId": 1 });
db.expenses.createIndex({ "category": 1 });
db.expenses.createIndex({ "date": -1 });

print('Database initialized successfully!');