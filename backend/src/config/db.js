const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parking-system';

    cachedPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 4000,
      })
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m.connection;
      })
      .catch(async (err) => {
        console.warn(`⚠️ Primary MongoDB Connection Failed (${err.message}). Trying fallback local MongoDB...`);
        try {
          const fallback = await mongoose.connect('mongodb://127.0.0.1:27017/parking-system', {
            serverSelectionTimeoutMS: 3000,
          });
          console.log(`✅ Fallback Local MongoDB Connected: ${fallback.connection.host}`);
          return fallback.connection;
        } catch (fallbackErr) {
          cachedPromise = null;
          console.error(`❌ MongoDB Connection Error: ${err.message}`);
          throw err;
        }
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
