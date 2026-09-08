# Smart Parking Management System - Project Report

## 1. Project Overview

The Smart Parking Management System is a full-stack MERN application that digitizes the parking process. Users book slots online, receive QR codes, and security staff verify entry/exit by scanning. The system eliminates paper tickets, reduces wait times, and provides real-time parking availability.

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI library for building component-based interfaces |
| TypeScript | 5.5.3 | Type-safe JavaScript for better development experience |
| Vite | 5.4.21 | Build tool and dev server (fast HMR) |
| Tailwind CSS | 3.4.0 | Utility-first CSS framework for rapid UI development |
| React Router DOM | 6.26.0 | Client-side routing (protected routes, layouts) |
| React Icons | 5.3.0 | Icon library (Heroicons v2 - HiOutline set) |
| Recharts | 2.12.0 | Charting library for analytics dashboards |
| Framer Motion | 11.3.0 | Animation library for smooth transitions and micro-interactions |
| HTML5 | - | Semantic markup structure |
| CSS3 | - | Custom styles, glassmorphism effects, animations |

### 2.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24.12.0 | JavaScript runtime environment |
| Express.js | 4.21.0 | Web framework for REST API |
| MongoDB | - | NoSQL database for data persistence |
| Mongoose | 8.6.0 | ODM for MongoDB schema management |
| JSON Web Token | 9.0.2 | Authentication and authorization |
| bcryptjs | 2.4.3 | Password hashing and comparison |
| QR Code | 1.5.4 | QR code generation for booking tokens |
| UUID | 10.0.0 | Unique token generation for QR codes |
| cors | 2.8.5 | Cross-Origin Resource Sharing |
| dotenv | 16.4.5 | Environment variable management |
| nodemon | 3.1.4 | Development auto-restart utility |

### 2.3 Architecture Pattern

- **Frontend**: Single Page Application (SPA) with React Router
- **Backend**: RESTful API with MVC pattern
- **Database**: MongoDB with Mongoose ODM
- **Auth Flow**: JWT-based token authentication
- **Deployment**: Separate frontend (Vite build) and backend (Node.js server)

---

## 3. Database Schema

### 3.1 User Collection

| Field | Type | Constraints |
|-------|------|-------------|
| name | String | Required, trimmed |
| email | String | Required, unique, lowercase |
| phone | String | Required |
| password | String | Required, min 6 chars, select: false |
| role | String | Enum: user, admin, security |
| isActive | Boolean | Default: true |
| avatar | String | Default: empty |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

Key methods: matchPassword(), generateAuthToken()

### 3.2 ParkingSlot Collection

| Field | Type | Constraints |
|-------|------|-------------|
| number | String | Required, unique (e.g., B1A, C2B) |
| category | String | Enum: two-wheeler, four-wheeler, ev, disabled |
| status | String | Enum: available, occupied, reserved, maintenance |
| floor | Number | Required |
| pricePerHour | Number | Required |
| pricePerDay | Number | Required |
| pricePerMonth | Number | Required |
| features | [String] | Array of features like covered, cctv, ev-charging |

### 3.3 Booking Collection

| Field | Type | Constraints |
|-------|------|-------------|
| user | ObjectId | Ref: User, required |
| slot | ObjectId | Ref: ParkingSlot, required |
| vehicleNumber | String | Required |
| startTime | Date | Required |
| endTime | Date | Required |
| status | String | Enum: confirmed, active, completed, expired, cancelled |
| paymentStatus | String | Enum: pending, paid, refunded, failed |
| amount | Number | Required |
| qrCode | String | Base64 QR data URL |
| qrToken | String | Unique token, indexed |
| entryTime | Date | Nullable |
| exitTime | Date | Nullable |
| duration | Number | Hours |
| overstayDuration | Number | Default 0 |
| overstayPenalty | Number | Default 0 |

### 3.4 Notification Collection

| Field | Type | Constraints |
|-------|------|-------------|
| user | ObjectId | Ref: User, required |
| title | String | Required |
| message | String | Required |
| type | String | Enum: booking, payment, alert, info |
| read | Boolean | Default: false |
| createdAt | Date | Auto |

---

## 4. API Endpoints

### 4.1 Authentication (/api/auth)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /register | Public | Register new user |
| POST | /login | Public | Login user |
| POST | /forgot-password | Public | Send password reset code |
| GET | /me | Protected | Get current user profile |
| PUT | /profile | Protected | Update profile |
| PUT | /change-password | Protected | Change password |

### 4.2 Parking Slots (/api/slots)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | / | Public | List all slots (filterable) |
| GET | /available | Public | List available slots |
| GET | /:id | Public | Get slot details |
| POST | / | Admin | Create slot |
| PUT | /:id | Admin | Update slot |
| DELETE | /:id | Admin | Delete slot |
| PATCH | /:id/status | Admin/Security | Update slot status |

### 4.3 Bookings (/api/bookings)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | / | User | Get my bookings |
| POST | / | User | Create booking |
| GET | /waiting | User | Get waiting list |
| POST | /waiting | User | Join waiting list |
| POST | /verify-qr | Security | Verify QR code |
| GET | /check-expired | Admin | Check expired bookings |
| GET | /:id | Protected | Get booking by ID |
| POST | /:id/entry | Security | Mark vehicle entry |
| POST | /:id/exit | Security | Mark vehicle exit |
| PUT | /:id/cancel | User/Admin | Cancel booking |

### 4.4 Admin (/api/admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dashboard | Dashboard statistics |
| GET | /users | List all users |
| GET | /users/:id | Get user details |
| PUT | /users/:id | Update user |
| DELETE | /users/:id | Delete user |
| GET | /revenue | Revenue report |
| GET | /analytics | Analytics data |
| GET | /reports/no-show | No-show report |
| GET | /reports/overstay | Overstay report |
| PUT | /pricing | Update pricing |
| GET | /audit-logs | Audit logs |
| GET | /waiting-list | Waiting list |

### 4.5 Security (/api/security)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dashboard | Security dashboard stats |
| GET | /logs | Today's activity logs |
| POST | /scan | Scan QR code |
| POST | /manual-verify | Manual vehicle number verification |

---

## 5. Complete Features List

### 5.1 User Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | User Registration | Register with name, email, phone, password |
| 2 | Secure Login | JWT-based authentication |
| 3 | Forgot Password | Reset password via email code |
| 4 | Profile Management | Update name, email, phone; change password |
| 5 | View Available Slots | Real-time grid of all slots with status |
| 6 | Slot Categories | Two-wheeler, Four-wheeler, EV, Disabled |
| 7 | Time-based Booking | Hourly, Daily, Monthly pass options |
| 8 | Booking Wizard | 5-step booking flow (date -> category -> duration -> slot -> confirm) |
| 9 | QR Code Generation | Unique QR for each booking as digital parking pass |
| 10 | Digital Parking Pass | Boarding-pass style card with user, vehicle, slot, time, QR |
| 11 | Booking History | Complete history with filters and search |
| 12 | Payment Integration | Pay with Razorpay (card/UPI/netbanking) |
| 13 | Booking Confirmation | Success page with booking details |
| 14 | Waiting List | Join queue when slots full, auto-notify when available |
| 15 | Booking Cancellation | Cancel with refund logic |
| 16 | Notifications | Real-time booking, payment, and alert notifications |
| 17 | Dark Mode | Full dark/light theme toggle |
| 18 | Mobile-first UI | Responsive design for all devices |
| 19 | Dashboard | Overview of active/upcoming bookings |

### 5.2 Security Staff Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Security Dashboard | Today's entries/exits, current occupancy, pending verifications |
| 2 | QR Scanner | Camera frame animation with manual booking ID fallback |
| 3 | Vehicle Entry | Mark vehicle entry with booking verification |
| 4 | Vehicle Exit | Mark vehicle exit with duration and overstay calculation |
| 5 | Today's Logs | Complete entry/exit log with search and filters |
| 6 | Manual Plate Verification | Look up booking by vehicle number |

### 5.3 Admin Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Admin Dashboard | 8 stat cards + revenue chart + occupancy pie + peak hours |
| 2 | User Management | List, search, filter, edit, suspend, delete users |
| 3 | Slot Management | CRUD slots, status toggle, category/floor filters |
| 4 | Booking Management | View all bookings, cancel, filter by status/date |
| 5 | Revenue Dashboard | Revenue charts, breakdown by category, payment methods |
| 6 | Reports | Daily/Weekly/Monthly/Custom report generation |
| 7 | Analytics | Peak hours, category distribution, booking trends, occupancy heatmap |
| 8 | No-Show Report | Track no-shows, lost revenue, penalties |
| 9 | Overstay Report | Track overstays, average duration, penalty collection |
| 10 | Pricing Management | Set hourly/daily/monthly rates per category |
| 11 | Waiting List Management | View and manage queue |
| 12 | Settings | General, notification, security, appearance settings |
| 13 | Audit Logs | Complete action trail with filters |

### 5.4 System Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | No-Show Timeout | Auto-expire bookings after grace period (15 min default) |
| 2 | Overstay Penalty | Auto-calculate penalty for exceeding booked time |
| 3 | Booking State Machine | confirmed -> active -> completed (with expired/cancelled edges) |
| 4 | Role-based Access | User, Security, Admin - three distinct panels |
| 5 | Real-time Updates | Live occupancy, today's stats |

---

## 6. Project Structure

```
parking-system/
├── index.html                    # Entry HTML
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite config with API proxy
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
├── server/
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables
│   └── src/
│       ├── index.js              # Express server entry
│       ├── config/db.js          # MongoDB connection
│       ├── models/               # Mongoose schemas
│       │   ├── User.js
│       │   ├── ParkingSlot.js
│       │   ├── Booking.js
│       │   └── Notification.js
│       ├── controllers/          # Business logic
│       │   ├── authController.js
│       │   ├── slotController.js
│       │   ├── bookingController.js
│       │   ├── adminController.js
│       │   └── securityController.js
│       ├── routes/               # API route definitions
│       │   ├── auth.js
│       │   ├── slots.js
│       │   ├── bookings.js
│       │   ├── admin.js
│       │   └── security.js
│       ├── middleware/           # Express middleware
│       │   ├── auth.js           # JWT verification + role authorization
│       │   └── errorHandler.js   # Global error handler
│       └── utils/
│           └── helpers.js        # Utility functions
├── src/
│   ├── main.tsx                  # React entry with providers
│   ├── App.tsx                   # Router configuration
│   ├── index.css                 # Tailwind + custom styles
│   ├── vite-env.d.ts
│   ├── types/index.ts            # TypeScript interfaces
│   ├── context/
│   │   ├── ThemeContext.tsx       # Dark/light theme
│   │   └── AuthContext.tsx        # Authentication state
│   ├── layouts/
│   │   ├── MainLayout.tsx        # User layout with navbar + footer
│   │   ├── AdminLayout.tsx       # Admin layout with sidebar
│   │   ├── SecurityLayout.tsx    # Security layout with sidebar
│   │   └── AuthLayout.tsx        # Centered auth card layout
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx        # 5 variants, 3 sizes, loading, ripple
│   │   │   ├── Input.tsx         # Floating label, validation, icons
│   │   │   ├── Card.tsx          # Glassmorphism card with hover
│   │   │   ├── Badge.tsx         # Status badge (5 variants)
│   │   │   ├── Modal.tsx         # Animated modal overlay
│   │   │   └── Toast.tsx         # Toast notification system
│   │   ├── StatCard.tsx          # Dashboard stat card
│   │   ├── DataTable.tsx         # Sortable, searchable table
│   │   ├── ParkingPass.tsx       # Digital boarding-pass style card
│   │   ├── LoadingSkeleton.tsx   # Loading placeholders
│   │   └── Footer.tsx            # Site footer
│   ├── pages/
│   │   ├── Landing.tsx           # SaaS landing page (9 sections)
│   │   ├── Login.tsx             # Login form
│   │   ├── Register.tsx          # Registration with password strength
│   │   ├── ForgotPassword.tsx    # Password reset
│   │   ├── Dashboard.tsx         # User dashboard
│   │   ├── BookParking.tsx       # 5-step booking wizard
│   │   ├── AvailableParking.tsx  # Slot grid with filters
│   │   ├── ParkingDetails.tsx    # Slot detail view
│   │   ├── BookingConfirmation.tsx # Success page
│   │   ├── QRCode.tsx            # Parking pass display
│   │   ├── BookingHistory.tsx    # Booking history table
│   │   ├── Notifications.tsx     # Notification center
│   │   ├── WaitingList.tsx       # Queue status
│   │   ├── Payment.tsx           # Payment form
│   │   ├── PaymentSuccess.tsx    # Payment success
│   │   ├── PaymentFailed.tsx     # Payment failed
│   │   ├── Profile.tsx           # User profile settings
│   │   ├── About.tsx             # About page
│   │   ├── Contact.tsx           # Contact form
│   │   ├── NotFound.tsx          # 404 page
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx    # 8 stats + charts
│   │   │   ├── ManageUsers.tsx       # User CRUD
│   │   │   ├── ManageSlots.tsx       # Slot CRUD
│   │   │   ├── ManageBookings.tsx    # Booking management
│   │   │   ├── RevenueDashboard.tsx  # Revenue analytics
│   │   │   ├── Reports.tsx           # Report generation
│   │   │   ├── Analytics.tsx         # Charts and trends
│   │   │   ├── NoShowReport.tsx      # No-show tracking
│   │   │   ├── OverstayReport.tsx    # Overstay tracking
│   │   │   ├── WaitingListAdmin.tsx  # Queue management
│   │   │   ├── PricingManagement.tsx # Rate management
│   │   │   ├── Settings.tsx          # System settings
│   │   │   └── AuditLogs.tsx         # Activity logging
│   │   └── security/
│   │       ├── SecurityDashboard.tsx    # Security overview
│   │       ├── QRScanner.tsx            # Scanner interface
│   │       ├── VehicleEntry.tsx         # Entry form
│   │       ├── VehicleExit.tsx          # Exit form
│   │       ├── TodaysLogs.tsx           # Daily log
│   │       └── ManualPlateVerification.tsx # Plate lookup
│   └── services/
│       └── api.ts                 # API client with auth token management
```

---

## 8. UI/UX Design Decisions

### 8.1 Design System
- **Color Palette**: Primary #2563EB, Secondary #22C55E, Accent #F59E0B
- **Typography**: Inter font family (300-800 weight)
- **Glassmorphism**: Semi-transparent backgrounds with backdrop blur
- **Shadows**: Soft shadows for depth without heaviness
- **Border Radius**: rounded-2xl (16px) for cards, rounded-lg for buttons
- **Spacing**: Consistent 4px grid system via Tailwind

### 8.2 Animation Strategy
- **Page transitions**: Framer Motion fade + slide
- **Cards**: Hover lift (translateY -4px) with shadow increase
- **Loader**: Skeleton screens during data fetch (not spinners)
- **Micro-interactions**: Button ripple, toast slide-in, badge pulse
- **Charts**: Recharts with responsive containers

### 8.3 Responsive Design
- **Mobile-first**: All layouts designed for mobile first, expanded to desktop
- **Breakpoints**: sm (640), md (768), lg (1024), xl (1280)
- **Sidebar**: Collapsible on mobile, persistent on desktop
- **Charts**: Single column on mobile, multi-column on desktop
- **Grids**: Auto-adjusting columns (1-2-3-4 based on viewport)

---

## 9. Security Considerations

- **Password hashing**: bcryptjs with salt rounds 12
- **JWT tokens**: Signed with secret, 7-day expiry
- **Protected routes**: Frontend + backend authorization checks
- **Role-based access**: Three distinct roles with separate panels
- **QR token uniqueness**: UUID v4 tokens, non-guessable
- **Input validation**: Express-validator patterns in controllers
- **Error handling**: Global error handler prevents stack leakage

---

## 10. How to Run

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Backend Setup
```bash
cd server
npm install
# Edit .env with your MongoDB URI
npm run seed    # Seed initial data
npm run dev     # Start on port 5000
```

### Frontend Setup
```bash
cd parking-system
npm install
npm run dev     # Start on port 5173
```

### Demo Credentials
- Admin: admin@parksmart.com / password123
- Security: security@parksmart.com / password123
- User: john@example.com / password123

---

## 11. Future Scope

- Online payment gateway integration (Razorpay live)
- GPS navigation to parking slots
- AI-based parking demand prediction
- IoT sensor integration for real-time occupancy
- Vehicle number plate OCR (automatic recognition)
- Mobile application (Flutter/React Native)
- Email and SMS notification service
- Multi-location/multi-lot support
- Push notifications via WebSocket
- Advanced role hierarchy with permissions
