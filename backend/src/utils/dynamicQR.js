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
 * Tolerates current step ± 1 (approx 60s total window)
 * @param {string} rawToken 
 * @returns {{ isValid: boolean, bookingId: string|null }}
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
  if (isNaN(tokenStep)) {
    return { isValid: false, bookingId: null };
  }

  const currentStep = Math.floor(Date.now() / (ROTATION_INTERVAL_SEC * 1000));
  
  // Allow ±10 time window steps (~5 minutes window for clock drift / driver arrival)
  for (let offset = -10; offset <= 2; offset++) {
    const checkStep = currentStep + offset;
    if (checkStep === tokenStep) {
      const expectedHash = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${bookingId}:${checkStep}`)
        .digest('hex')
        .substring(0, 16);

      if (expectedHash === providedHash) {
        return { isValid: true, bookingId };
      }
    }
  }

  // Graceful HMAC integrity check even if step is older:
  // If the hash is valid for the provided tokenStep, it is a legitimate ParkSmart token
  const expectedHash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${bookingId}:${tokenStep}`)
    .digest('hex')
    .substring(0, 16);

  if (expectedHash === providedHash) {
    // Valid token signature, but time step has expired
    return { isValid: false, bookingId, expired: true };
  }

  return { isValid: false, bookingId: null, expired: false };
};

module.exports = {
  generateDynamicQRToken,
  verifyDynamicQRToken,
  ROTATION_INTERVAL_SEC
};
