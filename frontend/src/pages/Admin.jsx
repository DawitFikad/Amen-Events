import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Settings, ShieldCheck, Users, DatabaseBackup, Activity, Bell, Globe, Lock, KeyRound, Smartphone, Mail, Download, FileText, Plus, X, Wallet, Workflow, TrendingUp, ArrowUpRight, DollarSign, TrendingDown, ClipboardList, Receipt, UserCheck, ExternalLink } from 'lucide-react'
import { useData } from '../store/DataContext'
import { ROLE_DEFINITIONS, MODULES, PERMISSIONS } from '../store/permissions'
import { PageHeader, Badge, Toast, Th, Td, Avatar, Modal, Field, Progress } from '../components/ui'
import { exportTableToPDF } from '../store/exportUtils'
import { nameOnly, emailValid, validate } from '../store/validation'
import { fmt } from '../store/data'

const permLabels = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  approve: 'Approve', assign: 'Assign', export: 'Export', print: 'Print', manage: 'Manage',
}

const notificationDefaults = {
  'Budget alerts': true,
  'Check-in updates': true,
  'Payment confirmations': true,
  'Maintenance reminders': false,
}

const securityDefaults = {
  'Two-factor authentication': true,
  'Session timeout (30 min)': true,
  'Login alerts': true,
  'Restrict IP access': false,
}

export default function Admin() {
  const { state, patch, patchBy, logActivity, addNotification, addStaffMember, rbac, intent, clearIntent, setDemoFlag } = useData()
  const [view, setView] = useState(rbac?.roleKey === 'admin' ? 'users' : 'settings')
  const [toast, setToast] = useState(null)
  const [twoStep, setTwoStep] = useState(state.twoStepVerification || false)
  const [method, setMethod] = useState(state.verificationMethod || 'SMS code to phone')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'manager' })
  const [permRole, setPermRole] = useState(null)
  const [permDraft, setPermDraft] = useState(null)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '' })
  const [backupAt, setBackupAt] = useState(state.lastBackupAt || null)
  const [notifPrefs, setNotifPrefs] = useState({ ...notificationDefaults, ...(state.notificationSettings || {}) })
  const [secPrefs, setSecPrefs] = useState({ ...securityDefaults, ...(state.securitySettings || {}) })

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const isAdmin = rbac?.roleKey === 'admin'

  // Derive users from state.staff (real data from backend)
  const users = state.staff.map((s) => ({
    id: s.id, name: s.name, email: s.email,
    role: s.userRoles?.[0]?.role?.label || s.jobTitle || 'Staff',
    status: s.status || 'active',
  }))

  // Derive roles from ROLE_DEFINITIONS (real RBAC config)
  const roleEntries = Object.entries(ROLE_DEFINITIONS).map(([key, def]) => ({
    id: key, name: def.label, perms: def.description,
    userCount: state.staff.filter((s) => s.userRoles?.[0]?.role?.key === key).length,
    modules: def.modules,
  }))

  // Activity logs from state (real data from backend)
  const activityLog = state.activities.map((a) => ({
    id: a.id, user: a.user?.name || 'System', action: a.text, at: a.at || (a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : ''),
  }))

  const allTabs = [
    ['users', 'Users', Users],
    ['roles', 'Roles & Permissions', ShieldCheck],
    ['finance', 'Finance Management', Wallet],
    ['settings', 'Company Settings', Globe],
    ['activity', 'Activity Logs', Activity],
    ['backup', 'Backup & Security', DatabaseBackup],
  ]
  const tabs = isAdmin ? allTabs : allTabs.filter(([v]) => v === 'settings')

  const inlineInvite = async (name, email, role) => {
    try {
      await addStaffMember({
        name,
        email,
        role: 'New Hire',
        jobTitle: role,
        dept: 'Operations',
        type: 'Employee',
        status: 'invited',
        color: 'bg-brand-500',
      })
    } catch (err) {
      const uid = 'st' + (state.staff.length + 10)
      patch('staff', (arr) => [...arr, {
        id: uid, name, role: 'New Hire', dept: 'Operations',
        phone: '', email, type: 'Employee', status: 'invited',
        color: 'bg-brand-500', initials: name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
        userRoles: [{ role: { key: role } }],
      }])
    }
    logActivity(`Invitation sent to ${email} (${role})`, 'admin')
    addNotification(`Invitation sent to ${email}`)
    setInviteOpen(false); setInviteForm({ name: '', email: '', role: 'manager' })
    setDemoFlag('adminAction', true)
    show(`Invitation sent to ${email}`)
  }

  const sendInvite = () => {
    const res = validate(inviteForm, { name: [nameOnly('Full name')], email: [emailValid('Work email')] })
    if (!res.ok) { show(res.first, 'warn'); return }
    inlineInvite(inviteForm.name.trim(), inviteForm.email.trim(), inviteForm.role)
  }

  useEffect(() => {
    if (intent === 'invite-user' && isAdmin) {
      setView('users'); setPermRole(null)
      if (state.demo.autoplay) {
        setInviteForm({ name: 'Samrawit Hailu', email: 'samrawit@amen.et', role: 'manager' }); setInviteOpen(true)
        setTimeout(() => inlineInvite('Samrawit Hailu', 'samrawit@amen.et', 'manager'), 1100)
      } else setInviteOpen(true)
      clearIntent()
    }
  }, [intent])

  const openPermissions = (roleId) => {
    setPermRole(roleId)
    setPermDraft(JSON.parse(JSON.stringify(ROLE_DEFINITIONS[roleId].modules)))
  }

  const savePermissions = () => {
    patch('roleOverrides', (o = {}) => ({ ...o, [permRole]: permDraft }))
    logActivity(`Permissions updated for ${ROLE_DEFINITIONS[permRole].label}`, 'admin')
    setPermRole(null); setPermDraft(null)
    show('Permissions saved')
  }

  const saveMethod = () => {
    patch('verificationMethod', method)
    logActivity(`2-step verification method set to ${method}`, 'admin')
    show('Verification method saved')
  }

  const changePassword = () => {
    if (!pwdForm.current) { show('Please fill out this field', 'warn'); return }
    if (pwdForm.next.length < 6) { show('New password must be at least 6 characters', 'warn'); return }
    if (pwdForm.next !== pwdForm.confirm) { show('New passwords do not match', 'warn'); return }
    patch('currentUser', (u) => ({ ...u, passwordChanged: true }))
    logActivity('Password updated', 'admin')
    setPwdOpen(false); setPwdForm({ current: '', next: '', confirm: '' })
    show('Password updated successfully')
  }

  const runBackup = () => {
    const now = new Date().toLocaleString()
    setBackupAt(now)
    patch('lastBackupAt', now)
    logActivity(`Backup created at ${now}`, 'admin')
    addNotification('Backup created successfully')
    show(`Backup created - ${now}`)
  }

  const downloadBackup = () => {
    const rows = [
      ['Staff', state.staff.length], ['Clients', state.clients.length], ['Events', state.events.length],
      ['Venues', state.venues.length], ['Resources', state.resources.length], ['Vendors', state.vendors.length],
      ['Registrations', state.registrations.length], ['Expenses', state.expenses.length],
    ]
    exportTableToPDF(
      'amen-ems-backup-summary',
      'Amen EMS System Backup Summary',
      ['Module', 'Records', 'Backup Timestamp'],
      rows.map(([m, n]) => [m, n, new Date().toLocaleString()]),
      { subtitle: `System backup generated on ${new Date().toLocaleString()}` }
    )
    logActivity('Backup downloaded', 'admin')
    show('Backup downloaded as PDF')
  }

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Users, roles, permissions, security and system settings."
        icon={Settings}
        actions={
          isAdmin ? (
            <button className="btn-primary" onClick={() => setInviteOpen(true)}>
              <Users size={15} /> Invite User
            </button>
          ) : undefined
        }
      />

      {isAdmin && (
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Total Users', users.length, 'team members'], ['Roles', roleEntries.length, 'defined'], ['Active Sessions', users.filter((u) => u.status === 'active').length, 'right now'], ['Last Backup', backupAt || '2 hr ago', 'automatic']].map(([l, v, s]) => (
            <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
          ))}
        </div>
      )}

      {/* ── Workflow Pipeline Overview Card ── */}
      <div className="mb-5 card overflow-hidden border-brand-200/80 shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-brand-100">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Workflow size={20} />
            </span>
            <div>
              <h3 className="text-sm font-black text-brand-950">Event Lifecycle Pipeline</h3>
              <p className="text-xs text-ink/50">14-stage governance workflow — real-time status across all active events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/erp/admin/events" className="btn-outline text-xs !py-2 flex items-center gap-1.5">
              <TrendingUp size={13} /> Manage Events
            </Link>
            <Link to="/erp/workflow" className="btn-primary text-xs !py-2 flex items-center gap-1.5">
              <Workflow size={13} /> Open Pipeline <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-center">
            <p className="text-2xl font-black text-brand-950">{state.events.length}</p>
            <p className="text-xs font-semibold text-ink/50 mt-1">Total Events</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
            <p className="text-2xl font-black text-amber-700">{state.events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').length}</p>
            <p className="text-xs font-semibold text-ink/50 mt-1">In-Flight</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">{state.events.filter((e) => e.status === 'completed').length}</p>
            <p className="text-xs font-semibold text-ink/50 mt-1">Completed</p>
          </div>
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-center">
            <p className="text-2xl font-black text-brand-700">
              {state.events.length > 0 ? Math.round(state.events.reduce((acc, e) => acc + (e.progress ?? 0), 0) / state.events.length) : 0}%
            </p>
            <p className="text-xs font-semibold text-ink/50 mt-1">Avg Progress</p>
          </div>
        </div>
        {state.events.length > 0 && (
          <div className="border-t border-brand-100 px-5 py-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/40">Top Active Events</p>
            <div className="space-y-1.5">
              {state.events
                .filter((e) => e.status !== 'completed')
                .slice(0, 4)
                .map((e) => {
                  const pct = e.progress ?? 0
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <p className="flex-1 truncate text-xs font-semibold text-brand-900">{e.name}</p>
                      <span className="chip bg-brand-100 text-brand-800 text-[10px]">Stage {(e.stage ?? 0) + 1}/14</span>
                      <div className="w-28 h-1.5 overflow-hidden rounded-full bg-brand-100">
                        <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-brand-700 w-8 text-right">{pct}%</span>
                      <Link to={`/erp/workflow?eventId=${e.id}`} className="text-brand-600 hover:text-brand-900 transition">
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
            <thead className="bg-brand-50/50"><tr><Th>User</Th><Th>Role</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/40">
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar name={u.name} initials={u.name.split(' ').map((p) => p[0]).join('')} color="bg-brand-600" size="sm" />
                      <span><p className="font-semibold text-brand-950">{u.name}</p><p className="text-[11px] text-ink/40">{u.email}</p></span>
                    </span>
                  </Td>
                  <Td><Badge status="active" label={u.role} /></Td>
                  <Td><Badge status={u.status} label={u.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {view === 'roles' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleEntries.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="chip bg-brand-100 text-brand-800">{r.name}</span>
                <span className="text-xs text-ink/40">{r.userCount} user(s)</span>
              </div>
              <p className="mt-3 text-sm text-ink/60">{r.perms}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {Object.entries(r.modules).filter(([_, p]) => p.view).map(([mod]) => (
                  <span key={mod} className="chip bg-brand-50 text-brand-700 text-[10px]">{mod}</span>
                ))}
              </div>
              <button className="btn-outline w-full !py-1.5 text-xs mt-4" onClick={() => openPermissions(r.id)}>Manage Permissions</button>
            </div>
          ))}
        </div>
      )}

      {view === 'settings' && (
        <div className="max-w-2xl space-y-4">
          {/* Personal Security - visible to all roles */}
          <div className="card p-5 border-l-4 border-l-brand-600">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-brand-600" />
              <p className="font-bold text-brand-950">Security Settings</p>
            </div>
            <p className="text-sm text-ink/55 mb-4">Manage your account security and 2-step verification.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-brand-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-950">2-Step Verification</p>
                  <p className="text-xs text-ink/45 mt-0.5">Require a verification code on login</p>
                </div>
                <span
                  className={`relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition ${twoStep ? 'bg-brand-700' : 'bg-brand-100'}`}
                  onClick={() => {
                    const next = !twoStep
                    setTwoStep(next)
                    patch('twoStepVerification', next)
                    logActivity(`2-step verification ${next ? 'enabled' : 'disabled'}`, 'admin')
                    show(next ? '2-step verification enabled' : '2-step verification disabled', next ? 'success' : 'warn')
                  }}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${twoStep ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </div>
              {twoStep && (
                <div className="rounded-lg bg-brand-50/50 p-4 animate-fade-up">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">Verification Method</p>
                  <div className="space-y-2">
                    {['SMS code to phone', 'Authenticator app', 'Email code'].map((m) => (
                      <label key={m} className="flex items-center gap-3 rounded-lg border border-brand-100 bg-white p-3 cursor-pointer hover:border-brand-300">
                        <input type="radio" name="2fa-method" checked={method === m} onChange={() => setMethod(m)} className="accent-brand-700" />
                        <span className="text-sm font-medium text-ink/75">{m}</span>
                      </label>
                    ))}
                  </div>
                  <button className="btn-primary mt-3 !py-2" onClick={saveMethod}>Save Method</button>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-brand-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-950">Change Password</p>
                  <p className="text-xs text-ink/45 mt-0.5">Update your account password</p>
                </div>
                <button className="btn-outline !py-1.5 text-xs" onClick={() => setPwdOpen(true)}>Reset</button>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="card p-5">
                <p className="mb-4 font-bold text-brand-950">Company Settings</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Company Name', 'Amen Events'], ['Currency', 'ETB (Birr)'], ['Default Timezone', 'Africa/Addis_Ababa'], ['Date Format', 'YYYY-MM-DD']].map(([l, v]) => (
                    <div key={l}><p className="label">{l}</p><input className="input" defaultValue={v} /></div>
                  ))}
                </div>
                <button className="btn-primary mt-4 !py-2" onClick={() => { logActivity('Company settings updated', 'admin'); show('Company settings saved') }}>Save Settings</button>
              </div>

              <div className="card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Bell size={16} className="text-brand-600" />
                  <p className="font-bold text-brand-950">Notification Settings</p>
                </div>
                <div className="space-y-3">
                  {[['Budget alerts', 'Notify when events cross budget thresholds'], ['Check-in updates', 'Live feed of QR scans'], ['Payment confirmations', 'When client payments are received'], ['Maintenance reminders', 'For inventory in need of service']].map(([n, d]) => (
                    <div key={n} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                      <div><p className="text-sm font-semibold text-brand-950">{n}</p><p className="text-xs text-ink/45">{d}</p></div>
                      <span
                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${notifPrefs[n] ? 'bg-brand-700' : 'bg-brand-100'}`}
                        onClick={() => {
                          const next = { ...notifPrefs, [n]: !notifPrefs[n] }
                          setNotifPrefs(next)
                          patch('notificationSettings', next)
                          logActivity(`Notification "${n}" ${next[n] ? 'enabled' : 'disabled'}`, 'admin')
                          show(`${n} ${next[n] ? 'enabled' : 'disabled'}`, next[n] ? 'success' : 'warn')
                        }}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${notifPrefs[n] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {view === 'activity' && (
        <div className="card p-5">
          <div className="flex items-center justify-between border-b border-brand-100 pb-4">
            <p className="font-bold text-brand-950">System Activity Log</p>
            <div className="flex items-center gap-2">
              <span className="chip bg-brand-100 text-brand-800">{activityLog.length} entries</span>
              <button className="btn-outline !py-1.5 text-xs" onClick={() => {
                exportTableToPDF(
                  'audit-activity-log',
                  'System Security & Audit Activity Log',
                  ['User', 'Action', 'Timestamp'],
                  activityLog.map((a) => [a.user, a.action, a.at]),
                  { subtitle: `${activityLog.length} activity entries · Exported by Administrator` }
                )
                show('Activity log exported to PDF')
              }}><FileText size={13} /> Export PDF</button>
            </div>
          </div>
          {activityLog.length === 0 ? (
            <div className="py-8 text-center text-ink/40">No activity logged yet.</div>
          ) : (
            <div className="divide-y divide-brand-50">
              {activityLog.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  <p className="flex-1 text-sm text-ink/75"><span className="font-semibold text-brand-950">{a.user}</span> · {a.action}</p>
                  <span className="text-xs text-ink/35">{a.at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'finance' && (() => {
        const revenue = state.invoices.reduce((a, i) => a + (i.paid || 0), 0)
        const expected = state.invoices.reduce((a, i) => a + (i.amount || 0), 0)
        const outstanding = expected - revenue
        const totalExp = state.expenses.reduce((a, e) => a + (e.amount || 0), 0)
        const profit = revenue - totalExp
        const purchaseRequests = state.purchaseRequests || []
        const pendingPR = purchaseRequests.filter(p => p.status === 'pending').length
        const unpaidInvoices = state.invoices.filter(i => i.status !== 'paid')

        const topExpCats = (() => {
          const map = {}
          state.expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
          return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
        })()

        return (
          <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-5">
              {[
                { l: 'Revenue Collected', v: fmt(revenue), tone: 'text-brand-800', bg: 'bg-brand-50', icon: TrendingUp },
                { l: 'Outstanding', v: fmt(outstanding), tone: 'text-amber-700', bg: 'bg-amber-50', icon: Receipt },
                { l: 'Total Expenses', v: fmt(totalExp), tone: 'text-red-700', bg: 'bg-red-50', icon: TrendingDown },
                { l: 'Net Profit', v: fmt(profit), tone: profit >= 0 ? 'text-emerald-700' : 'text-red-700', bg: profit >= 0 ? 'bg-emerald-50' : 'bg-red-50', icon: DollarSign },
                { l: 'Pending Purchases', v: pendingPR + ' requests', tone: 'text-purple-700', bg: 'bg-purple-50', icon: ClipboardList },
              ].map(({ l, v, tone, bg, icon: Icon }) => (
                <div key={l} className={`card ${bg} p-4`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">{l}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Icon size={16} className={tone} />
                    <p className={`text-base font-black ${tone}`}>{v}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Unpaid Invoices */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-100 p-4">
                  <p className="font-bold text-brand-950">Outstanding Invoices</p>
                  <Link to="/erp/finance" className="btn-outline !py-1 text-xs flex items-center gap-1">
                    <ExternalLink size={12} /> Full Finance
                  </Link>
                </div>
                {unpaidInvoices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-ink/40">All invoices are settled. ✓</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-brand-50/50">
                      <tr><Th>Ref</Th><Th>Client</Th><Th className="text-right">Outstanding</Th><Th>Due</Th><Th>Status</Th></tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50">
                      {unpaidInvoices.slice(0, 8).map(inv => {
                        const c = state.clients.find(x => x.id === inv.clientId)
                        return (
                          <tr key={inv.id} className="hover:bg-brand-50/30">
                            <Td className="font-mono text-xs font-bold text-brand-800">{inv.ref}</Td>
                            <Td className="text-sm font-semibold text-brand-950">{c?.company || '—'}</Td>
                            <Td className="text-right text-sm font-semibold text-red-600">{fmt(inv.amount - inv.paid)}</Td>
                            <Td className="text-xs text-ink/50">{inv.dueDate}</Td>
                            <Td><Badge status={inv.status} label={inv.status} /></Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Expense Breakdown */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-100 p-4">
                  <p className="font-bold text-brand-950">Expense Breakdown by Category</p>
                  <span className="text-xs text-ink/40">{state.expenses.length} transactions</span>
                </div>
                {topExpCats.length === 0 ? (
                  <div className="py-8 text-center text-sm text-ink/40">No expenses recorded yet.</div>
                ) : (
                  <div className="divide-y divide-brand-50">
                    {topExpCats.map(([cat, amt]) => {
                      const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0
                      return (
                        <div key={cat} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-950">{cat}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-brand-100">
                                <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] text-ink/40">{pct}%</span>
                            </div>
                          </div>
                          <p className="font-black text-brand-900">{fmt(amt)}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* P&L Summary */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-brand-100 p-4">
                <p className="font-bold text-brand-950">Profit & Loss Summary</p>
                <Link to="/erp/finance" className="btn-primary !py-1.5 text-xs flex items-center gap-1">
                  <ExternalLink size={12} /> Open Full Finance Control Center
                </Link>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-brand-50">
                  {[
                    { label: 'Total Revenue Collected', value: revenue, tone: 'text-brand-800', sign: '+' },
                    { label: 'Outstanding Receivables', value: outstanding, tone: 'text-amber-700', sign: '' },
                    { label: 'Total Operating Expenses', value: totalExp, tone: 'text-red-600', sign: '–' },
                    { label: 'Net Profit / Loss', value: profit, tone: profit >= 0 ? 'text-emerald-700 font-black text-lg' : 'text-red-700 font-black text-lg', sign: profit >= 0 ? '+' : '' },
                  ].map(r => (
                    <tr key={r.label} className="hover:bg-brand-50/30">
                      <Td className="font-semibold text-ink/70">{r.label}</Td>
                      <Td className={`text-right ${r.tone}`}>{r.sign}{fmt(r.value)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Purchase Requests (pending) */}
            {pendingPR > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-brand-100 p-4">
                  <p className="font-bold text-brand-950">⚠️ {pendingPR} Purchase Request{pendingPR > 1 ? 's' : ''} Awaiting Approval</p>
                </div>
                <table className="w-full">
                  <thead className="bg-brand-50/50">
                    <tr><Th>Item</Th><Th>Event</Th><Th className="text-right">Amount</Th><Th>Urgency</Th></tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {purchaseRequests.filter(p => p.status === 'pending').slice(0, 5).map(p => {
                      const ev = state.events.find(x => x.id === p.eventId)
                      return (
                        <tr key={p.id} className="hover:bg-brand-50/30">
                          <Td className="font-semibold text-brand-950">{p.item}</Td>
                          <Td className="text-ink/60">{ev?.name || '—'}</Td>
                          <Td className="text-right font-semibold">{fmt(p.amount)}</Td>
                          <Td><Badge status={p.urgency === 'Urgent' ? 'urgent' : 'pending'} label={p.urgency || 'Normal'} /></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="p-4">
                  <Link to="/erp/finance" className="btn-outline text-xs flex w-max items-center gap-1">
                    <ExternalLink size={12} /> Manage in Finance Center
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {view === 'backup' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-center gap-2"><DatabaseBackup size={18} className="text-brand-600" /><p className="font-bold text-brand-950">Backup</p></div>
            <p className="mt-2 text-sm text-ink/55">Automatic backups run daily at 02:00. Last successful backup: <span className="font-semibold text-brand-900">{backupAt || '2 hours ago'}</span>.</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={runBackup}>Backup Now</button>
              <button className="btn-outline" onClick={downloadBackup}>Download</button>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2"><Lock size={18} className="text-brand-600" /><p className="font-bold text-brand-950">Security</p></div>
            <div className="mt-3 space-y-3">
              {[['Two-factor authentication', true], ['Session timeout (30 min)', true], ['Login alerts', true], ['Restrict IP access', false]].map(([n]) => (
                <div key={n} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                  <p className="text-sm font-semibold text-brand-950">{n}</p>
                  <span
                    className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${secPrefs[n] ? 'bg-brand-700' : 'bg-brand-100'}`}
                    onClick={() => {
                      const next = { ...secPrefs, [n]: !secPrefs[n] }
                      setSecPrefs(next)
                      patch('securitySettings', next)
                      logActivity(`Security "${n}" ${next[n] ? 'enabled' : 'disabled'}`, 'admin')
                      show(`${n} ${next[n] ? 'enabled' : 'disabled'}`, next[n] ? 'success' : 'warn')
                    }}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${secPrefs[n] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite user modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite User" width="max-w-md">
        <div className="space-y-3">
          <Field label="Full Name *"><input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="e.g. Abebe Kebede" /></Field>
          <Field label="Work Email *"><input className="input" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="name@amen.et" /></Field>
          <Field label="Role">
            <select className="input" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
              {Object.entries(ROLE_DEFINITIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setInviteOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={sendInvite}><Mail size={14} /> Send Invitation</button>
        </div>
      </Modal>

      {/* Permissions modal */}
      <Modal open={!!permRole} onClose={() => setPermRole(null)} title={`Manage Permissions - ${permRole ? ROLE_DEFINITIONS[permRole].label : ''}`} width="max-w-2xl">
        {permDraft && (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {Object.entries(permDraft).map(([mod, perms]) => (
              <div key={mod} className="mb-3 rounded-lg border border-brand-100 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-800">{mod}</p>
                <div className="flex flex-wrap gap-2">
                  {PERMISSIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const next = { ...perms, [p]: !perms[p] }
                        setPermDraft({ ...permDraft, [mod]: next })
                      }}
                      className={`chip cursor-pointer transition ${perms[p] ? 'bg-brand-700 text-white' : 'bg-brand-50 text-ink/45 hover:bg-brand-100'}`}
                    >{permLabels[p] || p}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-between">
          <button className="btn-ghost !text-red-600" onClick={() => setPermRole(null)}>Cancel</button>
          <button className="btn-primary" onClick={savePermissions}>Save Permissions</button>
        </div>
      </Modal>

      {/* Change password modal */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password" width="max-w-md">
        <div className="space-y-3">
          <Field label="Current Password *"><input type="password" className="input" value={pwdForm.current || ''} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder="••••••••" /></Field>
          <Field label="New Password *"><input type="password" className="input" value={pwdForm.next || ''} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} placeholder="Min 6 characters" /></Field>
          <Field label="Confirm New Password *"><input type="password" className="input" value={pwdForm.confirm || ''} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Repeat new password" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setPwdOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={changePassword}><KeyRound size={14} /> Update Password</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}

