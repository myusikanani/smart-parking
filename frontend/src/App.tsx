import { Routes, Route } from 'react-router-dom';
import CursorGlow from './components/CursorGlow';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import SecurityLayout from './layouts/SecurityLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BookParking from './pages/BookParking';
import DashboardBookParking from './pages/DashboardBookParking';
import AvailableParking from './pages/AvailableParking';
import ParkingDetails from './pages/ParkingDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import QRCode from './pages/QRCode';
import BookingHistory from './pages/BookingHistory';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import WaitingList from './pages/WaitingList';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import UserPaymentHistory from './pages/UserPaymentHistory';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageSlots from './pages/admin/ManageSlots';
import ManageBookings from './pages/admin/ManageBookings';
import RevenueDashboard from './pages/admin/RevenueDashboard';
import Reports from './pages/admin/Reports'; 
import Analytics from './pages/admin/Analytics';
import NoShowReport from './pages/admin/NoShowReport';
import OverstayReport from './pages/admin/OverstayReport';
import WaitingListAdmin from './pages/admin/WaitingListAdmin';
import PricingManagement from './pages/admin/PricingManagement';
import Settings from './pages/admin/Settings';
import AuditLogs from './pages/admin/AuditLogs';
import PaymentManagement from './pages/admin/PaymentManagement';
import AdminLayoutDesigner from './pages/admin/AdminLayoutDesigner';
import AIAnalyticsDashboard from './pages/admin/AIAnalyticsDashboard';
import SecurityDashboard from './pages/security/SecurityDashboard';
import QRScanner from './pages/security/QRScanner';
import VehicleEntry from './pages/security/VehicleEntry';
import VehicleExit from './pages/security/VehicleExit';
import TodaysLogs from './pages/security/TodaysLogs';
import AvailableSlotsPublic from './pages/AvailableSlotsPublic';
import ManualPlateVerification from './pages/security/ManualPlateVerification';
import AIChatAssistant from './components/AIChatAssistant';
import SocketAlertToasts from './components/SocketAlertToasts';
import Demo3DOptions from './pages/Demo3DOptions';

import IntroConceptAD from './components/3d/IntroConceptAD';

export default function App() {
  return (
    <>
    <IntroConceptAD />
    <CursorGlow />
    <AIChatAssistant />
    <SocketAlertToasts />
    <Routes>
      {/* Public / Hybrid Pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/available-slots" element={<AvailableSlotsPublic />} />
        <Route path="/book-parking" element={<BookParking />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* User Portal with Left Sidebar Menu */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/book-parking" element={<DashboardBookParking />} />
          <Route path="/dashboard/live-map" element={<AvailableSlotsPublic />} />
          <Route path="/dashboard/smart-search" element={<AvailableParking />} />
          <Route path="/available-parking" element={<AvailableSlotsPublic />} />
          <Route path="/parking/:id" element={<ParkingDetails />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/qr-code" element={<QRCode />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/waiting-list" element={<WaitingList />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/dashboard/payments" element={<Payment />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="slots" element={<ManageSlots />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="revenue" element={<RevenueDashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="no-show" element={<NoShowReport />} />
          <Route path="overstay" element={<OverstayReport />} />
          <Route path="waiting-list" element={<WaitingListAdmin />} />
          <Route path="pricing" element={<PricingManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="layout-designer" element={<AdminLayoutDesigner />} />
          <Route path="ai-analytics" element={<AIAnalyticsDashboard />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['security']} />}>
        <Route path="/security" element={<SecurityLayout />}>
          <Route index element={<SecurityDashboard />} />
          <Route path="qr-scanner" element={<QRScanner />} />
          <Route path="vehicle-entry" element={<VehicleEntry />} />
          <Route path="vehicle-exit" element={<VehicleExit />} />
          <Route path="logs" element={<TodaysLogs />} />
          <Route path="manual-plate" element={<ManualPlateVerification />} />
        </Route>
      </Route>
      <Route path="/demo-3d" element={<Demo3DOptions />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
