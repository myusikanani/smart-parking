import { io, Socket } from 'socket.io-client';

// Same-origin socket by default (proxied with websocket upgrade); VITE_SOCKET_URL wins.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin;

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
