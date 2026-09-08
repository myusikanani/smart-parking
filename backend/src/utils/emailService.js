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

module.exports = {
  sendBookingEmail,
  sendQREmail,
  send2FAAlertEmail,
  send2FAEmailCode
};
