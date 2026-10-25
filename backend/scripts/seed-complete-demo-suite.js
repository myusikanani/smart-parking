const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const ParkingSlot = require('../src/models/ParkingSlot');
const Booking = require('../src/models/Booking');
const AuditLog = require('../src/models/AuditLog');
const IncidentReport = require('../src/models/IncidentReport');
const Blacklist = require('../src/models/Blacklist');
const Notification = require('../src/models/Notification');
const { generateDynamicQRToken } = require('../src/utils/dynamicQR');

const realDrivers = [
  { name: 'Kanani Myusi', email: 'myusiudaynkanani@gmail.com', phone: '6351000152', vehicleNumber: 'GJ-05-KM-2002', vehicleType: '4-wheeler' },
  { name: 'Hardik Jinjala', email: 'hardik.jinjala@gmail.com', phone: '9825101122', vehicleNumber: 'GJ-05-HJ-1001', vehicleType: '4-wheeler' },
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

async function seedCompleteDemo() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parking-system';
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  // 1. Setup & Ensure Drivers
  const userMap = {};
  for (const driver of realDrivers) {
    let user = await User.findOne({ email: driver.email });
    if (!user) {
      user = new User({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        password: 'Password@123',
        role: 'user',
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        vehicles: [{ plate: driver.vehicleNumber, type: driver.vehicleType, isPrimary: true }],
        isActive: true
      });
      await user.save();
    } else {
      user.name = driver.name;
      user.phone = driver.phone;
      user.vehicleNumber = driver.vehicleNumber;
      user.vehicleType = driver.vehicleType;
      user.vehicles = [{ plate: driver.vehicleNumber, type: driver.vehicleType, isPrimary: true }];
      user.isActive = true;
      await user.save();
    }
    userMap[driver.name] = user;
  }
  console.log(`Verified and synchronized ${Object.keys(userMap).length} real driver accounts.`);

  const adminUser = await User.findOne({ role: 'admin' });
  const securityUser = await User.findOne({ role: 'security' });

  // 2. Slots
  const slots = await ParkingSlot.find({});
  if (slots.length === 0) {
    console.error('No slots found in DB.');
    process.exit(1);
  }
  console.log(`Found ${slots.length} parking bay slots.`);

  // Reset all slots to available initially
  await ParkingSlot.updateMany({}, { $set: { status: 'available' } });

  // 3. Clear existing Bookings for seed users to populate fresh realistic data
  const userIds = Object.values(userMap).map(u => u._id);
  await Booking.deleteMany({ user: { $in: userIds } });
  await IncidentReport.deleteMany({});
  await Blacklist.deleteMany({});
  await AuditLog.deleteMany({ actionType: { $in: ['entry', 'exit', 'walkin_entry', 'incident_report', 'blacklist_add'] } });

  const now = new Date();
  const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0);

  // 4. Construct Comprehensive Realistic Bookings Suite
  const bookingConfigs = [
    // --- TODAY: 3 Currently Active Parked Vehicles (Security Live Occupancy & Today Entries) ---
    {
      driverName: 'Kanani Myusi',
      slotIdx: 3,
      plate: 'GJ-05-KM-2002',
      start: new Date(now.getTime() - 2.5 * 3600 * 1000),
      duration: 4,
      status: 'active',
      paymentStatus: 'paid',
      amount: 150,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: false
    },
    {
      driverName: 'Hardik Jinjala',
      slotIdx: 4,
      plate: 'GJ-05-HJ-1001',
      start: new Date(now.getTime() - 1.5 * 3600 * 1000),
      duration: 3,
      status: 'active',
      paymentStatus: 'paid',
      amount: 120,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: false
    },
    {
      driverName: 'Maitri Kanani',
      slotIdx: 5,
      plate: 'GJ-05-MK-9009',
      start: new Date(now.getTime() - 1 * 3600 * 1000),
      duration: 4,
      status: 'active',
      paymentStatus: 'paid',
      amount: 200,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: false
    },

    // --- TODAY: 5 Completed Visits (Both Entry & Exit verified by Security Today) ---
    {
      driverName: 'Rehan Pathan',
      slotIdx: 6,
      plate: 'GJ-05-RP-3003',
      start: new Date(todayMorning.getTime() + 10 * 60 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 160,
      overstayMinutes: 18,
      overstayFee: 50,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Dhruvi Malankiya',
      slotIdx: 7,
      plate: 'GJ-05-DM-4004',
      start: new Date(todayMorning.getTime() + 45 * 60 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Jay Parmar',
      slotIdx: 0,
      plate: 'GJ-05-JP-5005',
      start: new Date(todayMorning.getTime() + 75 * 60 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 60,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Janaki Gauswami',
      slotIdx: 8,
      plate: 'GJ-05-JG-6006',
      start: new Date(todayMorning.getTime() + 90 * 60 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 120,
      overstayMinutes: 25,
      overstayFee: 50,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Sahil Kanani',
      slotIdx: 9,
      plate: 'GJ-05-SK-1111',
      start: new Date(todayMorning.getTime() + 120 * 60 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: true,
      hasExited: true
    },

    // --- TODAY: 2 Confirmed Upcoming Bookings (Ready for Gate Entry Verification) ---
    {
      driverName: 'Jeel',
      slotIdx: 10,
      plate: 'GJ-05-JL-7007',
      start: new Date(now.getTime() + 45 * 60 * 1000),
      duration: 2,
      status: 'confirmed',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Sahil Shaikh',
      slotIdx: 11,
      plate: 'GJ-05-SS-2222',
      start: new Date(now.getTime() + 90 * 60 * 1000),
      duration: 3,
      status: 'confirmed',
      paymentStatus: 'paid',
      amount: 150,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },

    // --- OVERSTAY REPORT ENTRIES (Historical with overstayDuration > 0) ---
    {
      driverName: 'Rehan Pathan',
      slotIdx: 12,
      plate: 'GJ-05-RP-3003',
      start: new Date(now.getTime() - 2 * 86400 * 1000),
      duration: 3,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 180,
      overstayMinutes: 45,
      overstayFee: 100,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Janaki Gauswami',
      slotIdx: 13,
      plate: 'GJ-05-JG-6006',
      start: new Date(now.getTime() - 3 * 86400 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 60,
      overstayFee: 150,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Hardik Jinjala',
      slotIdx: 14,
      plate: 'GJ-05-HJ-1001',
      start: new Date(now.getTime() - 4 * 86400 * 1000),
      duration: 3,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 120,
      overstayMinutes: 90,
      overstayFee: 200,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Jay Parmar',
      slotIdx: 1,
      plate: 'GJ-05-JP-5005',
      start: new Date(now.getTime() - 5 * 86400 * 1000),
      duration: 4,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 80,
      overstayMinutes: 35,
      overstayFee: 50,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Maitri Kanani',
      slotIdx: 15,
      plate: 'GJ-05-MK-9009',
      start: new Date(now.getTime() - 6 * 86400 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 150,
      overstayMinutes: 30,
      overstayFee: 75,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },
    {
      driverName: 'Sahil Shaikh',
      slotIdx: 16,
      plate: 'GJ-05-SS-2222',
      start: new Date(now.getTime() - 7 * 86400 * 1000),
      duration: 2,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 120,
      overstayFee: 250,
      penaltyPaid: true,
      hasEntered: true,
      hasExited: true
    },

    // --- NO-SHOW REPORT ENTRIES (status: 'expired') ---
    {
      driverName: 'Riya Navadiya',
      slotIdx: 2,
      plate: 'GJ-05-RN-8008',
      start: new Date(now.getTime() - 1 * 86400 * 1000),
      duration: 2,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 60,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Jeel',
      slotIdx: 17,
      plate: 'GJ-05-JL-7007',
      start: new Date(now.getTime() - 2 * 86400 * 1000),
      duration: 3,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 150,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Dhruvi Malankiya',
      slotIdx: 18,
      plate: 'GJ-05-DM-4004',
      start: new Date(now.getTime() - 3 * 86400 * 1000),
      duration: 2,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Jay Parmar',
      slotIdx: 0,
      plate: 'GJ-05-JP-5005',
      start: new Date(now.getTime() - 4 * 86400 * 1000),
      duration: 3,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 75,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Sahil Kanani',
      slotIdx: 19,
      plate: 'GJ-05-SK-1111',
      start: new Date(now.getTime() - 5 * 86400 * 1000),
      duration: 2,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    },
    {
      driverName: 'Kanani Myusi',
      slotIdx: 20,
      plate: 'GJ-05-KM-2002',
      start: new Date(now.getTime() - 8 * 86400 * 1000),
      duration: 2,
      status: 'expired',
      paymentStatus: 'paid',
      amount: 100,
      overstayMinutes: 0,
      overstayFee: 0,
      hasEntered: false,
      hasExited: false
    }
  ];

  console.log(`Seeding ${bookingConfigs.length} total bookings across all lifecycle states...`);

  for (let i = 0; i < bookingConfigs.length; i++) {
    const cfg = bookingConfigs[i];
    const user = userMap[cfg.driverName];
    const slot = slots[cfg.slotIdx % slots.length];

    const endDate = new Date(cfg.start.getTime() + cfg.duration * 3600 * 1000);
    const entryDate = cfg.hasEntered ? new Date(cfg.start.getTime() + 4 * 60 * 1000) : null;
    const exitDate = cfg.hasExited ? new Date(endDate.getTime() + cfg.overstayMinutes * 60 * 1000) : null;

    const rzpPayId = 'pay_' + crypto.randomBytes(7).toString('hex');
    const rzpOrderId = 'order_' + crypto.randomBytes(7).toString('hex');

    const booking = new Booking({
      user: user._id,
      slot: slot._id,
      locationId: slot.locationId || undefined,
      vehicleNumber: cfg.plate,
      startTime: cfg.start,
      endTime: endDate,
      status: cfg.status,
      paymentStatus: cfg.paymentStatus,
      amount: cfg.amount,
      duration: cfg.duration,
      overstayDuration: cfg.overstayMinutes,
      overstayPenalty: cfg.overstayFee,
      penaltyPaymentStatus: cfg.penaltyPaid ? 'paid' : (cfg.overstayFee > 0 ? 'pending' : 'none'),
      entryTime: entryDate,
      exitTime: exitDate,
      razorpayPaymentId: rzpPayId,
      razorpayOrderId: rzpOrderId,
      paidAt: cfg.start,
      createdAt: cfg.start,
      updatedAt: exitDate || entryDate || cfg.start
    });

    const qrResult = generateDynamicQRToken(booking._id.toString());
    booking.qrToken = qrResult.token;
    booking.qrCode = qrResult.token;
    await booking.save();

    // Slot state sync
    if (cfg.status === 'active') {
      slot.status = 'occupied';
      await slot.save();
    } else if (cfg.status === 'confirmed') {
      slot.status = 'reserved';
      await slot.save();
    }

    // Audit logs for entry and exit
    if (entryDate) {
      await AuditLog.create({
        user: user.name,
        userId: user._id,
        action: `Vehicle ${cfg.plate} entered via Gate 1 into Bay ${slot.number}`,
        actionType: 'entry',
        details: `Driver: ${user.name}, Slot: ${slot.number}, Mode: FastScan-ANPR`,
        createdAt: entryDate
      });
    }

    if (exitDate) {
      await AuditLog.create({
        user: user.name,
        userId: user._id,
        action: `Vehicle ${cfg.plate} exited via Gate 2 from Bay ${slot.number}`,
        actionType: 'exit',
        details: `Driver: ${user.name}, Overstay: ${cfg.overstayMinutes}m, Penalty: ₹${cfg.overstayFee}`,
        createdAt: exitDate
      });
    }
  }

  // 5. Seed 7 Realistic Security Incidents
  const sampleIncidents = [
    {
      vehicleNumber: 'GJ-05-RP-3003',
      slotNumber: 'EV-01',
      type: 'other',
      severity: 'low',
      description: 'Vehicle GJ-05-RP-3003 EV fast charging completed; slot safely monitored by guard.',
      status: 'resolved',
      reportedByName: 'Security Guard - Gate 1',
      reportedBy: securityUser?._id,
      resolutionNotes: 'Driver Rehan Pathan retrieved vehicle on time without disruption.',
      resolvedAt: new Date(now.getTime() - 2 * 3600 * 1000)
    },
    {
      vehicleNumber: 'GJ-05-HJ-1001',
      slotNumber: 'A-C1A',
      type: 'illegal_parking',
      severity: 'low',
      description: 'Vehicle parked slightly across white divider line in slot A-C1A.',
      status: 'resolved',
      reportedByName: 'Security Guard - Patrol',
      reportedBy: securityUser?._id,
      resolutionNotes: 'Driver Hardik Jinjala realigned vehicle inside bay lines.',
      resolvedAt: new Date(now.getTime() - 4 * 3600 * 1000)
    },
    {
      vehicleNumber: 'GJ-05-SS-2222',
      slotNumber: 'B-C2B',
      type: 'other',
      severity: 'low',
      description: 'Vehicle headlights left illuminated in slot B-C2B after parking.',
      status: 'resolved',
      reportedByName: 'Security Guard - Patrol',
      reportedBy: securityUser?._id,
      resolutionNotes: 'Guard notified driver Sahil Shaikh via phone; lights switched off.',
      resolvedAt: new Date(now.getTime() - 5 * 3600 * 1000)
    },
    {
      vehicleNumber: 'GJ-05-KM-2002',
      slotNumber: 'Gate 1',
      type: 'other',
      severity: 'low',
      description: 'Driver Kanani Myusi requested EV directional assistance at East gate ramp.',
      status: 'resolved',
      reportedByName: 'Gate Attendant',
      reportedBy: securityUser?._id,
      resolutionNotes: 'Guided smoothly toward Level 1 designated bay.',
      resolvedAt: new Date(now.getTime() - 6 * 3600 * 1000)
    },
    {
      vehicleNumber: 'GJ-05-XX-1234',
      slotNumber: 'Gate 2',
      type: 'suspicious_activity',
      severity: 'medium',
      description: 'Unregistered visitor car attempted barrier tailgating behind exiting vehicle.',
      status: 'investigating',
      reportedByName: 'Gate Supervisor',
      reportedBy: securityUser?._id
    },
    {
      vehicleNumber: 'GJ-05-DM-4004',
      slotNumber: 'A-C1B',
      type: 'vehicle_damage',
      severity: 'low',
      description: 'Minor tire scuff observed near bay rubber curb protector.',
      status: 'resolved',
      reportedByName: 'Security Guard - Patrol',
      reportedBy: securityUser?._id,
      resolutionNotes: 'Driver confirmed no vehicle body damage occurred.',
      resolvedAt: new Date(now.getTime() - 1 * 86400 * 1000)
    },
    {
      vehicleNumber: 'GJ-05-RN-8008',
      slotNumber: '2W-Bay-03',
      type: 'other',
      severity: 'low',
      description: 'Helmet left securely on two-wheeler seat in designated two-wheeler area.',
      status: 'open',
      reportedByName: 'Patrol Staff',
      reportedBy: securityUser?._id
    }
  ];

  for (const inc of sampleIncidents) {
    await IncidentReport.create(inc);
  }
  console.log(`Seeded ${sampleIncidents.length} realistic incident reports.`);

  // 6. Seed 3 Blacklist Records
  const sampleBlacklist = [
    {
      vehicleNumber: 'GJ-05-XX-9999',
      reason: 'repeated_defaulter',
      severity: 'warning',
      notes: 'Repeated unpaid overdue overstay fees on multiple community parking visits.',
      addedByName: 'Security Admin',
      addedBy: adminUser?._id,
      isActive: true
    },
    {
      vehicleNumber: 'GJ-05-BK-0000',
      reason: 'stolen',
      severity: 'police_wanted',
      notes: 'Reported stolen plate flagged in national automated database bulletin.',
      addedByName: 'Senior Security Incharge',
      addedBy: securityUser?._id,
      isActive: true
    },
    {
      vehicleNumber: 'GJ-05-SP-4444',
      reason: 'suspicious_activity',
      severity: 'warning',
      notes: 'Attempted forced entry without scanning active dynamic QR pass at barrier.',
      addedByName: 'Security Staff',
      addedBy: securityUser?._id,
      isActive: true
    }
  ];

  for (const bl of sampleBlacklist) {
    await Blacklist.create(bl);
  }
  console.log(`Seeded ${sampleBlacklist.length} security blacklist records.`);

  // 7. Seed Notifications for each real user
  for (const driver of realDrivers) {
    const user = userMap[driver.name];
    await Notification.create({
      user: user._id,
      title: 'Booking Confirmed - ParkSmart Smart Parking',
      message: `Your reservation for vehicle ${driver.vehicleNumber} was successfully confirmed. Dynamic QR pass is ready for gate entry.`,
      type: 'booking',
      read: false,
      createdAt: new Date(now.getTime() - Math.floor(Math.random() * 86400000))
    });
  }
  console.log('Seeded notifications for all 11 real users.');

  console.log('\n===========================================================');
  console.log('✅ ALL FEATURES SEEDED WITH 5-10 REALISTIC ENTRIES SUCCESSFULLY!');
  console.log('===========================================================');
  process.exit(0);
}

seedCompleteDemo().catch(err => {
  console.error('Error seeding demo suite:', err);
  process.exit(1);
});
