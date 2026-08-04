import React, { useState } from 'react'
import { Settings, ShieldCheck, Users, DatabaseBackup, Activity, Bell, Globe, Lock, KeyRound } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, Th, Td, Avatar } from '../components/ui'

const users = [
  { id: 'u1', name: 'Hana Tadesse', email: 'hana@amen.et', role: 'Administrator', status: 'active', last: '2 min ago' },
  { id: 'u2', name: 'Dawit Mengistu', email: 'dawit@amen.et', role: 'Manager', status: 'active', last: '5 min ago' },
  { id: 'u3', name: 'Selam Bekele', email: 'selam@amen.et', role: 'Coordinator', status: 'active', last: '1 hr ago' },
  { id: 'u4', name: 'Yonas Girma', email: 'yonas@amen.et', role: 'Finance', status: 'active', last: '3 hr ago' },
  { id: 'u5', name: 'Freelancer Viewer', email: 'viewer@amen.et', role: 'Viewer', status: 'suspended', last: '6 days ago' },
]

const roles = [
  { id: 'r1', name: 'Administrator', users: 1, perms: 'Full access incl. settings & security', color: 'bg-red-100 text-red-700' },
  { id: 'r2', name: 'Manager', users: 2, perms: 'All modules, approvals, no admin', color: 'bg-gold-100 text-gold-700' },
  { id: 'r3', name: 'Coordinator', users: 3, perms: 'Events, tasks, check-in', color: 'bg-brand-100 text-brand-800' },
  { id: 'r4', name: 'Finance', users: 1, perms: 'Financial module only', color: 'bg-sky-100 text-sky-700' },
  { id: 'r5', name: 'Viewer', users: 2, perms: 'Read-only dashboards', color: 'bg-slate-100 text-slate-600' },
]

const activityLog = [
  { id: 'al1', user: 'Dawit Mengistu', action: 'Marked event "Retreat" as ongoing', at: '08:12' },
  { id: 'al2', user: 'Yonas Girma', action: 'Recorded payment INV-2026-0141', at: '07:55' },
  { id: 'al3', user: 'Selam Bekele', action: 'Created task "Finalize seating"', at: '07:40' },
  { id: 'al4', user: 'Hana Tadesse', action: 'Updated company notification settings', at: '06:30' },
  { id: 'al5', user: 'Sara Ahmed', action: 'Allocated 2x Line Array to Summit', at: '05:15' },
]

export default function Admin() {
  const { state } = useData()
  const [view, setView] = useState('users')
  const [toast, setToast] = useState(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Users, roles, permissions, security and system settings."
        icon={Settings}
        actions={<button className="btn-primary" onClick={() => show('User invitation sent')}><Users size={15} /> Invite User</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[['Total Users', users.length, 'team members'], ['Roles', roles.length, 'defined'], ['Active Sessions', 4, 'right now'], ['Last Backup', '2 hr ago', 'automatic']].map(([l, v, s]) => (
          <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['users', 'Users', Users], ['roles', 'Roles & Permissions', ShieldCheck], ['settings', 'Company Settings', Globe], ['activity', 'Activity Logs', Activity], ['backup', 'Backup & Security', DatabaseBackup]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Last Active</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {users.map((u) => {
                const m = state.staff.find((x) => x.email === u.email)
                return (
                  <tr key={u.id} className="hover:bg-brand-50/40">
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={u.name} initials={m?.initials || u.name.split(' ').map((p) => p[0]).join('')} color={m?.color || 'bg-brand-600'} size="sm" />
                        <span><p className="font-semibold text-brand-950">{u.name}</p><p className="text-[11px] text-ink/40">{u.email}</p></span>
                      </span>
                    </Td>
                    <Td><Badge status="active" label={u.role} /></Td>
                    <Td><Badge status={u.status} label={u.status} /></Td>
                    <Td className="text-ink/50">{u.last}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'roles' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className={`chip ${r.color}`}>{r.name}</span>
                <span className="text-xs text-ink/40">{r.users} user(s)</span>
              </div>
              <p className="mt-3 text-sm text-ink/60">{r.perms}</p>
              <button className="btn-outline w-full !py-1.5 text-xs mt-4" onClick={() => show(`Editing ${r.name} permissions`, 'info')}>Manage Permissions</button>
            </div>
          ))}
        </div>
      )}

      {view === 'settings' && (
        <div className="max-w-2xl space-y-4">
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
        </div>
      )}

      {view === 'activity' && (
        <div className="card p-5">
          <div className="flex items-center justify-between border-b border-brand-100 pb-4">
            <p className="font-bold text-brand-950">System Activity Log</p>
            <span className="chip bg-brand-100 text-brand-800">{activityLog.length} entries today</span>
          </div>
          <div className="divide-y divide-brand-50">
            {activityLog.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <p className="flex-1 text-sm text-ink/75"><span className="font-semibold text-brand-950">{a.user}</span> · {a.action}</p>
                <span className="text-xs text-ink/35">{a.at}</span>
              </div>
            ))}
          </div>
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