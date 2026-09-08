const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Blacklist = require('../models/Blacklist');
const IncidentReport = require('../models/IncidentReport');

const seedAll = async () => {
  await User.deleteMany({});
  await ParkingSlot.deleteMany({});
  await Booking.deleteMany({});
  await Notification.deleteMany({});
  await Blacklist.deleteMany({});
  await IncidentReport.deleteMany({});

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@parksmart.com',
    phone: '9999999999',
    password: 'password123',
    role: 'admin',
  });

  const admin2 = await User.create({
    name: 'Myusi Kanani',
    email: 'myusiudaynkanani@gmail.com',
    phone: '9999999999',
    password: 'Myusi128',
    role: 'admin',
  });

  const security = await User.create({
    name: 'Security Staff',
    email: 'security@parksmart.com',
    phone: '8888888888',
    password: 'password123',
    role: 'security',
  });

  const user1 = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '7777777777',
    password: 'password123',
    role: 'user',
  });

  const user2 = await User.create({
    name: 'user',
    email: 'user@parksmart.com',
    phone: '9876543210',
    password: 'user123',
    role: 'user',
  });

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
  }

  const slots = await ParkingSlot.insertMany(slotsData);

  // Seed Blacklisted Vehicles
  await Blacklist.create([
    {
      vehicleNumber: 'MH-04-XX-9999',
      reason: 'stolen',
      severity: 'police_wanted',
      notes: 'FIR #892/2026 registered at Crime Branch. Alert police immediately if seen.',
      addedBy: security._id,
      addedByName: security.name,
      isActive: true,
    },
    {
      vehicleNumber: 'DL-08-CC-1234',
      reason: 'unpaid_penalties',
      severity: 'warning',
      notes: '3 unpaid overstay penalties pending totaling ₹450.',
      addedBy: security._id,
      addedByName: security.name,
      isActive: true,
    },
  ]);

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
    status: 'open',
  });

  return { usersCount: 5, slotsCount: slots.length };
};

module.exports = { seedAll };
