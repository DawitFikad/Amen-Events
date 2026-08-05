import React, { useMemo, useState } from 'react'
import { Ticket, TrendingUp, Download, QrCode, Users, X, CalendarDays, MapPin, CheckCircle2 } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { fmtCompact, fmt } from '../../store/data'

export default function ClientTickets() {
  const { state } = useData()
  const clientId = state.currentUserId
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [qrTicket, setQrTicket] = useState(null)

  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])
  const myEventIds = useMemo(() => new Set(myEvents.map((e) => e.id)), [myEvents])

  const allRegs = useMemo(() => {
    let regs = state.registrations.filter((r) => myEventIds.has(r.eventId) || r.clientId === clientId)
    if (selectedEvent !== 'all') regs = regs.filter((r) => r.eventId === selectedEvent)
    return regs
  }, [state.registrations, myEventIds, selectedEvent, clientId])

  const ticketTypes = ['VVIP', 'VIP', 'Standard', 'Group']
  const totalRevenue = allRegs.reduce((a, r) => a + (r.amount || 0), 0)
  const totalCapacity = myEvents.reduce((a, e) => {
    const v = state.venues.find((v) => v.id === e.venueId)
    return a + (v?.capacity || 0)
  }, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-brand-950">Tickets</h1>
          <p className="text-sm text-ink/50">Ticket sales and revenue overview</p>
        </div>
        <select className="input max-w-[200px]" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="all">All Events</option>
          {myEvents.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Ticket size={18} /></span>
          <div><p className="text-xl font-black text-brand-950">{allRegs.length}</p><p className="text-[11px] text-ink/50">Tickets Sold</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><TrendingUp size={18} /></span>
          <div><p className="text-xl font-black text-brand-700">ETB {fmtCompact(totalRevenue)}</p><p className="text-[11px] text-ink/50">Revenue</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><Users size={18} /></span>
          <div><p className="text-xl font-black text-gold-700">{totalCapacity - allRegs.length}</p><p className="text-[11px] text-ink/50">Remaining</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><QrCode size={18} /></span>
          <div><p className="text-xl font-black text-brand-950">{allRegs.filter((r) => r.checkedIn).length}</p><p className="text-[11px] text-ink/50">QR Scanned</p></div>
        </div>
      </div>

      {/* Ticket types breakdown */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-bold text-brand-950">Ticket Types Breakdown</p>
          <button className="btn-outline text-xs"><Download size={14} /> Download Report</button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ticketTypes.map((type) => {
            const typeRegs = allRegs.filter((r) => r.type === type)
            const count = typeRegs.length
            const revenue = typeRegs.reduce((a, r) => a + (r.amount || 0), 0)
            const pct = allRegs.length > 0 ? (count / allRegs.length) * 100 : 0
            return (
              <div key={type} className="rounded-xl border border-brand-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-brand-950">{type}</span>
                  <span className="text-sm font-bold text-brand-700">{count} sold</span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-brand-50">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-ink/50">
                  <span>{pct.toFixed(0)}% of total</span>
                  <span className="font-bold text-brand-700">ETB {fmt(revenue)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* My Tickets list */}
      <div className="card p-5">
        <p className="mb-4 font-bold text-brand-950">My Tickets</p>
        {allRegs.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink/40">No tickets purchased yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allRegs.map((r) => {
              const evt = myEvents.find((e) => e.id === r.eventId) || state.events.find((e) => e.id === r.eventId)
              const venue = state.venues.find((v) => v.id === evt?.venueId)
              return (
                <div key={r.id} className="rounded-xl border-2 border-brand-100 p-4 transition hover:border-brand-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-brand-600">{r.type || 'Standard'}</p>
                      <p className="truncate font-bold text-brand-950">{evt?.name || 'Event'}</p>
                      <div className="mt-1 space-y-0.5 text-[11px] text-ink/50">
                        <p className="flex items-center gap-1"><CalendarDays size={11} /> {evt?.date || 'TBD'}</p>
                        <p className="flex items-center gap-1"><MapPin size={11} /> {venue?.name || 'TBA'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setQrTicket(r)}
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 transition hover:bg-brand-100"
                    >
                      <QrCode size={20} />
                      <span className="text-[8px] font-bold">View QR</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-brand-50 pt-2 text-xs">
                    <span className="text-ink/50">Qty: {r.qty || 1} · ETB {fmtCompact(r.amount || 0)}</span>
                    {r.checkedIn ? (
                      <span className="flex items-center gap-1 font-bold text-brand-700"><CheckCircle2 size={12} /> Checked In</span>
                    ) : (
                      <span className="font-bold text-gold-600">Pending Check-in</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR modal */}
      {qrTicket && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4" onClick={() => setQrTicket(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-brand-950">Your Ticket</h3>
              <button onClick={() => setQrTicket(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 hover:bg-brand-50"><X size={18} /></button>
            </div>
            <div className="rounded-2xl border-2 border-brand-200 p-5 text-center">
              <p className="text-xs font-bold text-brand-600">{qrTicket.type || 'Standard'}</p>
              <p className="text-lg font-black text-brand-950">{myEvents.find((e) => e.id === qrTicket.eventId)?.name || state.events.find((e) => e.id === qrTicket.eventId)?.name || 'Event'}</p>
              <div className="mx-auto my-4 flex h-40 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-50">
                <QrCode size={80} className="text-brand-700" />
                <p className="mt-2 text-xs font-bold text-brand-700">{qrTicket.qr || `AE-${qrTicket.eventId?.toUpperCase()}-${qrTicket.id.slice(-4).toUpperCase()}`}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-ink/50">Attendee</p><p className="font-bold text-brand-950">{qrTicket.name}</p></div>
                <div><p className="text-ink/50">Quantity</p><p className="font-bold text-brand-950">{qrTicket.qty || 1}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-bold text-brand-700">
                {qrTicket.checkedIn ? <><CheckCircle2 size={14} /> Checked In</> : 'Present this QR at the entrance'}
              </div>
            </div>
            <button onClick={() => { setQrTicket(null); window.print() }} className="btn-primary w-full mt-4"><Download size={16} /> Download Ticket</button>
          </div>
        </div>
      )}
    </div>
  )
}
