/**
 * Script to retrieve pharmacy and lab user credentials from the database
 * Run: node scripts/get-credentials.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Pharmacy = require('../src/models/Pharmacy');
const Lab = require('../src/models/Lab');

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all pharmacy users
    console.log('\n' + '='.repeat(70));
    console.log('🏪 PHARMACY USER CREDENTIALS');
    console.log('='.repeat(70));

    const pharmacyUsers = await User.find({ role: 'pharmacy' }).select('email fullName role _id');
    
    if (pharmacyUsers.length === 0) {
      console.log('❌ No pharmacy users found in the database');
    } else {
      for (const user of pharmacyUsers) {
        const pharmacy = await Pharmacy.findOne({ userId: user._id });
        console.log(`\nEmail: ${user.email}`);
        console.log(`Full Name: ${user.fullName}`);
        console.log(`Pharmacy Name: ${pharmacy?.pharmacyName || 'N/A'}`);
        console.log(`Status: ${pharmacy?.isVerified ? '✅ Verified' : '❌ Not Verified'}`);
        console.log(`Password: [Set during registration - Use "Reset Password" if forgotten]`);
        console.log('-'.repeat(70));
      }
    }

    // Get all lab users
    console.log('\n' + '='.repeat(70));
    console.log('🔬 LABORATORY USER CREDENTIALS');
    console.log('='.repeat(70));

    const labUsers = await User.find({ role: 'lab' }).select('email fullName role _id');
    
    if (labUsers.length === 0) {
      console.log('❌ No lab users found in the database');
    } else {
      for (const user of labUsers) {
        const lab = await Lab.findOne({ userId: user._id });
        console.log(`\nEmail: ${user.email}`);
        console.log(`Full Name: ${user.fullName}`);
        console.log(`Lab Name: ${lab?.labName || 'N/A'}`);
        console.log(`Status: ${lab?.isVerified ? '✅ Verified' : '❌ Not Verified'}`);
        console.log(`Password: [Set during registration - Use "Reset Password" if forgotten]`);
        console.log('-'.repeat(70));
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('ℹ️  IMPORTANT NOTES');
    console.log('='.repeat(70));
    console.log(`
1. Passwords are stored as bcrypt hashes - they cannot be retrieved
2. To reset a password, use the "Forgot Password" feature on the login page
3. Or generate a test password and update the user in the database

To create a test pharmacy or lab user with known credentials, 
run: node scripts/create-test-users.js
    `);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();
