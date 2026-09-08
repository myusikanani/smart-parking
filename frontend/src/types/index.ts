export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'security';
  avatar?: string;
  createdAt: string;
}

export interface ParkingSlot {
  id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  floor: number;
  pricePerHour: number;
  pricePerDay: number;
  pricePerMonth: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  slotId: string;
  slotNumber: string;
  category?: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'active' | 'completed' | 'expired' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  amount: number;
  qrCode: string;
  qrToken?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'alert' | 'info';
  read: boolean;
  createdAt: string;
}

export interface RevenueData {
  date: string;
  amount: number;
  bookings: number;
}

export interface OccupancyData {
  time: string;
  occupied: number;
  available: number;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
}
