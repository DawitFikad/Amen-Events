import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, Wallet, Ticket, TrendingUp, Clock, CheckCircle2, AlertCircle, MapPin, Users, ArrowRight, Search, Star, Plus, QrCode } from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, StatCard, Th, Td, Toast } from '../components/ui'

const TICKET_TYPES = [
  { id: 'vvip', name: 'VVIP', price: 5000, perks: ['Front row seating', 'VIP lounge access', 'Premium catering', 'Valet parking'] },
  { id: 'vip', name: 'VIP', price: 2500, perks: ['Priority seating', 'Lounge access', 'Welcome drink'] },
  { id: 'standard', name: 'Standard', price: 1000, perks: ['General seating', 'Event access'] },
  { id: 'student', name: 'Student', price: 300, perks: ['General seating', 'Student ID required'] },
]

export default function ClientPortal() {
  const { state, rbac, backendOnline, registerAttendee } = useData()
  const navigate = useNavigate()
  const [view, setView] = useState('overview')
  const [toast, setToast] = useState(null)
  const [apiData, setApiData] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState('standard')
  const [qty, setQty] = useState(1)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)

  // My events = events belonging to this client
  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])

  // All events available for browsing (all events in the system)
  const allEvents = useMemo(() => {
    let evts = state.events
    if (search) {
      const q = search.toLowerCase()
      evts = evts.filter((e) => e.name.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))
    }
    return evts
  }, [state.events, search])

  // My registrations
  const myRegistrations = useMemo(() => state.registrations.filter((r) => r.clientId === clientId), [state.registrations, clientId])

  // My invoices
  const myInvoices = useMemo(() => state.invoices.filter((inv) => inv.clientId === clientId), [state.invoices, clientId])

  // Stats
  const stats = useMemo(() => {
    const upcoming = myEvents.filter((e) => e.status === 'upcoming').length
    const ongoing = myEvents.filter((e) => e.status === 'ongoing').length
    const completed = myEvents.filter((e) => e.status === 'completed').length
    const totalBudget = myEvents.reduce((a, e) => a + (e.budget || 0), 0)
    const totalPaid = myInvoices.filter((i) => i.status === 'paid').reduce((a, i) => a + (i.amount || 0), 0)
    const outstanding = myInvoices.filter((i) => i.status !== 'paid').reduce((a, i) => a + (i.amount || 0), 0)
    return { totalEvents: myEvents.length, upcoming, ongoing, completed, totalBudget, totalPaid, outstanding, totalInvoiced: myInvoices.reduce((a, i) => a + (i.amount || 0), 0) }
  }, [myEvents, myInvoices])

  // Load from API if backend is online
  useEffect(() => {
    if (backendOnline && api.portal) {
      setApiLoading(true)
      api.portal.getDashboard()
        .then((d) => { setApiData(d); setApiLoading(false) })
        .catch(() => setApiLoading(false))
    }
  }, [backendOnline])

  // Use API data if available, otherwise use local state
  const displayEvents = apiData?.events || myEvents
  const displayInvoices = apiData?.invoices || myInvoices
  const displayRegistrations = apiData?.registrations || myRegistrations
  const displayClient = apiData?.client || client
  const displayStats = apiData?.stats || stats

  const handleBuyTickets = () => {
    if (!selectedEvent) return
    const ticket = TICKET_TYPES.find((t) => t.id === selectedTicket)
    const total = ticket.price * qty
    setCheckoutBusy(true)
    // Simulate checkout - in demo mode, register directly
    setTimeout(() => {
      if (registerAttendee) {
        registerAttendee({
          eventId: selectedEvent.id,
          name: displayClient?.contactPerson || 'Client User',
          email: displayClient?.email || '',
          type: ticket.name,
          qty,
          amount: total,
          clientId,
        })
      }
      show(`${qty} × ${ticket.name} ticket(s) purchased for ETB ${total.toLocaleString()}!`, 'success')
      setSelectedEvent(null)
      setCheckoutBusy(false)
      setView('registrations')
    }, 1200)
  }

  const tabs = [
    ['overview', 'Overview', TrendingUp],
    ['browse', 'Browse Events', Search],
    ['events', 'My Events', CalendarDays],
    ['invoices', 'Invoices', Wallet],
    ['registrations', 'Registrations', Ticket],
  ]

  return (
    <div>
      <PageHeader
        title={client?.company || 'Client Portal'}
        subtitle="View your events, invoices and registrations in real time."
        icon={Building2}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 mb-5">
        <StatCard label="Total Events" value={displayStats.totalEvents} icon={CalendarDays} tone="brand" sub={`${displayStats.upcoming} upcoming`} />
        <StatCard label="Ongoing" value={displayStats.ongoing} icon={Clock} tone="gold" sub="live now" />
        <StatCard label="Completed" value={displayStats.completed} icon={CheckCircle2} tone="brand" sub="finished" />
        <StatCard label="Total Budget" value={`ETB ${(displayStats.totalBudget / 1000000).toFixed(1)}M`} icon={TrendingUp} tone="brand" sub="across all events" />
        <StatCard label="Paid" value={`ETB ${(displayStats.totalPaid / 1000000).toFixed(1)}M`} icon={CheckCircle2} tone="brand" sub="invoices settled" />
        <StatCard label="Outstanding" value={`ETB ${(displayStats.outstanding / 1000000).toFixed(1)}M`} icon={AlertCircle} tone="gold" sub="pending payment" />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}>
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Event Status Breakdown</p>
              <div className="space-y-2">
                {[
                  ['Upcoming', displayStats.upcoming, 'bg-gold-400'],
                  ['Ongoing', displayStats.ongoing, 'bg-brand-500'],
                  ['Completed', displayStats.completed, 'bg-brand-700'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${color}`} />
                    <span className="flex-1 text-sm text-ink/70">{label}</span>
                    <span className="font-bold text-brand-950">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Financial Summary</p>
              <div className="space-y-2">
                {[
                  ['Total Invoiced', displayStats.totalInvoiced, 'text-brand-950'],
                  ['Total Paid', displayStats.totalPaid, 'text-brand-700'],
                  ['Outstanding', displayStats.outstanding, 'text-gold-700'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center justify-between border-b border-brand-50 pb-2">
                    <span className="text-sm text-ink/70">{label}</span>
                    <span className={`font-bold ${color}`}>ETB {val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Quick browse CTA */}
          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="font-bold text-brand-950">Looking for events to attend?</p>
              <p className="text-sm text-ink/50">Browse all available events and purchase tickets instantly.</p>
            </div>
            <button onClick={() => setView('browse')} className="btn-primary"><Search size={15} /> Browse Events</button>
          </div>
        </div>
      )
      }

      {/* Browse Events */}
      {view === 'browse' && !selectedEvent && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              className="input pl-12"
              placeholder="Search events by name or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Event cards */}
          {allEvents.length === 0 ? (
            <div className="card p-8 text-center text-ink/40">No events found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allEvents.map((e) => {
                const venue = state.venues.find((v) => v.id === e.venueId)
                const isMyEvent = e.clientId === clientId
                return (
                  <div key={e.id} className="card overflow-hidden transition hover:shadow-lg">
                    <div className="relative h-28 bg-gradient-to-br from-brand-600 to-brand-800 p-4">
                      <div className="absolute right-3 top-3 flex gap-1.5">
                        <span className="chip bg-white/20 text-white">{e.category}</span>
                        <span className={`chip ${e.status === 'upcoming' ? 'bg-gold-400 text-white' : e.status === 'ongoing' ? 'bg-brand-400 text-white' : 'bg-ink/60 text-white'}`}>{e.status}</span>
                      </div>
                      <p className="absolute bottom-3 left-4 text-lg font-bold text-white">{e.name}</p>
                    </div>
                    <div className="p-4">
                      <div className="mb-3 space-y-1.5 text-sm text-ink/55">
                        <div className="flex items-center gap-2"><CalendarDays size={14} className="text-brand-600" /> {e.date || 'TBD'} · {e.time || '09:00'}</div>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-600" /> {venue?.name || 'TBA'}{venue?.city && `, ${venue.city}`}</div>
                        <div className="flex items-center gap-2"><Users size={14} className="text-brand-600" /> {e.attendees ? e.attendees.toLocaleString() : '-'} attendees</div>
                      </div>
                      <div className="flex items-center justify-between border-t border-brand-50 pt-3">
                        <span className="text-xs font-semibold text-ink/50">{isMyEvent ? 'Your event' : 'Available'}</span>
                        <button onClick={() => { setSelectedEvent(e); setSelectedTicket('standard'); setQty(1) }} className="btn-primary text-xs"><Ticket size={14} /> Buy Tickets</button>
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

      {/* Event detail / Buy tickets */}
      {view === 'browse' && selectedEvent && (
        <div className="space-y-4">
          <button onClick={() => setSelectedEvent(null)} className="text-sm font-bold text-brand-700 hover:text-brand-900">← Back to events</button>
          <div className="card overflow-hidden">
            {/* Hero */}
            <div className="relative h-32 bg-gradient-to-br from-brand-600 to-brand-800 p-5">
              <div className="absolute right-4 top-4 flex gap-1.5">
                <span className="chip bg-white/20 text-white">{selectedEvent.category}</span>
                <span className={`chip ${selectedEvent.status === 'upcoming' ? 'bg-gold-400 text-white' : 'bg-brand-400 text-white'}`}>{selectedEvent.status}</span>
              </div>
              <p className="absolute bottom-4 left-5 text-xl font-bold text-white">{selectedEvent.name}</p>
            </div>
            <div className="p-5">
              {/* Info */}
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[11px] text-ink/50">Date</p><p className="font-bold text-brand-950">{selectedEvent.date || 'TBD'}</p></div>
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[11px] text-ink/50">Time</p><p className="font-bold text-brand-950">{selectedEvent.time || '09:00'}</p></div>
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[11px] text-ink/50">Venue</p><p className="font-bold text-brand-950">{state.venues.find((v) => v.id === selectedEvent.venueId)?.name || 'TBA'}</p></div>
              </div>
              {/* Ticket types */}
              <p className="mb-3 font-bold text-brand-950">Select Ticket Type</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TICKET_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${selectedTicket === t.id ? 'border-brand-600 bg-brand-50' : 'border-brand-100 hover:border-brand-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-950">{t.name}</span>
                      <span className="text-lg font-black text-brand-700">ETB {t.price.toLocaleString()}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {t.perks.map((p) => <li key={p} className="flex items-center gap-1.5 text-xs text-ink/55"><CheckCircle2 size={12} className="text-brand-500" /> {p}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
              {/* Quantity + total */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink/60">Quantity:</span>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 font-bold text-brand-700 hover:bg-brand-50">−</button>
                  <span className="w-8 text-center font-bold text-brand-950">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 font-bold text-brand-700 hover:bg-brand-50">+</button>
                </div>
                <div className="flex-1" />
                <div className="text-right">
                  <p className="text-xs text-ink/50">Total</p>
                  <p className="text-2xl font-black text-brand-700">ETB {(TICKET_TYPES.find((t) => t.id === selectedTicket)?.price * qty || 0).toLocaleString()}</p>
                </div>
                <button onClick={handleBuyTickets} disabled={checkoutBusy} className="btn-primary">
                  {checkoutBusy ? 'Processing…' : <><Ticket size={16} /> Purchase Tickets</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Events */}
      {view === 'events' && (
        <div className="card overflow-hidden">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center text-ink/40">No events yet. <button onClick={() => setView('browse')} className="font-bold text-brand-700 hover:underline">Browse events →</button></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50">
                <tr><Th>Event</Th><Th>Date</Th><Th>Venue</Th><Th>Status</Th><Th>Budget</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {displayEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <Td><span className="font-semibold text-brand-950">{e.name}</span></Td>
                    <Td className="text-ink/60">{e.date || 'TBD'}</Td>
                    <Td className="text-ink/60">{e.venue?.name || state.venues.find((v) => v.id === e.venueId)?.name || '-'}</Td>
                    <Td><Badge status={e.status} label={e.status} /></Td>
                    <Td className="text-ink/60">ETB {(e.budget || 0).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )
      }

      {/* Invoices */}
      {view === 'invoices' && (
        <div className="card overflow-hidden">
          {displayInvoices.length === 0 ? (
            <div className="p-8 text-center text-ink/40">No invoices yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50">
                <tr><Th>Invoice #</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {displayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-50/40">
                    <Td><span className="font-mono text-sm text-brand-950">{inv.number || inv.id.slice(-8)}</span></Td>
                    <Td className="font-semibold text-brand-950">ETB {(inv.amount || 0).toLocaleString()}</Td>
                    <Td><Badge status={inv.status} label={inv.status} /></Td>
                    <Td className="text-ink/50">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )
      }

      {/* Registrations */}
      {view === 'registrations' && (
        <div className="card overflow-hidden">
          {displayRegistrations.length === 0 ? (
            <div className="p-8 text-center text-ink/40">No registrations yet. <button onClick={() => setView('browse')} className="font-bold text-brand-700 hover:underline">Buy tickets →</button></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50">
                <tr><Th>Attendee</Th><Th>Event</Th><Th>Type</Th><Th>Qty</Th><Th>Amount</Th><Th>Checked In</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {displayRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td><span className="font-semibold text-brand-950">{r.name}</span></Td>
                    <Td className="text-ink/60">{r.event?.name || state.events.find((e) => e.id === r.eventId)?.name || '-'}</Td>
                    <Td className="text-ink/60">{r.type || 'Standard'}</Td>
                    <Td className="text-ink/60">{r.qty || 1}</Td>
                    <Td className="text-ink/60">ETB {(r.amount || 0).toLocaleString()}</Td>
                    <Td>{r.checkedIn ? <Badge status="active" label="Checked In" /> : <Badge status="pending" label="Pending" />}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )
      }

      <Toast toast={toast} />
    </div>
  )
}

