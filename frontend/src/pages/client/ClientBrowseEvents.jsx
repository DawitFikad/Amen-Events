import React, { useMemo, useState } from 'react'
import {
  CalendarDays, MapPin, Users, Search, Ticket, CheckCircle2, ArrowLeft,
  Clock, Star, QrCode, X, CreditCard, Shield, TrendingUp,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Toast, Progress } from '../../components/ui'
import { fmt, fmtCompact } from '../../store/data'

const TICKET_TYPES = [
  { id: 'vvip', name: 'VVIP', price: 5000, perks: ['Front row seating', 'VIP lounge access', 'Premium catering', 'Valet parking'] },
  { id: 'vip', name: 'VIP', price: 2500, perks: ['Priority seating', 'Lounge access', 'Welcome drink'] },
  { id: 'standard', name: 'Standard', price: 1000, perks: ['General seating', 'Event access'] },
  { id: 'student', name: 'Student', price: 300, perks: ['General seating', 'Student ID required'] },
]

export default function ClientBrowseEvents() {
  const { state, registerAttendee } = useData()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState('standard')
  const [qty, setQty] = useState(1)
  const [checkoutStep, setCheckoutStep] = useState('select') // select -> checkout -> success
  const [purchasedTicket, setPurchasedTicket] = useState(null)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  const categories = useMemo(() => {
    const cats = [...new Set(state.events.map((e) => e.category).filter(Boolean))]
    return ['all', ...cats]
  }, [state.events])

  const events = useMemo(() => {
    let evts = state.events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
    if (category !== 'all') evts = evts.filter((e) => e.category === category)
    if (search) {
      const q = search.toLowerCase()
      evts = evts.filter((e) => e.name.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))
    }
    return evts
  }, [state.events, search, category])

  const myRegistrations = useMemo(() => {
    const eventIds = new Set(state.events.filter((e) => e.clientId === clientId).map((e) => e.id))
    return state.registrations.filter((r) => eventIds.has(r.eventId) || r.clientId === clientId)
  }, [state.registrations, clientId, state.events])

  const handlePurchase = () => {
    setBusy(true)
    const ticket = TICKET_TYPES.find((t) => t.id === selectedTicket)
    const total = ticket.price * qty

    setTimeout(async () => {
      const reg = {
        eventId: selectedEvent.id,
        name: client?.contactPerson || 'Client User',
        email: client?.email || '',
        type: ticket.name,
        qty,
        amount: total,
        paid: true,
        clientId,
      }
      const result = await registerAttendee(reg)
      const ticketCode = result?.qr || `AE-${selectedEvent.id.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      setPurchasedTicket({ ...ticket, event: selectedEvent, qty, total, code: ticketCode })
      setCheckoutStep('success')
      setBusy(false)
      show(`${qty} × ${ticket.name} ticket(s) purchased successfully!`)
    }, 1500)
  }

  const resetFlow = () => {
    setSelectedEvent(null)
    setSelectedTicket('standard')
    setQty(1)
    setCheckoutStep('select')
    setPurchasedTicket(null)
  }

  // ─── Success screen ───
  if (checkoutStep === 'success' && purchasedTicket) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black">Payment Successful!</h2>
            <p className="mt-1 text-sm text-brand-100">Your tickets have been confirmed</p>
          </div>

          <div className="p-6">
            {/* Ticket card */}
            <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-brand-600">{purchasedTicket.event.category}</p>
                  <h3 className="text-lg font-black text-brand-950">{purchasedTicket.event.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-ink/60">
                    <p className="flex items-center gap-1.5"><CalendarDays size={13} className="text-brand-600" /> {purchasedTicket.event.date || 'TBD'} · {purchasedTicket.event.time || '09:00'}</p>
                    <p className="flex items-center gap-1.5"><MapPin size={13} className="text-brand-600" /> {state.venues.find((v) => v.id === purchasedTicket.event.venueId)?.name || 'TBA'}</p>
                  </div>
                </div>
                {/* QR */}
                <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-300">
                    <QrCode size={48} className="text-brand-700" />
                    <p className="mt-1 text-[9px] font-bold text-brand-700">{purchasedTicket.code}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-brand-100 pt-4">
                <div><p className="text-[10px] text-ink/50">Ticket Type</p><p className="font-bold text-brand-950">{purchasedTicket.name}</p></div>
                <div><p className="text-[10px] text-ink/50">Quantity</p><p className="font-bold text-brand-950">{purchasedTicket.qty}</p></div>
                <div><p className="text-[10px] text-ink/50">Total Paid</p><p className="font-bold text-brand-700">ETB {fmtCompact(purchasedTicket.total)}</p></div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={resetFlow} className="btn-primary flex-1">
                <Ticket size={16} /> Browse More Events
              </button>
              <button onClick={() => { resetFlow(); window.print() }} className="flex-1 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50">
                Download Ticket
              </button>
            </div>
          </div>
        </div>
        <Toast toast={toast} />
      </div>
    )
  }

  // ─── Checkout screen ───
  if (selectedEvent && checkoutStep === 'checkout') {
    const ticket = TICKET_TYPES.find((t) => t.id === selectedTicket)
    const total = ticket.price * qty
    const convenienceFee = Math.round(total * 0.03)
    const grandTotal = total + convenienceFee

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button onClick={() => setCheckoutStep('select')} className="flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
          <ArrowLeft size={16} /> Back to ticket selection
        </button>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Order summary */}
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Order Summary</p>
            <div className="mb-4 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-bold text-brand-600">{selectedEvent.category}</p>
              <p className="font-bold text-brand-950">{selectedEvent.name}</p>
              <p className="mt-1 text-xs text-ink/50">{selectedEvent.date || 'TBD'} · {state.venues.find((v) => v.id === selectedEvent.venueId)?.name || 'TBA'}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink/60">{ticket.name} × {qty}</span><span className="font-semibold">ETB {fmtCompact(total)}</span></div>
              <div className="flex justify-between"><span className="text-ink/60">Convenience fee (3%)</span><span className="font-semibold">ETB {fmtCompact(convenienceFee)}</span></div>
              <div className="flex justify-between border-t border-brand-100 pt-2"><span className="font-bold text-brand-950">Total</span><span className="text-lg font-black text-brand-700">ETB {fmtCompact(grandTotal)}</span></div>
            </div>

            {/* Buyer info */}
            <div className="mt-5 border-t border-brand-100 pt-4">
              <p className="mb-3 text-xs font-bold text-ink/60">Buyer Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink/50">Name</span><span className="font-semibold text-brand-950">{client?.contactPerson}</span></div>
                <div className="flex justify-between"><span className="text-ink/50">Email</span><span className="font-semibold text-brand-950">{client?.email}</span></div>
                <div className="flex justify-between"><span className="text-ink/50">Phone</span><span className="font-semibold text-brand-950">{client?.phone}</span></div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Payment Method</p>
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-brand-600 bg-brand-50 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-brand-700" />
                  <div>
                    <p className="text-sm font-bold text-brand-950">Credit / Debit Card</p>
                    <p className="text-[11px] text-ink/50">Visa, Mastercard, AmEx</p>
                  </div>
                  <CheckCircle2 size={18} className="ml-auto text-brand-600" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink/60">Card Number</label>
                  <input className="input" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-ink/60">Expiry</label>
                    <input className="input" placeholder="MM/YY" defaultValue="12/28" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-ink/60">CVV</label>
                    <input className="input" placeholder="123" defaultValue="123" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-xs text-ink/60">
                <Shield size={14} className="text-brand-600" />
                Your payment is secured with 256-bit SSL encryption
              </div>

              <button onClick={handlePurchase} disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing payment…
                  </span>
                ) : (
                  <><CreditCard size={16} /> Pay ETB {fmtCompact(grandTotal)}</>
                )}
              </button>
            </div>
          </div>
        </div>
        <Toast toast={toast} />
      </div>
    )
  }

  // ─── Ticket selection screen ───
  if (selectedEvent && checkoutStep === 'select') {
    const venue = state.venues.find((v) => v.id === selectedEvent.venueId)
    const eventRegs = state.registrations.filter((r) => r.eventId === selectedEvent.id)
    const seatsLeft = venue ? venue.capacity - eventRegs.length : null

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button onClick={resetFlow} className="flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
          <ArrowLeft size={16} /> Back to events
        </button>

        <div className="card overflow-hidden">
          {/* Hero */}
          <div className="relative h-36 bg-gradient-to-br from-brand-600 to-brand-800 p-5">
            <div className="absolute right-4 top-4 flex gap-1.5">
              <span className="chip bg-white/20 text-white">{selectedEvent.category}</span>
              <span className={`chip ${selectedEvent.status === 'upcoming' ? 'bg-gold-400 text-white' : 'bg-brand-400 text-white'}`}>{selectedEvent.status}</span>
            </div>
            <h2 className="absolute bottom-4 left-5 text-xl font-black text-white">{selectedEvent.name}</h2>
          </div>

          <div className="p-5">
            {/* Info grid */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Date</p><p className="font-bold text-brand-950">{selectedEvent.date || 'TBD'}</p></div>
              <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Time</p><p className="font-bold text-brand-950">{selectedEvent.time || '09:00'}</p></div>
              <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Venue</p><p className="font-bold text-brand-950 truncate">{venue?.name || 'TBA'}</p></div>
              <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Capacity</p><p className="font-bold text-brand-950">{venue?.capacity.toLocaleString() || '-'}</p></div>
            </div>

            {seatsLeft !== null && (
              <div className="mb-5">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink/50">Seats Available</span>
                  <span className="font-bold text-brand-700">{seatsLeft} of {venue.capacity}</span>
                </div>
                <Progress value={(eventRegs.length / venue.capacity) * 100} />
              </div>
            )}

            {/* Ticket types */}
            <p className="mb-3 font-bold text-brand-950">Select Ticket Type</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TICKET_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t.id)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    selectedTicket === t.id ? 'border-brand-600 bg-brand-50' : 'border-brand-100 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-950">{t.name}</span>
                    <span className="text-lg font-black text-brand-700">ETB {t.price.toLocaleString()}</span>
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-center gap-1.5 text-xs text-ink/55">
                        <CheckCircle2 size={12} className="text-brand-500" /> {p}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Quantity + checkout */}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-brand-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink/60">Quantity:</span>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 font-bold text-brand-700 hover:bg-brand-50">−</button>
                <span className="w-8 text-center font-bold text-brand-950">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 font-bold text-brand-700 hover:bg-brand-50">+</button>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-xs text-ink/50">Total</p>
                <p className="text-2xl font-black text-brand-700">ETB {fmtCompact(TICKET_TYPES.find((t) => t.id === selectedTicket)?.price * qty || 0)}</p>
              </div>
              <button onClick={() => setCheckoutStep('checkout')} className="btn-primary">
                Proceed to Checkout <ArrowLeft size={15} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Event browse grid ───
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Browse Events</h1>
        <p className="text-sm text-ink/50">Discover and purchase tickets for upcoming events</p>
      </div>

      {/* Search + category filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input className="input pl-10" placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                category === cat ? 'bg-brand-600 text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Event cards */}
      {events.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-ink/20" />
          <p className="text-sm font-semibold text-ink/50">No events available</p>
          <p className="text-xs text-ink/40">Check back later for new events</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => {
            const venue = state.venues.find((v) => v.id === e.venueId)
            const eventRegs = state.registrations.filter((r) => r.eventId === e.id)
            const seatsLeft = venue ? venue.capacity - eventRegs.length : null
            const alreadyRegistered = myRegistrations.some((r) => r.eventId === e.id)
            return (
              <div key={e.id} className="card overflow-hidden transition hover:shadow-lg">
                {/* Card header */}
                <div className="relative h-28 bg-gradient-to-br from-brand-600 to-brand-800 p-4">
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    <span className="chip bg-white/20 text-white">{e.category}</span>
                    <span className={`chip ${e.status === 'upcoming' ? 'bg-gold-400 text-white' : 'bg-brand-400 text-white'}`}>{e.status}</span>
                  </div>
                  <p className="absolute bottom-3 left-4 text-lg font-bold text-white">{e.name}</p>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="mb-3 space-y-1.5 text-sm text-ink/55">
                    <div className="flex items-center gap-2"><CalendarDays size={14} className="text-brand-600" /> {e.date || 'TBD'} · {e.time || '09:00'}</div>
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-600" /> {venue?.name || 'TBA'}{venue?.city && `, ${venue.city}`}</div>
                    <div className="flex items-center gap-2"><Users size={14} className="text-brand-600" /> {eventRegs.length} registered{seatsLeft !== null && ` · ${seatsLeft} left`}</div>
                  </div>

                  {seatsLeft !== null && seatsLeft > 0 && (
                    <div className="mb-3">
                      <Progress value={(eventRegs.length / venue.capacity) * 100} />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-brand-50 pt-3">
                    <div>
                      <p className="text-[10px] text-ink/50">Starting from</p>
                      <p className="text-lg font-black text-brand-700">ETB 300</p>
                    </div>
                    {alreadyRegistered ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
                        <CheckCircle2 size={14} /> Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => { setSelectedEvent(e); setSelectedTicket('standard'); setQty(1); setCheckoutStep('select') }}
                        className="btn-primary text-xs"
                      >
                        <Ticket size={14} /> Buy Tickets
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
