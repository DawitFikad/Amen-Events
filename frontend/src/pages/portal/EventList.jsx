import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight, Search, SlidersHorizontal, X, Star } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const SORTS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Lowest Price' },
  { value: 'price-high', label: 'Highest Price' },
  { value: 'popular', label: 'Most Popular' },
]

export default function PortalEventList() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    city: 'all',
    sort: 'upcoming',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/portal/categories`).then((r) => r.json()).then((d) => setCategories(d.categories || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category !== 'all') params.set('category', filters.category)
    if (filters.sort) params.set('sort', filters.sort)
    fetch(`${API_URL}/portal/events?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters.search, filters.category, filters.sort])

  const cities = useMemo(() => {
    const set = new Set()
    events.forEach((e) => { if (e.venue?.city) set.add(e.venue.city) })
    return Array.from(set)
  }, [events])

  const filtered = useMemo(() => {
    if (filters.city === 'all') return events
    return events.filter((e) => e.venue?.city?.toLowerCase().includes(filters.city.toLowerCase()))
  }, [events, filters.city])

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Explore Events</h1>
        <p className="mt-2 text-sm text-gray-500">Discover and register for events across Ethiopia</p>
      </div>

      {/* Search bar — prominent */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Filter Sidebar — desktop */}
        <aside className={`${showFilters ? 'block' : 'hidden'} w-64 shrink-0 lg:block`}>
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-5" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => { setFilters({ search: filters.search, category: 'all', city: 'all', sort: 'upcoming' }); setShowFilters(false) }} className="text-xs font-semibold text-gray-400 hover:text-portal-600">
                Clear all
              </button>
            </div>

            {/* Category */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Category</p>
              <div className="space-y-1.5">
                <button
                  onClick={() => setFilters({ ...filters, category: 'all' })}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${filters.category === 'all' ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters({ ...filters, category: c })}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${filters.category === c ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            {cities.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Location</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setFilters({ ...filters, city: 'all' })}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${filters.city === 'all' ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Cities
                  </button>
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilters({ ...filters, city: c })}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${filters.city === c ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Sort by</p>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-portal-400"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Events grid */}
        <div className="flex-1">
          {/* Results count */}
          <p className="mb-5 text-sm text-gray-500">{loading ? 'Loading...' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}</p>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="overflow-hidden rounded-[20px] border border-gray-100">
                  <div className="portal-skeleton h-44" />
                  <div className="p-5">
                    <div className="portal-skeleton h-4 w-3/4 rounded" />
                    <div className="portal-skeleton mt-3 h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[20px] border border-gray-100 bg-white py-20 text-center" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Calendar size={48} className="mx-auto text-gray-300" />
              <p className="mt-4 text-lg font-bold text-gray-900">No events found</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((event, i) => (
                <EventCard key={event.id} event={event} delay={i * 0.04} />
              ))}
            </div>
          )}
        </div>
      </div>
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
      <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #166534 0%, #3AAA1C 100%)' }}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute inset-0 flex items-center justify-center transition duration-500 group-hover:scale-110">
          <Calendar size={48} className="text-white/30" />
        </div>
        <div className="absolute left-4 top-4">
          <span className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur ${event.status === 'ongoing' ? 'bg-white/90 text-portal-600' : 'bg-white/80 text-gray-700'}`}>
            {event.status === 'ongoing' ? '● Live' : 'Upcoming'}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{event.category}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold leading-snug text-gray-900 transition group-hover:text-portal-600">{event.name}</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar size={15} className="text-portal-500" /> {dateStr} · {event.time || '09:00'}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin size={15} className="text-portal-500" /> {event.venue?.name || 'TBA'}{event.venue?.city && `, ${event.venue.city}`}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><Users size={15} className="text-portal-500" /> {regCount} registered</div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <span className="text-xs text-gray-400">{event.client?.company || 'Amen Events'}</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-portal-600 transition-all group-hover:gap-2">View Details <ArrowRight size={15} /></span>
        </div>
      </div>
    </Link>
  )
}
