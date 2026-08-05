import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, MapPin, Building2, Wallet, CheckCircle2, Clock,
  Search, ArrowRight, Ticket,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Progress } from '../../components/ui'
import { fmtCompact } from '../../store/data'

export default function ClientEvents() {
  const { state } = useData()
  const navigate = useNavigate()
  const clientId = state.currentUserId
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const myEvents = useMemo(() => {
    let evts = state.events.filter((e) => e.clientId === clientId)
    if (filter !== 'all') evts = evts.filter((e) => e.status === filter)
    if (search) {
      const q = search.toLowerCase()
      evts = evts.filter((e) => e.name.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))
    }
    return evts
  }, [state.events, clientId, search, filter])

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-brand-950">My Events</h1>
          <p className="text-sm text-ink/50">Track and manage all your events</p>
        </div>
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

            return (
              <div key={e.id} className="card overflow-hidden transition hover:shadow-lg">
                {/* Card header */}
                <div className="relative h-24 bg-gradient-to-br from-brand-600 to-brand-800 p-4">
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    <span className="chip bg-white/20 text-white">{e.category}</span>
                    <span className={`chip ${e.status === 'upcoming' ? 'bg-gold-400 text-white' : e.status === 'ongoing' ? 'bg-brand-400 text-white' : 'bg-ink/60 text-white'}`}>{e.status}</span>
                  </div>
                  <p className="absolute bottom-3 left-4 text-lg font-bold text-white">{e.name}</p>
                </div>

                {/* Card body */}
                <div className="p-4">
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
                      <span className="truncate">{pm?.name || 'Unassigned'}</span>
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
    </div>
  )
}
