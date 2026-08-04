import React, { useState } from 'react'
import { Bell, Search, Plus, ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../store/DataContext'
import { Avatar } from '../ui'

export default function Topbar({ onQuickAdd }) {
  const { state, unreadNotifications, logout } = useData()
  const navigate = useNavigate()
  const [showBell, setShowBell] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const me = state.staff.find((m) => m.id === state.currentUserId)
  const q = state.clients.length

  const notifTone = {
    alert: 'bg-red-100 text-red-600',
    crm: 'bg-brand-100 text-brand-700',
    inventory: 'bg-gold-100 text-gold-700',
    finance: 'bg-emerald-100 text-emerald-700',
    task: 'bg-sky-100 text-sky-700',
    general: 'bg-slate-100 text-slate-600',
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-brand-100 bg-white/85 px-5 backdrop-blur">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            placeholder="Search events, clients, tasks…"
            className="w-full rounded-lg border border-brand-100 bg-brand-50/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {q} active clients
        </span>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowBell((s) => !s)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 hover:bg-brand-50 hover:text-brand-800"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </button>
          {showBell && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowBell(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-brand-100 bg-white p-2 shadow-pop">
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/40">Notifications</p>
                <div className="max-h-80 space-y-0.5 overflow-y-auto">
                  {state.notifications.map((n) => (
                    <div key={n.id} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-brand-50/60">
                      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${notifTone[n.type] || notifTone.general}`} />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-ink/80">{n.text}</p>
                        <p className="mt-0.5 text-[11px] text-ink/40">{n.at}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={onQuickAdd} className="btn-primary !px-3.5">
          <Plus size={16} /> <span className="hidden sm:inline">Quick Add</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUser((s) => !s)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-50"
          >
            <Avatar name={me?.name} initials={me?.initials} color={me?.color} size="sm" />
            <span className="hidden md:flex items-center gap-1 text-[13px] font-semibold text-ink/70">
              {me?.name.split(' ')[0]}
              <ChevronDown size={13} className="text-ink/35" />
            </span>
          </button>
          {showUser && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
              <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-brand-100 bg-white p-2 shadow-pop">
                <div className="border-b border-brand-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={me?.name} initials={me?.initials} color={me?.color} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-brand-950">{me?.name}</p>
                      <p className="truncate text-[11px] text-ink/45">{me?.role} · {me?.dept}</p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-ink/40"><UserRound size={12} /> {me?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login', { replace: true }) }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}