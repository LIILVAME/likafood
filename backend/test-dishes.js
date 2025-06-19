// Test script to debug dishes route
const mongoose = require('mongoose');

try {
  console.log('Testing dishes route...');
  const dishesRoute = require('./routes/dishes');
  console.log('✅ Dishes route loaded successfully');
  console.log('All tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full stack:', error.stack);
  console.error('Stack:', error.stack);
}

process.exit(0);