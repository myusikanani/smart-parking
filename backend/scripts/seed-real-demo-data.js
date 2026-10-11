const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const ParkingSlot = require('../src/models/ParkingSlot');
const Booking = require('../src/models/Booking');
const AuditLog = require('../src/models/AuditLog');
const { generateDynamicQRToken } = require('../src/utils/dynamicQR');

const realDrivers = [
  { name: 'Hardik Jinjala', email: 'hardik.jinjala@gmail.com', phone: '9825101122', vehicleNumber: 'GJ-05-HJ-1001', vehicleType: '4-wheeler' },
  { name: 'Kanani Myusi', email: 'myusiudaynkanani@gmail.com', phone: '6351000152', vehicleNumber: 'GJ-05-KM-2002', vehicleType: '4-wheeler' },
  { name: 'Rehan Pathan', email: 'rehan.pathan@gmail.com', phone: '9898123456', vehicleNumber: 'GJ-05-RP-3003', vehicleType: 'ev' },
  { name: 'Dhruvi Malankiya', email: 'dhruvi.malankiya@gmail.com', phone: '9724012345', vehicleNumber: 'GJ-05-DM-4004', vehicleType: '4-wheeler' },
  { name: 'Jay Parmar', email: 'jay.parmar@gmail.com', phone: '9824056789', vehicleNumber: 'GJ-05-JP-5005', vehicleType: '2-wheeler' },
  { name: 'Janaki Gauswami', email: 'janaki.gauswami@gmail.com', phone: '9925067890', vehicleNumber: 'GJ-05-JG-6006', vehicleType: '4-wheeler' },
  { name: 'Jeel', email: 'jeel.patel@gmail.com', phone: '9825078901', vehicleNumber: 'GJ-05-JL-7007', vehicleType: '4-wheeler' },
  { name: 'Riya Navadiya', email: 'riya.navadiya@gmail.com', phone: '9879089012', vehicleNumber: 'GJ-05-RN-8008', vehicleType: '2-wheeler' },
  { name: 'Maitri Kanani', email: 'maitri.kanani@gmail.com', phone: '9824190123', vehicleNumber: 'GJ-05-MK-9009', vehicleType: 'ev' },
  { name: 'Sahil Kanani', email: 'sahil.kanani@gmail.com', phone: '9898201234', vehicleNumber: 'GJ-05-SK-1111', vehicleType: '4-wheeler' },
  { name: 'Sahil Shaikh', email: 'sahil.shaikh@gmail.com', phone: '9725012345', vehicleNumber: 'GJ-05-SS-2222', vehicleType: '4-wheeler' }
];

async function seedData() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parking-system';
  console.log('Connecting to MongoDB:', mongoUri.split('@')[1] || mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  // 1. Create or update Users
  const userMap = {};
  for (const uData of realDrivers) {
    let user = await User.findOne({ email: uData.email });
    if (!user) {
      user = new User({
        name: uData.name,
        email: uData.email,
        phone: uData.phone,
        password: 'Password@123', // Will be hashed by pre-save hook
        role: 'user',
        vehicleNumber: uData.vehicleNumber,
        vehicleType: uData.vehicleType,
        vehicles: [{ plate: uData.vehicleNumber, type: uData.vehicleType, isPrimary: true }],
        isActive: true
      });
      await user.save();
      console.log(`Created User: ${user.name} (${user.email})`);
    } else {
      user.name = uData.name;
      user.phone = uData.phone;
      user.vehicleNumber = uData.vehicleNumber;
      user.vehicleType = uData.vehicleType;
      await user.save();
      console.log(`Updated User: ${user.name} (${user.email})`);
    }
    userMap[uData.name] = user;
  }

  // 2. Fetch existing slots
  const slots = await ParkingSlot.find({});
  if (slots.length === 0) {
    console.error('No parking slots found! Please run the slot seed script first.');
    process.exit(1);
  }
  console.log(`Found ${slots.length} parking slots in database.`);

  // 3. Clear old test bookings for these users to prevent clutter
  const userIds = Object.values(userMap).map(u => u._id);
  await Booking.deleteMany({ user: { $in: userIds } });
  console.log('Cleaned old test bookings for seed drivers.');

  // 4. Create 10+ realistic bookings across multiple dates
  const sampleBookings = [
    {
      driverName: 'Kanani Myusi',
      slotIndex: 0,
      plate: 'GJ-05-KM-2002',
      startDate: new Date('2026-09-18T09:30:00Z'),
      durationHours: 3,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 150
    },
    {
      driverName: 'Hardik Jinjala',
      slotIndex: 1,
      plate: 'GJ-05-HJ-1001',
      startDate: new Date('2026-09-22T14:00:00Z'),
      durationHours: 2,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 100
    },
    {
      driverName: 'Rehan Pathan',
      slotIndex: 2,
      plate: 'GJ-05-RP-3003',
      startDate: new Date('2026-09-27T10:15:00Z'),
      durationHours: 4,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 35,
      overstayFee: 50,
      amount: 200
    },
    {
      driverName: 'Dhruvi Malankiya',
      slotIndex: 3,
      plate: 'GJ-05-DM-4004',
      startDate: new Date('2026-10-01T11:00:00Z'),
      durationHours: 2,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 100
    },
    {
      driverName: 'Jay Parmar',
      slotIndex: 4,
      plate: 'GJ-05-JP-5005',
      startDate: new Date('2026-10-05T16:30:00Z'),
      durationHours: 3,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 60
    },
    {
      driverName: 'Janaki Gauswami',
      slotIndex: 5,
      plate: 'GJ-05-JG-6006',
      startDate: new Date('2026-10-08T13:00:00Z'),
      durationHours: 3,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 45,
      overstayFee: 50,
      amount: 150
    },
    {
      driverName: 'Jeel',
      slotIndex: 6,
      plate: 'GJ-05-JL-7007',
      startDate: new Date('2026-10-10T09:00:00Z'),
      durationHours: 2,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 100
    },
    {
      driverName: 'Riya Navadiya',
      slotIndex: 7,
      plate: 'GJ-05-RN-8008',
      startDate: new Date('2026-10-10T15:00:00Z'),
      durationHours: 4,
      status: 'completed',
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 80
    },
    {
      driverName: 'Maitri Kanani',
      slotIndex: 8,
      plate: 'GJ-05-MK-9009',
      startDate: new Date(Date.now() - 2 * 3600 * 1000), // Parked 2 hours ago
      durationHours: 4,
      status: 'active', // CURRENTLY PARKED INSIDE
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 200
    },
    {
      driverName: 'Sahil Kanani',
      slotIndex: 9,
      plate: 'GJ-05-SK-1111',
      startDate: new Date(Date.now() + 30 * 60 * 1000), // Upcoming booking today
      durationHours: 2,
      status: 'confirmed', // READY FOR ENTRY
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 100
    },
    {
      driverName: 'Sahil Shaikh',
      slotIndex: 10,
      plate: 'GJ-05-SS-2222',
      startDate: new Date(Date.now() + 60 * 60 * 1000), // Upcoming booking today
      durationHours: 3,
      status: 'confirmed', // READY FOR ENTRY
      paymentStatus: 'paid',
      overstayMinutes: 0,
      overstayFee: 0,
      amount: 150
    }
  ];

  for (let i = 0; i < sampleBookings.length; i++) {
    const item = sampleBookings[i];
    const user = userMap[item.driverName];
    const slot = slots[item.slotIndex % slots.length];

    const endDate = new Date(item.startDate.getTime() + item.durationHours * 3600 * 1000);
    const entryDate = item.status === 'confirmed' ? null : new Date(item.startDate.getTime() + 5 * 60 * 1000);
    const exitDate = item.status === 'completed'
      ? new Date(endDate.getTime() + item.overstayMinutes * 60 * 1000)
      : null;

    const rzpId = 'pay_' + crypto.randomBytes(7).toString('hex');
    const rzpOrder = 'order_' + crypto.randomBytes(7).toString('hex');

    const booking = new Booking({
      user: user._id,
      slot: slot._id,
      locationId: slot.locationId || undefined,
      vehicleNumber: item.plate,
      startTime: item.startDate,
      endTime: endDate,
      status: item.status,
      paymentStatus: item.paymentStatus,
      amount: item.amount,
      duration: item.durationHours,
      overstayDuration: item.overstayMinutes,
      overstayPenalty: item.overstayFee,
      entryTime: entryDate,
      exitTime: exitDate,
      razorpayPaymentId: rzpId,
      razorpayOrderId: rzpOrder,
      paidAt: item.startDate,
      createdAt: item.startDate,
      updatedAt: exitDate || entryDate || item.startDate
    });

    // Generate dynamic QR token
    const qrResult = generateDynamicQRToken(booking._id.toString());
    booking.qrToken = qrResult.token;
    booking.qrCode = qrResult.token;
    await booking.save();

    // If active, mark slot occupied
    if (item.status === 'active') {
      slot.status = 'occupied';
      await slot.save();
    }

    // Add Audit Logs for entry and exit
    if (entryDate) {
      await AuditLog.create({
        user: user.name,
        userId: user._id,
        action: `Vehicle ${item.plate} entered gate into slot ${slot.number}`,
        actionType: 'entry',
        details: `Slot: ${slot.number}, Mode: Auto-Entry`,
        createdAt: entryDate
      });
    }

    if (exitDate) {
      await AuditLog.create({
        user: user.name,
        userId: user._id,
        action: `Vehicle ${item.plate} exited gate from slot ${slot.number}`,
        actionType: 'exit',
        details: `Slot: ${slot.number}, Overstay: ${item.overstayMinutes}m, Penalty: ₹${item.overstayFee}`,
        createdAt: exitDate
      });
    }

    console.log(`[${i + 1}/${sampleBookings.length}] Seeded Booking for ${user.name} | Slot: ${slot.number} | Plate: ${item.plate} | Status: ${item.status} | Date: ${item.startDate.toISOString().split('T')[0]}`);
  }

  console.log('\n✅ All 11 real demo bookings and audit logs have been successfully inserted into MongoDB!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
