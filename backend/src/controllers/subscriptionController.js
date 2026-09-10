const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { emitAlert } = require('../utils/socket');

const PLAN_CONFIGS = {
  silver: {
    planName: 'Silver Monthly Pass',
    price: 2499,
    features: ['10 Hours/Day Unlimited Access', 'Priority Fast Barrier Entry', 'Any Floor Standard Bay', '1 Registered Vehicle'],
    maxVehicles: 1
  },
  gold_vip: {
    planName: 'Gold Executive VIP Pass',
    price: 3999,
    features: ['24/7 Unlimited Access', 'Dedicated Reserved VIP Bay', 'Free 11kW EV Fast Charging', 'ANPR Auto Barrier Whitelist', 'Up to 2 Vehicles'],
    maxVehicles: 2,
    dedicatedSlotPrefix: 'VIP-'
  },
  corporate_fleet: {
    planName: 'Corporate Enterprise Fleet Pass',
    price: 24999,
    features: ['Multi-Vehicle Company Pool (Up to 15 Vehicles)', 'Dedicated Reserved Executive Bay Zone', 'Centralized GST Invoicing', 'Priority Fleet Concierge Support'],
    maxVehicles: 15,
    dedicatedSlotPrefix: 'CORP-'
  }
};

// GET /api/subscriptions/my
exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
      availablePlans: PLAN_CONFIGS
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/subscriptions
exports.createSubscription = async (req, res) => {
  try {
    const { planType, vehicleNumbers, billingCycle = 'monthly' } = req.body;

    if (!planType || !PLAN_CONFIGS[planType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid planType. Must be one of: silver, gold_vip, corporate_fleet'
      });
    }

    const plan = PLAN_CONFIGS[planType];
    const user = await User.findById(req.user._id || req.user.id);

    // Vehicles array
    let vehicles = Array.isArray(vehicleNumbers) && vehicleNumbers.length > 0 
      ? vehicleNumbers.map(v => String(v).trim().toUpperCase()) 
      : [user?.vehicleNumber || 'MH-12-AB-3456'];

    if (vehicles.length > plan.maxVehicles) {
      vehicles = vehicles.slice(0, plan.maxVehicles);
    }

    // Auto-assign dedicated slot for VIP / Corporate
    let dedicatedSlot = '';
    if (planType === 'gold_vip') {
      dedicatedSlot = 'VIP-0' + Math.floor(1 + Math.random() * 8);
    } else if (planType === 'corporate_fleet') {
      dedicatedSlot = 'CORP-A' + Math.floor(1 + Math.random() * 5);
    }

    // End date calculation (30 days for monthly, 90 days for quarterly, 365 days for annual)
    const durationDays = billingCycle === 'annual' ? 365 : billingCycle === 'quarterly' ? 90 : 30;
    const endDate = new Date(Date.now() + durationDays * 24 * 3600 * 1000);

    const subscription = await Subscription.create({
      user: req.user._id || req.user.id,
      planType,
      planName: plan.planName,
      price: plan.price,
      billingCycle,
      startDate: new Date(),
      endDate,
      status: 'active',
      vehicleNumbers: vehicles,
      dedicatedSlot,
      anprWhitelisted: true,
      razorpaySubscriptionId: 'sub_' + Date.now()
    });

    await logAudit(req, {
      action: 'Subscription Pass Activated',
      details: `${req.user.name || 'User'} subscribed to ${plan.planName} (₹${plan.price}) for vehicles: ${vehicles.join(', ')}`,
      actionType: 'security',
      userId: req.user._id
    });

    emitAlert({
      type: 'subscription_activated',
      planName: plan.planName,
      vehicles,
      dedicatedSlot,
      message: `Pass Activated: ${plan.planName} ready for vehicles ${vehicles.join(', ')}.`
    });

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${plan.planName}!`,
      subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/subscriptions/:id/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (String(subscription.user) !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this subscription' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully.',
      subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/admin (Admin only)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('user', 'name email phone vehicleNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
