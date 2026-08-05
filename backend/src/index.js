import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import clientsRoutes from './routes/clients.js'
import eventsRoutes from './routes/events.js'
import tasksRoutes from './routes/tasks.js'
import venuesRoutes from './routes/venues.js'
import resourcesRoutes from './routes/resources.js'
import vendorsRoutes from './routes/vendors.js'
import usersRoutes from './routes/users.js'
import financeRoutes from './routes/finance.js'
import registrationsRoutes from './routes/registrations.js'
import modulesRoutes from './routes/modules.js'
import dashboardRoutes from './routes/dashboard.js'
import portalRoutes from './routes/portal.js'
import workflowRoutes from './routes/workflow.js'
import notificationsRoutes from './routes/notifications.js'
import approvalsRoutes from './routes/approvals.js'
import documentsRoutes from './routes/documents.js'
import calendarRoutes from './routes/calendar.js'
import searchRoutes from './routes/search.js'
import publicRoutes from './routes/public.js'
import portalAuthRoutes from './routes/portalAuth.js'
import portalAttendeeRoutes from './routes/portalAttendee.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json())
app.use(morgan('dev'))

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Public routes (no auth required)
app.use('/api/public', publicRoutes)

// Attendee portal routes (auth optional per route)
app.use('/api/portal/auth', portalAuthRoutes)
app.use('/api/portal', portalAttendeeRoutes)

// Apply general rate limiter to all API routes
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/venues', venuesRoutes)
app.use('/api/resources', resourcesRoutes)
app.use('/api/vendors', vendorsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/registrations', registrationsRoutes)
app.use('/api/modules', modulesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/workflow', workflowRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/approvals', approvalsRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/search', searchRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Amen Events API running on http://localhost:${PORT}`)
})
