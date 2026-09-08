require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(url);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test() {
  await mongoose.connect('mongodb://localhost:27017/parking-system');

  const pendingBooking = await Booking.findOne({ status: 'pending' }).populate('user');
  console.log('Pending booking:', pendingBooking?._id, 'User:', pendingBooking?.user?.email);

  if (!pendingBooking) {
    console.log('No pending booking found to test');
    process.exit(0);
  }

  const user = await User.findById(pendingBooking.user._id || pendingBooking.user);
  const token = user.generateAuthToken();

  console.log('Testing createOrder:');
  const orderRes = await post('http://localhost:5000/api/payments/create-order', {
    bookingId: String(pendingBooking._id)
  }, token);

  console.log('Order creation status:', orderRes.status, 'Data:', orderRes.data);
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
