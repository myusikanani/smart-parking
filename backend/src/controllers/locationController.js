const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const { logAudit } = require('../utils/auditLogger');

// Format distance nicely: "450 m" or "1.2 km"
const formatDistance = (meters) => {
  if (meters === undefined || meters === null || isNaN(meters)) return '';
  const m = Math.round(meters);
  if (m < 1000) {
    return `${m} m`;
  }
  return `${(m / 1000).toFixed(1)} km`;
};

// Map friendly vehicle type to model category
const normalizeVehicleType = (type) => {
  if (!type) return 'all';
  const t = type.toLowerCase().trim();
  if (t === 'car' || t === 'cars' || t === 'four-wheeler' || t === '4w') return 'four-wheeler';
  if (t === 'bike' || t === 'bikes' || t === 'two-wheeler' || t === '2w') return 'two-wheeler';
  if (t === 'ev' || t === 'electric') return 'ev';
  if (t === 'disabled' || t === 'accessible' || t === 'handicap') return 'disabled';
  return 'all';
};

// Helper to calculate live slot statistics for an array of location IDs or all locations
const getSlotStatsForLocations = async (locationIds) => {
  const match = { isEmergencyBuffer: { $ne: true } };
  if (locationIds && locationIds.length > 0) {
    match.locationId = { $in: locationIds };
  }

  const slots = await ParkingSlot.find(match).select('locationId category status floor');

  const statsMap = {};

  slots.forEach((s) => {
    const locIdStr = s.locationId ? s.locationId.toString() : 'unassigned';
    if (!statsMap[locIdStr]) {
      statsMap[locIdStr] = {
        totalSlots: 0,
        availableSlots: 0,
        occupiedSlots: 0,
        reservedSlots: 0,
        carsTotal: 0,
        carsAvailable: 0,
        bikesTotal: 0,
        bikesAvailable: 0,
        evTotal: 0,
        evAvailable: 0,
        disabledTotal: 0,
        disabledAvailable: 0,
      };
    }

    const st = statsMap[locIdStr];
    st.totalSlots++;
    if (s.status === 'available') st.availableSlots++;
    else if (s.status === 'occupied') st.occupiedSlots++;
    else if (s.status === 'reserved') st.reservedSlots++;

    if (s.category === 'four-wheeler') {
      st.carsTotal++;
      if (s.status === 'available') st.carsAvailable++;
    } else if (s.category === 'two-wheeler') {
      st.bikesTotal++;
      if (s.status === 'available') st.bikesAvailable++;
    } else if (s.category === 'ev') {
      st.evTotal++;
      if (s.status === 'available') st.evAvailable++;
    } else if (s.category === 'disabled') {
      st.disabledTotal++;
      if (s.status === 'available') st.disabledAvailable++;
    }
  });

  return statsMap;
};

// 1. Get all locations with optional area filter, search, and live availability stats
exports.getLocations = async (req, res) => {
  try {
    const { area, city, search, status, all } = req.query;
    const filter = {};

    if (!all && status !== 'all') {
      filter.status = status || 'active';
    }

    if (area && area !== 'all') {
      filter.area = new RegExp(`^${area.trim()}$`, 'i');
    }

    if (city && city !== 'all') {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const locations = await ParkingLocation.find(filter).sort({ area: 1, name: 1 });
    const locationIds = locations.map((loc) => loc._id);
    const statsMap = await getSlotStatsForLocations(locationIds);

    const results = locations.map((loc) => {
      const locObj = loc.toObject();
      const stats = statsMap[loc._id.toString()] || {
        totalSlots: 0,
        availableSlots: 0,
        occupiedSlots: 0,
        reservedSlots: 0,
        carsTotal: 0,
        carsAvailable: 0,
        bikesTotal: 0,
        bikesAvailable: 0,
        evTotal: 0,
        evAvailable: 0,
        disabledTotal: 0,
        disabledAvailable: 0,
      };

      return {
        ...locObj,
        stats,
        isFull: stats.totalSlots > 0 && stats.availableSlots === 0,
        occupancyRate: stats.totalSlots > 0 ? Math.round(((stats.totalSlots - stats.availableSlots) / stats.totalSlots) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      locations: results,
    });
  } catch (error) {
    console.error('getLocations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Nearby Locations using MongoDB 2dsphere Geospatial Index + Smart Recommendation
exports.getNearbyLocations = async (req, res) => {
  try {
    const { lat, lng, radius = 10, vehicleType = 'all' } = req.query;

    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude coordinates are required for nearby search.',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusInMeters = Math.max(1, parseFloat(radius) || 10) * 1000;
    const normalizedCategory = normalizeVehicleType(vehicleType);

    // MongoDB 2dsphere $geoNear pipeline
    const geoQuery = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusInMeters,
          spherical: true,
          query: { status: 'active' },
        },
      },
    ];

    let rawLocations = await ParkingLocation.aggregate(geoQuery);

    // Fallback if no locations in exact radius: grab active locations and compute distance
    if (!rawLocations || rawLocations.length === 0) {
      // Find within wider range (up to 30km) or return all active with Haversine calculated distance
      const allActive = await ParkingLocation.find({ status: 'active' }).lean();
      rawLocations = allActive.map((loc) => {
        // Haversine formula calculation for fallback
        const R = 6371000; // meters
        const dLat = ((loc.latitude - userLat) * Math.PI) / 180;
        const dLng = ((loc.longitude - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) * Math.cos((loc.latitude * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;
        return {
          ...loc,
          distanceMeters: dist,
        };
      });
    }

    // Sort by distance ascending
    rawLocations.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

    const locationIds = rawLocations.map((loc) => loc._id);
    const statsMap = await getSlotStatsForLocations(locationIds);

    const locations = rawLocations.map((loc) => {
      const stats = statsMap[loc._id.toString()] || {
        totalSlots: 0,
        availableSlots: 0,
        occupiedSlots: 0,
        reservedSlots: 0,
        carsTotal: 0,
        carsAvailable: 0,
        bikesTotal: 0,
        bikesAvailable: 0,
        evTotal: 0,
        evAvailable: 0,
        disabledTotal: 0,
        disabledAvailable: 0,
      };

      let categoryAvailable = stats.availableSlots;
      let categoryTotal = stats.totalSlots;
      if (normalizedCategory === 'four-wheeler') {
        categoryAvailable = stats.carsAvailable;
        categoryTotal = stats.carsTotal;
      } else if (normalizedCategory === 'two-wheeler') {
        categoryAvailable = stats.bikesAvailable;
        categoryTotal = stats.bikesTotal;
      } else if (normalizedCategory === 'ev') {
        categoryAvailable = stats.evAvailable;
        categoryTotal = stats.evTotal;
      } else if (normalizedCategory === 'disabled') {
        categoryAvailable = stats.disabledAvailable;
        categoryTotal = stats.disabledTotal;
      }

      const isCategoryFull = categoryTotal > 0 && categoryAvailable === 0;
      const isTotalFull = stats.totalSlots > 0 && stats.availableSlots === 0;

      return {
        ...loc,
        distanceMeters: Math.round(loc.distanceMeters || 0),
        distanceFormatted: formatDistance(loc.distanceMeters),
        stats,
        categoryAvailable,
        categoryTotal,
        isCategoryFull,
        isTotalFull,
        occupancyRate: stats.totalSlots > 0 ? Math.round(((stats.totalSlots - stats.availableSlots) / stats.totalSlots) * 100) : 0,
      };
    });

    // --- SMART LOCATION-BASED PARKING RECOMMENDATION LOGIC ---
    let recommended = null;
    let nearestFull = null;
    let recommendationReason = '';
    let recommendationHighlights = [];

    const vehicleLabels = {
      'four-wheeler': 'Cars',
      'two-wheeler': 'Bikes / Scooters',
      ev: 'Electric Vehicles (EV)',
      disabled: 'Accessible VIP',
      all: 'Vehicles',
    };
    const currentVehicleLabel = vehicleLabels[normalizedCategory] || 'Vehicles';

    if (locations.length > 0) {
      const closest = locations[0];

      // Check if closest location has availability for requested vehicle
      if (closest.categoryAvailable > 0) {
        recommended = closest;
        recommendationReason = `${closest.name} is closest to your location (${closest.distanceFormatted} away) and currently has ${closest.categoryAvailable} ${currentVehicleLabel} slot${closest.categoryAvailable > 1 ? 's' : ''} available.`;
        recommendationHighlights = [
          `Closest parking hub (${closest.distanceFormatted} away)`,
          `${closest.categoryAvailable} available ${currentVehicleLabel} slot${closest.categoryAvailable > 1 ? 's' : ''}`,
          `High availability rate (${100 - closest.occupancyRate}% bays free)`,
        ];
      } else {
        // Nearest location is FULL for the requested vehicle category
        nearestFull = closest;

        // Search for the closest alternative that has slots available
        const alternative = locations.find((l) => l.categoryAvailable > 0);

        if (alternative) {
          recommended = alternative;
          recommendationReason = `${closest.name} is closer (${closest.distanceFormatted} away) but currently full for ${currentVehicleLabel}. We recommend ${alternative.name} (${alternative.distanceFormatted} away) which currently has ${alternative.categoryAvailable} ${currentVehicleLabel} slot${alternative.categoryAvailable > 1 ? 's' : ''} available.`;
          recommendationHighlights = [
            `Fastest alternative destination (${alternative.distanceFormatted} away)`,
            `${alternative.categoryAvailable} open ${currentVehicleLabel} slots ready to book`,
            `Avoids congestion at full nearby garages`,
          ];
        } else {
          recommendationReason = `All nearby parking locations are currently full for ${currentVehicleLabel}. You can search another area or check general spots.`;
          recommendationHighlights = [
            'All nearby hubs currently at maximum capacity',
            'Consider checking an adjacent area like Adajan or Varachha',
          ];
        }
      }
    }

    res.status(200).json({
      success: true,
      count: locations.length,
      userCoordinates: { latitude: userLat, longitude: userLng },
      searchRadiusKm: parseFloat(radius) || 10,
      vehicleType: normalizedCategory,
      recommended,
      nearestFull,
      recommendationReason,
      recommendationHighlights,
      locations,
    });
  } catch (error) {
    console.error('getNearbyLocations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get distinct Areas / Zones (Katargam, Varachha, Adajan, Vesu, etc.)
exports.getDistinctAreas = async (req, res) => {
  try {
    const areas = await ParkingLocation.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 },
          city: { $first: '$city' },
          sampleCoordinates: { $first: '$location.coordinates' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = areas.map((a) => ({
      name: a._id,
      count: a.count,
      city: a.city,
      longitude: a.sampleCoordinates ? a.sampleCoordinates[0] : 72.83,
      latitude: a.sampleCoordinates ? a.sampleCoordinates[1] : 21.23,
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      areas: result,
    });
  } catch (error) {
    console.error('getDistinctAreas error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get a single location by ID with floor-wise slots breakdown
exports.getLocationById = async (req, res) => {
  try {
    const location = await ParkingLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    const slots = await ParkingSlot.find({ locationId: location._id }).sort({ floor: 1, number: 1 });
    const statsMap = await getSlotStatsForLocations([location._id]);
    const stats = statsMap[location._id.toString()] || {
      totalSlots: slots.length,
      availableSlots: slots.filter((s) => s.status === 'available').length,
    };

    // Group slots by floor
    const floorsMap = {};
    for (let f = 1; f <= (location.totalFloors || 3); f++) {
      floorsMap[f] = {
        floor: f,
        slots: [],
        total: 0,
        available: 0,
      };
    }

    slots.forEach((s) => {
      const f = s.floor || 1;
      if (!floorsMap[f]) {
        floorsMap[f] = { floor: f, slots: [], total: 0, available: 0 };
      }
      floorsMap[f].slots.push(s);
      floorsMap[f].total++;
      if (s.status === 'available') floorsMap[f].available++;
    });

    res.status(200).json({
      success: true,
      location: {
        ...location.toObject(),
        stats,
        floors: Object.values(floorsMap),
      },
    });
  } catch (error) {
    console.error('getLocationById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin: Create a new Parking Location / Mall
exports.createLocation = async (req, res) => {
  try {
    const {
      name,
      code,
      area,
      city = 'Surat',
      address,
      latitude,
      longitude,
      description,
      contactNumber,
      amenities,
      image,
      totalFloors = 3,
      status = 'active',
      operatingHours,
    } = req.body;

    if (!name || !area || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, Area, Address, Latitude, and Longitude are required.',
      });
    }

    const location = await ParkingLocation.create({
      name,
      code: code || name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase(),
      area,
      city,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      description,
      contactNumber,
      amenities: Array.isArray(amenities) ? amenities : ['CCTV', 'Covered Parking', '24/7 Security'],
      image: image || '',
      totalFloors: Number(totalFloors) || 3,
      status,
      operatingHours: operatingHours || '24/7 Open',
    });

    await logAudit(
      req.user?._id,
      req.user?.name || 'Admin',
      'CREATE_LOCATION',
      'ParkingLocation',
      location._id,
      `Created new parking location '${location.name}' in area '${location.area}'`,
      req
    );

    res.status(201).json({
      success: true,
      message: `Parking location '${location.name}' created successfully!`,
      location,
    });
  } catch (error) {
    console.error('createLocation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin: Update Parking Location
exports.updateLocation = async (req, res) => {
  try {
    const location = await ParkingLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    const {
      name,
      code,
      area,
      city,
      address,
      latitude,
      longitude,
      description,
      contactNumber,
      amenities,
      image,
      totalFloors,
      status,
      operatingHours,
    } = req.body;

    if (name) location.name = name;
    if (code) location.code = code;
    if (area) location.area = area;
    if (city) location.city = city;
    if (address) location.address = address;
    if (description !== undefined) location.description = description;
    if (contactNumber) location.contactNumber = contactNumber;
    if (amenities) location.amenities = amenities;
    if (image !== undefined) location.image = image;
    if (totalFloors) location.totalFloors = Number(totalFloors);
    if (status) location.status = status;
    if (operatingHours) location.operatingHours = operatingHours;

    if (latitude !== undefined && longitude !== undefined) {
      location.latitude = Number(latitude);
      location.longitude = Number(longitude);
      location.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    await location.save();

    // If name changed, update location string in associated slots
    if (name) {
      await ParkingSlot.updateMany(
        { locationId: location._id },
        { $set: { location: `${location.name} (${location.area})` } }
      );
    }

    await logAudit(
      req.user?._id,
      req.user?.name || 'Admin',
      'UPDATE_LOCATION',
      'ParkingLocation',
      location._id,
      `Updated parking location '${location.name}'`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Parking location '${location.name}' updated successfully!`,
      location,
    });
  } catch (error) {
    console.error('updateLocation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Admin: Delete Parking Location (Safe delete check)
exports.deleteLocation = async (req, res) => {
  try {
    const location = await ParkingLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    // Check for active bookings on slots in this location
    const slots = await ParkingSlot.find({ locationId: location._id }).select('_id');
    const slotIds = slots.map((s) => s._id);

    const activeBookings = await Booking.countDocuments({
      slot: { $in: slotIds },
      status: { $in: ['pending', 'confirmed', 'active'] },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete location. There are ${activeBookings} active/confirmed bookings associated with this location. Please cancel or complete them first, or set location status to 'inactive'.`,
      });
    }

    // Unassign slots from this location or remove them
    await ParkingSlot.updateMany(
      { locationId: location._id },
      { $unset: { locationId: 1 }, $set: { location: 'Unassigned Hub' } }
    );

    await ParkingLocation.findByIdAndDelete(req.params.id);

    await logAudit(
      req.user?._id,
      req.user?.name || 'Admin',
      'DELETE_LOCATION',
      'ParkingLocation',
      location._id,
      `Deleted parking location '${location.name}'`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Parking location '${location.name}' deleted successfully. Associated slots have been unassigned.`,
    });
  } catch (error) {
    console.error('deleteLocation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
