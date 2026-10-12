const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const DEFAULT_URI = 'mongodb+srv://myusiudaynkanani_db_user:67tkMuTXIsml8SM7@cluster0.eehhaos.mongodb.net/parking-system?retryWrites=true&w=majority&appName=Cluster0';
    const uri = process.env.MONGO_URI || DEFAULT_URI;

    cachedPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m.connection;
      })
      .catch(async (err) => {
        console.warn(`⚠️ Primary MongoDB Connection Failed (${err.message}). Retrying Atlas connection...`);
        try {
          const fallback = await mongoose.connect(DEFAULT_URI, {
            serverSelectionTimeoutMS: 5000,
          });
          console.log(`✅ Fallback MongoDB Connected: ${fallback.connection.host}`);
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
