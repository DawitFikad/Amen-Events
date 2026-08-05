import React, { useState } from 'react'
import { Settings, ShieldCheck, Users, DatabaseBackup, Activity, Bell, Globe, Lock, KeyRound, Smartphone } from 'lucide-react'
import { useData } from '../store/DataContext'
import { ROLE_DEFINITIONS, MODULES, PERMISSIONS } from '../store/permissions'
import { PageHeader, Badge, Toast, Th, Td, Avatar } from '../components/ui'

const permLabels = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  approve: 'Approve', assign: 'Assign', export: 'Export', print: 'Print', manage: 'Manage',
}

export default function Admin() {
  const { state, patch, rbac } = useData()
  const [view, setView] = useState(rbac?.roleKey === 'admin' ? 'users' : 'settings')
  const [toast, setToast] = useState(null)
  const [twoStep, setTwoStep] = useState(state.twoStepVerification || false)

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

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Users, roles, permissions, security and system settings."
        icon={Settings}
        actions={isAdmin ? <button className="btn-primary" onClick={() => show('User invitation sent')}><Users size={15} /> Invite User</button> : undefined}
      />

      {isAdmin && (
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Total Users', users.length, 'team members'], ['Roles', roleEntries.length, 'defined'], ['Active Sessions', users.filter((u) => u.status === 'active').length, 'right now'], ['Last Backup', '2 hr ago', 'automatic']].map(([l, v, s]) => (
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
          <table className="w-full">
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
              <button className="btn-outline w-full !py-1.5 text-xs mt-4" onClick={() => show(`Editing ${r.name} permissions`, 'info')}>Manage Permissions</button>
            </div>
          ))}
        </div>
      )}

      {view === 'settings' && (
        <div className="max-w-2xl space-y-4">
          {/* Personal Security — visible to all roles */}
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
                    patch('twoStepVerification', () => next)
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
                    {['SMS code to phone', 'Authenticator app', 'Email code'].map((method, i) => (
                      <label key={method} className="flex items-center gap-3 rounded-lg border border-brand-100 bg-white p-3 cursor-pointer hover:border-brand-300">
                        <input type="radio" name="2fa-method" defaultChecked={i === 0} className="accent-brand-700" />
                        <span className="text-sm font-medium text-ink/75">{method}</span>
                      </label>
                    ))}
                  </div>
                  <button className="btn-primary mt-3 !py-2" onClick={() => show('Verification method saved')}>Save Method</button>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-brand-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-950">Change Password</p>
                  <p className="text-xs text-ink/45 mt-0.5">Update your account password</p>
                </div>
                <button className="btn-outline !py-1.5 text-xs" onClick={() => show('Password reset link sent to your email', 'info')}>Reset</button>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="card p-5">
                <p className="mb-4 font-bold text-brand-950">Company Settings</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Company Name', 'Amen Event Organizer'], ['Currency', 'ETB (Birr)'], ['Default Timezone', 'Africa/Addis_Ababa'], ['Date Format', 'YYYY-MM-DD']].map(([l, v]) => (
                    <div key={l}><p className="label">{l}</p><input className="input" defaultValue={v} /></div>
                  ))}
                </div>
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
                      <span className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-brand-700" onClick={() => show(`${n} toggled`, 'info')}>
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-6" />
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
            <span className="chip bg-brand-100 text-brand-800">{activityLog.length} entries</span>
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
            <p className="mt-2 text-sm text-ink/55">Automatic backups run daily at 02:00. Last successful backup: <span className="font-semibold text-brand-900">2 hours ago</span>.</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={() => show('Backup created', 'success')}>Backup Now</button>
              <button className="btn-outline" onClick={() => show('Backup downloaded', 'success')}>Download</button>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2"><Lock size={18} className="text-brand-600" /><p className="font-bold text-brand-950">Security</p></div>
            <div className="mt-3 space-y-3">
              {[['Two-factor authentication', true], ['Session timeout (30 min)', true], ['Login alerts', true], ['Restrict IP access', false]].map(([n, on]) => (
                <div key={n} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                  <p className="text-sm font-semibold text-brand-950">{n}</p>
                  <span className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${on ? 'bg-brand-700' : 'bg-brand-100'}`} onClick={() => show(`${n} toggled`, 'info')}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}