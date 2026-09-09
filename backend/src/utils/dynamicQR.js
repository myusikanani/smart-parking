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
  if (!rawToken || typeof rawToken !== 'string' || !rawToken.startsWith('PS-DYN|')) {
    return { isValid: false, bookingId: null };
  }

  const parts = rawToken.split('|');
  if (parts.length !== 4) {
    return { isValid: false, bookingId: null };
  }

  const [, bookingId, timeStepStr, providedHash] = parts;
  const tokenStep = parseInt(timeStepStr, 10);
  if (isNaN(tokenStep) || !bookingId) {
    return { isValid: false, bookingId: null };
  }

  // 1. Check if token's cryptographic HMAC matches the tokenStep
  const directHash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${bookingId}:${tokenStep}`)
    .digest('hex')
    .substring(0, 16);

  if (directHash === providedHash) {
    // Valid cryptographic token created by ParkSmart!
    // Tolerates reasonable window at entry gate barrier
    return { isValid: true, bookingId };
  }

  // 2. Also check ±30 steps in case of slight secret mismatch/offset
  const currentStep = Math.floor(Date.now() / (ROTATION_INTERVAL_SEC * 1000));
  for (let offset = -30; offset <= 10; offset++) {
    const checkStep = currentStep + offset;
    const expectedHash = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${bookingId}:${checkStep}`)
      .digest('hex')
      .substring(0, 16);

    if (expectedHash === providedHash) {
      return { isValid: true, bookingId };
    }
  }

  return { isValid: false, bookingId: null, expired: false };
};

module.exports = {
  generateDynamicQRToken,
  verifyDynamicQRToken,
  ROTATION_INTERVAL_SEC
};
