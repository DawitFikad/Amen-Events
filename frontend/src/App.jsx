import React, { useState, useEffect } from 'react'
import { Routes, Route, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import DemoWizard from './components/DemoWizard'
import { Modal, Field, Toast } from './components/ui'
import { DataProvider, useData } from './store/DataContext'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import CRM from './pages/CRM'

// Portal imports
import { AttendeeProvider } from './store/AttendeeContext'
import PortalLayout from './components/portal/PortalLayout'
import PortalLanding from './pages/portal/Landing'
import PortalEventList from './pages/portal/EventList'
import PortalEventDetail from './pages/portal/EventDetail'
import PortalRegister from './pages/portal/Register'
import PortalLogin from './pages/portal/Login'
import PortalCheckout from './pages/portal/Checkout'
import PortalPaymentSuccess from './pages/portal/PaymentSuccess'
import PortalPaymentFailed from './pages/portal/PaymentFailed'
import PortalMyTickets from './pages/portal/MyTickets'
import PortalMyEvents from './pages/portal/MyEvents'
import PortalProfile from './pages/portal/Profile'
import PortalNotifications from './pages/portal/Notifications'
import PortalAbout from './pages/portal/About'
import PortalContact from './pages/portal/Contact'
import Events from './pages/Events'
import Projects from './pages/Projects'
import Venues from './pages/Venues'
import Resources from './pages/Resources'
import Vendors from './pages/Vendors'
import Staff from './pages/Staff'
import Finance from './pages/Finance'
import Ticketing from './pages/Ticketing'
import CheckIn from './pages/CheckIn'
import Speakers from './pages/Speakers'
import Exhibition from './pages/Exhibition'
import Sponsorship from './pages/Sponsorship'
import Marketing from './pages/Marketing'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import ClientShell from './components/layout/ClientShell'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientEvents from './pages/client/ClientEvents'
import ClientBrowseEvents from './pages/client/ClientBrowseEvents'
import ClientEventDetail from './pages/client/ClientEventDetail'
import ClientTimeline from './pages/client/ClientTimeline'
import ClientAttendees from './pages/client/ClientAttendees'
import ClientTickets from './pages/client/ClientTickets'
import ClientInvoices from './pages/client/ClientInvoices'
import ClientDocuments from './pages/client/ClientDocuments'
import ClientNotifications from './pages/client/ClientNotifications'
import ClientMessages from './pages/client/ClientMessages'
import ClientProfile from './pages/client/ClientProfile'
import ClientSupport from './pages/client/ClientSupport'
import WorkflowPage from './pages/WorkflowPage'
import Approvals from './pages/Approvals'
import CalendarPage from './pages/CalendarPage'

function QuickAdd({ onMenuClick }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { state, addClient, addEvent, addTask } = useData()
  const [tab, setTab] = useState('client')
  const [form, setForm] = useState({})
  const [toast, setToast] = useState(null)

  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2600)
  }

  const submit = () => {
    if (tab === 'client' && form.company) {
      addClient(form)
      show(`Client "${form.company}" created`)
    } else if (tab === 'event' && form.name) {
      addEvent(form)
      show(`Event "${form.name}" created`)
      navigate('/erp/admin/events')
    } else if (tab === 'task' && form.title) {
      addTask({ ...form, assigneeId: form.assigneeId || 'st2', priority: form.priority || 'medium' })
      show('Task created')
    } else {
      show('Please fill the required fields', 'warn')
      return
    }
    setOpen(false)
    setForm({})
  }

  return (
    <>
      <Topbar onQuickAdd={() => setOpen(true)} onMenuClick={onMenuClick} />
      <Modal open={open} onClose={() => setOpen(false)} title="Quick Add">
        <div className="flex gap-1 rounded-xl bg-brand-50 p-1 mb-4">
          {[
            ['client', 'Client'], ['event', 'Event'], ['task', 'Task'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`tab flex-1 ${tab === v ? 'tab-active' : 'tab-idle'}`}>{l}</button>
          ))}
        </div>

        {tab === 'client' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company *"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Walia Telecom" /></Field>
            <Field label="Industry"><input className="input" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Financial Services" /></Field>
            <Field label="Contact Person"><input className="input" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" /></Field>
            <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9…" /></Field>
            <Field label="Email" className="col-span-2"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></Field>
          </div>
        )}

        {tab === 'event' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Innovation Summit" /></Field>
            <Field label="Category"><select className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Select…</option><option>Conference</option><option>Exhibition</option><option>Product Launch</option><option>Retreat</option><option>Gala</option><option>Ceremony</option></select></Field>
            <Field label="Date"><input type="date" className="input" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Budget (ETB)"><input type="number" className="input" value={form.budget || ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="850000" /></Field>
            <Field label="Client"><select className="input" value={form.clientId || ''} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><option value="">Select…</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
          </div>
        )}

        {tab === 'task' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Task Title *" className="col-span-2"><input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Book transport" /></Field>
            <Field label="Priority"><select className="input" value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
            <Field label="Due Date"><input type="date" className="input" value={form.due || ''} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create</button>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
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
        <QuickAdd onMenuClick={() => setMobileNav(true)} />
        <main key={location.pathname} className="mx-auto max-w-[1400px] px-5 py-6 animate-page-enter">
          <Outlet />
          <PoweredFooter />
        </main>
        <DemoWizard />
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
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
  if (!state.currentUserId) return <Navigate to="/login" replace state={{ from: location }} />
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
  if (!rbac) return <Navigate to="/login" replace />
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
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Public Portal — attendee-facing, separate from ERP */}
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
        {/* Client Portal — separate layout, still requires auth */}
        <Route path="/erp/portal" element={<RequireAuth><RequireClient><ClientShell /></RequireClient></RequireAuth>}>
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
        {/* ERP — staff only */}
        <Route path="/erp" element={<RequireAuth><Shell /></RequireAuth>}>
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
          <Route path="/erp/admin" element={<RequirePermission module="admin"><Admin /></RequirePermission>} />
          <Route path="/erp/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/erp" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}