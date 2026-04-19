// Script to create verification staff
const mongoose = require('mongoose');
const Staff = require('./server/models/Staff.js');

async function createVerificationStaff() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/abviiitm-registration');
    console.log('✅ Connected to MongoDB');

    // Check if verification staff already exists
    const existingStaff = await Staff.findOne({ role: 'verification_staff' });
    if (existingStaff) {
      console.log('✅ Verification staff already exists:', existingStaff.employeeId);
      await mongoose.disconnect();
      return;
    }

    // Create verification staff
    const verificationStaff = new Staff({
      employeeId: 'VER001',
      name: 'Verification Staff',
      email: 'verification@abviiitm.ac.in',
      passwordHash: 'Verification@123',
      role: 'verification_staff',
      department: 'Accounts'
    });

    await verificationStaff.save();
    console.log('✅ Verification staff created successfully');
    console.log('   Employee ID: VER001');
    console.log('   Password: Verification@123');
    console.log('   Role: verification_staff');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating verification staff:', error.message);
    process.exit(1);
  }
}

createVerificationStaff();
