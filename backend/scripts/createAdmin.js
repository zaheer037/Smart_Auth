const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-auth-hub');
    console.log('✅ Connected to MongoDB');

    // Create or update admin user
    const adminEmail = 'admin@example.com';
    
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update existing user to admin
      adminUser.role = 'admin';
      adminUser.verified = true;
      await adminUser.save();
      console.log('✅ Updated existing user to admin role');
    } else {
      // Create new admin user
      adminUser = new User({
        email: adminEmail,
        role: 'admin',
        verified: true
      });
      await adminUser.save();
      console.log('✅ Created new admin user');
    }

    console.log(`🔐 Admin user created/updated:`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);
    console.log('');
    console.log('🚀 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log('   Use OTP from backend console');
    console.log('   Then access: http://localhost:5173/admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdminUser();
