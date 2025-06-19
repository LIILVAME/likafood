const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Otp = require('./models/Otp');

async function checkDatabase() {
  try {
    console.log('🔍 Checking MongoDB Database Contents\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('');
    
    // Check Users collection
    console.log('👥 USERS COLLECTION:');
    console.log('==================');
    const users = await User.find({}).sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user._id}`);
        console.log(`   📞 Phone: ${user.phoneNumber}`);
        console.log(`   🏪 Business: ${user.businessName}`);
        console.log(`   👤 Owner: ${user.ownerName}`);
        console.log(`   ✅ Verified: ${user.isPhoneVerified}`);
        console.log(`   📅 Created: ${user.createdAt}`);
      });
    }
    
    console.log('\n');
    
    // Check OTPs collection
    console.log('🔐 OTP COLLECTION:');
    console.log('================');
    const otps = await Otp.find({}).sort({ createdAt: -1 }).limit(10);
    
    if (otps.length === 0) {
      console.log('❌ No OTPs found in database');
    } else {
      console.log(`✅ Found ${otps.length} recent OTP(s):`);
      otps.forEach((otp, index) => {
        console.log(`\n${index + 1}. OTP ID: ${otp._id}`);
        console.log(`   📞 Phone: ${otp.phoneNumber}`);
        console.log(`   🔑 Code: ${otp.code}`);
        console.log(`   📝 Type: ${otp.type}`);
        console.log(`   ✅ Used: ${otp.isUsed}`);
        console.log(`   ⏰ Expires: ${otp.expiresAt}`);
        console.log(`   📅 Created: ${otp.createdAt}`);
      });
    }
    
    console.log('\n');
    
    // Check collections in database
    console.log('📋 ALL COLLECTIONS:');
    console.log('==================');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ No collections found');
    } else {
      console.log(`✅ Found ${collections.length} collection(s):`);
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`   📁 ${collection.name}: ${count} documents`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`🔐 OTPs: ${otps.length}`);
    console.log(`📁 Collections: ${collections.length}`);
    
    if (users.length === 0) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log('   No users found in database!');
      console.log('   This means registration is not saving data properly.');
      console.log('\n🔧 POSSIBLE CAUSES:');
      console.log('   1. Database connection issues');
      console.log('   2. Model validation errors');
      console.log('   3. Transaction rollbacks');
      console.log('   4. Wrong database/collection names');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkDatabase();