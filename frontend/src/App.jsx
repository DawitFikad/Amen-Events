import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import DemoWizard from './components/DemoWizard'
import LiveKpiBar from './components/LiveKpiBar'
import { DataProvider, useData } from './store/DataContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const ClientLogin = lazy(() => import('./pages/ClientLogin'))
const CRM = lazy(() => import('./pages/CRM'))
const Notifications = lazy(() => import('./pages/Notifications'))

// Portal imports
import { AttendeeProvider } from './store/AttendeeContext'
import PortalLayout from './components/portal/PortalLayout'
const PortalLanding = lazy(() => import('./pages/portal/Landing'))
const PortalEventList = lazy(() => import('./pages/portal/EventList'))
const PortalEventDetail = lazy(() => import('./pages/portal/EventDetail'))
const PortalRegister = lazy(() => import('./pages/portal/Register'))
const PortalLogin = lazy(() => import('./pages/portal/Login'))
const PortalCheckout = lazy(() => import('./pages/portal/Checkout'))
const PortalPaymentSuccess = lazy(() => import('./pages/portal/PaymentSuccess'))
const PortalPaymentFailed = lazy(() => import('./pages/portal/PaymentFailed'))
const PortalMyTickets = lazy(() => import('./pages/portal/MyTickets'))
const PortalMyEvents = lazy(() => import('./pages/portal/MyEvents'))
const PortalProfile = lazy(() => import('./pages/portal/Profile'))
const PortalNotifications = lazy(() => import('./pages/portal/Notifications'))
const PortalAbout = lazy(() => import('./pages/portal/About'))
const PortalContact = lazy(() => import('./pages/portal/Contact'))
const Events = lazy(() => import('./pages/Events'))
const Projects = lazy(() => import('./pages/Projects'))
const Venues = lazy(() => import('./pages/Venues'))
const Resources = lazy(() => import('./pages/Resources'))
const Vendors = lazy(() => import('./pages/Vendors'))
const Staff = lazy(() => import('./pages/Staff'))
const Finance = lazy(() => import('./pages/Finance'))
const Ticketing = lazy(() => import('./pages/Ticketing'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const Speakers = lazy(() => import('./pages/Speakers'))
const Exhibition = lazy(() => import('./pages/Exhibition'))
const Sponsorship = lazy(() => import('./pages/Sponsorship'))
const Marketing = lazy(() => import('./pages/Marketing'))
const Reports = lazy(() => import('./pages/Reports'))
const Admin = lazy(() => import('./pages/Admin'))
const Profile = lazy(() => import('./pages/Profile'))
import ClientShell from './components/layout/ClientShell'
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'))
const ClientEvents = lazy(() => import('./pages/client/ClientEvents'))
const ClientBrowseEvents = lazy(() => import('./pages/client/ClientBrowseEvents'))
const ClientEventDetail = lazy(() => import('./pages/client/ClientEventDetail'))
const ClientTimeline = lazy(() => import('./pages/client/ClientTimeline'))
const ClientAttendees = lazy(() => import('./pages/client/ClientAttendees'))
const ClientTickets = lazy(() => import('./pages/client/ClientTickets'))
const ClientInvoices = lazy(() => import('./pages/client/ClientInvoices'))
const ClientDocuments = lazy(() => import('./pages/client/ClientDocuments'))
const ClientNotifications = lazy(() => import('./pages/client/ClientNotifications'))
const ClientMessages = lazy(() => import('./pages/client/ClientMessages'))
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'))
const ClientSupport = lazy(() => import('./pages/client/ClientSupport'))
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'))
const Approvals = lazy(() => import('./pages/Approvals'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f7f3]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
        <p className="text-sm font-medium text-brand-700">Loading…</p>
      </div>
    </div>
  )
}

function PoweredFooter() {
  return (
    <footer className="animate-fade-up mt-10 pb-8">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">Powered by</p>
        <p className="animate-gradient-x cursor-default bg-gradient-to-r from-brand-600 via-gold-500 to-brand-700 bg-clip-text text-sm font-black tracking-wide text-transparent select-none">
          Gravity Technologies PLC
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
      </div>
    </footer>
  )
}

function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Keyboard shortcuts: g d=dashboard, g e=events, g c=crm, g f=finance, g r=reports
  useEffect(() => {
    let pendingG = false
    let timer = null
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'g' && !pendingG) {
        pendingG = true
        timer = setTimeout(() => { pendingG = false }, 800)
        return
      }
      if (pendingG) {
        const map = { d: '/erp/dashboard', e: '/erp/admin/events', c: '/erp/crm', f: '/erp/finance', r: '/erp/reports', v: '/erp/vendors', s: '/erp/staff', t: '/erp/ticketing' }
        if (map[e.key]) {
          e.preventDefault()
          navigate(map[e.key])
        }
        pendingG = false
        if (timer) clearTimeout(timer)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileNav(false)} />
      )}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileNav={mobileNav} setMobileNav={setMobileNav} />
      <div className={`${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'} transition-all duration-300`}>
        <Topbar onMenuClick={() => setMobileNav(true)} />
        <main key={location.pathname} className="mx-auto max-w-[1400px] overflow-x-hidden px-5 py-6 animate-page-enter">
          {/* KPI OFF */}
          <Outlet />
          <PoweredFooter />
        </main>
        <DemoWizard />
      </div>
    </div>
  )
}

function RequireAuth({ children, loginTo = '/login' }) {
  const { state, loading } = useData()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
          <p className="text-sm font-medium text-brand-700">Loading workspace…</p>
        </div>
      </div>
    )
  }
  if (!state.currentUserId) return <Navigate to={loginTo} replace state={{ from: location }} />
  return children
}

function RequireStaff({ children }) {
  const { rbac } = useData()
  if (rbac?.roleKey === 'client') return <Navigate to="/erp/portal" replace />
  return children
}

const ROUTE_MODULES = {
  '/erp/dashboard': 'dashboard', '/erp/reports': 'reports', '/erp/crm': 'crm',
  '/erp/admin/events': 'events', '/erp/projects': 'projects', '/erp/venues': 'venues',
  '/erp/resources': 'resources', '/erp/vendors': 'vendors', '/erp/staff': 'staff',
  '/erp/finance': 'finance', '/erp/ticketing': 'ticketing', '/erp/checkin': 'checkin',
  '/erp/speakers': 'speakers', '/erp/exhibition': 'exhibition', '/erp/sponsorship': 'sponsorship',
  '/erp/marketing': 'marketing', '/erp/admin': 'admin',
}

function RequirePermission({ module, children }) {
  const { rbac } = useData()
  if (!rbac || !rbac.canAccess(module)) return <Navigate to="/erp/dashboard" replace />
  return children
}

function RequireClient({ children }) {
  const { rbac } = useData()
  if (!rbac?.roleKey) return <Navigate to="/client-login" replace />
  if (rbac.roleKey !== 'client') return <Navigate to="/erp/dashboard" replace />
  return children
}

function HomeRedirect() {
  const { rbac } = useData()
  return <Navigate to={rbac?.roleKey === 'client' ? '/erp/portal' : '/erp/dashboard'} replace />
}

export default function App() {
  return (
    <DataProvider>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/client-login" element={<ClientLogin />} />
        {/* Public Portal - attendee-facing, separate from ERP */}
        <Route element={<AttendeeProvider><PortalLayout /></AttendeeProvider>}>
          <Route path="/" element={<PortalLanding />} />
          <Route path="/events" element={<PortalEventList />} />
          <Route path="/events/:id" element={<PortalEventDetail />} />
          <Route path="/register" element={<PortalRegister />} />
          <Route path="/portal-login" element={<PortalLogin />} />
          <Route path="/checkout" element={<PortalCheckout />} />
          <Route path="/payment-success" element={<PortalPaymentSuccess />} />
          <Route path="/payment-failed" element={<PortalPaymentFailed />} />
          <Route path="/my-tickets" element={<PortalMyTickets />} />
          <Route path="/my-events" element={<PortalMyEvents />} />
          <Route path="/profile" element={<PortalProfile />} />
          <Route path="/notifications" element={<PortalNotifications />} />
          <Route path="/about" element={<PortalAbout />} />
          <Route path="/contact" element={<PortalContact />} />
        </Route>
        {/* Client Portal - separate layout & login, still requires auth */}
        <Route path="/erp/portal" element={<RequireAuth loginTo="/client-login"><RequireClient><ClientShell /></RequireClient></RequireAuth>}>
          <Route index element={<ClientDashboard />} />
          <Route path="/erp/portal/browse" element={<ClientBrowseEvents />} />
          <Route path="/erp/portal/events" element={<ClientEvents />} />
          <Route path="/erp/portal/events/:id" element={<ClientEventDetail />} />
          <Route path="/erp/portal/timeline" element={<ClientTimeline />} />
          <Route path="/erp/portal/timeline/:id" element={<ClientTimeline />} />
          <Route path="/erp/portal/attendees" element={<ClientAttendees />} />
          <Route path="/erp/portal/tickets" element={<ClientTickets />} />
          <Route path="/erp/portal/invoices" element={<ClientInvoices />} />
          <Route path="/erp/portal/documents" element={<ClientDocuments />} />
          <Route path="/erp/portal/documents/:id" element={<ClientDocuments />} />
          <Route path="/erp/portal/notifications" element={<ClientNotifications />} />
          <Route path="/erp/portal/messages" element={<ClientMessages />} />
          <Route path="/erp/portal/profile" element={<ClientProfile />} />
          <Route path="/erp/portal/support" element={<ClientSupport />} />
        </Route>
        {/* ERP - staff only */}
        <Route path="/erp" element={<RequireAuth><RequireStaff><Shell /></RequireStaff></RequireAuth>}>
          <Route index element={<HomeRedirect />} />
          <Route path="/erp/workflow" element={<RequirePermission module="events"><WorkflowPage /></RequirePermission>} />
          <Route path="/erp/approvals" element={<RequirePermission module="finance"><Approvals /></RequirePermission>} />
          <Route path="/erp/calendar" element={<RequirePermission module="dashboard"><CalendarPage /></RequirePermission>} />
          <Route path="/erp/dashboard" element={<RequirePermission module="dashboard"><Dashboard /></RequirePermission>} />
          <Route path="/erp/crm" element={<RequirePermission module="crm"><CRM /></RequirePermission>} />
          <Route path="/erp/admin/events" element={<RequirePermission module="events"><Events /></RequirePermission>} />
          <Route path="/erp/projects" element={<RequirePermission module="projects"><Projects /></RequirePermission>} />
          <Route path="/erp/venues" element={<RequirePermission module="venues"><Venues /></RequirePermission>} />
          <Route path="/erp/resources" element={<RequirePermission module="resources"><Resources /></RequirePermission>} />
          <Route path="/erp/vendors" element={<RequirePermission module="vendors"><Vendors /></RequirePermission>} />
          <Route path="/erp/staff" element={<RequirePermission module="staff"><Staff /></RequirePermission>} />
          <Route path="/erp/finance" element={<RequirePermission module="finance"><Finance /></RequirePermission>} />
          <Route path="/erp/ticketing" element={<RequirePermission module="ticketing"><Ticketing /></RequirePermission>} />
          <Route path="/erp/checkin" element={<RequirePermission module="checkin"><CheckIn /></RequirePermission>} />
          <Route path="/erp/speakers" element={<RequirePermission module="speakers"><Speakers /></RequirePermission>} />
          <Route path="/erp/exhibition" element={<RequirePermission module="exhibition"><Exhibition /></RequirePermission>} />
          <Route path="/erp/sponsorship" element={<RequirePermission module="sponsorship"><Sponsorship /></RequirePermission>} />
          <Route path="/erp/marketing" element={<RequirePermission module="marketing"><Marketing /></RequirePermission>} />
          <Route path="/erp/reports" element={<RequirePermission module="reports"><Reports /></RequirePermission>} />
          <Route path="/erp/notifications" element={<Notifications />} />
          <Route path="/erp/admin" element={<RequirePermission module="admin"><Admin /></RequirePermission>} />
          <Route path="/erp/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/erp" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </DataProvider>
  )
}