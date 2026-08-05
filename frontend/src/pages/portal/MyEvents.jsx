import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Ticket, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'

export default function MyEvents() {
  const { authFetch, isAuthenticated } = useAttendee()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    authFetch('/portal/my-events').then((data) => {
      setEvents(data.events || [])
      setLoading(false)
    })
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-bold text-brand-950 text-lg">Please login to view your events</p>
        <Link to="/login?redirect=/my-events" className="btn-primary mt-4">Login</Link>
      </div>
    )
  }

  const now = new Date()
  const filtered = events.filter((e) => {
    if (filter === 'upcoming') return e.date && new Date(e.date) >= now
    if (filter === 'completed') return e.date && new Date(e.date) < now
    return true
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-950">My Events</h1>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-1 rounded-xl bg-brand-50/50 p-1">
        {[{ v: 'all', l: 'All' }, { v: 'upcoming', l: 'Upcoming' }, { v: 'completed', l: 'Completed' }].map((t) => (
          <button key={t.v} onClick={() => setFilter(t.v)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${filter === t.v ? 'bg-white text-brand-800 shadow-sm' : 'text-ink/55'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse p-5 h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 py-16 text-center">
          <Calendar size={40} className="mx-auto text-ink/30" />
          <p className="mt-4 font-bold text-brand-950">No events found</p>
          <Link to="/events" className="btn-primary mt-4">Browse Events</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((e) => {
            const isUpcoming = e.date && new Date(e.date) >= now
            const reg = e.registration
            return (
              <Link key={e.id} to={`/events/${e.id}`} className="card group flex items-center gap-4 p-4 transition hover:shadow-pop">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isUpcoming ? 'bg-brand-100 text-brand-700' : 'bg-ink/10 text-ink/50'}`}>
                  <Calendar size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-brand-950 group-hover:text-brand-700">{e.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink/55">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {e.date ? new Date(e.date).toLocaleDateString() : 'TBA'}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {e.venue?.name || 'TBA'}</span>
                    <span className="flex items-center gap-1"><Ticket size={12} /> {reg?.type}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {reg?.checkedIn ? (
                    <span className="chip bg-brand-100 text-brand-800"><CheckCircle2 size={12} /> Checked In</span>
                  ) : isUpcoming ? (
                    <span className="chip bg-gold-100 text-gold-700"><Clock size={12} /> Upcoming</span>
                  ) : (
                    <span className="chip bg-ink/10 text-ink/50">Completed</span>
                  )}
                  {reg?.qr && <p className="mt-1 text-xs font-bold text-brand-700">{reg.qr}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
