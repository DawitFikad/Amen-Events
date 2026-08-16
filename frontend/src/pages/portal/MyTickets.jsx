import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QrCode, Calendar, MapPin, Ticket, Download, Share2, CheckCircle2, Clock, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useAttendee } from '../../store/AttendeeContext'
import { ticketPayload, encodeTicket } from '../../store/ticket'

export default function MyTickets() {
  const { authFetch, isAuthenticated, attendee } = useAttendee()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const qrCanvasRef = useRef(null)

  const downloadQr = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || !selected) return
    const safeName = (attendee?.name || 'attendee').replace(/[^\w\u00C0-\u024F]+/g, '_').slice(0, 40)
    const safeEvent = (selected?.event?.name || 'event').replace(/[^\w\u00C0-\u024F]+/g, '_').slice(0, 30)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${safeEvent}-${safeName}-${selected?.qr || 'TICKET'}.png`
    a.click()
  }

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    authFetch('/portal/my-tickets').then((data) => {
      setTickets(data.tickets || [])
      setLoading(false)
    })
  }, [isAuthenticated])

  const qrValue = selected
    ? encodeTicket(ticketPayload(
        { id: selected.id, qr: selected.qr, name: attendee?.name || '', email: attendee?.email || '', phone: selected.phone || '', type: selected.type, amount: selected.amount, paid: selected.paid, paymentMethod: selected.paymentMethod || 'Cash', checkedIn: selected.checkedIn, eventId: selected.event?.id || selected.event?._id },
        selected.event,
        selected.event?.venue
      ))
    : ''

  if (!isAuthenticated) {
    return <NotAuthed />
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Tickets</h1>
      <p className="mt-2 text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="portal-skeleton rounded-[20px] h-36" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-100 bg-white py-20 text-center" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <Ticket size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-lg font-bold text-gray-900">No tickets yet</p>
          <p className="mt-1 text-sm text-gray-500">Browse events and purchase your first ticket</p>
          <Link to="/events" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-portal-600">Browse Events</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {tickets.map((t, i) => (
            <TicketCard key={t.id} ticket={t} onView={() => setSelected(t)} delay={i * 0.05} />
          ))}
        </div>
      )}

      {/* QR Modal - premium */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="animate-portal-scale-in w-full max-w-sm rounded-[24px] border border-gray-100 bg-white p-7 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="ml-auto block text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900">{selected.event?.name}</h3>
            <div className="mt-5 rounded-2xl border-2 border-portal-200 bg-portal-50/50 p-6">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-white p-2" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <QRCodeCanvas ref={qrCanvasRef} value={qrValue} size={112} level="M" includeMargin={false} fgColor="#1b4332" bgColor="#ffffff" />
              </div>
              <p className="mt-4 text-lg font-bold tracking-wider text-gray-900">{selected.qr}</p>
              <p className="mt-1 text-xs text-gray-400">QR embeds your full ticket details - present at the entrance</p>
            </div>
            <div className="mt-4 space-y-2 text-left text-sm">
              <div className="flex justify-between py-1"><span className="text-gray-400">Attendee</span><span className="font-semibold text-gray-900">{attendee?.name || '-'}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-400">Email</span><span className="font-semibold text-gray-900">{attendee?.email || '-'}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Type</span><span className="font-semibold text-gray-900">{selected.type}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Amount</span><span className="font-semibold text-gray-900">ETB {(selected.amount || 0).toLocaleString()}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Payment</span><span className="font-semibold text-gray-900">{selected.paymentMethod || 'Cash'}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Date</span><span className="font-semibold text-gray-900">{selected.event?.date ? new Date(selected.event.date).toLocaleDateString() : 'TBA'}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Venue</span><span className="font-semibold text-gray-900">{selected.event?.venue?.name || 'TBA'}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-400">Status</span><span className="font-semibold text-gray-900">{selected.checkedIn ? 'Checked In' : selected.paid ? 'Valid' : 'Pending'}</span></div>
            </div>
            <div className="mt-5 flex gap-2.5">
              <button onClick={downloadQr} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-portal-500 py-3 text-sm font-bold text-white transition hover:bg-portal-600"><Download size={16} /> Download</button>
              <button onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"><Download size={16} /> Print</button>
              <button onClick={() => navigator.share?.({ text: `My ticket: ${selected.qr}` }).catch(() => {})} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"><Share2 size={16} /> Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TicketCard({ ticket, onView, delay = 0 }) {
  const dateStr = ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'
  return (
    <div
      className="animate-portal-fade-up overflow-hidden rounded-[20px] border border-gray-100 bg-white transition hover:shadow-lg"
      style={{ animationDelay: `${delay}s`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 bg-gradient-to-r from-portal-50/50 to-transparent px-5 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${ticket.checkedIn ? 'bg-portal-100 text-portal-600' : ticket.paid ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
          {ticket.checkedIn ? <><CheckCircle2 size={12} /> Checked In</> : ticket.paid ? <><Clock size={12} /> Valid</> : 'Pending'}
        </span>
        <span className="text-xs font-bold text-portal-600">{ticket.qr}</span>
      </div>
      {/* Body */}
      <div className="p-5">
        <h3 className="truncate text-lg font-bold text-gray-900">{ticket.event?.name}</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2"><Calendar size={15} className="text-portal-500" /> {dateStr} · {ticket.event?.time || '09:00'}</div>
          <div className="flex items-center gap-2"><MapPin size={15} className="text-portal-500" /> {ticket.event?.venue?.name || 'TBA'}{ticket.event?.venue?.city && `, ${ticket.event.venue.city}`}</div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <span className="text-xs font-semibold text-gray-400">{ticket.type} · ETB {(ticket.amount || 0).toLocaleString()}</span>
          <button onClick={onView} className="inline-flex items-center gap-1.5 rounded-xl bg-portal-50 px-4 py-2 text-sm font-bold text-portal-600 transition hover:bg-portal-100">
            <QrCode size={15} /> View QR
          </button>
        </div>
      </div>
    </div>
  )
}

function NotAuthed() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <p className="text-lg font-bold text-gray-900">Please login to view your tickets</p>
      <Link to="/portal-login?redirect=/my-tickets" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-portal-600">Login</Link>
    </div>
  )
}
