# Amen Events — Enterprise Documentation

Complete documentation for the Amen Events ERP platform.

## Contents

1. [Installation Guide](#installation-guide)
2. [Deployment Guide](#deployment-guide)
3. [User Manual](#user-manual)
4. [Administrator Manual](#administrator-manual)
5. [API Documentation](#api-documentation)
6. [Database ER Diagram](#database-er-diagram)
7. [System Architecture](#system-architecture)
8. [Demo Script](#demo-script)

---

## Installation Guide

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ (or Docker)
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET, etc.
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Configure VITE_API_URL
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | hana@amen.et | demo@amen |
| Manager | dawit@amen.et | demo@amen |
| Operations | sara@amen.et | demo@amen |
| Finance | yonas@amen.et | demo@amen |
| Marketing | liya@amen.et | demo@amen |
| Client | meron@ethfintech.com | demo@amen |

---

## Deployment Guide

### Frontend → Netlify

1. `cd frontend && npm run build`
2. Connect repo to Netlify or upload `dist/`
3. Env var: `VITE_API_URL=https://your-backend-url/api`
4. Build command: `npm run build`, Publish dir: `dist`

### Backend → Railway / Render

1. Connect repo to Railway or Render
2. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`
3. Start command: `npm start`
4. Run: `npx prisma db push`

### Database → Managed PostgreSQL

Use Railway, Render, Supabase, or DigitalOcean managed PostgreSQL.

---

## User Manual

### Dashboard
KPI cards, revenue charts, event pipeline, quick actions.

### CRM
Client management with stages: Lead → Quotation → Contract → Active.

### Events
Create events, assign teams, set budgets, track 10-step workflow.

### Finance
Invoices, expenses, payments, purchase requests, P&L reports.

### Ticketing & Check-in
Register attendees, generate QR codes, scan for entry.

### Reports
All reports from live database data. Export to CSV/PDF.

### Global Search
Search bar in top nav searches across all entities. Debounced 300ms. Keyboard navigable.

### Keyboard Shortcuts
- `g d` → Dashboard, `g e` → Events, `g c` → CRM
- `g f` → Finance, `g r` → Reports, `g v` → Vendors
- `g s` → Staff, `g t` → Ticketing, `Esc` → Close modals

---

## Administrator Manual

### RBAC Roles
Admin (full), Manager (events/CRM), Operations (venues/resources), Finance (invoices/budgets), Marketing (campaigns/tickets), Client (portal only).

### Security
- Password: 8+ chars, uppercase, lowercase, number
- Lockout: 5 failed attempts → 15-min lock
- Rate limiting: 300 req/15min API, 20 req/15min auth
- Helmet security headers
- JWT access + refresh tokens
- Audit logging (login history, password changes)

### Database Commands
```bash
npx prisma db push     # Apply schema
npx prisma migrate dev # Run migrations
npm run db:seed        # Seed demo data
npx prisma studio      # GUI database browser
```

---

## API Documentation

Base URL: `http://localhost:4000/api`
Auth: `Authorization: Bearer <token>`

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| /auth/login | POST | Login |
| /auth/refresh | POST | Refresh token |
| /auth/logout | POST | Logout |
| /auth/me | GET | Current user |
| /auth/profile | PUT | Update profile |
| /auth/password | PUT | Change password |
| /auth/forgot-password | POST | Request reset |
| /auth/reset-password | POST | Reset password |
| /auth/login-history | GET | Login history |

### Core Modules
| Endpoint | Method | Description |
|----------|--------|-------------|
| /clients | GET/POST | Clients |
| /clients/:id | PUT/DELETE | Update/Delete client |
| /events | GET/POST | Events |
| /events/:id | PUT/DELETE | Update/Delete event |
| /events/:id/team | PUT | Assign team |
| /events/:id/budget | PUT | Set budget |
| /finance/invoices | GET/POST | Invoices |
| /finance/invoices/:id/payment | POST | Record payment |
| /finance/expenses | GET/POST | Expenses |
| /registrations | GET/POST | Registrations |
| /registrations/checkin | POST | QR check-in |
| /tasks | GET/POST | Tasks |
| /venues | GET/POST | Venues |
| /resources | GET/POST | Resources |
| /vendors | GET/POST | Vendors |
| /users | GET/POST/PUT | Users |

### Extended Modules
| Endpoint | Method | Description |
|----------|--------|-------------|
| /dashboard | GET | Dashboard data |
| /search?q= | GET | Global search |
| /portal | GET | Client portal |
| /workflow | GET/POST | Workflow ops |
| /notifications | GET/POST | Notifications |
| /approvals | GET/POST/PUT | Approval requests |
| /documents | GET/POST | Documents |
| /calendar | GET/POST | Calendar events |
| /modules/speakers | GET/POST | Speakers |
| /modules/exhibitors | GET/POST | Exhibitors |
| /modules/sponsors | GET/POST | Sponsors |
| /modules/campaigns | GET/POST | Campaigns |

### Error Format
```json
{ "error": "Error description" }
```
Status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limited), 500 (server).

---

## Database ER Diagram

```
Client ──── Event ──── Venue
  │           │
  │           ├── Task
  │           ├── Registration (QR, check-in)
  │           ├── Expense ──── Vendor
  │           └── Invoice
  │
  └── Document

User ──── UserRole ──── Role ──── RolePerm ──── Permission

Notification, ApprovalRequest, CalendarEvent
ActivityLog, LoginHistory, PasswordReset, RefreshToken
```

### Key Models (25+)
Client, Event, Venue, Resource, Vendor, Task, Invoice, Expense, Registration, User, Role, Permission, UserRole, RolePerm, Notification, ApprovalRequest, Document, CalendarEvent, ActivityLog, LoginHistory, PasswordReset, RefreshToken, Speaker, Exhibitor, Sponsor, Campaign, Coupon, Allocation, WorkflowLog

---

## System Architecture

```
React Frontend (Vite:5173)
  ├── Pages (20+)
  ├── UI Components (Skeleton, Modal, Toast, ConfirmDialog, Breadcrumbs, Pagination)
  ├── DataContext (global state, API integration)
  ├── GlobalSearch (debounced, keyboard-navigable)
  └── API Layer (auto-refresh JWT, error handling)
        │
        ▼ HTTP/HTTPS
Express Backend (:4000)
  ├── Helmet (security headers)
  ├── Rate Limiting (API + auth)
  ├── Auth Middleware (JWT, RBAC, account lockout)
  ├── 18 Route Modules
  └── Prisma ORM
        │
        ▼
PostgreSQL (:5432)
  └── 25+ models with relations
```

---

## Demo Script

1. **Login** as Admin → Show dashboard
2. **Quick Add** → Create client → Show in CRM
3. **Quick Add** → Create event → Show in Events
4. **Workflow** → Assign team, set budget, submit approval
5. **Finance** → Approve budget, record expense, create invoice, record payment
6. **Ticketing** → Register attendee, show QR code
7. **Check-in** → Scan QR → success → scan again → duplicate rejected
8. **Reports** → Show live data charts, export CSV
9. **Global Search** → Type name → show cross-entity results
10. **Error Handling** → Duplicate email, invalid login, missing fields
11. **Responsive** → Resize to mobile → hamburger menu → sidebar drawer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TailwindCSS, Recharts, Lucide |
| Backend | Express 4, Helmet, express-rate-limit |
| Database | PostgreSQL, Prisma ORM 5 |
| Auth | JWT + bcryptjs |
| Security | Helmet, rate limiting, password complexity, account lockout |

---

*Gravity Technologies PLC*
