const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: './.env' });

const User = require('./models/User');
const ParkingSlot = require('./models/ParkingSlot');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Blacklist = require('./models/Blacklist');
const IncidentReport = require('./models/IncidentReport');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await ParkingSlot.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    await Blacklist.deleteMany({});
    await IncidentReport.deleteMany({});
    console.log('Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@parksmart.com',
      phone: '9999999999',
      password: 'password123',
      role: 'admin',
    });
    console.log('Admin created:', admin.email);

    const admin2 = await User.create({
      name: 'Myusi Kanani',
      email: 'myusiudaynkanani@gmail.com',
      phone: '9999999999',
      password: 'Myusi128',
      role: 'admin',
    });
    console.log('Admin created:', admin2.email);

    const security = await User.create({
      name: 'Security Staff',
      email: 'security@parksmart.com',
      phone: '8888888888',
      password: 'password123',
      role: 'security',
    });
    console.log('Security created:', security.email);

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '7777777777',
      password: 'password123',
      role: 'user',
    });
    console.log('User created:', user1.email);

    const user2 = await User.create({
      name: 'user',
      email: 'user@parksmart.com',
      phone: '9876543210',
      password: 'user123',
      role: 'user',
    });
    console.log('User created:', user2.email);

    const slotsData = [];
    const categories = ['two-wheeler', 'four-wheeler', 'ev', 'disabled'];
    const pricing = {
      'two-wheeler': { pricePerHour: 10, pricePerDay: 50, pricePerMonth: 1000 },
      'four-wheeler': { pricePerHour: 30, pricePerDay: 150, pricePerMonth: 3000 },
      'ev': { pricePerHour: 25, pricePerDay: 120, pricePerMonth: 2500 },
      'disabled': { pricePerHour: 15, pricePerDay: 80, pricePerMonth: 1500 },
    };

    let slotCounter = 1;
    for (let floor = 1; floor <= 3; floor++) {
      for (const category of categories) {
        for (let i = 0; i < 3; i++) {
          const prefix = category === 'two-wheeler' ? 'B' : category === 'ev' ? 'E' : category === 'disabled' ? 'D' : 'C';
          slotsData.push({
            number: `${prefix}${floor}${String.fromCharCode(65 + i)}`,
            category,
            floor,
            ...pricing[category],
            features: category === 'ev' ? ['covered', 'cctv', 'ev-charging'] : category === 'disabled' ? ['covered', 'wider-space'] : ['covered', 'cctv'],
          });
          slotCounter++;
        }
      }

      // Dedicated Emergency Overstay Buffer & VIP Standby Slots (System Reserved)
      slotsData.push({
        number: `BUF-${floor}A`,
        category: 'four-wheeler',
        floor,
        status: 'available',
        pricePerHour: 30,
        pricePerDay: 150,
        pricePerMonth: 3000,
        isEmergencyBuffer: true,
        features: ['emergency_buffer', 'vip_standby', 'cctv', 'priority_access']
      });
      slotsData.push({
        number: `BUF-${floor}B`,
        category: 'ev',
        floor,
        status: 'available',
        pricePerHour: 40,
        pricePerDay: 160,
        pricePerMonth: 3500,
        isEmergencyBuffer: true,
        features: ['emergency_buffer', 'vip_standby', 'cctv', 'ev-charging']
      });
    }

    const slots = await ParkingSlot.insertMany(slotsData);
    console.log(`${slots.length} slots created`);

    // Seed Blacklisted Vehicles
    await Blacklist.create([
      {
        vehicleNumber: 'MH-04-XX-9999',
        reason: 'stolen',
        severity: 'police_wanted',
        notes: 'FIR #892/2026 registered at Crime Branch. Alert police immediately if seen.',
        addedBy: security._id,
        addedByName: security.name,
        isActive: true
      },
      {
        vehicleNumber: 'DL-08-CC-1234',
        reason: 'unpaid_penalties',
        severity: 'warning',
        notes: '3 unpaid overstay penalties pending totaling ₹450.',
        addedBy: security._id,
        addedByName: security.name,
        isActive: true
      }
    ]);
    console.log('Sample watchlist/blacklisted vehicles seeded');

    // Seed Sample Incident
    await IncidentReport.create({
      incidentId: 'INC-102938',
      vehicleNumber: 'DL-01-AB-1122',
      slotNumber: 'C1A',
      type: 'vehicle_damage',
      severity: 'medium',
      description: 'Minor bumper scratch reported on arrival near Pillar B',
      reportedBy: security._id,
      reportedByName: security.name,
      status: 'open'
    });
    console.log('Sample incident reports seeded');

    console.log('\n--- Seed Complete ---');
    console.log('Admin: admin@parksmart.com / password123');
    console.log('Security: security@parksmart.com / password123');
    console.log('User: john@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
