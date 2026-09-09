const nodemailer = require('nodemailer');

// Create transporter using environment variables or Ethereal / Fallback
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

const sendBookingEmail = async (userEmail, bookingDetails) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #06b6d4;">Smart Parking Booking Confirmation</h2>
      <p>Your parking slot booking is confirmed!</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingDetails.vehicleNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Slot Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingDetails.slotNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${bookingDetails.amount}</td></tr>
      </table>
      <p style="margin-top: 20px;">Present your QR code at the entrance for verification.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Sent booking email to ${userEmail} for slot ${bookingDetails.slotNumber}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: '"Smart Parking System" <noreply@smartparking.com>',
      to: userEmail,
      subject: 'Booking Confirmation & QR Pass - Smart Parking',
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return false;
  }
};

const send2FAAlertEmail = async (userEmail, action) => {
  console.log(`[EMAIL SIMULATION] 2FA Alert to ${userEmail}: ${action}`);
  return true;
};

// One-time 2FA fallback code — printed to the server console when no real
// SMTP transport is configured (demo mode), so the user can still log in.
const send2FAEmailCode = async (userEmail, code) => {
  console.log(`[EMAIL SIMULATION] 2FA fallback code for ${userEmail}: ${code} (expires in 5 min)`);
  return true;
};

// Entry pass email with the QR code embedded inline (used by "Email QR")
const sendQREmail = async (userEmail, bookingDetails) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #06b6d4;">Your Smart Parking Entry Pass</h2>
      <p>Scan this QR code at the entry gate.</p>
      ${bookingDetails.qrDataUrl ? `<img src="cid:qrcode" alt="Parking QR Pass" width="220" height="220" style="display:block;margin:16px 0;" />` : ''}
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingDetails.vehicleNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Slot Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingDetails.slotNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Valid Until:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingDetails.endTime || ''}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${bookingDetails.amount}</td></tr>
      </table>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Sent QR pass email to ${userEmail} for slot ${bookingDetails.slotNumber}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: '"Smart Parking System" <noreply@smartparking.com>',
      to: userEmail,
      subject: 'Your Parking Entry Pass (QR) - Smart Parking',
      html,
      attachments: bookingDetails.qrDataUrl
        ? [{ filename: 'parking-qr-pass.png', path: bookingDetails.qrDataUrl, cid: 'qrcode' }]
        : []
    });
    return true;
  } catch (error) {
    console.error('Failed to send QR email:', error.message);
    return false;
  }
};

const sendResetPasswordEmail = async (userEmail, resetToken, resetCode) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background: #0b132b; color: #e2e8f0; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: #06b6d4; margin-top: 0;">ParkSmart Password Recovery</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
        We received a request to reset your password. You can reset your password using the verification code below or by clicking the direct reset link:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: rgba(6,182,212,0.15); border: 1px solid #06b6d4; padding: 12px 28px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38bdf8;">
          ${resetCode}
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 8px;">(Code valid for 15 minutes)</p>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #06b6d4; color: #020617; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Reset Password Online
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 15px;">
        If you did not request a password reset, please ignore this email or notify security immediately.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Password reset email for ${userEmail}:`);
    console.log(`  -> 6-Digit Code: ${resetCode}`);
    console.log(`  -> Direct Link: ${resetUrl}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: '"ParkSmart Security" <noreply@parksmart.com>',
      to: userEmail,
      subject: 'Password Reset Request - ParkSmart',
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send reset password email:', error.message);
    return false;
  }
};

module.exports = {
  sendBookingEmail,
  sendQREmail,
  send2FAAlertEmail,
  send2FAEmailCode,
  sendResetPasswordEmail
};

