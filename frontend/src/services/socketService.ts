import { io, Socket } from 'socket.io-client';

// Production cloud backend URL on Vercel
const PRODUCTION_SOCKET = 'https://backend-eta-jet-79.vercel.app';

const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
// Guard: ignore stale or deleted 'backend-myusi' Vercel dashboard environment variable
const validSocketUrl =
  envSocketUrl && !envSocketUrl.includes('backend-myusi') ? envSocketUrl : null;

const SOCKET_URL =
  validSocketUrl ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? PRODUCTION_SOCKET
    : window.location.origin);

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('⚡ Socket.io connected to server:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected');
      });
    }
    return this.socket;
  }

  onSlotUpdate(callback: (data: { slotId: string; status: string }) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('slot-updated', callback);
  }

  onBookingUpdate(callback: (data: { bookingId: string; status?: string; overstayFlag?: boolean }) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('booking-updated', callback);
  }

  onVehicleMotion(callback: (data: { slotId: string; phase: 'entering' | 'exiting' }) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('vehicle-motion', callback);
  }

  onAlert(callback: (data: { type?: string; severity?: string; message?: string }) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('alert', callback);
  }

  off(eventName: string) {
    this.socket?.off(eventName);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
