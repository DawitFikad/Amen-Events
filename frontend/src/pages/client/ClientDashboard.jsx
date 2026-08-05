import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Clock, CheckCircle2, AlertCircle, TrendingUp, Wallet,
  Bell, ArrowRight, FileText, MessageSquare, Users, Ticket, Activity,
  ChevronRight, Building2, MapPin,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress } from '../../components/ui'
import { fmtCompact } from '../../store/data'

export default function ClientDashboard() {
  const { state } = useData()
  const navigate = useNavigate()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)

  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])
  const myInvoices = useMemo(() => state.invoices.filter((inv) => inv.clientId === clientId), [state.invoices, clientId])
  const myRegistrations = useMemo(() => {
    const eventIds = new Set(myEvents.map((e) => e.id))
    return state.registrations.filter((r) => eventIds.has(r.eventId))
  }, [state.registrations, myEvents])

  const stats = useMemo(() => {
    const upcoming = myEvents.filter((e) => e.status === 'upcoming').length
    const ongoing = myEvents.filter((e) => e.status === 'ongoing').length
    const completed = myEvents.filter((e) => e.status === 'completed').length
    const outstanding = myInvoices.filter((i) => i.status !== 'paid').reduce((a, i) => a + (i.amount - (i.paid || 0)), 0)
    const totalBudget = myEvents.reduce((a, e) => a + (e.budget || 0), 0)
    return { total: myEvents.length, upcoming, ongoing, completed, outstanding, totalBudget }
  }, [myEvents, myInvoices])

  const upcomingEvents = useMemo(() =>
    myEvents
      .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
      .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
      .slice(0, 4)
  , [myEvents])

  const recentNotifications = state.notifications.slice(0, 5)
  const recentActivities = state.activities.slice(0, 5)

  const quickActions = [
    { label: 'Browse Events', icon: Ticket, route: '/erp/portal/browse', tone: 'bg-brand-600' },
    { label: 'View My Events', icon: CalendarDays, route: '/erp/portal/events', tone: 'bg-brand-500' },
    { label: 'Pay Invoices', icon: Wallet, route: '/erp/portal/invoices', tone: 'bg-gold-500' },
    { label: 'Contact PM', icon: MessageSquare, route: '/erp/portal/messages', tone: 'bg-ink' },
  ]

  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-200">Welcome back,</p>
            <h1 className="text-2xl font-black">{client?.contactPerson || 'Client'}</h1>
            <p className="mt-1 text-sm text-brand-100">{client?.company} · {client?.industry}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-[11px] text-brand-200">Total Events</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-2xl font-black">{stats.upcoming}</p>
              <p className="text-[11px] text-brand-200">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Events" value={stats.total} icon={CalendarDays} tone="brand" sub={`${stats.upcoming} upcoming`} />
        <StatCard label="Upcoming" value={stats.upcoming} icon={Clock} tone="gold" sub="scheduled" />
        <StatCard label="Ongoing" value={stats.ongoing} icon={Activity} tone="brand" sub="live now" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="brand" sub="finished" />
        <StatCard label="Outstanding" value={`ETB ${fmtCompact(stats.outstanding)}`} icon={AlertCircle} tone="gold" sub="to pay" />
        <StatCard label="Total Budget" value={`ETB ${fmtCompact(stats.totalBudget)}`} icon={TrendingUp} tone="brand" sub="all events" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.route)}
            className="group flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.tone} text-white`}>
              <a.icon size={18} />
            </span>
            <span className="flex-1 text-sm font-bold text-brand-950">{a.label}</span>
            <ArrowRight size={16} className="text-brand-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Upcoming events */}
        <div className="xl:col-span-2 card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Upcoming Events</p>
            <button onClick={() => navigate('/erp/portal/events')} className="text-xs font-bold text-brand-700 hover:text-brand-900">
              View all <ChevronRight size={12} className="inline" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No upcoming events.</div>
            ) : (
              upcomingEvents.map((e) => {
                const venue = state.venues.find((v) => v.id === e.venueId)
                const pm = state.staff.find((s) => s.id === e.pmId)
                return (
                  <div key={e.id} className="flex items-center gap-4 rounded-xl border border-brand-100 p-4 transition hover:border-brand-300 hover:shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-[10px] font-bold uppercase">{e.date ? new Date(e.date).toLocaleDateString('en', { month: 'short' }) : 'TBD'}</span>
                      <span className="text-lg font-black leading-none">{e.date ? new Date(e.date).getDate() : '—'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-950">{e.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink/45">
                        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {venue?.name || 'TBA'}</span>
                        <span className="inline-flex items-center gap-1"><Building2 size={11} /> {pm?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block w-24">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-ink/40">
                        <span>Progress</span><span className="font-bold">{e.progress || 0}%</span>
                      </div>
                      <Progress value={e.progress || 0} />
                    </div>
                    <Badge status={e.status} label={e.status} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent notifications */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Notifications</p>
            <button onClick={() => navigate('/erp/portal/notifications')} className="text-xs font-bold text-brand-700 hover:text-brand-900">
              View all <ChevronRight size={12} className="inline" />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentNotifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No notifications.</div>
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-brand-50 p-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Bell size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand-950">{n.text}</p>
                    <p className="text-[10px] text-ink/40">{n.at}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent activities + deadlines */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Recent Activities</p>
          <div className="space-y-2.5">
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <span className="flex-1 text-ink/70">{a.text}</span>
                <span className="text-[11px] text-ink/40">{a.at}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Upcoming Deadlines</p>
          <div className="space-y-2.5">
            {myInvoices.filter((i) => i.status !== 'paid').map((inv) => {
              const evt = myEvents.find((e) => e.id === inv.eventId)
              return (
                <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-gold-100 bg-gold-50/50 p-3">
                  <AlertCircle size={16} className="shrink-0 text-gold-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand-950">Invoice {inv.ref} due</p>
                    <p className="text-[11px] text-ink/45">{evt?.name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gold-700">ETB {fmtCompact(inv.amount - (inv.paid || 0))}</p>
                    <p className="text-[10px] text-ink/40">{inv.dueDate}</p>
                  </div>
                </div>
              )
            })}
            {myInvoices.filter((i) => i.status !== 'paid').length === 0 && (
              <div className="py-6 text-center text-sm text-ink/40">No pending deadlines.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
