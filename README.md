<div align="center">

<h1>🏥 Doctor Appointment System</h1>

<p><em>A production-grade healthcare appointment management platform — engineered for concurrent booking safety, role-differentiated workflows, and end-to-end appointment lifecycle management across patients, doctors, and administrators.</em></p>

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square)](https://axios-http.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

<br/>

[**GitHub Repository**](https://github.com/Nikhilseelam1/Doctor-Appointement-System) · [**API Docs**](#-api-endpoints) · [**Setup Guide**](#-local-development-setup)

</div>

---

## 📌 Overview

This is a **production-grade healthcare appointment management platform** built on a full MERN stack, designed to handle the complete appointment lifecycle — from patient registration and doctor availability management to concurrent booking validation and admin oversight.

The system is engineered around four core concerns that separate it from a basic CRUD application:

1. **Concurrent booking safety** — Appointment slots are validated atomically to prevent race conditions and double-bookings under simultaneous load
2. **Role-differentiated workflows** — Patients, Doctors, and Admins each operate within isolated dashboards with distinct permissions and action sets
3. **Appointment lifecycle management** — Bookings transition through well-defined states: `pending → confirmed → completed / cancelled`
4. **Layered backend architecture** — Controller → Service → Repository separation ensures independent testability and extensibility at each layer

> **Engineering Focus:** Scheduling engine design · Concurrent booking prevention · JWT RBAC · Appointment state machine · MERN layered architecture

---

## 🏛️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        React SPA (Vite)                       │
│                                                               │
│  Patient Dashboard │ Doctor Dashboard │ Admin Dashboard       │
│                                                               │
│  AuthContext ──► Protected Routes ──► Axios API Client        │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│                   Express.js API Server                       │
│                                                               │
│  Routes ──► Middleware (Auth · RBAC · Validation)            │
│          ──► Controllers                                      │
│          ──► Services (Scheduling Engine)                     │
│          ──► Repositories                                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                       MongoDB                                  │
│  Users · Doctors · Appointments · Availability Slots          │
└──────────────────────────────────────────────────────────────┘
```

### Appointment State Machine

Every appointment in the system follows a strict lifecycle:

```
                    ┌──────────┐
         Book       │  PENDING  │
Patient ──────────► │           │
                    └─────┬─────┘
                          │
             ┌────────────┴────────────┐
             │                         │
      Doctor Confirms           Patient / Doctor
             │                    Cancels
             ▼                         ▼
      ┌─────────────┐          ┌──────────────┐
      │  CONFIRMED  │          │  CANCELLED   │
      └──────┬──────┘          └──────────────┘
             │
      Appointment Date Passes
             │
             ▼
      ┌─────────────┐
      │  COMPLETED  │
      └─────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18.x + Vite | Component-based UI, fast builds |
| **Routing** | React Router DOM 6.x | Client-side routing, protected routes |
| **HTTP Client** | Axios + Interceptors | Centralized API calls, token attachment |
| **Auth State** | Context API + useReducer | Global session management |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MongoDB + Mongoose | Document storage, aggregation |
| **Authentication** | JWT (Access Tokens) | Stateless auth, protected APIs |
| **Authorization** | RBAC Middleware | Role-based route protection |
| **Validation** | Joi / Zod | Schema-based input validation |
| **Security** | Helmet.js + bcrypt | Headers + password hashing |
| **Deployment** | Vercel (frontend) + Render (backend) | Cloud PaaS |

---

## ✨ Features

### Patient
- 📋 **Registration & login** with JWT session management
- 🔍 **Browse doctors** by specialty, availability, and rating
- 📅 **Book appointments** with real-time slot availability checks
- ❌ **Cancel appointments** within allowed cancellation window
- 📊 **Patient dashboard** — upcoming, past, and pending appointments

### Doctor
- 🗓️ **Set availability** — define weekly schedules and time slots
- 📬 **Manage appointments** — confirm or cancel incoming bookings
- 👤 **Profile management** — specialty, bio, experience, fees
- 📈 **Doctor dashboard** — appointment queue and schedule overview

### Admin
- 👥 **User management** — view, activate, or deactivate accounts
- 🏥 **Doctor onboarding** — approve doctor registrations
- 📊 **Platform overview** — appointment statistics and system health
- 🔧 **Appointment arbitration** — override, cancel, or reassign bookings

---

## 🗓️ Appointment Scheduling Engine

This is the most engineering-intensive component of the system. The scheduling engine must handle real-world challenges that a naive CRUD implementation cannot: concurrent booking attempts, slot consistency, and availability enforcement.

### Booking Validation Flow

```
Patient Submits Booking (doctorId, date, slotTime)
          │
          ▼
[1] Validate Request Schema (Joi)
          │
          ▼
[2] Check Doctor Exists + Is Active
          │
          ▼
[3] Check Slot Is Within Doctor's Availability Schedule
          │
          ▼
[4] Atomic Slot Check + Reserve
          │
     ┌────┴─────┐
     │          │
  AVAILABLE   TAKEN
     │          │
     ▼          ▼
  Create     409 Conflict
  Appointment  "Slot already booked"
     │
     ▼
[5] Update Doctor's Booked Slots Array
     │
     ▼
[6] Return Booking Confirmation
```

### Concurrency & Double-Booking Prevention

In a real scheduling system, two patients can submit booking requests for the same slot within milliseconds of each other. A naive read-then-write pattern would allow both to succeed:

```
❌ Naive (race condition vulnerable):
   Thread A: reads slot → available → creates appointment
   Thread B: reads slot → available → creates appointment (duplicate!)
```

The system addresses this using **MongoDB's atomic `findOneAndUpdate` with a conditional filter**, ensuring only one booking can claim a slot:

```javascript
// services/appointment.service.js

const reserveSlot = async (doctorId, date, slotTime) => {
  // Atomic: find the availability document where this slot is NOT yet booked
  // and mark it booked in a single operation
  const result = await DoctorAvailability.findOneAndUpdate(
    {
      doctorId,
      date,
      "slots.time": slotTime,
      "slots.isBooked": false, // ← condition: only match if not already booked
    },
    {
      $set: { "slots.$.isBooked": true },
    },
    { new: true }
  );

  if (!result) {
    throw new ConflictError("This slot is no longer available.");
  }

  return result;
};
```

If two concurrent requests hit this update simultaneously, MongoDB's document-level locking ensures exactly **one** succeeds and the other receives `null` — triggering a 409 Conflict response. No double bookings are possible.

### Availability Model Design

```javascript
// Doctor availability schema
{
  doctorId: ObjectId,
  date: Date,
  slots: [
    { time: "09:00", isBooked: false },
    { time: "09:30", isBooked: true  },
    { time: "10:00", isBooked: false },
    // ...
  ]
}

// Indexes for scheduling queries
{ doctorId: 1, date: 1 }          // fetch doctor's day schedule
{ doctorId: 1, date: 1, "slots.isBooked": 1 }  // available slot queries
```

---

## 🔐 Authentication & Authorization

### JWT Authentication Flow

```
POST /api/auth/login
          │
          ▼
  Validate credentials (bcrypt.compare)
          │
          ▼
  Issue JWT: { userId, role, email }
          │
          ▼
  Token returned in response body
  Stored in: React AuthContext (memory)
          │
On protected API call:
          │
          ▼
┌──────────────────────────────┐
│   Axios Request Interceptor   │
│   Attach Authorization header │
│   Bearer <token>              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Backend Auth Middleware     │
│   Verify JWT signature        │
│   Attach req.user             │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│   RBAC Middleware             │
│   Check req.user.role         │
│   against allowedRoles[]      │
└──────────────────────────────┘
```

### Role Access Matrix

| Resource | Patient | Doctor | Admin |
|---|---|---|---|
| Book appointment | ✅ | ❌ | ✅ |
| View own appointments | ✅ | ✅ | ✅ |
| Confirm / cancel appointment | ❌ | ✅ | ✅ |
| Set availability | ❌ | ✅ | ❌ |
| View all users | ❌ | ❌ | ✅ |
| Approve doctor registration | ❌ | ❌ | ✅ |
| View platform analytics | ❌ | ❌ | ✅ |

---

## 🧑‍⚕️ Patient Workflow

```
Register / Login
      │
      ▼
Browse Doctors (filter by specialty, date, availability)
      │
      ▼
Select Doctor → Choose Date → View Available Slots
      │
      ▼
Confirm Booking (POST /api/appointments)
      │
      ▼
Receive Confirmation → Appointment Status: PENDING
      │
      ▼
Doctor Confirms → Status: CONFIRMED
      │
      ▼
Patient Dashboard: upcoming / past / cancelled appointments
```

---

## 🩺 Doctor Workflow

```
Register (Admin approves) → Login
      │
      ▼
Set Weekly Availability (days + time slots)
      │
      ▼
Receive Incoming Appointment Requests (PENDING)
      │
      ▼
Confirm or Cancel
      │
      ▼
Doctor Dashboard: today's schedule, upcoming queue
      │
      ▼
Appointment passes → Status auto-transitions to COMPLETED
```

---

## 🔧 Admin Workflow

```
Login (admin credentials)
      │
      ▼
Admin Dashboard: platform stats, pending approvals
      │
      ├── Approve/Reject Doctor Registrations
      │
      ├── View & Manage All Users
      │
      ├── View All Appointments (override / cancel)
      │
      └── Platform-wide Reporting
```

---

## 🖥️ Frontend Architecture

```
src/
├── api/
│   ├── axiosInstance.js       # Centralized Axios + auth interceptors
│   ├── auth.api.js
│   ├── appointments.api.js
│   ├── doctors.api.js
│   └── admin.api.js
├── context/
│   └── AuthContext.jsx        # Global auth state: user, role, token
├── components/
│   ├── DoctorCard.jsx
│   ├── SlotPicker.jsx         # Time slot grid with availability state
│   ├── AppointmentCard.jsx
│   ├── StatusBadge.jsx        # Color-coded appointment status
│   └── Navbar.jsx
├── pages/
│   ├── patient/
│   │   ├── PatientDashboard.jsx
│   │   ├── BookAppointment.jsx
│   │   └── MyAppointments.jsx
│   ├── doctor/
│   │   ├── DoctorDashboard.jsx
│   │   ├── SetAvailability.jsx
│   │   └── AppointmentQueue.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── ManageUsers.jsx
│   │   └── ManageDoctors.jsx
│   └── auth/
│       ├── LoginPage.jsx
│       └── RegisterPage.jsx
├── routes/
│   ├── AppRouter.jsx
│   ├── ProtectedRoute.jsx     # Redirect to login if unauthenticated
│   └── RoleRoute.jsx          # Redirect to 403 if wrong role
├── hooks/
│   ├── useAuth.js
│   ├── useAppointments.js
│   └── useDoctors.js
└── utils/
    ├── tokenStore.js
    └── dateUtils.js
```

---

## 🏗️ Backend Architecture

```
src/
├── config/
│   └── db.js                        # MongoDB connection
├── models/
│   ├── User.model.js                # Patient / Doctor / Admin schema
│   ├── Doctor.model.js              # Doctor profile + specialty
│   ├── Appointment.model.js         # Booking record + state
│   └── DoctorAvailability.model.js  # Weekly slot schedule
├── repositories/
│   ├── user.repository.js
│   ├── doctor.repository.js
│   ├── appointment.repository.js
│   └── availability.repository.js
├── services/
│   ├── auth.service.js
│   ├── appointment.service.js       # Scheduling engine + slot reservation
│   ├── doctor.service.js
│   └── admin.service.js
├── controllers/
│   ├── auth.controller.js
│   ├── appointment.controller.js
│   ├── doctor.controller.js
│   └── admin.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── appointment.routes.js
│   ├── doctor.routes.js
│   └── admin.routes.js
├── middlewares/
│   ├── auth.middleware.js           # JWT verification
│   ├── rbac.middleware.js           # Role-based guard
│   ├── validate.middleware.js       # Joi/Zod schema validation
│   └── error.middleware.js          # Centralized error handler
├── validators/
│   ├── appointment.validator.js
│   └── auth.validator.js
└── utils/
    ├── apiResponse.js
    └── dateUtils.js
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | — | Register patient or doctor |
| `POST` | `/api/auth/login` | ❌ | — | Login, receive JWT |
| `POST` | `/api/auth/logout` | ✅ | Any | Clear session |

### Doctors

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/doctors` | ✅ | Any | List all active doctors |
| `GET` | `/api/doctors/:id` | ✅ | Any | Doctor profile + specialty |
| `GET` | `/api/doctors/:id/availability` | ✅ | Any | Available slots for a date |
| `PUT` | `/api/doctors/:id/availability` | ✅ | Doctor | Set weekly availability |
| `PATCH` | `/api/doctors/:id/profile` | ✅ | Doctor | Update profile |

### Appointments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/appointments` | ✅ | Patient | Book an appointment |
| `GET` | `/api/appointments/my` | ✅ | Any | My appointments |
| `GET` | `/api/appointments/:id` | ✅ | Any | Single appointment detail |
| `PATCH` | `/api/appointments/:id/confirm` | ✅ | Doctor | Confirm appointment |
| `PATCH` | `/api/appointments/:id/cancel` | ✅ | Any | Cancel appointment |

### Admin

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/users` | ✅ | Admin | All registered users |
| `PATCH` | `/api/admin/doctors/:id/approve` | ✅ | Admin | Approve doctor account |
| `GET` | `/api/admin/appointments` | ✅ | Admin | All appointments |
| `DELETE` | `/api/admin/users/:id` | ✅ | Admin | Remove user account |

---

### Sample Request / Response

**Book Appointment**
```http
POST /api/appointments
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "doctorId": "664f2a...",
  "date": "2025-04-10",
  "slotTime": "10:00"
}
```
```json
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "appointmentId": "abc123...",
    "doctor": { "name": "Dr. Priya Sharma", "specialty": "Cardiology" },
    "patient": { "name": "Nikhil Seelam" },
    "date": "2025-04-10",
    "slotTime": "10:00",
    "status": "pending",
    "bookedAt": "2025-04-06T09:30:00.000Z"
  }
}
```

**Slot Conflict Response**
```json
HTTP/1.1 409 Conflict
{
  "success": false,
  "message": "This slot is no longer available. Please select another time."
}
```

---

## ⚙️ Local Development Setup

### Prerequisites

- Node.js ≥ 18.x
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/Nikhilseelam1/Doctor-Appointement-System.git
cd Doctor-Appointement-System

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# backend/.env
cp .env.example .env

# frontend/.env
cp .env.example .env
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev     # http://localhost:3000

# Terminal 2 — Frontend
cd frontend && npm run dev    # http://localhost:5173
```

---

## 🔧 Environment Variables

```env
# backend/.env.example

PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/appointments
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:5173
```

```env
# frontend/.env.example

VITE_API_BASE_URL=http://localhost:3000
```

---

## 🔒 Security Features

| Feature | Implementation | Threat Mitigated |
|---|---|---|
| **Password hashing** | bcrypt (12 rounds) | Credential exposure via DB dump |
| **JWT authentication** | Signed tokens, `req.user` injection | Unauthorized API access |
| **RBAC middleware** | Role check before every protected route | Privilege escalation |
| **Atomic slot reservation** | `findOneAndUpdate` with conditional filter | Double-booking race conditions |
| **Input validation** | Joi/Zod on all request bodies | Injection, malformed data |
| **Security headers** | Helmet.js | XSS, clickjacking, MIME sniffing |
| **CORS whitelisting** | Explicit allowed origins | Cross-origin abuse |
| **Error normalization** | Global error handler; no stack traces to client | Information leakage |

---

## 📈 Scalability & Engineering Decisions

| Decision | Rationale |
|---|---|
| **Atomic `findOneAndUpdate` for slots** | Prevents double-booking without distributed locks at this scale |
| **Availability as separate collection** | Decouples scheduling data from doctor profiles; enables independent scaling |
| **Appointment state machine** | Explicit status field prevents ambiguous state; enables clean lifecycle transitions |
| **Stateless JWT** | API servers carry no session state; horizontally scalable |
| **Service layer isolation** | Scheduling engine logic is testable without HTTP or DB |
| **Repository pattern** | DB queries abstracted; service layer remains DB-agnostic |
| **Compound indexes** | `{ doctorId, date }` on availability; O(log n) slot lookups under load |

### Future Scaling Path

| Challenge | Current Approach | Production Scale Solution |
|---|---|---|
| **Concurrent booking** | MongoDB atomic update | Redis-based distributed slot locks |
| **Slot query throughput** | MongoDB indexes | Redis slot availability cache |
| **Appointment reminders** | Not yet implemented | BullMQ + email/SMS worker queue |
| **Real-time updates** | Polling | WebSocket / Server-Sent Events |
| **Multi-location doctors** | Single location model | Multi-tenancy + clinic entity |

---

## 🔭 Future Improvements

- [ ] **Email notifications** — Booking confirmations and reminders via Nodemailer + BullMQ
- [ ] **Payment integration** — Razorpay/Stripe for appointment fee collection
- [ ] **Video consultation** — WebRTC-based teleconsultation for remote appointments
- [ ] **Real-time slot updates** — WebSocket push when a slot becomes unavailable
- [ ] **Doctor ratings & reviews** — Patient feedback post-completion
- [ ] **Prescription management** — Doctor uploads prescriptions post-appointment
- [ ] **Calendar sync** — Google Calendar integration for doctors and patients
- [ ] **Redis slot caching** — Cache available slots with TTL for high-read scenarios
- [ ] **Mobile app** — React Native client sharing the same backend API
- [ ] **Analytics dashboard** — Appointment volumes, cancellation rates, popular doctors

---

## 📸 Screenshots

> _Coming soon — patient dashboard, doctor schedule view, slot picker, and admin panel screenshots._

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 👤 Author

**Nikhil Seelam**
B.Tech Computer Science & Engineering · RGUKT Ongole

[![GitHub](https://img.shields.io/badge/GitHub-Nikhilseelam1-181717?style=flat-square&logo=github)](https://github.com/Nikhilseelam1)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/nikhilseelam)

---

<div align="center">

*Scheduling built for correctness. Architecture built for scale.*

</div>
