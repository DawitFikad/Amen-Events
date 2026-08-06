import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck, Filter, CalendarClock, UserPlus, Wallet, AlertTriangle, Boxes, Star, Users } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Th, Td } from '../components/ui'

const TYPES = [
  ['all', 'All', Filter],
  ['task', 'Assignments', UserPlus],
  ['finance', 'Finance', Wallet],
  ['budget', 'Budget', Star],
  ['alert', 'Alerts', AlertTriangle],
  ['inventory', 'Inventory', Boxes],
  ['crm', 'CRM', Users],
]

export default function Notifications() {
  const { state, rbac } = useData()
  const [filter, setFilter] = useState('all')
  const [read, setRead] = useState({})

  const meId = state.currentUserId
  const mine = state.notifications.filter((n) => !n.userId || n.userId === meId)
  const filtered = filter === 'all' ? mine : mine.filter((n) => n.type === filter)
  const unread = mine.filter((n) => !read[n.id]).length

  const tone = {
    alert: 'bg-red-100 text-red-600',
    crm: 'bg-brand-100 text-brand-700',
    inventory: 'bg-gold-100 text-gold-700',
    finance: 'bg-emerald-100 text-emerald-700',
    task: 'bg-sky-100 text-sky-700',
    approval: 'bg-purple-100 text-purple-700',
    budget: 'bg-emerald-100 text-emerald-700',
    workflow: 'bg-brand-100 text-brand-700',
    general: 'bg-slate-100 text-slate-600',
  }
  const iconOf = {
    task: UserPlus, finance: Wallet, budget: Star, alert: AlertTriangle,
    inventory: Boxes, crm: Users, workflow: CalendarClock, general: Bell,
  }

  const markAllRead = () => setRead(mine.reduce((a, n) => ({ ...a, [n.id]: true }), {}))

  return (
    <div>
      <PageHeader
        title="My Notifications"
        subtitle={`Your assignments, finance and system alerts · ${unread} unread`}
        icon={Bell}
        actions={
          unread > 0 ? (
            <button className="btn-outline" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TYPES.map(([v, l, I]) => (
          <button key={v} onClick={() => setFilter(v)} className={`tab ${filter === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <p className="font-bold text-brand-950">Inbox ({filtered.length})</p>
          <Badge status={unread > 0 ? 'active' : 'done'} label={unread > 0 ? `${unread} unread` : 'All clear'} />
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-400"><Bell size={22} /></span>
            <p className="font-bold text-brand-950">No notifications</p>
            <p className="mt-1 text-sm text-ink/45">You'll see team assignments and system alerts here.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-50">
            {filtered.map((n) => {
              const Icon = iconOf[n.type] || Bell
              const isRead = read[n.id]
              const isMine = n.userId === meId
              return (
                <button
                  key={n.id}
                  onClick={() => setRead((prev) => ({ ...prev, [n.id]: true }))}
                  className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-brand-50/50 ${isRead ? 'opacity-55' : ''}`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone[n.type] || tone.general}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-950">{n.text}</p>
                      {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink/45">
                      <span>{n.at}</span>
                      {isMine && <span className="chip bg-brand-50 text-brand-700">Personal</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
