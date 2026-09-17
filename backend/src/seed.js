const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: './.env' });

const { seedAll } = require('./utils/seeder');

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await seedAll();
    console.log('\n--- Seed Complete ---');
    console.log(`Users: ${result.usersCount}`);
    console.log(`Locations / Malls: ${result.locationsCount}`);
    console.log(`Slots: ${result.slotsCount}`);
    console.log('Admin: admin@parksmart.com / password123');
    console.log('Security: security@parksmart.com / password123');
    console.log('User: john@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

runSeed();
