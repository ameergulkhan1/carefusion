/**
 * Script to create test pharmacy and lab users with known credentials
 * Run: node scripts/create-test-users.js
 */

const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Pharmacy = require('../src/models/Pharmacy');
const Lab = require('../src/models/Lab');

// Test credentials (you can change these)
const TEST_PHARMACY = [
  {
    email: 'ahmad@pharmacy.com',
    password: 'Ahmad@123',
    fullName: 'Ahmad Pharmacy Manager',
    phone: '+92 300 1111111',
    pharmacyName: 'Ahmad Medical Store',
    location: 'Karachi',
    licenseNumber: 'PKR-PHARM-001'
  },
  {
    email: 'moiz@pharmacy.com',
    password: 'Moiz@123',
    fullName: 'Moiz Pharmacy Manager',
    phone: '+92 300 2222222',
    pharmacyName: 'Moiz Medicine Center',
    location: 'Lahore',
    licenseNumber: 'PKR-PHARM-002'
  }
];

const TEST_LABS = [
  {
    email: 'orangzaib@lab.com',
    password: 'Orangzaib@123',
    fullName: 'Orangzaib Lab Manager',
    phone: '+92 300 3333333',
    labName: 'Orangzaib Diagnostic Lab',
    location: 'Islamabad',
    licenseNumber: 'PKR-LAB-001'
  },
  {
    email: 'huzaifa@lab.com',
    password: 'Huzaifa@123',
    fullName: 'Huzaifa Lab Manager',
    phone: '+92 300 4444444',
    labName: 'Huzaifa Medical Laboratory',
    location: 'Rawalpindi',
    licenseNumber: 'PKR-LAB-002'
  }
];

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create pharmacy users
    console.log('='.repeat(70));
    console.log('🏪 CREATING PHARMACY TEST USERS');
    console.log('='.repeat(70));

    for (const pharmacy of TEST_PHARMACY) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: pharmacy.email });
        if (existingUser) {
          console.log(`⚠️  User ${pharmacy.email} already exists - skipping`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(pharmacy.password, 10);

        // Create user
        const user = new User({
          email: pharmacy.email,
          password: hashedPassword,
          fullName: pharmacy.fullName,
          phone: pharmacy.phone,
          role: 'pharmacy',
          isVerified: true,
          isActive: true
        });

        await user.save();

        // Create pharmacy profile
        const pharmacyProfile = new Pharmacy({
          userId: user._id,
          user: user._id,
          pharmacyName: pharmacy.pharmacyName,
          licenseNumber: pharmacy.licenseNumber,
          location: pharmacy.location,
          phone: pharmacy.phone,
          email: pharmacy.email,
          isVerified: true,
          operatingHours: {
            monday: { open: '08:00', close: '22:00' },
            tuesday: { open: '08:00', close: '22:00' },
            wednesday: { open: '08:00', close: '22:00' },
            thursday: { open: '08:00', close: '22:00' },
            friday: { open: '08:00', close: '22:00' },
            saturday: { open: '09:00', close: '21:00' },
            sunday: { open: '10:00', close: '20:00' }
          },
          address: {
            street: '123 Medical Street',
            city: pharmacy.location,
            state: 'Pakistan',
            country: 'Pakistan',
            postalCode: '12345'
          }
        });

        await pharmacyProfile.save();

        console.log(`\n✅ PHARMACY ACCOUNT CREATED`);
        console.log(`Email: ${pharmacy.email}`);
        console.log(`Password: ${pharmacy.password}`);
        console.log(`Pharmacy Name: ${pharmacy.pharmacyName}`);
        console.log(`Status: ✅ Verified & Active`);
        console.log('-'.repeat(70));
      } catch (error) {
        console.error(`❌ Error creating pharmacy ${pharmacy.email}:`, error.message);
      }
    }

    // Create lab users
    console.log('\n' + '='.repeat(70));
    console.log('🔬 CREATING LAB TEST USERS');
    console.log('='.repeat(70));

    for (const lab of TEST_LABS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: lab.email });
        if (existingUser) {
          console.log(`⚠️  User ${lab.email} already exists - skipping`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(lab.password, 10);

        // Create user
        const user = new User({
          email: lab.email,
          password: hashedPassword,
          fullName: lab.fullName,
          phone: lab.phone,
          role: 'lab',
          isVerified: true,
          isActive: true
        });

        await user.save();

        // Create lab profile
        const labProfile = new Lab({
          userId: user._id,
          user: user._id,
          labName: lab.labName,
          licenseNumber: lab.licenseNumber,
          location: lab.location,
          phone: lab.phone,
          email: lab.email,
          isVerified: true,
          operatingHours: {
            monday: { open: '08:00', close: '20:00' },
            tuesday: { open: '08:00', close: '20:00' },
            wednesday: { open: '08:00', close: '20:00' },
            thursday: { open: '08:00', close: '20:00' },
            friday: { open: '08:00', close: '20:00' },
            saturday: { open: '09:00', close: '18:00' },
            sunday: { closed: true }
          },
          address: {
            street: '456 Hospital Road',
            city: lab.location,
            state: 'Pakistan',
            country: 'Pakistan',
            postalCode: '54321'
          }
        });

        await labProfile.save();

        console.log(`\n✅ LAB ACCOUNT CREATED`);
        console.log(`Email: ${lab.email}`);
        console.log(`Password: ${lab.password}`);
        console.log(`Lab Name: ${lab.labName}`);
        console.log(`Status: ✅ Verified & Active`);
        console.log('-'.repeat(70));
      } catch (error) {
        console.error(`❌ Error creating lab ${lab.email}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 TEST ACCOUNT SUMMARY');
    console.log('='.repeat(70));
    console.log(`
🏪 PHARMACY ACCOUNTS:
${TEST_PHARMACY.map(p => `   Email: ${p.email}, Password: ${p.password}`).join('\n')}

🔬 LAB ACCOUNTS:
${TEST_LABS.map(l => `   Email: ${l.email}, Password: ${l.password}`).join('\n')}

⚠️  IMPORTANT:
- These are TEST credentials only
- Store these securely for testing purposes
- Do NOT use in production
- Passwords cannot be recovered after creation
- Use "Forgot Password" feature to reset if needed
    `);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUsers();
