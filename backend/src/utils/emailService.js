const nodemailer = require('nodemailer');

// Create transporter using environment variables (supporting both SMTP_* and EMAIL_* keys) or Fallback to null
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || port === 465;

  // If credentials are dummy/placeholder or missing, return null to activate simulation mode
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

const sendBookingEmail = async (userEmail, bookingDetails) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b132b; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #06b6d4; margin: 0; font-size: 24px; font-weight: 700;">ParkSmart</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Facility & Automated Parking Platform</p>
      </div>

      <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #38bdf8; margin-top: 0; font-size: 18px;">✅ Booking Confirmed!</h2>
        <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">
          Your parking slot has been successfully booked. You can use your digital QR pass at the entry gate.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Vehicle Number:</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #ffffff; font-family: monospace;">${bookingDetails.vehicleNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Slot Reserved:</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #38bdf8;">${bookingDetails.slotNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Amount Paid:</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #10b981;">₹${bookingDetails.amount}</td>
        </tr>
      </table>

      <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px;">
        Need help? Contact ParkSmart Security Desk or reply to this email.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Sent booking confirmation to ${userEmail} for slot ${bookingDetails.slotNumber}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@parksmart.com';
    await transporter.sendMail({
      from: `"ParkSmart System" <${sender}>`,
      to: userEmail,
      subject: `Booking Confirmed (Slot ${bookingDetails.slotNumber}) - ParkSmart`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send booking email:', error.message);
    return false;
  }
};

const send2FAAlertEmail = async (userEmail, action) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b132b; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: #06b6d4; margin-top: 0;">Security Alert: 2FA Update</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        A Two-Factor Authentication action occurred on your account: <strong>${action}</strong>.
      </p>
      <p style="font-size: 13px; color: #94a3b8;">Time: ${new Date().toLocaleString('en-IN')}</p>
      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 20px;">
        If this wasn't you, please change your password and notify the facility admin immediately.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] 2FA Alert to ${userEmail}: ${action}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'security@parksmart.com';
    await transporter.sendMail({
      from: `"ParkSmart Security" <${sender}>`,
      to: userEmail,
      subject: 'Security Alert: Two-Factor Authentication Action - ParkSmart',
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send 2FA alert email:', error.message);
    return false;
  }
};

// One-time 2FA fallback code — sent when authenticator is unavailable
const send2FAEmailCode = async (userEmail, code) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; background: #0b132b; color: #e2e8f0; border-radius: 16px; border: 1px solid #1e293b; text-align: center;">
      <h2 style="color: #06b6d4; margin-top: 0; font-size: 22px;">ParkSmart Verification Code</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: left;">
        You requested a 2FA one-time verification code to sign in to your ParkSmart account:
      </p>
      
      <div style="margin: 25px 0;">
        <div style="display: inline-block; background: rgba(6,182,212,0.15); border: 2px solid #06b6d4; padding: 14px 32px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 10px;">(Code is valid for 5 minutes • Do not share with anyone)</p>
      </div>

      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 15px; margin-top: 25px; text-align: left;">
        If you did not initiate this login request, your account credentials might be compromised. Please reset your password immediately.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] 2FA fallback code for ${userEmail}: ${code} (expires in 5 min)`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'security@parksmart.com';
    await transporter.sendMail({
      from: `"ParkSmart Security" <${sender}>`,
      to: userEmail,
      subject: `${code} is your ParkSmart Verification Code`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send 2FA email code:', error.message);
    return false;
  }
};

// Entry pass email with the QR code embedded inline (used by "Email QR Pass")
const sendQREmail = async (userEmail, bookingDetails) => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b132b; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #06b6d4; margin: 0; font-size: 22px;">Your ParkSmart Entry QR Pass</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Present this digital pass at the entrance scanner gate</p>
      </div>

      ${bookingDetails.qrDataUrl ? `
        <div style="text-align: center; margin: 20px 0; background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block;">
          <img src="cid:qrcode" alt="Parking QR Pass" width="220" height="220" style="display:block; margin: 0 auto;" />
        </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Vehicle:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #ffffff; font-family: monospace;">${bookingDetails.vehicleNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Slot:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #38bdf8;">${bookingDetails.slotNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Valid Until:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1;">${bookingDetails.endTime || 'Scheduled Departure'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Total Amount:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #1e293b; font-weight: 700; color: #10b981;">₹${bookingDetails.amount}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 14px;">
        ParkSmart Automated Gate Access • 24/7 Security System
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Sent QR pass email to ${userEmail} for slot ${bookingDetails.slotNumber}`);
    return true;
  }

  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@parksmart.com';
    await transporter.sendMail({
      from: `"ParkSmart Gate Access" <${sender}>`,
      to: userEmail,
      subject: `Your Parking Entry Pass (Slot ${bookingDetails.slotNumber}) - ParkSmart`,
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
        <div style="display: inline-block; background: rgba(6,182,212,0.15); border: 1px solid #06b6d4; padding: 12px 28px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; font-family: monospace;">
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
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || 'security@parksmart.com';
    await transporter.sendMail({
      from: `"ParkSmart Security" <${sender}>`,
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

