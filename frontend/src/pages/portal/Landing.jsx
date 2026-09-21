import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight, Sparkles, Ticket, Shield, Zap, Heart, ChevronDown, Star, Building2, Search, Mic, Award, Clock } from 'lucide-react'
import { portalEventsFallback } from '../../store/portalFallback'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const CATEGORIES = [
  { name: 'Conference', icon: Users, color: 'bg-portal-100 text-portal-600' },
  { name: 'Concert', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
  { name: 'Business', icon: Building2, color: 'bg-blue-100 text-blue-600' },
  { name: 'Technology', icon: Zap, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Workshop', icon: Mic, color: 'bg-orange-100 text-orange-600' },
  { name: 'Exhibition', icon: Building2, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Festival', icon: Heart, color: 'bg-rose-100 text-rose-600' },
]

const TESTIMONIALS = [
  { name: 'Hanan Ali', role: 'Marketing Director', text: 'The QR check-in at our product launch was quick and professional - guests were through the door in seconds.', rating: 5 },
  { name: 'Dawit Tsegaye', role: 'Tech Entrepreneur', text: 'I registered for three conferences in one sitting. Clearest ticket page I have used so far.', rating: 5 },
  { name: 'Selam Bekele', role: 'Event Attendee', text: 'No paper, no queue. My ticket lived on my phone and got scanned straight at the entrance.', rating: 4 },
]

const SPONSORS = ['ETH FINTECH Group', 'Abyssinia Bank', 'Walia Telecom', 'Sheba Bank', 'Sof Omer Hotel']

const FAQS = [
  { q: 'How do I purchase tickets?', a: 'Browse events, pick your ticket type, complete checkout, and your QR ticket arrives instantly on your profile.' },
  { q: 'Can I get a refund?', a: 'Refund policies vary by event. Check the event page for the specific terms before buying.' },
  { q: 'How do I check in at an event?', a: 'Open your ticket QR at the entrance - our staff scan it for immediate entry. No printing needed.' },
  { q: 'Do I need an account to buy tickets?', a: 'Yes, a free account stores your tickets, your purchase history, and event updates in one place.' },
  { q: 'What payment methods are available?', a: 'Cash, card, Telebirr, CBE Birr and bank transfer are accepted at checkout.' },
]

export default function Landing() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/portal/events?sort=popular`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events?.slice(0, 6) || portalEventsFallback({ sort: 'popular', limit: 6 }))
        setLoading(false)
      })
      .catch(() => {
        setEvents(portalEventsFallback({ sort: 'popular', limit: 6 }))
        setLoading(false)
      })
  }, [])

  const featured = events[0]

  return (
    <div>
      {/* Hero - premium, spacious, Apple/Stripe style */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle background gradient */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(58,170,28,0.06) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        <div className="relative mx-auto max-w-7xl px-5 pt-16 pb-12 sm:px-8 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-portal-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-portal-100 bg-portal-50 px-4 py-2 text-sm font-semibold text-portal-600">
              <Sparkles size={15} /> Event Ticketing & Entry
            </div>
            <h1 className="animate-portal-fade-up text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl" style={{ animationDelay: '0.1s' }}>
              Find events
              <span className="block text-portal-500">across Ethiopia</span>
            </h1>
            <p className="animate-portal-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500" style={{ animationDelay: '0.2s' }}>
              Browse upcoming conferences, concerts, and exhibitions. Register with instant QR ticket delivery.
            </p>

            {/* Search bar - prominent, Eventbrite style */}
            <div className="animate-portal-fade-up mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg" style={{ animationDelay: '0.3s', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
              <Search size={20} className="ml-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/events?search=${encodeURIComponent(searchQuery)}` }}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              <Link
                to={`/events?search=${encodeURIComponent(searchQuery)}`}
                className="flex items-center gap-2 rounded-xl bg-portal-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-portal-600"
              >
                Search <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - chip style, horizontal scroll on mobile */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/events?category=${encodeURIComponent(cat.name)}`}
              className="group flex shrink-0 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-5 py-3 transition hover:border-portal-200 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.color} transition group-hover:scale-110`}>
                <cat.icon size={18} />
              </span>
              <span className="text-sm font-bold text-gray-900">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Event - large hero card */}
      {featured && !loading && (
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Event</h2>
              <p className="mt-1 text-sm text-gray-500">Don't miss out on what's coming up</p>
            </div>
          </div>
          <Link
            to={`/events/${featured.id}`}
            className="group relative block overflow-hidden rounded-[20px] border border-gray-100 bg-white transition hover:shadow-xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
          >
            <div className="grid lg:grid-cols-2">
              {/* Image area - gradient placeholder */}
              <div className="relative h-64 overflow-hidden lg:h-full" style={{ background: 'linear-gradient(135deg, #166534 0%, #3AAA1C 50%, #4ade80 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Calendar size={80} className="text-white/30" />
                </div>
                <div className="absolute left-5 top-5">
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-portal-600 backdrop-blur">★ Featured</span>
                </div>
              </div>
              {/* Content */}
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <span className="text-sm font-semibold text-portal-600">{featured.category}</span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{featured.name}</h3>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-portal-50 px-3 py-1 font-semibold text-portal-600"><Users size={13} /> {featured._count?.registrations || 0} registered</span>
                </div>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Calendar size={17} className="text-portal-500" /> {featured.date ? new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'TBA'}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <MapPin size={17} className="text-portal-500" /> {featured.venue?.name || 'TBA'}{featured.venue?.city && `, ${featured.venue.city}`}
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span className="rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white transition group-hover:bg-portal-600">Buy Ticket</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Upcoming Events - grid of large cards */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Upcoming Events</h2>
            <p className="mt-1 text-sm text-gray-500">Discover and register for events across Ethiopia</p>
          </div>
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-portal-600 hover:text-portal-700">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-[20px] border border-gray-100">
                <div className="portal-skeleton h-40" />
                <div className="p-5">
                  <div className="portal-skeleton h-4 w-3/4 rounded" />
                  <div className="portal-skeleton mt-3 h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} delay={i * 0.05} />
            ))}
          </div>
        )}
      </section>

      {/* Sponsors */}
      <section className="border-y border-gray-50 bg-gray-50/30 py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center text-sm font-bold uppercase tracking-wider text-gray-400">Trusted by leading brands</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {SPONSORS.map((s) => (
              <span key={s} className="text-lg font-bold text-gray-300 transition hover:text-gray-400">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Attend */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">Why Attend with Amen Events?</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Ticket, title: 'Instant QR Tickets', desc: 'Get your QR code immediately after purchase. No waiting, no printing required.' },
            { icon: Shield, title: 'Secure Checkout', desc: 'Your payments are protected with industry-standard encryption and secure gateways.' },
            { icon: Zap, title: 'Lightning Fast', desc: 'Browse, register, and check in - all in seconds. Designed for speed and simplicity.' },
          ].map((feat) => (
            <div key={feat.title} className="rounded-[20px] border border-gray-100 bg-white p-7 text-center transition hover:shadow-lg" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-portal-50 text-portal-600">
                <feat.icon size={24} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{feat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50/30 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">What Our Attendees Say</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div className="flex gap-1 text-gold-500">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-portal-100 text-sm font-bold text-portal-600">
                    {t.name.split(' ').map((p) => p[0]).join('')}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-bold text-gray-900">{faq.q}</span>
                <ChevronDown size={18} className={`shrink-0 text-gray-400 transition ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="rounded-[24px] bg-gradient-to-br from-portal-600 to-portal-800 px-8 py-14 text-center text-white sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to attend your next event?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">Create a free account and start exploring events across Ethiopia today.</p>
          <Link to="/events" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-portal-700 shadow-lg transition hover:scale-105">
            Browse Events <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

function EventCard({ event, delay = 0 }) {
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'
  const regCount = event._count?.registrations || 0
  return (
    <Link
      to={`/events/${event.id}`}
      className="group animate-portal-fade-up block overflow-hidden rounded-[20px] border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${delay}s`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
    >
      {/* Image area - gradient placeholder with zoom on hover */}
      <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #166534 0%, #3AAA1C 100%)' }}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute inset-0 flex items-center justify-center transition duration-500 group-hover:scale-110">
          <Calendar size={48} className="text-white/30" />
        </div>
        <div className="absolute left-4 top-4 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur ${event.status === 'ongoing' ? 'bg-white/90 text-portal-600' : 'bg-white/80 text-gray-700'}`}>
            {event.status === 'ongoing' ? '● Live' : 'Upcoming'}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{event.category}</span>
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold leading-snug text-gray-900 transition group-hover:text-portal-600">{event.name}</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={15} className="text-portal-500" /> {dateStr} · {event.time || '09:00'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={15} className="text-portal-500" /> {event.venue?.name || 'TBA'}{event.venue?.city && `, ${event.venue.city}`}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={15} className="text-portal-500" /> {regCount} registered
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <span className="text-xs text-gray-400">{event.client?.company || 'Amen Events'}</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-portal-600 transition-all group-hover:gap-2">
            Buy Ticket <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  )
}
