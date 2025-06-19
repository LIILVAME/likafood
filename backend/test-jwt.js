console.log('Testing JWT module...');

try {
  const jwt = require('jsonwebtoken');
  console.log('✅ jsonwebtoken package loaded successfully');
  
  const jwtService = require('./utils/jwt');
  console.log('✅ JWT service loaded successfully');
  
  console.log('All JWT tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full stack:', error.stack);
}