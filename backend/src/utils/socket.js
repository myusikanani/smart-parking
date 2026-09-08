const { Server } = require('socket.io');
const ParkingSlot = require('../models/ParkingSlot');
const { isAllowedOrigin } = require('./corsOrigins');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
    });

    socket.on('parking:requestState', async () => {
      try {
        const slots = await ParkingSlot.find().lean();
        socket.emit('parking:initialState', slots);
      } catch (err) {
        socket.emit('parking:error', { message: 'Failed to load parking state' });
      }
    });

    socket.on('parking:selectSlot', (data) => {
      socket.broadcast.emit('parking:slotSelected', data);
    });

    socket.on('parking:deselectSlot', (data) => {
      socket.broadcast.emit('parking:slotDeselected', data);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('Socket.io not initialized yet!');
  }
  return io;
};

const emitSlotUpdate = (slotData) => {
  if (io) {
    io.emit('slot-updated', slotData);
  }
};

const emitBookingUpdate = (bookingData) => {
  if (io) {
    io.emit('booking-updated', bookingData);
  }
};

// Feature 8: broadcast vehicle motion so 3D maps can animate the car
// driving in from the entrance gate or out to the exit gate.
const emitVehicleMotion = ({ slotId, phase }) => {
  if (io && slotId && (phase === 'entering' || phase === 'exiting')) {
    io.emit('vehicle-motion', { slotId: String(slotId), phase });
  }
};

const emitOccupancyUpdate = (data) => {
  if (io) {
    io.emit('occupancy:update', data);
  }
};

const emitAlert = (data) => {
  if (io) {
    io.emit('alert', data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitSlotUpdate,
  emitBookingUpdate,
  emitVehicleMotion,
  emitOccupancyUpdate,
  emitAlert,
};
