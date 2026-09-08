const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const targetEmail = 'myusiudaynkanani@gmail.com';
const newPassword = 'Myusi128';

async function updateAdminPassword() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/parking-system';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    let user = await User.findOne({ email: targetEmail.toLowerCase() }).select('+password');

    if (user) {
      console.log(`User found: ${user.name} (${user.email}), current role: ${user.role}`);
      user.password = newPassword;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log(`Successfully updated password and role for ${user.email} (Role: admin, Password: ${newPassword})`);
    } else {
      console.log(`User ${targetEmail} not found. Creating new admin user...`);
      user = new User({
        name: 'Myusi Kanani',
        email: targetEmail.toLowerCase(),
        phone: '9999999999',
        password: newPassword,
        role: 'admin',
        isActive: true,
      });
      await user.save();
      console.log(`Successfully created new admin user ${user.email} with password: ${newPassword}`);
    }

    // Verify password comparison works
    const checkUser = await User.findOne({ email: targetEmail.toLowerCase() }).select('+password');
    const isMatch = await checkUser.matchPassword(newPassword);
    console.log(`Verification: password match check -> ${isMatch ? 'PASSED (valid)' : 'FAILED'}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  }
}

updateAdminPassword();
