const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Check if myusi128@gmail.com exists
  let user = await User.findOne({ email: 'myusi128@gmail.com' }).select('+password');
  if (user) {
    user.password = 'Myusi128';
    user.role = 'user';
    user.isActive = true;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    console.log('Updated existing user myusi128@gmail.com with password Myusi128');
  } else {
    user = new User({
      name: 'Kanani Myusi',
      email: 'myusi128@gmail.com',
      phone: '6351000152',
      password: 'Myusi128',
      role: 'user',
      vehicleNumber: 'GJ-05-KM-2002',
      vehicleType: '4-wheeler',
      vehicles: [{ plate: 'GJ-05-KM-2002', type: '4-wheeler', isPrimary: true }],
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null
    });
    await user.save();
    console.log('Created new user myusi128@gmail.com with password Myusi128');
  }

  // Also ensure myusiudaynkanani@gmail.com is up to date and active
  let adminUser = await User.findOne({ email: 'myusiudaynkanani@gmail.com' }).select('+password');
  if (adminUser) {
    adminUser.password = 'Myusi128';
    adminUser.isActive = true;
    adminUser.failedLoginAttempts = 0;
    adminUser.lockUntil = null;
    await adminUser.save();
    console.log('Updated myusiudaynkanani@gmail.com with password Myusi128');
  }

  // Test matchPassword
  const checkUser = await User.findOne({ email: 'myusi128@gmail.com' }).select('+password');
  const isMatch1 = await checkUser.matchPassword('Myusi128');
  console.log(`Password check 'Myusi128' for myusi128@gmail.com: ${isMatch1}`);

  await mongoose.disconnect();
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
