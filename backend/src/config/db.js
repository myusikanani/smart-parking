const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn('⚠️ MONGO_URI environment variable is missing');
    }

    cachedPromise = mongoose
      .connect(uri || 'mongodb://127.0.0.1:27017/parking-system', {
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m.connection;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        throw err;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
