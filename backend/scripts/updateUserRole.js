const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserRole() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const email = args[0];
    const role = args[1] || 'admin';

    if (!email) {
      console.log('❌ Usage: node updateUserRole.js <email> [role]');
      console.log('   Example: node updateUserRole.js admin@example.com admin');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-auth-hub');
    console.log('✅ Connected to MongoDB');

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: role },
      { new: true }
    );

    if (user) {
      console.log(`✅ Updated user role successfully:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      
      if (role === 'admin') {
        console.log('');
        console.log('🚀 Admin access granted!');
        console.log('   Login with this email and access: http://localhost:5173/admin');
      }
    } else {
      console.log(`❌ User with email "${email}" not found`);
      console.log('   Make sure the user has logged in at least once');
    }

  } catch (error) {
    console.error('❌ Error updating user role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

updateUserRole();
