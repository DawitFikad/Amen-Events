import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight, Ticket, CheckCircle2, Info } from 'lucide-react'
import { publicApi } from '../store/api'
import { Spinner, EmptyState } from '../components/ui'

export default function PublicEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    publicApi.events().then((data) => {
      if (data.error) {
        setError(data.error)
      } else {
        setEvents(data.events || [])
      }
      setLoading(false)
    }).catch(() => {
      setError('Failed to load events')
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
      {/* Header */}
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white font-bold text-sm">AE</span>
            <span className="font-bold text-brand-950">Amen Events</span>
          </div>
          <Link to="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Staff Login →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-12 pb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
          Discover Upcoming Events
        </h1>
        <p className="mt-3 text-base text-ink/55">
          Browse events and secure your spot with instant QR ticket delivery
        </p>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-5 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} className="text-brand-600" />
          </div>
        ) : error ? (
          <EmptyState icon={Info} title="Could not load events" subtitle={error} />
        ) : events.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming events" subtitle="Check back soon for new events to register for." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-100 py-6 text-center text-xs text-ink/40">
        Gravity Technologies PLC · Amen Events Platform
      </footer>
    </div>
  )
}

function EventCard({ event }) {
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA'
  const regCount = event._count?.registrations || 0
  const venueName = event.venue?.name || 'Venue TBA'
  const venueCity = event.venue?.city || ''

  return (
    <Link
      to={`/events/${event.id}`}
      className="card group overflow-hidden transition hover:shadow-pop"
    >
      <div className="flex items-center gap-3 border-b border-brand-50 bg-brand-50/30 px-4 py-3">
        <span className={`chip ${event.status === 'ongoing' ? 'bg-brand-100 text-brand-800' : 'bg-gold-100 text-gold-700'}`}>
          {event.status === 'ongoing' ? '● Live Now' : 'Upcoming'}
        </span>
        <span className="text-xs font-semibold text-ink/40">{event.category}</span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-brand-950 leading-snug group-hover:text-brand-700 transition">{event.name}</h3>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-ink/55">
            <Calendar size={15} className="text-brand-600" />
            {dateStr} · {event.time || '09:00'}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/55">
            <MapPin size={15} className="text-brand-600" />
            {venueName}{venueCity && `, ${venueCity}`}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/55">
            <Users size={15} className="text-brand-600" />
            {regCount} registered
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink/40">by {event.client?.company || 'Amen Events'}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:gap-2 transition-all">
            Get Ticket <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  )
}
