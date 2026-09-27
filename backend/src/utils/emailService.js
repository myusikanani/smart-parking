const nodemailer = require('nodemailer');

// Create transporter using environment variables (supporting both SMTP_* and EMAIL_* keys) or Fallback to null
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || port === 465;

  // If credentials are valid, create transporter
  if (host && user && pass && user !== 'your-email@gmail.com' && !user.includes('your-email') && pass !== 'your-app-password') {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  }
  return null;
};

// 1. WELCOME EMAIL (Triggered immediately upon registration)
const sendWelcomeEmail = async (userEmail, userDetails = {}) => {
  const transporter = createTransporter();
  const name = userDetails.name || 'Valued User';
  const vehicleNumber = userDetails.vehicleNumber || 'Registered Vehicle';
  const vehicleType = userDetails.vehicleType || '4-wheeler';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #070d1e; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #06b6d4; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">ParkEase</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Facility & Automated Parking Platform</p>
      </div>

      <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 22px;">
        <h2 style="color: #38bdf8; margin: 0 0 8px 0; font-size: 18px;">🎉 Welcome to ParkEase, ${name}!</h2>
        <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">
          Your account has been successfully created. You can now effortlessly reserve parking slots, access digital QR gate passes, and manage your vehicle garage.
        </p>
      </div>

      <div style="background: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #1e293b; margin-bottom: 22px;">
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1px;">Your Registered Primary Vehicle</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 6px 0;">License Plate:</td>
            <td style="color: #38bdf8; font-family: monospace; font-weight: 700; text-align: right; font-size: 15px;">${vehicleNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Vehicle Category:</td>
            <td style="color: #ffffff; font-weight: 600; text-align: right; text-transform: capitalize;">${vehicleType}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.CLIENT_URL || 'https://park-ease-myusi.vercel.app'}/book" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #0284c7); color: #020617; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px;">
          Book Your First Parking Slot ➔
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px;">
        © 2026 ParkEase Smart Systems • 24/7 Automated Parking Management
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Welcome email to ${userEmail} (${name})`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'support.parkeaseee@gmail.com';
    await transporter.sendMail({
      from: `"ParkEase Official" <${sender}>`,
      to: userEmail,
      subject: `Welcome to ParkEase, ${name}! 🎉`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    return false;
  }
};

// 2. BOOKING CONFIRMATION EMAIL (Triggered upon booking & payment)
const sendBookingEmail = async (userEmail, bookingDetails = {}) => {
  const transporter = createTransporter();
  const name = bookingDetails.userName || 'Valued Driver';
  const vehicleNumber = bookingDetails.vehicleNumber || 'Vehicle';
  const slotNumber = bookingDetails.slotNumber || 'A-01';
  const floor = bookingDetails.floor ? `Floor ${bookingDetails.floor}` : 'Level 1';
  const amount = bookingDetails.amount || 0;
  const qrDataUrl = bookingDetails.qrDataUrl || bookingDetails.qrCode;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #070d1e; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #06b6d4; margin: 0; font-size: 26px; font-weight: 800;">ParkEase</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Facility & Automated Parking Platform</p>
      </div>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h2 style="color: #34d399; margin: 0 0 6px 0; font-size: 18px;">✅ Booking & Payment Confirmed!</h2>
        <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">
          Hello <strong>${name}</strong>, your parking bay has been reserved and your digital gate pass is ready.
        </p>
      </div>

      ${qrDataUrl ? `
        <div style="text-align: center; margin: 20px 0; background: #ffffff; padding: 18px; border-radius: 12px; display: block; border: 2px solid #06b6d4;">
          <p style="color: #020617; font-weight: bold; font-size: 13px; margin: 0 0 10px 0;">SCAN AT ENTRANCE / EXIT GATE</p>
          <img src="cid:bookingqr" alt="Entry QR Pass" width="220" height="220" style="display:block; margin: 0 auto;" />
          <p style="color: #64748b; font-size: 11px; margin: 8px 0 0 0;">Dynamic Encrypted Pass</p>
        </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; background: #0f172a; border-radius: 10px; overflow: hidden; border: 1px solid #1e293b;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Driver Name:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #ffffff; text-align: right;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Vehicle License:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #38bdf8; font-family: monospace; font-size: 15px; text-align: right;">${vehicleNumber}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Reserved Bay:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #38bdf8; text-align: right;">Bay #${slotNumber} (${floor})</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Amount Paid:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #10b981; font-size: 16px; text-align: right;">₹${amount}</td>
        </tr>
      </table>

      <p style="margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px;">
        Need assistance? Contact ParkEase Security Desk or visit your Dashboard.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Sent booking confirmation to ${userEmail} for slot ${slotNumber}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'support.parkeaseee@gmail.com';
    await transporter.sendMail({
      from: `"ParkEase Bookings" <${sender}>`,
      to: userEmail,
      subject: `✅ Booking Confirmed (Bay #${slotNumber}) - ParkEase`,
      html,
      attachments: qrDataUrl
        ? [{ filename: 'parkease-gate-pass.png', path: qrDataUrl, cid: 'bookingqr' }]
        : []
    });
    return true;
  } catch (error) {
    console.error('Failed to send booking email:', error.message);
    return false;
  }
};

// 3. QR PASS DISPATCH EMAIL
const sendQREmail = async (userEmail, bookingDetails = {}) => {
  return sendBookingEmail(userEmail, bookingDetails);
};

// 4. PASSWORD RESET EMAIL
const sendResetPasswordEmail = async (userEmail, resetToken, resetCode, userName = 'Valued User') => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'https://park-ease-myusi.vercel.app'}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #070d1e; color: #e2e8f0; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #06b6d4; margin: 0; font-size: 24px; font-weight: 800;">ParkEase</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Account Security & Recovery</p>
      </div>

      <h2 style="color: #38bdf8; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Hello <strong>${userName}</strong>,<br/>
        We received a request to reset your password. Use the 6-digit verification code below or click the direct button:
      </p>
      
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: rgba(6,182,212,0.15); border: 2px solid #06b6d4; padding: 14px 32px; border-radius: 12px; font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">
          ${resetCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">(Code is valid for 15 minutes • Do not share)</p>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #06b6d4; color: #020617; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px;">
          Reset Password Online ➔
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px;">
        If you did not request this, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Password reset email for ${userEmail}: Code ${resetCode}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'support.parkeaseee@gmail.com';
    await transporter.sendMail({
      from: `"ParkEase Security" <${sender}>`,
      to: userEmail,
      subject: `${resetCode} is your Password Reset Code - ParkEase`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send reset password email:', error.message);
    return false;
  }
};

// 5. 2FA CODE EMAIL
const send2FAEmailCode = async (userEmail, code, userName = 'User') => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 26px; background: #070d1e; color: #e2e8f0; border-radius: 16px; border: 1px solid #1e293b; text-align: center;">
      <h2 style="color: #06b6d4; margin-top: 0; font-size: 22px;">ParkEase Verification Code</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: left;">
        Hello <strong>${userName}</strong>,<br/>
        You requested a one-time verification code to sign in to your ParkEase account:
      </p>
      
      <div style="margin: 25px 0;">
        <div style="display: inline-block; background: rgba(6,182,212,0.15); border: 2px solid #06b6d4; padding: 14px 32px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 10px;">(Code is valid for 5 minutes • Do not share)</p>
      </div>

      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 15px; margin-top: 25px; text-align: left;">
        If you did not initiate this login request, please reset your password immediately.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] 2FA code for ${userEmail}: ${code}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'support.parkeaseee@gmail.com';
    await transporter.sendMail({
      from: `"ParkEase Security Shield" <${sender}>`,
      to: userEmail,
      subject: `${code} is your ParkEase Login Verification Code`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send 2FA email code:', error.message);
    return false;
  }
};

const send2FAAlertEmail = async (userEmail, action) => {
  return true;
};

module.exports = {
  sendWelcomeEmail,
  sendBookingEmail,
  sendQREmail,
  send2FAAlertEmail,
  send2FAEmailCode,
  sendResetPasswordEmail
};
