const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const ParkingLocation = require('../src/models/ParkingLocation');
const locationController = require('../src/controllers/locationController');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Test 1: getLocations
  console.log('\n--- Test 1: getLocations (Katargam) ---');
  let mockRes = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(d) { console.log('Locations count in Katargam:', d.count, d.locations?.map(l => ({ name: l.name, area: l.area, carsAvailable: l.stats?.carsAvailable, bikesAvailable: l.stats?.bikesAvailable }))); }
  };
  await locationController.getLocations({ query: { area: 'Katargam' } }, mockRes);

  // Test 2: getDistinctAreas
  console.log('\n--- Test 2: getDistinctAreas ---');
  mockRes.json = (d) => console.log('Areas:', d.areas);
  await locationController.getDistinctAreas({}, mockRes);

  // Test 3: getNearbyLocations with User in Katargam near Mall B (21.2370, 72.8295) for Cars
  // Note: Mall B has 0 cars available, Mall A has 25+ cars available!
  console.log('\n--- Test 3: getNearbyLocations (Smart Recommendation test) ---');
  mockRes.json = (d) => {
    console.log('Nearby Count:', d.count);
    console.log('Nearest Full:', d.nearestFull ? { name: d.nearestFull.name, distance: d.nearestFull.distanceFormatted, carsAvail: d.nearestFull.categoryAvailable } : 'None');
    console.log('Recommended Location:', d.recommended ? { name: d.recommended.name, distance: d.recommended.distanceFormatted, carsAvail: d.recommended.categoryAvailable } : 'None');
    console.log('Recommendation Reason:', d.recommendationReason);
    console.log('Highlights:', d.recommendationHighlights);
  };
  await locationController.getNearbyLocations({ query: { lat: '21.2370', lng: '72.8295', radius: '10', vehicleType: 'car' } }, mockRes);

  process.exit(0);
};

test().catch(err => { console.error('Test error:', err); process.exit(1); });
