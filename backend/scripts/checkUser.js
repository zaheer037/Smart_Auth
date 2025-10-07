const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser() {
  try {
    const email = process.argv[2] || 'admin@example.com';
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-auth-hub');
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });

    if (user) {
      console.log(`\n👤 User found:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.verified}`);
      console.log(`   Login Count: ${user.loginCount}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Created: ${user.createdAt}`);
    } else {
      console.log(`❌ User with email "${email}" not found`);
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkUser();
