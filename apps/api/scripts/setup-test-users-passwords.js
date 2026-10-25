/**
 * Setup Test Users Passwords
 * This script ensures all test users have properly hashed passwords for authentication
 * Run: node scripts/setup-test-users-passwords.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const testUsers = [
  {
    email: 'ahmad@pharmacy.com',
    password: 'Ahmad@123',
    role: 'pharmacy',
    name: 'Ahmad'
  },
  {
    email: 'moiz@pharmacy.com',
    password: 'Moiz@123',
    role: 'pharmacy',
    name: 'Moiz'
  },
  {
    email: 'orangzaib@lab.com',
    password: 'Orangzaib@123',
    role: 'lab',
    name: 'Orangzaib'
  },
  {
    email: 'huzaifa@lab.com',
    password: 'Huzaifa@123',
    role: 'lab',
    name: 'Huzaifa'
  }
];

async function setupPasswords() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinixsol');
    console.log('✅ Connected to MongoDB\n');

    console.log('🔐 Setting up test user passwords...\n');

    for (const userData of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = await User.findOneAndUpdate(
          { email: userData.email },
          { 
            password: hashedPassword,
            fullName: userData.name,
            isVerified: true,
            isActive: true
          },
          { new: true }
        );

        if (user) {
          console.log(`✅ ${userData.email}`);
          console.log(`   Role: ${userData.role}`);
          console.log(`   Name: ${userData.name}`);
          console.log(`   Password: ${userData.password}`);
          console.log(`   Status: Active & Verified\n`);
        } else {
          console.log(`⚠️  ${userData.email} - User not found in database\n`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${userData.email}:`, error.message, '\n');
      }
    }

    console.log('\n🎯 Test Users Setup Complete!');
    console.log('\n📋 Login Credentials Summary:\n');
    console.log('PHARMACIES:');
    console.log('  Ahmad: ahmad@pharmacy.com / Ahmad@123');
    console.log('  Moiz:  moiz@pharmacy.com / Moiz@123');
    console.log('\nLABORATORIES:');
    console.log('  Orangzaib: orangzaib@lab.com / Orangzaib@123');
    console.log('  Huzaifa:   huzaifa@lab.com / Huzaifa@123');
    console.log('\n✨ All tests users are ready to login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test users:', error.message);
    process.exit(1);
  }
}

setupPasswords();
