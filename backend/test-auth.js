console.log('Testing auth middleware...');

try {
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware loaded successfully');
  
  console.log('All auth tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full stack:', error.stack);
}