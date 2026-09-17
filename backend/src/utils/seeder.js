const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Blacklist = require('../models/Blacklist');
const IncidentReport = require('../models/IncidentReport');

const seedAll = async () => {
  await User.deleteMany({});
  await ParkingLocation.deleteMany({});
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

  return {
    usersCount: 5,
    locationsCount: createdLocations.length,
    slotsCount: slots.length,
  };
};

module.exports = { seedAll };
