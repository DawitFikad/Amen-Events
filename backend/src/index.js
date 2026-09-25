import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') })

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import prisma from './lib/prisma.js'
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

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or if origin is in allowedOrigins or on vercel.app
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true)
      }
      return callback(null, true) // Fallback to allow for flexibility
    },
    credentials: true,
  })
)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json())
app.use(morgan('dev'))

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

// Health check that verifies Supabase connection
const healthCheck = async (req, res) => {
  try {
    const userCount = await prisma.user.count()
    res.json({ status: 'ok', database: 'connected', users: userCount })
  } catch (err) {
    console.error('Database connection error:', err)
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message })
  }
}
app.get('/health', healthCheck)
app.get('/api/health', healthCheck)

// Router containing all API endpoints
const apiRouter = express.Router()

// Public routes (no auth required)
apiRouter.use('/public', publicRoutes)

// Attendee portal routes
apiRouter.use('/portal/auth', portalAuthRoutes)
apiRouter.use('/portal', portalAttendeeRoutes)

// Apply rate limiting
apiRouter.use('/auth', authLimiter, authRoutes)
apiRouter.use(apiLimiter)

// Business routes
apiRouter.use('/clients', clientsRoutes)
apiRouter.use('/events', eventsRoutes)
apiRouter.use('/tasks', tasksRoutes)
apiRouter.use('/venues', venuesRoutes)
apiRouter.use('/resources', resourcesRoutes)
apiRouter.use('/vendors', vendorsRoutes)
apiRouter.use('/users', usersRoutes)
apiRouter.use('/finance', financeRoutes)
apiRouter.use('/registrations', registrationsRoutes)
apiRouter.use('/modules', modulesRoutes)
apiRouter.use('/dashboard', dashboardRoutes)
apiRouter.use('/portal', portalRoutes)
apiRouter.use('/workflow', workflowRoutes)
apiRouter.use('/notifications', notificationsRoutes)
apiRouter.use('/approvals', approvalsRoutes)
apiRouter.use('/documents', documentsRoutes)
apiRouter.use('/calendar', calendarRoutes)
apiRouter.use('/search', searchRoutes)

// Mount on both /api and root so calls with or without /api prefix work seamlessly
app.use('/api', apiRouter)
app.use('/', apiRouter)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Amen Events API running on http://localhost:${PORT}`)
  })
}

export default app
