#!/usr/bin/env node
/**
 * ParkSmart Database Backup Tool
 * Exports a full JSON snapshot of all collections with SHA-256 integrity verification.
 * Usage: node scripts/db-backup.js
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

async function runBackup() {
  console.log('📦 [DB BACKUP] Connecting to MongoDB at:', MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
  await mongoose.connect(MONGO_URI);

  try {
    const User = require('../src/models/User');
    const ParkingSlot = require('../src/models/ParkingSlot');
    const Booking = require('../src/models/Booking');
    const AuditLog = require('../src/models/AuditLog');
    const Notification = require('../src/models/Notification');
    const Layout = require('../src/models/Layout');

    console.log('📦 [DB BACKUP] Reading database collections...');
    const [users, slots, bookings, auditLogs, notifications, layouts] = await Promise.all([
      User.find().select('+password +twoFactorSecret').lean(),
      ParkingSlot.find().lean(),
      Booking.find().lean(),
      AuditLog.find().lean(),
      Notification.find().lean(),
      Layout.find().lean()
    ]);

    const backupPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      system: 'ParkSmart',
      metadata: {
        usersCount: users.length,
        slotsCount: slots.length,
        bookingsCount: bookings.length,
        auditLogsCount: auditLogs.length,
        notificationsCount: notifications.length,
        layoutsCount: layouts.length
      },
      collections: {
        users,
        slots,
        bookings,
        auditLogs,
        notifications,
        layouts
      }
    };

    const rawJson = JSON.stringify(backupPayload, null, 2);
    const checksum = crypto.createHash('sha256').update(rawJson).digest('hex');
    backupPayload.checksum = checksum;

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `parksmart-backup-${timestampStr}.json`;
    const targetPath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(targetPath, JSON.stringify(backupPayload, null, 2));

    console.log('\n========================================');
    console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`📁 File:     ${filename}`);
    console.log(`📍 Path:     ${targetPath}`);
    console.log(`🔒 SHA-256:  ${checksum}`);
    console.log(`📊 Summary:  ${users.length} users, ${slots.length} slots, ${bookings.length} bookings, ${layouts.length} layouts`);
    console.log('========================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runBackup().catch((err) => {
  console.error('❌ [DB BACKUP] Failed:', err);
  process.exit(1);
});
