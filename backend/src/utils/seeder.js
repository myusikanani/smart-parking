const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Blacklist = require('../models/Blacklist');
const IncidentReport = require('../models/IncidentReport');
const WaitingList = require('../models/WaitingList');

const seedAll = async () => {
  await User.deleteMany({});
  await ParkingLocation.deleteMany({});
  await ParkingSlot.deleteMany({});
  await Booking.deleteMany({});
  await Notification.deleteMany({});
  await Blacklist.deleteMany({});
  await IncidentReport.deleteMany({});
  await WaitingList.deleteMany({});

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
    phone: '6351000152',
    password: 'Myusi128',
    role: 'admin',
    vehicleNumber: 'GJ-05-AB-1234',
    vehicleType: '4-wheeler',
    vehicles: [{ plate: 'GJ-05-AB-1234', type: '4-wheeler' }]
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
    vehicleNumber: 'GJ-05-CD-5678',
    vehicleType: '4-wheeler',
    vehicles: [{ plate: 'GJ-05-CD-5678', type: '4-wheeler' }]
  });

  const user2 = await User.create({
    name: 'user',
    email: 'user@parksmart.com',
    phone: '9876543210',
    password: 'user123',
    role: 'user',
    vehicleNumber: 'GJ-01-AB-1234',
    vehicleType: '4-wheeler',
    vehicles: [{ plate: 'GJ-01-AB-1234', type: '4-wheeler' }]
  });

  // --- SEED SURAT PARKING LOCATIONS & MALLS ---
  const locationsData = [
    {
      name: 'Mall A - Katargam Central Mall',
      code: 'KAT-MALL-A',
      area: 'Katargam',
      city: 'Surat',
      address: 'Katargam Main Road, Near GIDC, Katargam, Surat - 395004',
      latitude: 21.2330,
      longitude: 72.8335,
      description: 'Premier shopping and commercial hub with multi-level automated smart parking and rapid EV charging bays.',
      contactNumber: '+91 98250 11223',
      amenities: ['EV Fast Charging', 'CCTV 24/7', 'Covered Parking', 'Valet Service', 'Elevator Ramp'],
      totalFloors: 3,
      status: 'active',
      operatingHours: '24/7 Open',
    },
    {
      name: 'Mall B - Gitanjali Square Hub',
      code: 'KAT-MALL-B',
      area: 'Katargam',
      city: 'Surat',
      address: 'Gitanjali Circle, Opp. Lake Garden, Katargam, Surat - 395004',
      latitude: 21.2375,
      longitude: 72.8290,
      description: 'Bustling retail center with two floors of underground parking and quick bike/EV access.',
      contactNumber: '+91 98250 44556',
      amenities: ['CCTV 24/7', 'Covered Parking', 'Security Staff'],
      totalFloors: 2,
      status: 'active',
      operatingHours: '08:00 AM - 11:30 PM',
    },
    {
      name: 'Mall C - Diamond Complex Parking',
      code: 'VAR-MALL-C',
      area: 'Varachha',
      city: 'Surat',
      address: 'Mini Bazar Main Road, Near Diamond Market, Varachha, Surat - 395006',
      latitude: 21.2185,
      longitude: 72.8620,
      description: 'State-of-the-art secure multi-story parking facility in the heart of the Varachha diamond district.',
      contactNumber: '+91 98250 77889',
      amenities: ['EV Fast Charging', 'CCTV 24/7', 'Covered Parking', 'VIP Valet', '24/7 Security'],
      totalFloors: 3,
      status: 'active',
      operatingHours: '24/7 Open',
    },
    {
      name: 'Mall D - Mini Bazar Arcade',
      code: 'VAR-MALL-D',
      area: 'Varachha',
      city: 'Surat',
      address: 'Near Labheshwar Chowk, Varachha Road, Surat - 395006',
      latitude: 21.2240,
      longitude: 72.8550,
      description: 'Convenient central garage serving Mini Bazar shoppers with wide bays and automated entry gates.',
      contactNumber: '+91 98250 99001',
      amenities: ['Covered Parking', 'CCTV 24/7', 'Security Staff'],
      totalFloors: 2,
      status: 'active',
      operatingHours: '07:00 AM - 11:00 PM',
    },
    {
      name: 'Mall E - Prime Shoppers Arena',
      code: 'ADJ-MALL-E',
      area: 'Adajan',
      city: 'Surat',
      address: 'LP Savani Road, Adajan, Surat - 395009',
      latitude: 21.1960,
      longitude: 72.7930,
      description: 'Spacious western suburban parking hub with solar-powered EV superchargers and express lanes.',
      contactNumber: '+91 98250 33445',
      amenities: ['EV Fast Charging', 'CCTV 24/7', 'Covered Parking', 'Valet Service', 'Solar Powered'],
      totalFloors: 3,
      status: 'active',
      operatingHours: '24/7 Open',
    },
    {
      name: 'Mall F - Vesu Boulevard Parking',
      code: 'VES-MALL-F',
      area: 'Vesu',
      city: 'Surat',
      address: 'VIP Road, Near University Circle, Vesu, Surat - 395007',
      latitude: 21.1450,
      longitude: 72.7780,
      description: 'Premium luxury garage equipped with smart sensors, wide SUV parking bays, and VIP lounge access.',
      contactNumber: '+91 98250 55667',
      amenities: ['EV Fast Charging', 'CCTV 24/7', 'Covered Parking', 'VIP Reserved', 'Valet Service'],
      totalFloors: 3,
      status: 'active',
      operatingHours: '24/7 Open',
    },
  ];

  const createdLocations = await ParkingLocation.create(locationsData);
  console.log(`${createdLocations.length} Parking Locations / Malls seeded`);

  const locA = createdLocations.find((l) => l.code === 'KAT-MALL-A');
  const locB = createdLocations.find((l) => l.code === 'KAT-MALL-B');
  const locC = createdLocations.find((l) => l.code === 'VAR-MALL-C');
  const locD = createdLocations.find((l) => l.code === 'VAR-MALL-D');
  const locE = createdLocations.find((l) => l.code === 'ADJ-MALL-E');
  const locF = createdLocations.find((l) => l.code === 'VES-MALL-F');

  const pricing = {
    'two-wheeler': { pricePerHour: 10, pricePerDay: 50, pricePerMonth: 1000 },
    'four-wheeler': { pricePerHour: 30, pricePerDay: 150, pricePerMonth: 3000 },
    'ev': { pricePerHour: 25, pricePerDay: 120, pricePerMonth: 2500 },
    'disabled': { pricePerHour: 15, pricePerDay: 80, pricePerMonth: 1500 },
  };

  const slotsData = [];

  // 1. Seed Slots for Mall A (Katargam Central Mall - 3 floors, rich availability)
  for (let floor = 1; floor <= 3; floor++) {
    for (const category of ['two-wheeler', 'four-wheeler', 'ev', 'disabled']) {
      for (let i = 0; i < 3; i++) {
        const prefix = category === 'two-wheeler' ? 'B' : category === 'ev' ? 'E' : category === 'disabled' ? 'D' : 'C';
        slotsData.push({
          number: `A-${prefix}${floor}${String.fromCharCode(65 + i)}`,
          locationId: locA._id,
          location: `${locA.name} (${locA.area})`,
          category,
          floor,
          status: 'available',
          ...pricing[category],
          features: category === 'ev' ? ['covered', 'cctv', 'ev-charging'] : category === 'disabled' ? ['covered', 'wider-space'] : ['covered', 'cctv'],
        });
      }
    }
  }

  // 2. Seed Slots for Mall B (Gitanjali Square Hub - Car slots occupied/full, but bikes/EV available for testing smart recommendations!)
  for (let floor = 1; floor <= 2; floor++) {
    for (let i = 0; i < 3; i++) {
      // 4W Car slots are occupied/full
      slotsData.push({
        number: `B-C${floor}${String.fromCharCode(65 + i)}`,
        locationId: locB._id,
        location: `${locB.name} (${locB.area})`,
        category: 'four-wheeler',
        floor,
        status: 'occupied',
        ...pricing['four-wheeler'],
        features: ['covered', 'cctv'],
      });
      // 2W Bike slots are available
      slotsData.push({
        number: `B-B${floor}${String.fromCharCode(65 + i)}`,
        locationId: locB._id,
        location: `${locB.name} (${locB.area})`,
        category: 'two-wheeler',
        floor,
        status: 'available',
        ...pricing['two-wheeler'],
        features: ['covered', 'cctv'],
      });
      // EV slots are available
      slotsData.push({
        number: `B-E${floor}${String.fromCharCode(65 + i)}`,
        locationId: locB._id,
        location: `${locB.name} (${locB.area})`,
        category: 'ev',
        floor,
        status: i === 0 ? 'available' : 'occupied',
        ...pricing['ev'],
        features: ['covered', 'cctv', 'ev-charging'],
      });
    }
  }

  // 3. Seed Slots for Mall C (Varachha Diamond Complex - 3 floors)
  for (let floor = 1; floor <= 3; floor++) {
    for (const category of ['two-wheeler', 'four-wheeler', 'ev', 'disabled']) {
      for (let i = 0; i < 2; i++) {
        const prefix = category === 'two-wheeler' ? 'B' : category === 'ev' ? 'E' : category === 'disabled' ? 'D' : 'C';
        slotsData.push({
          number: `C-${prefix}${floor}${String.fromCharCode(65 + i)}`,
          locationId: locC._id,
          location: `${locC.name} (${locC.area})`,
          category,
          floor,
          status: 'available',
          ...pricing[category],
          features: category === 'ev' ? ['covered', 'cctv', 'ev-charging'] : ['covered', 'cctv'],
        });
      }
    }
  }

  // 4. Seed Slots for Mall D (Varachha Mini Bazar)
  for (let floor = 1; floor <= 2; floor++) {
    for (const category of ['two-wheeler', 'four-wheeler']) {
      for (let i = 0; i < 3; i++) {
        const prefix = category === 'two-wheeler' ? 'B' : 'C';
        slotsData.push({
          number: `D-${prefix}${floor}${String.fromCharCode(65 + i)}`,
          locationId: locD._id,
          location: `${locD.name} (${locD.area})`,
          category,
          floor,
          status: 'available',
          ...pricing[category],
          features: ['covered', 'cctv'],
        });
      }
    }
  }

  // 5. Seed Slots for Mall E (Adajan Prime Shoppers)
  for (let floor = 1; floor <= 3; floor++) {
    for (const category of ['two-wheeler', 'four-wheeler', 'ev']) {
      for (let i = 0; i < 2; i++) {
        const prefix = category === 'two-wheeler' ? 'B' : category === 'ev' ? 'E' : 'C';
        slotsData.push({
          number: `E-${prefix}${floor}${String.fromCharCode(65 + i)}`,
          locationId: locE._id,
          location: `${locE.name} (${locE.area})`,
          category,
          floor,
          status: 'available',
          ...pricing[category],
          features: category === 'ev' ? ['covered', 'cctv', 'ev-charging'] : ['covered', 'cctv'],
        });
      }
    }
  }

  // 6. Seed Slots for Mall F (Vesu Boulevard)
  for (let floor = 1; floor <= 3; floor++) {
    for (const category of ['four-wheeler', 'ev', 'disabled']) {
      for (let i = 0; i < 2; i++) {
        const prefix = category === 'ev' ? 'E' : category === 'disabled' ? 'D' : 'C';
        slotsData.push({
          number: `F-${prefix}${floor}${String.fromCharCode(65 + i)}`,
          locationId: locF._id,
          location: `${locF.name} (${locF.area})`,
          category,
          floor,
          status: 'available',
          ...pricing[category],
          features: ['covered', 'cctv', 'vip'],
        });
      }
    }
  }

  // Emergency Buffers for Mall A
  for (let floor = 1; floor <= 3; floor++) {
    slotsData.push({
      number: `BUF-${floor}A`,
      locationId: locA._id,
      location: `${locA.name} (${locA.area})`,
      category: 'four-wheeler',
      floor,
      status: 'available',
      pricePerHour: 30,
      pricePerDay: 150,
      pricePerMonth: 3000,
      isEmergencyBuffer: true,
      features: ['emergency_buffer', 'vip_standby', 'cctv', 'priority_access'],
    });
    slotsData.push({
      number: `BUF-${floor}B`,
      locationId: locA._id,
      location: `${locA.name} (${locA.area})`,
      category: 'ev',
      floor,
      status: 'available',
      pricePerHour: 40,
      pricePerDay: 160,
      pricePerMonth: 3500,
      isEmergencyBuffer: true,
      features: ['emergency_buffer', 'vip_standby', 'cctv', 'ev-charging'],
    });
  }

  const slots = await ParkingSlot.insertMany(slotsData);

  // Seed Watchlist / Blacklist
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
    slotNumber: 'A-C1A',
    type: 'vehicle_damage',
    severity: 'medium',
    description: 'Minor bumper scratch reported on arrival near Pillar B',
    reportedBy: security._id,
    reportedByName: security.name,
    status: 'open',
  });

  // Seed Waiting List Entries
  await WaitingList.create([
    {
      user: user1._id,
      category: 'four-wheeler',
      locationId: locA._id,
      status: 'waiting',
      joinedAt: new Date(Date.now() - 25 * 60000)
    },
    {
      user: user2._id,
      category: 'ev',
      locationId: locF._id,
      status: 'waiting',
      joinedAt: new Date(Date.now() - 10 * 60000)
    }
  ]);

  // Seed Sample Historical and Active Bookings for Rich Analytics
  const now = new Date();
  const sampleBookings = [];
  const carSlot = slots.find(s => s.category === 'four-wheeler');
  const bikeSlot = slots.find(s => s.category === 'two-wheeler');
  const evSlot = slots.find(s => s.category === 'ev');
  const disSlot = slots.find(s => s.category === 'disabled');

  // Active booking for User 1
  if (carSlot) {
    sampleBookings.push({
      user: user1._id,
      slot: carSlot._id,
      locationId: locA._id,
      vehicleNumber: user1.vehicleNumber || 'GJ-05-CD-5678',
      vehicleType: '4-wheeler',
      status: 'active',
      paymentStatus: 'paid',
      startTime: new Date(now.getTime() - 45 * 60000),
      endTime: new Date(now.getTime() + 75 * 60000),
      entryTime: new Date(now.getTime() - 40 * 60000),
      duration: 2,
      amount: 60,
      createdAt: new Date(now.getTime() - 50 * 60000)
    });
  }

  // Generate 18 realistic past bookings across the last 14 days
  for (let i = 1; i <= 18; i++) {
    const daysAgo = i % 10;
    const hour = 8 + (i * 2) % 12;
    const bDate = new Date(now);
    bDate.setDate(bDate.getDate() - daysAgo);
    bDate.setHours(hour, (i * 17) % 60, 0, 0);

    const slotChoice = i % 4 === 0 ? disSlot : i % 3 === 0 ? evSlot : i % 2 === 0 ? bikeSlot : carSlot;
    const dur = 1 + (i % 3);
    const amount = (slotChoice?.pricePerHour || 30) * dur;

    sampleBookings.push({
      user: i % 2 === 0 ? user1._id : user2._id,
      slot: slotChoice?._id || slots[0]._id,
      locationId: locA._id,
      vehicleNumber: i % 2 === 0 ? 'GJ-05-CD-5678' : 'GJ-01-AB-1234',
      vehicleType: slotChoice?.category === 'two-wheeler' ? '2-wheeler' : '4-wheeler',
      status: 'completed',
      paymentStatus: 'paid',
      startTime: bDate,
      endTime: new Date(bDate.getTime() + dur * 3600000),
      entryTime: new Date(bDate.getTime() + 5 * 60000),
      exitTime: new Date(bDate.getTime() + dur * 3600000),
      duration: dur,
      amount,
      createdAt: bDate
    });
  }

  // Add No-Show entries (status: 'expired') for No-Show Report
  sampleBookings.push({
    user: user1._id,
    slot: carSlot?._id || slots[0]._id,
    locationId: locA._id,
    vehicleNumber: 'GJ-05-CD-5678',
    vehicleType: '4-wheeler',
    status: 'expired',
    paymentStatus: 'paid',
    cancellationReason: 'Auto-cancelled due to No-Show (Failed to check-in within 30 minutes)',
    startTime: new Date(now.getTime() - 2 * 3600000),
    endTime: new Date(now.getTime() - 3600000),
    duration: 1,
    amount: 30,
    overstayPenalty: 15,
    penaltyPaymentStatus: 'paid',
    createdAt: new Date(now.getTime() - 3 * 3600000)
  });
  sampleBookings.push({
    user: user2._id,
    slot: bikeSlot?._id || slots[1]._id,
    locationId: locB._id,
    vehicleNumber: 'GJ-01-AB-1234',
    vehicleType: '2-wheeler',
    status: 'expired',
    paymentStatus: 'paid',
    cancellationReason: 'Auto-cancelled due to No-Show (Failed to check-in within 30 minutes)',
    startTime: new Date(now.getTime() - 5 * 3600000),
    endTime: new Date(now.getTime() - 4 * 3600000),
    duration: 1,
    amount: 15,
    overstayPenalty: 10,
    penaltyPaymentStatus: 'pending',
    createdAt: new Date(now.getTime() - 6 * 3600000)
  });

  // Add Overstay entries (overstayDuration > 0) for Overstay Report
  sampleBookings.push({
    user: user1._id,
    slot: carSlot?._id || slots[0]._id,
    locationId: locA._id,
    vehicleNumber: 'GJ-05-CD-5678',
    vehicleType: '4-wheeler',
    status: 'completed',
    paymentStatus: 'paid',
    startTime: new Date(now.getTime() - 6 * 3600000),
    endTime: new Date(now.getTime() - 4 * 3600000),
    entryTime: new Date(now.getTime() - 6 * 3600000),
    exitTime: new Date(now.getTime() - 3 * 3600000 - 15 * 60000), // 45 mins late
    duration: 2,
    amount: 60,
    overstayDuration: 45,
    overstayPenalty: 75,
    penaltyPaymentStatus: 'paid',
    createdAt: new Date(now.getTime() - 7 * 3600000)
  });
  sampleBookings.push({
    user: user2._id,
    slot: evSlot?._id || slots[2]._id,
    locationId: locC._id,
    vehicleNumber: 'GJ-03-EV-9999',
    vehicleType: '4-wheeler',
    status: 'completed',
    paymentStatus: 'paid',
    startTime: new Date(now.getTime() - 10 * 3600000),
    endTime: new Date(now.getTime() - 8 * 3600000),
    entryTime: new Date(now.getTime() - 10 * 3600000),
    exitTime: new Date(now.getTime() - 7 * 3600000 - 30 * 60000), // 30 mins late
    duration: 2,
    amount: 80,
    overstayDuration: 30,
    overstayPenalty: 50,
    penaltyPaymentStatus: 'paid',
    createdAt: new Date(now.getTime() - 11 * 3600000)
  });

  await Booking.insertMany(sampleBookings);

  // Seed Real Initial Notifications
  await Notification.create([
    {
      user: admin._id,
      title: 'New Online Reservation',
      message: 'Slot A-C1A booked by John Doe (GJ-05-CD-5678)',
      type: 'booking',
      read: false,
      createdAt: new Date(now.getTime() - 15 * 60000)
    },
    {
      user: admin._id,
      title: 'Payment Confirmed',
      message: '₹60 received via Razorpay UPI for Slot A-C1A',
      type: 'payment',
      read: false,
      createdAt: new Date(now.getTime() - 14 * 60000)
    },
    {
      user: admin._id,
      title: 'New Waiting Queue Entry',
      message: 'Driver joined waiting list for EV Charging Bay at Vesu Boulevard',
      type: 'alert',
      read: false,
      createdAt: new Date(now.getTime() - 10 * 60000)
    }
  ]);

  return {
    usersCount: 5,
    locationsCount: createdLocations.length,
    slotsCount: slots.length,
    bookingsCount: sampleBookings.length,
  };
};

module.exports = { seedAll };
