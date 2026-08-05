import React, { useState, useEffect } from 'react'
import { Menu, Bell, Search, Plus, ChevronDown, LogOut, UserRound, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../store/DataContext'
import { Avatar } from '../ui'
import api from '../../store/api'
import GlobalSearch from '../GlobalSearch'

export default function Topbar({ onQuickAdd, onMenuClick }) {
  const { state, logout, backendOnline } = useData()
  const navigate = useNavigate()
  const [showBell, setShowBell] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [apiNotifs, setApiNotifs] = useState([])
  const me = state.staff.find((m) => m.id === state.currentUserId)
  const q = state.clients.length

  useEffect(() => {
    if (backendOnline) {
      api.notifications.list().then(({ notifications }) => setApiNotifs(notifications)).catch(() => {})
      const interval = setInterval(() => {
        api.notifications.list().then(({ notifications }) => setApiNotifs(notifications)).catch(() => {})
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [backendOnline])

  const allNotifs = backendOnline && apiNotifs.length > 0 ? apiNotifs : state.notifications
  const unread = backendOnline ? allNotifs.filter((n) => !n.read).length : allNotifs.length

  const markAllRead = async () => {
    if (backendOnline) {
      await api.notifications.markAllRead()
      setApiNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const notifTone = {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-brand-100 bg-white/85 px-5 backdrop-blur">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 hover:bg-brand-50 hover:text-brand-800"
        >
          <Menu size={20} />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <GlobalSearch />
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
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {showBell && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowBell(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-brand-100 bg-white p-2 shadow-pop">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">Notifications</p>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900">
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 space-y-0.5 overflow-y-auto">
                  {allNotifs.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-ink/40">No notifications</div>
                  ) : (
                    allNotifs.slice(0, 12).map((n) => (
                      <div key={n.id} className={`flex gap-2.5 rounded-lg px-2 py-2 hover:bg-brand-50/60 ${n.read ? 'opacity-50' : ''}`}>
                        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${notifTone[n.type] || notifTone.general}`} />
                        <div className="min-w-0">
                          <p className="text-[13px] leading-snug text-ink/80">{n.text}</p>
                          <p className="mt-0.5 text-[11px] text-ink/40">{n.at || (n.createdAt ? new Date(n.createdAt).toLocaleString() : '')}</p>
                        </div>
                      </div>
                    ))
                  )}
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