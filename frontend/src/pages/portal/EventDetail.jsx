import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Mic, ArrowLeft, Ticket, CheckCircle2, Star, Heart, Share2, Clock, Map } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'
import { portalEventFallback } from '../../store/portalFallback'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const TICKET_TYPES = [
  { type: 'Standard', price: 1000, perks: ['Event access', 'Networking session', 'Lunch included'] },
  { type: 'VIP', price: 5000, perks: ['Priority seating', 'VIP lounge access', 'Networking dinner', 'Swag bag'] },
  { type: 'Student', price: 500, perks: ['Event access', 'Student networking', 'Certificate'] },
]

const AGENDA = [
  { time: '09:00', title: 'Registration & Welcome' },
  { time: '10:00', title: 'Opening Keynote' },
  { time: '11:00', title: 'Panel Discussion' },
  { time: '12:30', title: 'Lunch Break' },
  { time: '14:00', title: 'Workshop Session' },
  { time: '16:00', title: 'Networking & Closing' },
]

export default function PortalEventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, authFetch } = useAttendee()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(TICKET_TYPES[0])
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [inWishlist, setInWishlist] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [reviewErr, setReviewErr] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/portal/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { const fb = portalEventFallback(id); if (fb) { setEvent(fb); setReviews(fb.reviews || []) } else setError(data.error) }
        else { setEvent(data.event); setReviews(data.event.reviews || []) }
        setLoading(false)
      })
      .catch(() => {
        const fb = portalEventFallback(id)
        if (fb) { setEvent(fb); setReviews(fb.reviews || []) }
        else setError('Failed to load')
        setLoading(false)
      })
  }, [id])

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate(`/portal-login?redirect=/events/${id}`)
      return
    }
    navigate(`/checkout`, {
      state: {
        eventId: id,
        eventName: event.name,
        ticketType: selected.type,
        unitPrice: selected.price,
        quantity,
        eventDate: event.date,
        venue: event.venue?.name,
      },
    })
  }

  const toggleWishlist = async () => {
    if (!isAuthenticated) { navigate(`/portal-login?redirect=/events/${id}`); return }
    if (inWishlist) {
      await authFetch(`/portal/wishlist/${id}`, { method: 'DELETE' })
      setInWishlist(false)
    } else {
      await authFetch(`/portal/wishlist`, { method: 'POST', body: JSON.stringify({ eventId: id }) })
      setInWishlist(true)
    }
  }

  const submitReview = async () => {
    const comment = (reviewData.comment || '').trim()
    if (comment.length < 3) { setReviewErr('Please write a few words about your experience'); return }
    setReviewErr('')
    const data = await authFetch(`/portal/events/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ ...reviewData, comment }),
    })
    if (data.review) {
      setReviews([data.review, ...reviews])
      setShowReviewForm(false)
      setReviewData({ rating: 5, comment: '' })
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <div className="portal-skeleton rounded-[20px] p-8 h-96" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
        <p className="text-lg font-bold text-gray-900">Event not found</p>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-portal-600">← Back to events</Link>
      </div>
    )
  }

  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA'
  const regCount = event._count?.registrations || 0
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div>
      {/* Large Hero */}
      <div className="relative h-72 overflow-hidden sm:h-96" style={{ background: 'linear-gradient(135deg, #166534 0%, #3AAA1C 50%, #4ade80 100%)' }}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar size={100} className="text-white/20" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Back button */}
        <div className="absolute left-5 top-5 sm:left-8">
          <Link to="/events" className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-bold text-gray-900 backdrop-blur transition hover:bg-white">
            <ArrowLeft size={16} /> All events
          </Link>
        </div>
        {/* Action buttons */}
        <div className="absolute right-5 top-5 flex gap-2 sm:right-8">
          <button onClick={toggleWishlist} className={`rounded-xl p-2.5 backdrop-blur transition ${inWishlist ? 'bg-rose-500/90 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}>
            <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => navigator.share?.({ title: event.name, url: window.location.href }).catch(() => {})} className="rounded-xl bg-white/90 p-2.5 text-gray-700 backdrop-blur transition hover:bg-white">
            <Share2 size={18} />
          </button>
        </div>
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-portal-600 backdrop-blur">
                {event.status === 'ongoing' ? '● Live Now' : 'Upcoming'}
              </span>
              <span className="rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{event.category}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        {/* Title + info */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{event.name}</h1>
        {avgRating && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-0.5 text-gold-500">{[1,2,3,4,5].map((i) => <Star key={i} size={18} fill={i <= Math.round(avgRating) ? 'currentColor' : 'none'} />)}</div>
            <span className="text-sm font-semibold text-gray-900">{avgRating}</span>
            <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
          </div>
        )}

        {/* Info grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-50 text-portal-600"><Calendar size={20} /></span>
            <div><p className="text-sm font-bold text-gray-900">{dateStr}</p><p className="text-xs text-gray-400">{event.time || '09:00'}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-50 text-portal-600"><MapPin size={20} /></span>
            <div><p className="text-sm font-bold text-gray-900">{event.venue?.name || 'TBA'}</p><p className="text-xs text-gray-400">{event.venue?.city || ''}{event.venue?.capacity ? ` · Cap ${event.venue.capacity}` : ''}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-50 text-portal-600"><Users size={20} /></span>
            <div><p className="text-sm font-bold text-gray-900">{regCount} registered</p><p className="text-xs text-gray-400">by {event.client?.company || 'Amen Events'}</p></div>
          </div>
        </div>

        {/* About */}
        <div className="mt-8 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="text-xl font-bold text-gray-900">About This Event</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {event.description || `Join us for ${event.name}, organized by ${event.client?.company || 'Amen Events'}. Check the agenda below for the session schedule.`}
            {event.venue?.name && ` Located at ${event.venue.name}${event.venue?.city ? `, ${event.venue.city}` : ''}.`}
          </p>
        </div>

        {/* Agenda */}
        <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="text-xl font-bold text-gray-900">Agenda</h2>
          <div className="mt-5 space-y-1">
            {AGENDA.map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-50 p-3.5 transition hover:bg-gray-50/50">
                <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-portal-50 text-sm font-bold text-portal-600">{item.time}</span>
                <span className="text-sm font-semibold text-gray-900">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speakers */}
        {event.speakers?.length > 0 && (
          <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-900"><Mic size={20} className="text-portal-600" /> Speakers</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.speakers.map((sp) => (
                <div key={sp.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 transition hover:shadow-md">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-portal-100 text-sm font-bold text-portal-600">
                    {sp.name?.split(' ').map((p) => p[0]).slice(0, 2).join('') || '?'}
                  </span>
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{sp.name}</p><p className="truncate text-xs text-gray-400">{sp.title || sp.company || ''}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue */}
        <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="text-xl font-bold text-gray-900">Venue</h2>
          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-portal-50 text-portal-600"><Map size={22} /></span>
            <div>
              <p className="font-bold text-gray-900">{event.venue?.name || 'TBA'}</p>
              <p className="text-sm text-gray-500">{event.venue?.city || 'Addis Ababa, Ethiopia'}</p>
              <p className="mt-1 text-xs text-gray-400">{event.venue?.capacity ? `Capacity: ${event.venue.capacity} people` : ''}</p>
            </div>
          </div>
          <div className="mt-4 h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-portal-100 to-portal-50">
            <div className="flex h-full items-center justify-center">
              <Map size={48} className="text-portal-300" />
            </div>
          </div>
        </div>

        {/* Ticket Types */}
        <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Ticket size={20} className="text-portal-600" /> Available Tickets</h2>
          <div className="mt-5 space-y-3">
            {TICKET_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setSelected(t)}
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${selected.type === t.type ? 'border-portal-500 bg-portal-50' : 'border-gray-100 hover:border-portal-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div><p className="text-lg font-bold text-gray-900">{t.type}</p><p className="text-sm text-gray-500">ETB {t.price.toLocaleString()}</p></div>
                  {selected.type === t.type && <CheckCircle2 size={22} className="text-portal-600" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.perks.map((perk) => <span key={perk} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">{perk}</span>)}
                </div>
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Quantity:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 font-bold text-gray-700 transition hover:bg-gray-50">−</button>
              <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 font-bold text-gray-700 transition hover:bg-gray-50">+</button>
            </div>
          </div>

          {/* Total + Buy */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
            <div><p className="text-xs text-gray-400">Total</p><p className="text-3xl font-bold text-gray-900">ETB {(selected.price * quantity).toLocaleString()}</p></div>
            <button onClick={handleBuy} className="rounded-xl bg-portal-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-portal-600 hover:shadow-md">
              <span className="inline-flex items-center gap-2"><Ticket size={16} /> Buy Ticket</span>
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            {isAuthenticated && (
              <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-sm font-bold text-portal-600 hover:text-portal-700">
                {showReviewForm ? 'Cancel' : 'Write a review'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mt-4 rounded-2xl border border-gray-100 p-5">
              <div className="mb-3 flex gap-1 text-gold-500">
                {[1,2,3,4,5].map((i) => (
                  <button key={i} onClick={() => setReviewData({ ...reviewData, rating: i })}>
                    <Star size={24} fill={i <= reviewData.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15 min-h-[80px]" placeholder="Share your experience..." value={reviewData.comment} onChange={(e) => { setReviewData({ ...reviewData, comment: e.target.value }); setReviewErr('') }} />
              {reviewErr && <p className="mt-1 text-[11px] font-medium text-red-600">{reviewErr}</p>}
              <button onClick={submitReview} className="mt-3 rounded-xl bg-portal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-portal-600">Submit Review</button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No reviews yet. Be the first to share your experience!</p>
          ) : (
            <div className="mt-5 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-portal-100 text-xs font-bold text-portal-600">
                      {r.attendee ? `${r.attendee.firstName[0]}${r.attendee.lastName[0]}` : '?'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.attendee ? `${r.attendee.firstName} ${r.attendee.lastName}` : 'Anonymous'}</p>
                      <div className="flex gap-0.5 text-gold-500">{[1,2,3,4,5].map((i) => <Star key={i} size={12} fill={i <= r.rating ? 'currentColor' : 'none'} />)}</div>
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
