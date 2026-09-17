const mongoose = require('mongoose');

const parkingLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    area: {
      type: String,
      required: [true, 'Area / Zone is required'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: 'Surat',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    // GeoJSON Point format: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    description: {
      type: String,
      default: '',
    },
    contactNumber: {
      type: String,
      default: '+91 98765 43210',
    },
    amenities: {
      type: [String],
      default: ['CCTV', 'Covered Parking', '24/7 Security'],
    },
    image: {
      type: String,
      default: '',
    },
    totalFloors: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true,
    },
    operatingHours: {
      type: String,
      default: '24/7 Open',
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB 2dsphere Geospatial Index for efficient nearby / proximity searches
parkingLocationSchema.index({ location: '2dsphere' });

// Ensure GeoJSON coordinates are in sync before validation
parkingLocationSchema.pre('validate', function (next) {
  if (this.latitude !== undefined && this.longitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.longitude), Number(this.latitude)],
    };
  }
  next();
});

module.exports = mongoose.model('ParkingLocation', parkingLocationSchema);
