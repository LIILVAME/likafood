const axios = require('axios');
const colors = require('util').inspect.colors;

// Base URL for the API
const BASE_URL = 'http://127.0.0.1:5001/api';

// Test phone number
const TEST_PHONE = '+33123456789';
const TEST_BUSINESS = 'Mon Restaurant Test';
const TEST_OWNER = 'Jean Dupont';

async function testCompleteAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow\n');
  
  try {
    // Step 1: Register a new user
    console.log('📝 Step 1: User Registration');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      phoneNumber: TEST_PHONE,
      businessName: TEST_BUSINESS,
      ownerName: TEST_OWNER
    });
    
    console.log('✅ Registration successful:');
    console.log('   User ID:', registerResponse.data.data.userId);
    console.log('   Phone:', registerResponse.data.data.phoneNumber);
    console.log('   Business:', registerResponse.data.data.businessName);
    console.log('');
    
    // Step 2: Extract OTP from server logs (in real app, user gets SMS)
    console.log('📱 Step 2: OTP Generation');
    console.log('   ⚠️  In production, OTP is sent via SMS');
    console.log('   ⚠️  For testing, check server console for OTP code');
    console.log('   ⚠️  Look for: "🔑 OTP Code: XXXXXX"');
    console.log('');
    
    // Step 3: Simulate OTP verification (user needs to provide actual OTP)
    console.log('🔐 Step 3: OTP Verification');
    console.log('   ⚠️  You need to manually enter the OTP from server logs');
    console.log('   ⚠️  Example: curl -X POST http://localhost:5001/api/auth/verify-otp \\');
    console.log('   ⚠️           -H "Content-Type: application/json" \\');
    console.log('   ⚠️           -d \'{\'phoneNumber\':\'+33123456789\',\'code\':\'XXXXXX\',\'type\':\'registration\'}\' ');
    console.log('');
    
    // Step 4: Test login flow
    console.log('🔄 Step 4: Login Flow (Request OTP)');
    const loginResponse = await axios.post(`${BASE_URL}/auth/request-otp`, {
      phoneNumber: TEST_PHONE
    });
    
    console.log('✅ Login OTP requested:');
    console.log('   Phone:', loginResponse.data.data.phoneNumber);
    console.log('   Requires Verification:', loginResponse.data.data.requiresVerification);
    console.log('');
    
    console.log('🔐 Step 5: Login OTP Verification');
    console.log('   ⚠️  Use the new OTP from server logs with type "login"');
    console.log('   ⚠️  Example: curl -X POST http://localhost:5001/api/auth/verify-otp \\');
    console.log('   ⚠️           -H "Content-Type: application/json" \\');
    console.log('   ⚠️           -d \'{\'phoneNumber\':\'+33123456789\',\'code\':\'XXXXXX\',\'type\':\'login\'}\' ');
    console.log('');
    
    console.log('🎉 Authentication flow test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   1. Registration creates user and sends OTP');
    console.log('   2. Verify registration OTP with type="registration"');
    console.log('   3. Request login OTP for existing users');
    console.log('   4. Verify login OTP with type="login"');
    console.log('   5. Successful verification returns JWT tokens');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCompleteAuthFlow();