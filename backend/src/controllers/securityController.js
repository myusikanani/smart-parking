const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');
const Blacklist = require('../models/Blacklist');
const IncidentReport = require('../models/IncidentReport');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { verifyDynamicQRToken } = require('../utils/dynamicQR');
const { emitSlotUpdate, emitBookingUpdate, emitVehicleMotion, emitAlert } = require('../utils/socket');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const getStartOfDay = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

exports.getTodayLogs = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        totalMovements: 0,
        entries: 0,
        exits: 0,
        logs: []
      });
    }

    const logs = await Booking.find({
      $or: [
        { entryTime: { $gte: startOfDay, $lte: endOfDay } },
        { exitTime: { $gte: startOfDay, $lte: endOfDay } }
      ]
    })
      .populate('slot', 'number category pricePerHour')
      .populate('user', 'name vehicleNumber phone')
      .sort({ updatedAt: -1 });

    const entries = logs.filter(log => log.status === 'active').length;
    const exits = logs.filter(log => log.status === 'completed' && log.exitTime >= startOfDay && log.exitTime <= endOfDay).length;

    res.status(200).json({
      success: true,
      totalMovements: logs.length,
      entries,
      exits,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        stats: {
          todayEntries: 12,
          todayExits: 8,
          currentOccupancy: 15,
          pendingVerifications: 3,
          blacklistedCount: 2,
          openIncidentsCount: 1,
          recentActivity: []
        }
      });
    }

    const [
      todayEntries,
      todayExits,
      currentOccupancy,
      pendingVerifications,
      blacklistedCount,
      openIncidentsCount,
      recentActivity
    ] = await Promise.all([
      Booking.countDocuments({ status: 'active', entryTime: { $gte: startOfDay, $lte: endOfDay } }),
      Booking.countDocuments({ status: 'completed', exitTime: { $gte: startOfDay, $lte: endOfDay } }),
      Booking.countDocuments({ status: 'active' }),
      Booking.countDocuments({ status: 'confirmed', startTime: { $gte: startOfDay, $lte: endOfDay } }),
      Blacklist.countDocuments({ isActive: true }),
      IncidentReport.countDocuments({ status: { $in: ['open', 'investigating'] } }),
      Booking.find()
        .populate('slot', 'number category')
        .populate('user', 'name vehicleNumber')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      stats: {
        todayEntries,
        todayExits,
        currentOccupancy,
        pendingVerifications,
        blacklistedCount,
        openIncidentsCount,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scanQR = async (req, res) => {
  try {
    const { qrToken, gateMode } = req.body;
    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'qrToken is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const type = gateMode || 'entry';
      const slotNum = qrToken.length === 3 ? qrToken : 'A-04';
      const mockBooking = {
        _id: 'mock_' + Date.now(),
        bookingId: 'mock_' + Date.now(),
        slotNumber: slotNum,
        vehicleNumber: 'MH-12-AB-3456',
        userName: 'Rahul Sharma',
        startTime: new Date().toLocaleTimeString(),
        endTime: new Date(Date.now() + 2 * 3600000).toLocaleTimeString(),
        entryTime: new Date(),
        exitTime: type === 'exit' ? new Date() : undefined,
        duration: type === 'exit' ? 2 : undefined,
        amount: 60,
        overstayDuration: 0,
        overstayPenalty: 0,
        totalPaid: 60
      };
      return res.status(200).json({
        success: true,
        allowed: true,
        type,
        message: type === 'entry' ? 'ENTRY ALLOWED' : 'EXIT SUCCESSFUL',
        booking: mockBooking
      });
    }

    const rawToken = String(qrToken).trim();
    let booking = null;

    // 1. Check if token is a Dynamic Rotating QR Token
    if (rawToken.startsWith('PS-DYN|')) {
      const dynamicCheck = verifyDynamicQRToken(rawToken);
      const candidateId = dynamicCheck.bookingId;
      if (candidateId) {
        if (mongoose.Types.ObjectId.isValid(candidateId)) {
          booking = await Booking.findById(candidateId).populate('slot').populate('user');
        }
        if (!booking) {
          booking = await Booking.findOne({
            $or: [
              { _id: mongoose.Types.ObjectId.isValid(candidateId) ? candidateId : null },
              { qrToken: candidateId },
              { vehicleNumber: candidateId.toUpperCase() }
            ]
          }).populate('slot').populate('user');
        }
      }
      if (!booking && !dynamicCheck.isValid) {
        return res.status(400).json({
          success: false,
          allowed: false,
          message: 'Dynamic QR token is expired or invalid. Please refresh the QR screen.'
        });
      }
    }

    // 2. Fallback to standard UUID qrToken
    if (!booking) {
      booking = await Booking.findOne({
        qrToken: { $regex: `^${rawToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      })
        .populate('slot')
        .populate('user');
    }

    // 3. Fallback to MongoDB _id or vehicleNumber / License Plate
    if (!booking) {
      if (mongoose.Types.ObjectId.isValid(rawToken)) {
        booking = await Booking.findById(rawToken).populate('slot').populate('user');
      }
      
      const cleanPlate = rawToken.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // If it looks like a vehicle plate, check blacklist first
      if (cleanPlate.length >= 4 && cleanPlate.length <= 16) {
        const directBlacklist = await Blacklist.findOne({
          vehicleNumber: { $regex: `^${cleanPlate}$|^${rawToken.toUpperCase()}$`, $options: 'i' },
          isActive: true
        });

        if (directBlacklist) {
          await logAudit(req, {
            action: 'Blacklisted Vehicle Scan Alert',
            details: `Blacklisted vehicle ${rawToken.toUpperCase()} scanned at ${gateMode || 'gate'}. Severity: ${directBlacklist.severity} - Reason: ${directBlacklist.reason}`,
            actionType: 'blacklist_add',
            userId: req.user?._id
          });

          emitAlert({
            type: 'blacklist_warning',
            vehicleNumber: rawToken.toUpperCase(),
            reason: directBlacklist.reason,
            severity: directBlacklist.severity,
            timestamp: new Date().toISOString()
          });

          return res.status(403).json({
            success: false,
            allowed: false,
            blacklisted: true,
            blacklistDetails: directBlacklist,
            vehicleNumber: rawToken.toUpperCase(),
            message: `CRITICAL ALERT: Vehicle ${rawToken.toUpperCase()} is BLACKLISTED (${directBlacklist.reason.toUpperCase()}). Entry forbidden. Notify authorities.`
          });
        }
      }

      if (!booking) {
        // Try finding active/confirmed booking by vehicleNumber (exact or regex)
        booking = await Booking.findOne({
          $or: [
            { vehicleNumber: rawToken.toUpperCase() },
            { vehicleNumber: { $regex: `^${cleanPlate.split('').join('[- ]?')}$`, $options: 'i' } }
          ],
          status: gateMode === 'exit' ? 'active' : { $in: ['confirmed', 'active'] }
        }).populate('slot').populate('user');
      }
    }

    if (!booking) {
      return res.status(400).json({
        success: false,
        allowed: false,
        unbookedVehicle: true,
        vehicleNumber: rawToken.toUpperCase(),
        message: `No active paid booking found for vehicle plate / token "${rawToken}".`
      });
    }

    // 4. Blacklist Check on Confirmed Booking Vehicle Number
    const vehicleNum = (booking.vehicleNumber || '').toUpperCase().trim();
    const blacklistMatch = await Blacklist.findOne({ vehicleNumber: vehicleNum, isActive: true });
    if (blacklistMatch) {
      await logAudit(req, {
        action: 'Blacklisted Vehicle Scan Alert',
        details: `Blacklisted vehicle ${vehicleNum} scanned at ${gateMode || 'gate'}. Severity: ${blacklistMatch.severity} - Reason: ${blacklistMatch.reason}`,
        actionType: 'blacklist_add',
        userId: req.user?._id
      });

      emitAlert({
        type: 'blacklist_warning',
        vehicleNumber: vehicleNum,
        reason: blacklistMatch.reason,
        severity: blacklistMatch.severity,
        timestamp: new Date().toISOString()
      });

      if (blacklistMatch.severity === 'police_wanted' || blacklistMatch.severity === 'danger') {
        return res.status(403).json({
          success: false,
          allowed: false,
          blacklisted: true,
          blacklistDetails: blacklistMatch,
          message: `CRITICAL ALERT: Vehicle ${vehicleNum} is BLACKLISTED (${blacklistMatch.reason.toUpperCase()}). Entry forbidden. Notify authorities.`
        });
      }
    }

    return processScan(req, res, booking, gateMode, blacklistMatch);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const processScan = async (req, res, booking, mode, blacklistMatch = null) => {
  const type = mode || (booking.status === 'active' ? 'exit' : 'entry');

  if (type === 'entry') {
    // Payment check
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: 'ENTRY DENIED: Booking is unpaid. Please complete payment.'
      });
    }

    // Status state check
    if (booking.status === 'active') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: 'ENTRY DENIED: Vehicle has already entered the parking lot.'
      });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: 'ENTRY DENIED: Booking session has already been completed.'
      });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: `ENTRY DENIED: Booking is not in a valid state (${booking.status}).`
      });
    }

    // Time Window check: Valid 10 mins before startTime until 15 mins after startTime for initial entry
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const earlyEntryWindow = new Date(startTime.getTime() - 10 * 60 * 1000);
    const graceExpiryWindow = new Date(startTime.getTime() + 15 * 60 * 1000);

    if (now.getTime() < earlyEntryWindow.getTime()) {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: `ENTRY DENIED: Too early. QR pass activates 10 minutes before slot start time (at ${earlyEntryWindow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
      });
    }
    if (now.getTime() > graceExpiryWindow.getTime() && booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'entry',
        message: `ENTRY DENIED: 15-minute gate entry grace period expired at ${graceExpiryWindow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Slot released.`
      });
    }

    // Process entry
    booking.status = 'active';
    booking.entryTime = now;
    await booking.save();

    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'occupied' });
      emitSlotUpdate({ slotId: booking.slot._id, status: 'occupied' });
      emitVehicleMotion({ slotId: booking.slot._id, phase: 'entering' });
    }

    emitBookingUpdate({ bookingId: booking._id, status: 'active' });

    await logAudit(req, {
      action: 'Vehicle Entry',
      details: `${booking.vehicleNumber} entered slot ${booking.slot?.number || 'A-01'} (booking ${booking._id})`,
      actionType: 'entry',
      userId: booking.user?._id || req.user?._id
    });

    return res.status(200).json({
      success: true,
      allowed: true,
      type: 'entry',
      warning: blacklistMatch ? `Vehicle flagged as warning: ${blacklistMatch.reason}` : undefined,
      message: 'ENTRY ALLOWED',
      booking: {
        id: booking._id,
        slotNumber: booking.slot?.number || 'A-01',
        vehicleNumber: booking.vehicleNumber,
        userName: booking.user?.name || 'Driver',
        startTime: booking.startTime,
        endTime: booking.endTime,
        entryTime: booking.entryTime
      }
    });
  } else {
    // Exit scan
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        allowed: false,
        type: 'exit',
        message: 'EXIT DENIED: Vehicle is not currently marked inside the parking lot.'
      });
    }

    const exitTime = new Date();
    const entryTime = new Date(booking.entryTime || booking.startTime);
    const durationHours = Math.max(1, Math.ceil((exitTime.getTime() - entryTime.getTime()) / 3600000));

    let overstayHours = 0;
    let overstayPenalty = 0;

    const endTime = new Date(booking.endTime);
    if (exitTime.getTime() > endTime.getTime()) {
      overstayHours = Math.ceil((exitTime.getTime() - endTime.getTime()) / 3600000);
      const hourlyRate = booking.slot?.pricePerHour || 30;
      const rate = parseFloat(process.env.OVERSTAY_RATE) || hourlyRate * 1.5;
      overstayPenalty = overstayHours * rate;
    }

    booking.overstayDuration = overstayHours;
    booking.overstayPenalty = overstayPenalty;

    if (overstayPenalty > 0) {
      booking.penaltyPaymentStatus = 'pending';
      await booking.save();

      await logAudit(req, {
        action: 'Overstay Detected at Exit',
        details: `${booking.vehicleNumber} overstayed ${overstayHours}h — ₹${overstayPenalty} penalty due before exit (booking ${booking._id})`,
        actionType: 'exit',
        userId: booking.user?._id || req.user?._id
      });

      return res.status(200).json({
        success: true,
        allowed: true,
        type: 'exit',
        paymentRequired: true,
        message: `OVERSTAY: Additional payment of ₹${overstayPenalty} required before exit.`,
        booking: {
          id: booking._id,
          slotNumber: booking.slot?.number || 'A-01',
          vehicleNumber: booking.vehicleNumber,
          userName: booking.user?.name || 'Driver',
          startTime: booking.startTime,
          endTime: booking.endTime,
          entryTime: booking.entryTime,
          duration: durationHours,
          amount: booking.amount,
          overstayDuration: overstayHours,
          overstayPenalty,
          totalDue: overstayPenalty
        }
      });
    }

    booking.status = 'completed';
    booking.exitTime = exitTime;
    await booking.save();

    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id || booking.slot, { status: 'available' });
      emitSlotUpdate({ slotId: booking.slot._id || booking.slot, status: 'available' });
      emitVehicleMotion({ slotId: booking.slot._id || booking.slot, phase: 'exiting' });
    }

    emitBookingUpdate({ bookingId: booking._id, status: 'completed' });

    await logAudit(req, {
      action: 'Vehicle Exit',
      details: `${booking.vehicleNumber} exited slot ${booking.slot?.number || 'A-01'} after ${durationHours}h (booking ${booking._id})`,
      actionType: 'exit',
      userId: booking.user?._id || req.user?._id
    });

    return res.status(200).json({
      success: true,
      allowed: true,
      type: 'exit',
      message: 'EXIT SUCCESSFUL',
      booking: {
        id: booking._id,
        slotNumber: booking.slot?.number || 'A-01',
        vehicleNumber: booking.vehicleNumber,
        userName: booking.user?.name || 'Driver',
        startTime: booking.startTime,
        endTime: booking.endTime,
        entryTime: booking.entryTime,
        exitTime,
        duration: durationHours,
        amount: booking.amount,
        overstayDuration: overstayHours,
        overstayPenalty,
        totalPaid: booking.amount + overstayPenalty
      }
    });
  }
};

exports.manualVerify = async (req, res) => {
  try {
    const { vehicleNumber, gateMode } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'vehicleNumber is required' });
    }

    const cleanPlate = vehicleNumber.toUpperCase().trim();

    // Check Blacklist
    let blacklistMatch = null;
    if (mongoose.connection.readyState === 1) {
      blacklistMatch = await Blacklist.findOne({ vehicleNumber: cleanPlate, isActive: true });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 1,
        blacklistAlert: null,
        bookings: [{
          _id: 'mock_manual_' + Date.now(),
          vehicleNumber: cleanPlate,
          slot: { number: 'A-04', category: 'four-wheeler' },
          user: { name: 'Rahul Sharma' },
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 3600000).toISOString()
        }]
      });
    }

    const searchStatus = gateMode === 'exit' ? 'active' : 'confirmed';

    const bookings = await Booking.find({
      vehicleNumber: { $regex: new RegExp(`^${cleanPlate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: searchStatus
    })
      .populate('slot')
      .populate('user');

    if (!bookings.length) {
      return res.status(400).json({
        success: false,
        blacklistAlert: blacklistMatch,
        message: `No ${searchStatus} booking found for vehicle ${cleanPlate}`
      });
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      blacklistAlert: blacklistMatch,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 1. BLACKLIST & WATCHLIST MANAGEMENT
// ==========================================
exports.getBlacklist = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 2,
        data: [
          {
            _id: 'mock_bl_1',
            vehicleNumber: 'MH-04-XX-9999',
            reason: 'stolen',
            severity: 'police_wanted',
            notes: 'Reported stolen at Police Station',
            addedByName: 'Security Head',
            isActive: true,
            createdAt: new Date()
          }
        ]
      });
    }

    const list = await Blacklist.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToBlacklist = async (req, res) => {
  try {
    const { vehicleNumber, reason, severity, notes } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    }

    const cleanPlate = vehicleNumber.toUpperCase().trim();

    const entry = await Blacklist.findOneAndUpdate(
      { vehicleNumber: cleanPlate },
      {
        vehicleNumber: cleanPlate,
        reason: reason || 'stolen',
        severity: severity || 'danger',
        notes: notes || '',
        addedBy: req.user?._id,
        addedByName: req.user?.name || 'Security Officer',
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await logAudit(req, {
      action: 'Vehicle Added to Blacklist',
      details: `Vehicle ${cleanPlate} flagged as ${severity || 'danger'} (${reason || 'stolen'})`,
      actionType: 'blacklist_add',
      userId: req.user?._id
    });

    emitAlert({
      type: 'blacklist_updated',
      vehicleNumber: cleanPlate,
      action: 'added',
      reason: entry.reason
    });

    res.status(201).json({ success: true, message: 'Vehicle added to watchlist', data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromBlacklist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Blacklist.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Watchlist entry not found' });
    }

    await logAudit(req, {
      action: 'Vehicle Removed from Blacklist',
      details: `Vehicle ${entry.vehicleNumber} unflagged by security`,
      actionType: 'blacklist_remove',
      userId: req.user?._id
    });

    res.status(200).json({ success: true, message: 'Vehicle removed from active watchlist', data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. INCIDENT & DAMAGE REPORTING
// ==========================================
exports.getIncidentReports = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 1,
        data: [{
          _id: 'mock_inc_1',
          incidentId: 'INC-102938',
          vehicleNumber: 'DL-01-AB-1122',
          type: 'vehicle_damage',
          severity: 'medium',
          description: 'Scratch on rear bumper upon arrival',
          status: 'open',
          createdAt: new Date()
        }]
      });
    }

    const incidents = await IncidentReport.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIncidentReport = async (req, res) => {
  try {
    const { vehicleNumber, slotNumber, type, severity, description, photoUrl, fineAmount, bookingId } = req.body;

    if (!vehicleNumber || !description) {
      return res.status(400).json({ success: false, message: 'Vehicle number and description are required' });
    }

    const incident = await IncidentReport.create({
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      slotNumber: slotNumber || 'N/A',
      bookingId: bookingId || undefined,
      type: type || 'vehicle_damage',
      severity: severity || 'medium',
      description,
      photoUrl: photoUrl || '',
      fineAmount: Number(fineAmount) || 0,
      reportedBy: req.user?._id,
      reportedByName: req.user?.name || 'Security Guard'
    });

    await logAudit(req, {
      action: 'Incident Reported',
      details: `${incident.incidentId}: ${incident.type} for ${incident.vehicleNumber} (${incident.severity})`,
      actionType: 'incident_report',
      userId: req.user?._id
    });

    emitAlert({
      type: 'incident_created',
      incidentId: incident.incidentId,
      vehicleNumber: incident.vehicleNumber,
      severity: incident.severity
    });

    res.status(201).json({ success: true, message: 'Incident reported successfully', data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const incident = await IncidentReport.findByIdAndUpdate(
      id,
      {
        status,
        resolutionNotes: resolutionNotes || '',
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.status(200).json({ success: true, message: 'Incident updated', data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. OFFLINE / WALK-IN GUEST PASS CREATION
// ==========================================
exports.createWalkinPass = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, durationHours = 2, driverName, driverPhone } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    }

    const cleanPlate = vehicleNumber.toUpperCase().trim();

    // Check Blacklist first
    const blacklistMatch = await Blacklist.findOne({ vehicleNumber: cleanPlate, isActive: true });
    if (blacklistMatch && (blacklistMatch.severity === 'police_wanted' || blacklistMatch.severity === 'danger')) {
      return res.status(403).json({
        success: false,
        blacklisted: true,
        message: `DENIED: Vehicle ${cleanPlate} is BLACKLISTED (${blacklistMatch.reason}). Cannot issue pass.`
      });
    }

    // Category mapping
    const category = vehicleType === 'two-wheeler' || vehicleType === 'bike' ? 'two-wheeler' : (vehicleType === 'ev' ? 'ev' : 'four-wheeler');

    // Find available slot
    let slot = await ParkingSlot.findOne({ category, status: 'available' });
    if (!slot) {
      slot = await ParkingSlot.findOne({ status: 'available' });
    }

    if (!slot) {
      return res.status(400).json({ success: false, message: 'No available parking slots for this category' });
    }

    const now = new Date();
    const duration = Number(durationHours) || 2;
    const endTime = new Date(now.getTime() + duration * 3600000);
    const amount = slot.pricePerHour * duration;
    const qrToken = uuidv4();

    // Find or create Guest User
    let guestUser = await User.findOne({ email: 'guest@parksmart.local' });
    if (!guestUser) {
      guestUser = await User.create({
        name: driverName || 'Walk-in Guest',
        email: 'guest@parksmart.local',
        phone: driverPhone || '0000000000',
        password: uuidv4(),
        role: 'user'
      });
    }

    const qrDataUrl = await QRCode.toDataURL(qrToken);

    const booking = await Booking.create({
      user: guestUser._id,
      slot: slot._id,
      vehicleNumber: cleanPlate,
      startTime: now,
      endTime,
      entryTime: now,
      status: 'active',
      paymentStatus: 'paid', // Cash/Card collected at gate
      amount,
      duration,
      qrToken,
      qrCode: qrDataUrl
    });

    slot.status = 'occupied';
    await slot.save();

    emitSlotUpdate({ slotId: slot._id, status: 'occupied' });
    emitBookingUpdate({ bookingId: booking._id, status: 'active' });
    emitVehicleMotion({ slotId: slot._id, phase: 'entering' });

    await logAudit(req, {
      action: 'Walk-in Pass Issued',
      details: `Gate pass issued for ${cleanPlate} in slot ${slot.number} (₹${amount})`,
      actionType: 'walkin_entry',
      userId: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Walk-in pass generated and vehicle entered',
      pass: {
        bookingId: booking._id,
        vehicleNumber: cleanPlate,
        slotNumber: slot.number,
        category: slot.category,
        entryTime: now,
        endTime,
        duration,
        amount,
        qrToken,
        qrCode: qrDataUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. EMERGENCY SOS PANIC TRIGGER
// ==========================================
exports.triggerEmergencySOS = async (req, res) => {
  try {
    const { emergencyType = 'panic_lockdown', notes } = req.body;

    const alertPayload = {
      alertId: 'EMERGENCY-' + Date.now(),
      type: 'emergency_sos',
      emergencyType,
      triggeredBy: req.user?.name || 'Security Officer',
      role: req.user?.role || 'security',
      notes: notes || 'Emergency protocol initiated. All gate barriers flagged.',
      timestamp: new Date().toISOString()
    };

    // Broadcast emergency alert to all connected sockets
    emitAlert(alertPayload);

    await logAudit(req, {
      action: 'Emergency SOS Triggered',
      details: `CRITICAL: ${emergencyType.toUpperCase()} triggered by ${req.user?.name}. Notes: ${notes || 'None'}`,
      actionType: 'emergency_sos',
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'EMERGENCY PROTOCOL ACTIVATED. Alert broadcasted across all gates & admin terminals.',
      alert: alertPayload
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
