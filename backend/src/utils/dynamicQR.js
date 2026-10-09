const crypto = require('crypto');

const ROTATION_INTERVAL_SEC = 30;
const SECRET_KEY = process.env.JWT_SECRET || 'parksmart_secure_jwt_secret_key_2026';

/**
 * Generate a dynamic time-based token for a booking
 * @param {string} bookingId 
 * @param {number} offsetSteps 
 * @returns {{ token: string, timeStep: number, expiresIn: number }}
 */
const generateDynamicQRToken = (bookingId, offsetSteps = 0) => {
  const timeStep = Math.floor(Date.now() / (ROTATION_INTERVAL_SEC * 1000)) + offsetSteps;
  const hash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${bookingId}:${timeStep}`)
    .digest('hex')
    .substring(0, 16);
  
  const token = `PS-DYN|${bookingId}|${timeStep}|${hash}`;
  const now = Date.now();
  const stepStart = timeStep * ROTATION_INTERVAL_SEC * 1000;
  const expiresIn = Math.max(1, Math.ceil((stepStart + ROTATION_INTERVAL_SEC * 1000 - now) / 1000));

  return { token, timeStep, expiresIn, rotationInterval: ROTATION_INTERVAL_SEC };
};

/**
 * Verify a dynamic token and extract bookingId
 * Cryptographically validates the HMAC signature generated for the booking
 * @param {string} rawToken 
 * @returns {{ isValid: boolean, bookingId: string|null, expired?: boolean }}
 */
const verifyDynamicQRToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    return { isValid: false, bookingId: null };
  }

  const trimmed = rawToken.trim();
  if (!trimmed.toUpperCase().startsWith('PS-DYN|')) {
    return { isValid: false, bookingId: null };
  }

  const parts = trimmed.split('|');
  if (parts.length !== 4) {
    return { isValid: false, bookingId: null };
  }

  const [, bookingId, timeStepStr, providedHash] = parts;
  const tokenStep = parseInt(timeStepStr, 10);
  if (isNaN(tokenStep) || !bookingId || !providedHash) {
    return { isValid: false, bookingId: null };
  }

  const cleanProvidedHash = providedHash.trim().toLowerCase();
  const cleanBookingId = bookingId.trim();
  const lowerBookingId = cleanBookingId.toLowerCase();

  const checkHash = (bId, step) =>
    crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${bId}:${step}`)
      .digest('hex')
      .substring(0, 16)
      .toLowerCase();

  // 1. Check if token's cryptographic HMAC matches the tokenStep
  if (
    checkHash(cleanBookingId, tokenStep) === cleanProvidedHash ||
    checkHash(lowerBookingId, tokenStep) === cleanProvidedHash
  ) {
    // Valid cryptographic token created by ParkSmart!
    return { isValid: true, bookingId: cleanBookingId };
  }

  // 2. Also check ±30 steps (15 minutes window) in case of clock drift or slight delay at gate barrier
  const currentStep = Math.floor(Date.now() / (ROTATION_INTERVAL_SEC * 1000));
  for (let offset = -30; offset <= 30; offset++) {
    const checkStep = currentStep + offset;
    if (
      checkHash(cleanBookingId, checkStep) === cleanProvidedHash ||
      checkHash(lowerBookingId, checkStep) === cleanProvidedHash
    ) {
      return { isValid: true, bookingId: cleanBookingId };
    }
  }

  return { isValid: false, bookingId: null, expired: false };
};

module.exports = {
  generateDynamicQRToken,
  verifyDynamicQRToken,
  ROTATION_INTERVAL_SEC
};
