// Test script to verify frontend-backend connectivity
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/api';

async function testBackendConnection() {
  console.log('🔍 Testing backend connectivity...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test registration endpoint
    console.log('\n2. Testing registration endpoint...');
    const testUser = {
      phoneNumber: '+1234567899',
      businessName: 'Frontend Test Restaurant',
      ownerName: 'Frontend Test Owner',
      type: 'restaurant'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful:', {
      message: registerResponse.data.message,
      data: registerResponse.data
    });
    
    console.log('📧 OTP sent! Check the backend logs for the OTP code.');
    
    console.log('\n🎉 Frontend-Backend connectivity test PASSED!');
    console.log('\n📱 You can now test the authentication flow in the React app:');
    console.log('   1. Open http://localhost:3000');
    console.log('   2. Try registering with a new phone number');
    console.log('   3. Use OTP: 123456 (mock OTP for testing)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

testBackendConnection();