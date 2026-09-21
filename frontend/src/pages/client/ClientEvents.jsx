import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CalendarDays, MapPin, Building2, Wallet, CheckCircle2, Clock,
  Search, ArrowRight, Ticket, Plus, AlertCircle, Sparkles,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Progress, StatCard } from '../../components/ui'
import { fmtCompact } from '../../store/data'
import ClientAddEventModal from '../../components/ClientAddEventModal'

export default function ClientEvents() {
  const { state } = useData()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateOpen(true)
      searchParams.delete('create')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const allMyEvents = useMemo(() => {
    return state.events.filter((e) => {
      const isOwner = e.clientId === clientId
      const hasRegistration = state.registrations.some((r) =>
        r.eventId === e.id && (r.clientId === clientId || (client?.email && r.email?.toLowerCase() === client.email.toLowerCase()))
      )
      return isOwner || hasRegistration
    })
  }, [state.events, state.registrations, clientId, client?.email])

  const pendingCount = allMyEvents.filter((e) => e.status === 'pending_review').length
  const upcomingCount = allMyEvents.filter((e) => e.status === 'upcoming').length
  const ongoingCount = allMyEvents.filter((e) => e.status === 'ongoing').length
  const activeCount = upcomingCount + ongoingCount
  const completedCount = allMyEvents.filter((e) => e.status === 'completed').length

  const myEvents = useMemo(() => {
    let evts = allMyEvents
    if (filter !== 'all') evts = evts.filter((e) => e.status === filter)
    if (search) {
      const q = search.toLowerCase()
      evts = evts.filter((e) => e.name.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))
    }
    return evts
  }, [allMyEvents, search, filter])

  const filters = [
    { key: 'all', label: `All (${allMyEvents.length})` },
    { key: 'pending_review', label: `Pending Review (${pendingCount})`, badge: pendingCount > 0 ? 'bg-amber-100 text-amber-800' : null },
    { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
    { key: 'ongoing', label: `Ongoing (${ongoingCount})` },
    { key: 'completed', label: `Completed (${completedCount})` },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-brand-950">My Events</h1>
          <p className="text-sm text-ink/50">Track, manage and propose your events</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={15} /> Add Event
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Events" value={allMyEvents.length} icon={CalendarDays} tone="brand" sub="assigned to you" />
        <StatCard label="Active Events" value={activeCount} icon={Clock} tone="gold" sub={`${upcomingCount} upcoming · ${ongoingCount} ongoing`} />
        <StatCard label="Upcoming" value={upcomingCount} icon={CalendarDays} tone="brand" sub="scheduled" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} tone="brand" sub="finished events" />
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            className="input pl-10"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                filter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event cards */}
      {myEvents.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-ink/20" />
          <p className="text-sm font-semibold text-ink/50">No events found</p>
          <p className="text-xs text-ink/40">Events assigned to your company will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {myEvents.map((e) => {
            const venue = state.venues.find((v) => v.id === e.venueId)
            const pm = state.staff.find((s) => s.id === e.pmId)
            const myInvoices = state.invoices.filter((inv) => inv.eventId === e.id)
            const paid = myInvoices.reduce((a, i) => a + (i.paid || 0), 0)
            const totalInv = myInvoices.reduce((a, i) => a + i.amount, 0)
            const outstanding = totalInv - paid

            const isPending = e.status === 'pending_review'
            const isDeclined = e.status === 'declined'

            return (
              <div key={e.id} className="card overflow-hidden transition hover:shadow-lg">
                {/* Card header */}
                <div className={`relative h-24 p-4 ${
                  isPending
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                    : isDeclined
                    ? 'bg-gradient-to-br from-red-700 to-red-900'
                    : 'bg-gradient-to-br from-brand-600 to-brand-800'
                }`}>
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    <span className="chip bg-white/20 text-white">{e.category}</span>
                    <span className={`chip ${
                      isPending
                        ? 'bg-amber-300 text-amber-950 font-bold'
                        : isDeclined
                        ? 'bg-red-300 text-red-950 font-bold'
                        : e.status === 'upcoming'
                        ? 'bg-gold-400 text-white'
                        : e.status === 'ongoing'
                        ? 'bg-brand-400 text-white'
                        : 'bg-ink/60 text-white'
                    }`}>
                      {isPending ? '● Pending Review' : isDeclined ? 'Declined' : e.status}
                    </span>
                  </div>
                  <p className="absolute bottom-3 left-4 text-lg font-bold text-white truncate max-w-[80%]">{e.name}</p>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Status Banner for Pending / Declined */}
                  {isPending && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Clock size={14} className="text-amber-600" /> Awaiting Event Manager Review
                      </div>
                      <p className="mt-1 text-[11px] text-amber-800">
                        Your event was submitted and is in the review queue. The event manager will review the requirements and accept or adjust it before publishing.
                      </p>
                    </div>
                  )}

                  {isDeclined && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                      <div className="flex items-center gap-1.5 font-bold text-red-700">
                        <AlertCircle size={14} /> Submission Declined
                      </div>
                      <p className="mt-1 text-[11px] text-red-700">
                        {e.declineReason || 'This event request could not be approved. Please contact your event manager for details.'}
                      </p>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-ink/60">
                      <CalendarDays size={14} className="text-brand-600" />
                      <span>{e.date || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/60">
                      <MapPin size={14} className="text-brand-600" />
                      <span className="truncate">{venue?.name || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/60">
                      <Building2 size={14} className="text-brand-600" />
                      <span className="truncate">{pm?.name || (isPending ? 'Awaiting PM' : 'Unassigned')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/60">
                      <Wallet size={14} className="text-brand-600" />
                      <span>ETB {fmtCompact(e.budget || 0)}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink/50">Progress</span>
                      <span className="font-bold text-brand-700">{e.progress || 0}%</span>
                    </div>
                    <Progress value={e.progress || 0} />
                  </div>

                  {/* Financials */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-brand-50 p-2.5 text-center">
                      <p className="text-[10px] text-ink/50">Budget</p>
                      <p className="text-sm font-bold text-brand-950">ETB {fmtCompact(e.budget || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-brand-50 p-2.5 text-center">
                      <p className="text-[10px] text-ink/50">Paid</p>
                      <p className="text-sm font-bold text-brand-700">ETB {fmtCompact(paid)}</p>
                    </div>
                    <div className="rounded-lg bg-gold-50 p-2.5 text-center">
                      <p className="text-[10px] text-ink/50">Outstanding</p>
                      <p className="text-sm font-bold text-gold-700">ETB {fmtCompact(outstanding)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-brand-50 pt-3">
                    <button
                      onClick={() => navigate(`/erp/portal/events/${e.id}`)}
                      className="btn-primary flex-1 text-xs"
                    >
                      View Details <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={() => navigate(`/erp/portal/timeline/${e.id}`)}
                      className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
                    >
                      Timeline
                    </button>
                    <button
                      onClick={() => navigate(`/erp/portal/documents/${e.id}`)}
                      className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
                    >
                      Documents
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Client Add Event Modal */}
      <ClientAddEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(newEvent) => {
          setFilter('pending_review')
        }}
      />
    </div>
  )
}
