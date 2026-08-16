import React, { useState, useEffect } from 'react'
import { Settings, ShieldCheck, Users, DatabaseBackup, Activity, Bell, Globe, Lock, KeyRound, Smartphone, Mail, Download, Plus, X } from 'lucide-react'
import { useData } from '../store/DataContext'
import { ROLE_DEFINITIONS, MODULES, PERMISSIONS } from '../store/permissions'
import { PageHeader, Badge, Toast, Th, Td, Avatar, Modal, Field } from '../components/ui'
import { downloadCSV } from '../store/exportUtils'
import { nameOnly, emailValid, validate } from '../store/validation'

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
  const { state, patch, patchBy, logActivity, addNotification, rbac, intent, clearIntent, setDemoFlag } = useData()
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
    ['settings', 'Company Settings', Globe],
    ['activity', 'Activity Logs', Activity],
    ['backup', 'Backup & Security', DatabaseBackup],
  ]
  const tabs = isAdmin ? allTabs : allTabs.filter(([v]) => v === 'settings')

  const sendInvite = () => {
    const res = validate(inviteForm, { name: [nameOnly('Full name')], email: [emailValid('Work email')] })
    if (!res.ok) { show(res.first, 'warn'); return }
    inlineInvite(inviteForm.name.trim(), inviteForm.email.trim(), inviteForm.role)
  }

  const inlineInvite = (name, email, role) => {
    const uid = 'st' + (state.staff.length + 10)
    patch('staff', (arr) => [...arr, {
      id: uid, name, role: 'New Hire', dept: 'Operations',
      phone: '', email, type: 'Employee', status: 'invited',
      color: 'bg-brand-500', initials: name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
      userRoles: [{ role: { key: role } }],
    }])
    logActivity(`Invitation sent to ${email} (${role})`, 'admin')
    addNotification(`Invitation sent to ${email}`)
    setInviteOpen(false); setInviteForm({ name: '', email: '', role: 'manager' })
    setDemoFlag('adminAction', true)
    show(`Invitation sent to ${email}`)
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
    if (!pwdForm.current) { show('Enter your current password', 'warn'); return }
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
    downloadCSV('amen-ems-backup.csv', ['Module', 'Records', 'Backup Time'], rows.map(([m, n]) => [m, n, new Date().toLocaleString()]))
    logActivity('Backup downloaded', 'admin')
    show('Backup downloaded')
  }

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Users, roles, permissions, security and system settings."
        icon={Settings}
        actions={isAdmin ? <button className="btn-primary" onClick={() => setInviteOpen(true)}><Users size={15} /> Invite User</button> : undefined}
      />

      {isAdmin && (
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Total Users', users.length, 'team members'], ['Roles', roleEntries.length, 'defined'], ['Active Sessions', users.filter((u) => u.status === 'active').length, 'right now'], ['Last Backup', backupAt || '2 hr ago', 'automatic']].map(([l, v, s]) => (
            <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
          ))}
        </div>
      )}

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
                downloadCSV('activity-log.csv', ['User', 'Action', 'Time'], activityLog.map((a) => [a.user, a.action, a.at]))
                show('Activity log exported')
              }}><Download size={13} /> Export</button>
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

