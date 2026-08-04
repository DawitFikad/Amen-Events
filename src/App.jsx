import React, { useState } from 'react'
import { Routes, Route, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import DemoWizard from './components/DemoWizard'
import { Modal, Field, Toast } from './components/ui'
import { DataProvider, useData } from './store/DataContext'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import CRM from './pages/CRM'
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

function QuickAdd() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { state, addClient, addEvent, addTask } = useData()
  const [tab, setTab] = useState('client')
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})

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
      navigate('/events')
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
      <Topbar onQuickAdd={() => setOpen(true)} />
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
  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'} transition-all duration-300`}>
        <QuickAdd />
        <main className="mx-auto max-w-[1400px] px-5 py-6">
          <Outlet />
          <PoweredFooter />
        </main>
        <DemoWizard />
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { state } = useData()
  const location = useLocation()
  if (!state.currentUserId) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Shell /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/events" element={<Events />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/ticketing" element={<Ticketing />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/exhibition" element={<Exhibition />} />
          <Route path="/sponsorship" element={<Sponsorship />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}