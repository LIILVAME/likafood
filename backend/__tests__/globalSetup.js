const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
  // Create MongoDB Memory Server
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018,
      dbName: 'likafood-test'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  
  // Store the MongoDB URI and server instance for global teardown
  global.__MONGOINSTANCE = mongoServer;
  global.__MONGO_URI__ = mongoUri;
  
  // Set environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-for-testing-purposes-only';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.PORT = '5003';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.OTP_EXPIRE_MINUTES = '5';
  process.env.OTP_LENGTH = '6';
  
  // Disable external services in test mode
  process.env.TWILIO_ACCOUNT_SID = 'test';
  process.env.TWILIO_AUTH_TOKEN = 'test';
  process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  
  console.log('🧪 Global test setup completed');
  console.log(`📊 MongoDB Test URI: ${mongoUri}`);
};