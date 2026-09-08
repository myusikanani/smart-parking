/**
 * 2FA Diagnostic Tool
 * -------------------
 * Proves the full TOTP chain and tells you whether your Authy entry matches
 * the secret stored in the database.
 *
 * Usage:  node scripts/2fa-debug.js [email]
 *         (default email: admin@parksmart.com)
 *
 * WHAT IT DOES
 *  1. Loads the user's stored 2FA secret from MongoDB (permanent or pending).
 *  2. Prints the server's current time (UTC + your local timezone).
 *  3. Computes the EXACT 6-digit code the server accepts RIGHT NOW.
 *  4. Builds the otpauth:// URL that the QR code is generated from.
 *  5. Verifies the "current code" against the live /api/auth/verify-2fa
 *     endpoint — a pass here proves the backend chain is 100% consistent.
 *
 * HOW TO USE THE RESULT
 *  - Open Authy on your phone and look at the ParkSmart token.
 *  - If it shows the SAME "CURRENT CODE" as printed below → your Authy entry
 *    is correct; only a code typed after rotation or clock drift (≥1 min)
 *    would fail.
 *  - If it shows a DIFFERENT code → your Authy entry holds a STALE secret.
 *    Delete the ParkSmart entry in Authy and re-add it using the CURRENT
 *    secret printed below (add manually) or a QR generated from the otpauth
 *    URL below.
 */
const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../src/models/User');

const email = process.argv[2] || 'admin@parksmart.com';
const API = process.env.API_URL || 'http://localhost:5000/api';

const mask = (s) => (s ? s.slice(0, 4) + '…' + s.slice(-4) : '(none)');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✔ Connected to MongoDB\n');

  const user = await User.findOne({ email }).select('+twoFactorSecret +twoFactorTempSecret');
  if (!user) {
    console.error(`✘ User not found: ${email}`);
    process.exit(1);
  }

  const secret = user.twoFactorSecret || user.twoFactorTempSecret;
  const src = user.twoFactorSecret ? 'PERMANENT (2FA enabled)' : 'TEMP (setup pending)';

  console.log('═'.repeat(56));
  console.log(' 2FA DIAGNOSTIC REPORT');
  console.log('═'.repeat(56));
  console.log(` User           : ${user.email}`);
  console.log(` 2FA enabled    : ${user.twoFactorEnabled}`);
  console.log(` Secret source  : ${src}`);
  console.log(` Stored secret  : ${secret}`);
  console.log(`   (masked)     : ${mask(secret)}`);
  console.log('');
  console.log(` Server UTC     : ${new Date().toISOString()}`);
  console.log(` Server local   : ${new Date().toString()}`);
  console.log('');

  const now = Math.floor(Date.now() / 1000);
  const codes = {
    'CURRENT (valid now)': speakeasy.totp({ secret, encoding: 'base32' }),
    'In 30s            ': speakeasy.totp({ secret, encoding: 'base32', time: now + 30 }),
    'In 60s            ': speakeasy.totp({ secret, encoding: 'base32', time: now + 60 }),
    '30s ago           ': speakeasy.totp({ secret, encoding: 'base32', time: now - 30 }),
  };

  console.log('  EXPECTED CODES (what the server accepts):');
  for (const [label, code] of Object.entries(codes)) {
    console.log(`   ${label} : ${code}`);
  }
  console.log('');

  // NOTE: do NOT use speakeasy.otpauthURL here — it base32-encodes the input
  // and would produce a double-encoded (wrong) secret. Build the URL manually
  // so the secret param is EXACTLY the stored base32.
  const otpauth = `otpauth://totp/${encodeURIComponent('ParkSmart (' + user.email + ')')}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent('ParkSmart')}&algorithm=SHA1&digits=6&period=30`;
  console.log(` otpauth URL (generate a QR from this if needed):`);
  console.log(`   ${otpauth}`);
  console.log('');
  const qrSecret = new URL(otpauth).searchParams.get('secret');
  console.log(` QR "secret=" param equals stored secret : ${qrSecret === secret ? '✔ YES' : '✘ NO'}`);
  console.log('');

  // Live end-to-end proof: verify the current code against the real endpoint.
  const userId = user._id.toString();
  const currentCode = codes['CURRENT (valid now)'];
  try {
    const res = await fetch(`${API}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: currentCode }),
    });
    const body = await res.json();
    console.log(' LIVE END-TO-END CHECK (verify-2fa with CURRENT code):');
    console.log(`   HTTP ${res.status} | success=${body.success} | ${body.message || 'JWT issued'}`);
  } catch (err) {
    console.log(' LIVE END-TO-END CHECK: could not reach API —', err.message);
  }
  console.log('');
  console.log(' VERDICT:');
  console.log('  1) If Authy shows the CURRENT code above  → backend is fine;');
  console.log('     re-check the code you typed and its rotation timing.');
  console.log('  2) If Authy shows a DIFFERENT code        → your Authy entry is stale.');
  console.log('     Delete ParkSmart in Authy, then ADD ACCOUNT manually with the');
  console.log('     stored secret above (or scan a QR made from the otpauth URL).');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
