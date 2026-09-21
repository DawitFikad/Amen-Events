import React, { useState } from 'react'
import { Bell, CheckCheck, Wallet, FileText, CalendarDays, GitBranch, Users, AlertCircle } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge } from '../../components/ui'

const ICON_MAP = {
  alert: AlertCircle,
  finance: Wallet,
  crm: Users,
  inventory: FileText,
  task: CalendarDays,
  registration: Users,
  venue: GitBranch,
  speaker: Users,
  checkin: CalendarDays,
}

export default function ClientNotifications() {
  const { state } = useData()
  const [filter, setFilter] = useState('all')
  const [read, setRead] = useState({})

  const notifications = state.notifications
  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)

  const types = ['all', 'alert', 'finance', 'task', 'registration']
  const unread = notifications.filter((n) => !read[n.id]).length

  const markAllRead = () => {
    setRead(notifications.reduce((a, n) => ({ ...a, [n.id]: true }), {}))
  }
  const markRead = (id) => setRead((r) => ({ ...r, [id]: true }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-brand-950">Notifications</h1>
          <p className="text-sm text-ink/50">{unread} notification{unread !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-outline text-xs" onClick={markAllRead}><CheckCheck size={14} /> Mark All Read</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
              filter === t ? 'bg-brand-600 text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
            }`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Bell size={36} className="mx-auto mb-3 text-ink/20" />
            <p className="text-sm font-semibold text-ink/50">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-50">
            {filtered.map((n) => {
              const Icon = ICON_MAP[n.type] || Bell
              return (
                <div key={n.id} onClick={() => markRead(n.id)} className={`flex items-start gap-3 p-4 transition hover:bg-brand-50/40 ${!read[n.id] ? 'cursor-pointer' : ''}`}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-950">{n.text}</p>
                    <p className="text-[11px] text-ink/40">{n.at}</p>
                  </div>
                  {!read[n.id] && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
