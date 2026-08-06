import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, MapPin, Users, Mic, ArrowLeft, Ticket, CheckCircle2, QrCode, AlertCircle } from 'lucide-react'
import { publicApi } from '../store/api'
import { Spinner, EmptyState } from '../components/ui'
import { nameOnly, emailValid, phoneValid, optional, validate } from '../store/validation'

const TICKET_TYPES = [
  { type: 'Standard', price: 1000, label: 'Standard', perks: ['Event access', 'Networking session', 'Lunch included'] },
  { type: 'VIP', price: 5000, label: 'VIP', perks: ['Priority seating', 'VIP lounge access', 'Networking dinner', 'Event swag bag'] },
  { type: 'Student', price: 500, label: 'Student', perks: ['Event access', 'Student networking', 'Certificate of attendance'] },
]

export default function PublicEventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(TICKET_TYPES[0])
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    publicApi.event(id).then((data) => {
      if (data.error) {
        setError(data.error)
      } else {
        setEvent(data.event)
      }
      setLoading(false)
    }).catch(() => {
      setError('Failed to load event')
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    const res = validate(form, {
      name: [nameOnly('Full name')],
      email: [emailValid('Email')],
      phone: [optional(phoneValid('Phone number'))],
    })
    if (!res.ok) {
      setFormError(res.first)
      return
    }
    setSubmitting(true)
    try {
      const res = await publicApi.register({
        eventId: id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        type: selectedTicket.type,
        amount: selectedTicket.price,
      })
      if (res.error) {
        setFormError(res.error)
      } else {
        setResult(res.registration)
      }
    } catch {
      setFormError('Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50/30">
        <Spinner size={28} className="text-brand-600" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-brand-50/30">
        <PublicHeader />
        <div className="mx-auto max-w-2xl px-5 py-20">
          <EmptyState icon={AlertCircle} title="Event not found" subtitle={error || 'This event may have been removed.'} />
          <div className="text-center mt-4">
            <Link to="/events" className="text-sm font-semibold text-brand-700 hover:text-brand-800">← Back to all events</Link>
          </div>
        </div>
      </div>
    )
  }

  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA'
  const regCount = event.registrations?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
      <PublicHeader />

      {/* Back link */}
      <div className="mx-auto max-w-4xl px-5 pt-6">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          <ArrowLeft size={16} /> All events
        </Link>
      </div>

      {/* Event hero */}
      <section className="mx-auto max-w-4xl px-5 pt-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-brand-50 bg-brand-50/30 px-5 py-3">
            <span className={`chip ${event.status === 'ongoing' ? 'bg-brand-100 text-brand-800' : 'bg-gold-100 text-gold-700'}`}>
              {event.status === 'ongoing' ? '● Live Now' : 'Upcoming'}
            </span>
            <span className="text-xs font-semibold text-ink/40">{event.category}</span>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{event.name}</h1>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Calendar size={18} className="text-brand-600" />
                <div>
                  <p className="font-semibold text-brand-950">{dateStr}</p>
                  <p className="text-xs text-ink/45">{event.time || '09:00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <MapPin size={18} className="text-brand-600" />
                <div>
                  <p className="font-semibold text-brand-950">{event.venue?.name || 'Venue TBA'}</p>
                  <p className="text-xs text-ink/45">{event.venue?.city || ''}{event.venue?.capacity ? ` · Cap ${event.venue.capacity}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Users size={18} className="text-brand-600" />
                <div>
                  <p className="font-semibold text-brand-950">{regCount} registered</p>
                  <p className="text-xs text-ink/45">by {event.client?.company || 'Amen Events'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers */}
      {event.speakers && event.speakers.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 pt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-950">
            <Mic size={18} className="text-brand-600" /> Speakers
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {event.speakers.map((sp) => (
              <div key={sp.id} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-sm">
                  {sp.name?.split(' ').map((p) => p[0]).slice(0, 2).join('') || '?'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-950">{sp.name}</p>
                  <p className="truncate text-xs text-ink/45">{sp.title || sp.company || ''}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Registration / Result */}
      <section className="mx-auto max-w-4xl px-5 py-8">
        {result ? (
          /* Success state with QR */
          <div className="card mx-auto max-w-md p-8 text-center animate-page-enter">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <CheckCircle2 size={28} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-brand-950">Registration Confirmed!</h2>
            <p className="mt-1 text-sm text-ink/55">Your ticket has been reserved. Save your QR code for check-in.</p>

            <div className="mt-6 rounded-xl border-2 border-brand-200 bg-white p-6">
              <div className="flex items-center justify-center gap-2 text-brand-800">
                <QrCode size={48} />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-wider text-brand-950">{result.qr}</p>
              <p className="mt-1 text-xs text-ink/45">Present this code at the event entrance</p>
            </div>

            <div className="mt-6 space-y-1 text-left text-sm">
              <div className="flex justify-between border-b border-brand-50 py-2">
                <span className="text-ink/50">Name</span>
                <span className="font-semibold text-brand-950">{result.name}</span>
              </div>
              <div className="flex justify-between border-b border-brand-50 py-2">
                <span className="text-ink/50">Ticket Type</span>
                <span className="font-semibold text-brand-950">{result.type}</span>
              </div>
              <div className="flex justify-between border-b border-brand-50 py-2">
                <span className="text-ink/50">Amount</span>
                <span className="font-semibold text-brand-950">ETB {result.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink/50">Payment</span>
                <span className="chip bg-gold-100 text-gold-700">Pay at venue</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Link to="/events" className="btn-outline flex-1">Browse more events</Link>
              <button onClick={() => window.print()} className="btn-primary flex-1">Print ticket</button>
            </div>
          </div>
        ) : (
          /* Registration form */
          <div className="card mx-auto max-w-md p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-brand-950">
              <Ticket size={20} className="text-brand-600" /> Get Your Ticket
            </h2>

            {/* Ticket type selector */}
            <div className="mt-5 space-y-2">
              {TICKET_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    selectedTicket.type === t.type
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-brand-100 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-brand-950">{t.label}</p>
                      <p className="text-xs text-ink/45">ETB {t.price.toLocaleString()}</p>
                    </div>
                    {selectedTicket.type === t.type && (
                      <CheckCircle2 size={20} className="text-brand-600" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.perks.map((perk) => (
                      <span key={perk} className="chip bg-white text-ink/55 ring-1 ring-brand-100">{perk}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>

              <div className="flex items-center justify-between border-t border-brand-50 pt-4">
                <div>
                  <p className="text-xs text-ink/45">Total</p>
                  <p className="text-xl font-bold text-brand-950">ETB {selectedTicket.price.toLocaleString()}</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Spinner size={16} /> : <Ticket size={16} />}
                  {submitting ? 'Registering…' : 'Register Now'}
                </button>
              </div>
              <p className="text-center text-xs text-ink/40">Payment at venue · QR code delivered instantly</p>
            </form>
          </div>
        )}
      </section>

      <footer className="border-t border-brand-100 py-6 text-center text-xs text-ink/40">
        Gravity Technologies PLC · Amen Events Platform
      </footer>
    </div>
  )
}

function PublicHeader() {
  return (
    <header className="border-b border-brand-100 bg-white/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link to="/events" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white font-bold text-sm">AE</span>
          <span className="font-bold text-brand-950">Amen Events</span>
        </Link>
        <Link to="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Staff Login →
        </Link>
      </div>
    </header>
  )
}
