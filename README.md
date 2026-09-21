# Amen Events — Full-Stack Enterprise Architecture

## Project Structure

```
Amen-Events/
├── frontend/               # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── store/
│   │   │   ├── api.js          # API client (fetch wrapper with auto-refresh)
│   │   │   ├── DataContext.jsx # Global state — uses backend API with offline fallback
│   │   │   ├── permissions.js  # RBAC permission matrix (5 roles × 17 modules)
│   │   │   └── data.js         # Seed data (used as offline fallback)
│   │   ├── pages/              # All page components (unchanged UI)
│   │   ├── components/         # Shared UI components
│   │   └── App.jsx             # Routes with RequireAuth + RequirePermission
│   ├── .env                    # VITE_API_URL=http://localhost:4000/api
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── backend/                # Backend (Node.js + Express + Prisma + PostgreSQL)
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema — 20+ normalized tables
│   │   └── seed.js         # Seeds all demo data + users + roles + permissions
│   ├── src/
│   │   ├── index.js        # Express server entry point
│   │   ├── lib/
│   │   │   ├── prisma.js   # Prisma client singleton
│   │   │   └── jwt.js      # JWT sign/verify helpers
│   │   ├── middleware/
│   │   │   ├── auth.js     # JWT authentication middleware
│   │   │   └── rbac.js     # RBAC permission checking middleware
│   │   └── routes/
│   │       ├── auth.js         # Login, logout, refresh, profile, password, 2FA, forgot/reset
│   │       ├── clients.js      # CRUD + RBAC
│   │       ├── events.js       # CRUD + team + budget + RBAC
│   │       ├── tasks.js        # CRUD + RBAC
│   │       ├── venues.js       # CRUD + RBAC
│   │       ├── resources.js    # CRUD + allocate + RBAC
│   │       ├── vendors.js      # CRUD + RBAC
│   │       ├── users.js        # Users + roles + permissions + RBAC
│   │       ├── finance.js      # Invoices + payments + expenses + RBAC
│   │       ├── registrations.js # Registrations + check-in + RBAC
│   │       ├── modules.js      # Speakers, exhibitors, sponsors, campaigns, coupons
│   │       └── dashboard.js    # Bulk data fetch for dashboard
│   ├── .env                # Environment variables
│   └── package.json
│
├── package.json            # Root — convenience scripts (dev, build, db:seed, etc.)
└── README.md
```

## Setup Instructions

### 1. Database (PostgreSQL)

Install PostgreSQL and create a database:
```sql
CREATE DATABASE amen_events;
```

### 2. Install All Dependencies

```bash
# From project root
npm run install:all
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env    # Edit DATABASE_URL if needed
npx prisma db push      # Create all tables
npm run db:seed         # Seed roles, permissions, users, and demo data
npm run dev             # Start API server on http://localhost:4000
```

### 4. Frontend Setup

```bash
cd frontend
npm run dev             # Start Vite dev server on http://localhost:5173
```

### 5. Run Both (from project root)

```bash
npm run dev             # Starts both backend and frontend concurrently
```
```

The frontend `.env` file should contain:
```
VITE_API_URL=http://localhost:4000/api
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | hana@amen.et | demo@amen |
| Event Manager | dawit@amen.et | demo@amen |
| Operations | sara@amen.et | demo@amen |
| Finance | yonas@amen.et | demo@amen |
| Marketing | liya@amen.et | demo@amen |

## Architecture

### Authentication Flow
1. User submits email + password to `POST /api/auth/login`
2. Backend validates credentials with bcrypt, returns `accessToken` (15min) + `refreshToken` (7d)
3. Frontend stores tokens in memory (access) + localStorage (refresh)
4. On every API call, `Authorization: Bearer <accessToken>` header is sent
5. On 401, frontend auto-refreshes using the refresh token
6. On logout, refresh token is revoked in database

### RBAC Flow
1. Every API route is wrapped with `authRequired` middleware (validates JWT)
2. Then `requirePermission(module, permission)` middleware checks RBAC
3. Admin role bypasses all permission checks
4. Other roles are checked against the `RolePermission` table
5. Frontend also checks permissions for UI rendering (sidebar filtering, route protection)

### Offline Fallback
If the backend is unavailable, the frontend automatically falls back to local seed data (same as before the migration). This ensures the app remains functional during development or demo without a running backend.

### Database Schema (20+ tables)
- **Auth**: User, RefreshToken, Role, Permission, UserRole, RolePermission
- **Business**: Client, Venue, Resource, Vendor, Event, Task, Speaker, Exhibitor, Sponsor
- **Finance**: Invoice, Expense
- **Registration**: Registration, Allocation
- **Marketing**: Campaign, Coupon
- **System**: ActivityLog, Notification

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login with email + password |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Revoke refresh token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/password | Change password |
| PUT | /api/auth/two-step | Toggle 2-step verification |
| GET | /api/dashboard | Bulk fetch all data |
| GET/POST/PUT/DELETE | /api/clients | Client CRUD |
| GET/POST/PUT/DELETE | /api/events | Event CRUD + team/budget |
| GET/POST/PUT/DELETE | /api/tasks | Task CRUD |
| GET/POST/PUT/DELETE | /api/venues | Venue CRUD |
| GET/POST/PUT/DELETE | /api/resources | Resource CRUD + allocate |
| GET/POST/PUT/DELETE | /api/vendors | Vendor CRUD |
| GET/POST/PUT/DELETE | /api/users | User CRUD + roles |
| GET | /api/finance | Invoices + expenses |
| POST | /api/finance/invoices | Create invoice |
| POST | /api/finance/invoices/:id/payment | Record payment |
| POST | /api/finance/expenses | Record expense |
| GET/POST | /api/registrations | Registrations + check-in |
| GET/POST | /api/modules/* | Speakers, exhibitors, sponsors, campaigns, coupons |
