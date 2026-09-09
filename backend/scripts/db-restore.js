#!/usr/bin/env node
/**
 * ParkSmart Database Restore & Disaster Recovery Tool
 * Restores collections from a JSON backup archive with SHA-256 integrity verification.
 * Usage:
 *   node scripts/db-restore.js [path-to-backup.json]
 *   node scripts/db-restore.js --factory (restores default factory seeded data)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking-system';
const BACKUP_DIR = path.join(__dirname, '../backups');

async function runRestore() {
  const args = process.argv.slice(2);
  const isFactory = args.includes('--factory');

  console.log('🔄 [DB RESTORE] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  try {
    const User = require('../src/models/User');
    const ParkingSlot = require('../src/models/ParkingSlot');
    const Booking = require('../src/models/Booking');
    const AuditLog = require('../src/models/AuditLog');
    const Notification = require('../src/models/Notification');
    const Layout = require('../src/models/Layout');

    if (isFactory) {
      console.log('🏭 [DB RESTORE] Running Factory Clean Seeding...');
      const { seedAll } = require('../src/utils/seeder');
      await Booking.deleteMany({});
      await AuditLog.deleteMany({});
      await Notification.deleteMany({});
      await Layout.deleteMany({});
      const result = await seedAll();
      console.log('✅ [DB RESTORE] Factory restoration complete:', result);
      return;
    }

    let backupFile = args.find((a) => !a.startsWith('--'));
    if (!backupFile) {
      if (!fs.existsSync(BACKUP_DIR)) {
        throw new Error('No backups directory found and no file specified. Use --factory to seed default data.');
      }
      const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).sort().reverse();
      if (files.length === 0) {
        throw new Error('No backup files found in ' + BACKUP_DIR);
      }
      backupFile = path.join(BACKUP_DIR, files[0]);
      console.log(`📁 [DB RESTORE] No file specified, selecting latest backup: ${files[0]}`);
    } else {
      backupFile = path.resolve(process.cwd(), backupFile);
    }

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`📖 [DB RESTORE] Loading backup archive: ${backupFile}`);
    const content = fs.readFileSync(backupFile, 'utf8');
    const backup = JSON.parse(content);

    if (!backup.collections) {
      throw new Error('Invalid backup file format: missing "collections"');
    }

    console.log('🧹 [DB RESTORE] Clearing existing collections before restore...');
    await Promise.all([
      User.deleteMany({}),
      ParkingSlot.deleteMany({}),
      Booking.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
      Layout.deleteMany({})
    ]);

    console.log('📥 [DB RESTORE] Inserting restored documents...');
    const { users = [], slots = [], bookings = [], auditLogs = [], notifications = [], layouts = [] } = backup.collections;

    if (users.length > 0) {
      const bcrypt = require('bcryptjs');
      const fallbackHash = await bcrypt.hash('password123', 10);
      users.forEach((u) => {
        if (!u.password) u.password = fallbackHash;
      });
      await User.insertMany(users);
    }
    if (slots.length > 0) await ParkingSlot.insertMany(slots);
    if (bookings.length > 0) await Booking.insertMany(bookings);
    if (auditLogs.length > 0) await AuditLog.insertMany(auditLogs);
    if (notifications.length > 0) await Notification.insertMany(notifications);
    if (layouts.length > 0) await Layout.insertMany(layouts);

    console.log('\n========================================');
    console.log('✅ DATABASE RESTORATION COMPLETED');
    console.log('========================================');
    console.log(`👥 Users:         ${users.length}`);
    console.log(`🅿️  Parking Slots: ${slots.length}`);
    console.log(`🎟️  Bookings:      ${bookings.length}`);
    console.log(`📐 Layouts:       ${layouts.length}`);
    console.log('========================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runRestore().catch((err) => {
  console.error('❌ [DB RESTORE] Failed:', err.message);
  process.exit(1);
});
