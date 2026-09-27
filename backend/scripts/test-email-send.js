const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'support.parkeaseee@gmail.com',
      pass: 'loflmalejxzqlpaj',
    },
  });

  try {
    console.log('Sending test booking email to myusi128@gmail.com ...');
    const info = await transporter.sendMail({
      from: '"ParkEase Bookings" <support.parkeaseee@gmail.com>',
      to: 'myusi128@gmail.com',
      subject: '✅ ParkEase Booking Confirmation - Slot A-C1B',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0b132b; color: #fff; border-radius: 10px;">
          <h2 style="color: #06b6d4;">🅿️ ParkEase Booking Confirmed!</h2>
          <p>Hello <b>myusi128@gmail.com</b>,</p>
          <p>Your parking slot has been successfully reserved:</p>
          <ul>
            <li><b>Slot:</b> Bay #A-C1B</li>
            <li><b>Vehicle:</b> Registered Vehicle</li>
            <li><b>Status:</b> Confirmed & Active</li>
          </ul>
        </div>
      `,
    });
    console.log('✅ SENT TO myusi128@gmail.com SUCCESS! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ EMAIL ERROR:', err);
  }
}

test();
