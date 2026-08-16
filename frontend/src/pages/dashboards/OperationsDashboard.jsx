import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Package, Handshake, CheckCircle2, Clock3, AlertCircle,
  ArrowRight, Sparkles, Truck, Wrench,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress, PageHeader } from '../../components/ui'
import { fmtCompact } from '../../store/data'

export default function OperationsDashboard() {
  const { state } = useData()
  const navigate = useNavigate()

  const venues = state.venues
  const resources = state.resources
  const vendors = state.vendors
  const events = state.events

  // Venue stats
  const bookedVenues = venues.filter((v) => v.status === 'booked')
  const availableVenues = venues.filter((v) => v.status === 'available')
  const maintenanceVenues = venues.filter((v) => v.status === 'maintenance')

  // Resource stats
  const allocatedResources = resources.filter((r) => r.status === 'allocated' || r.status === 'booked')
  const availableResources = resources.filter((r) => r.status === 'available')
  const maintenanceResources = resources.filter((r) => r.status === 'maintenance')

  // Vendor stats
  const activeVendors = vendors.filter((v) => v.status === 'active')
  const avgRating = activeVendors.length > 0
    ? (activeVendors.reduce((a, v) => a + (v.rating || 0), 0) / activeVendors.length).toFixed(1)
    : '-'

  // Upcoming events needing logistics
  const upcomingEvents = events
    .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    .slice(0, 5)

  const stats = [
    { label: 'Total Venues', value: venues.length, icon: MapPin, tone: 'brand', sub: `${bookedVenues.length} booked · ${availableVenues.length} available`, delta: null },
    { label: 'Resources', value: resources.length, icon: Package, tone: 'gold', sub: `${allocatedResources.length} allocated`, delta: null },
    { label: 'Active Vendors', value: activeVendors.length, icon: Handshake, tone: 'brand', sub: `avg rating ${avgRating}`, delta: null },
    { label: 'Maintenance', value: maintenanceVenues.length + maintenanceResources.length, icon: Wrench, tone: 'red', sub: 'needs attention', delta: null },
  ]

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        subtitle="Venues, resources, vendors and event logistics at a glance."
        icon={Sparkles}
        actions={
          <>
            <button className="btn-outline" onClick={() => navigate('/erp/vendors')}><Handshake size={15} /> Vendors</button>
            <button className="btn-primary" onClick={() => navigate('/erp/venues')}><MapPin size={15} /> Venues</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Venue status + resource status */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Venue Status</p>
            <button onClick={() => navigate('/erp/venues')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">Manage <ArrowRight size={13} /></button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-brand-50 p-3 text-center">
              <p className="text-2xl font-black text-brand-700">{availableVenues.length}</p>
              <p className="text-[11px] text-ink/50">Available</p>
            </div>
            <div className="rounded-lg bg-gold-50 p-3 text-center">
              <p className="text-2xl font-black text-gold-700">{bookedVenues.length}</p>
              <p className="text-[11px] text-ink/50">Booked</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-black text-red-700">{maintenanceVenues.length}</p>
              <p className="text-[11px] text-ink/50">Maintenance</p>
            </div>
          </div>
          <div className="space-y-2">
            {venues.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                  {v.abbr || v.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{v.name}</p>
                  <p className="truncate text-[11px] text-ink/45">{v.city} · Cap {v.capacity.toLocaleString()}</p>
                </div>
                <Badge status={v.status} label={v.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Resource Inventory</p>
            <button onClick={() => navigate('/erp/resources')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">Manage <ArrowRight size={13} /></button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-brand-50 p-3 text-center">
              <p className="text-2xl font-black text-brand-700">{availableResources.length}</p>
              <p className="text-[11px] text-ink/50">Available</p>
            </div>
            <div className="rounded-lg bg-gold-50 p-3 text-center">
              <p className="text-2xl font-black text-gold-700">{allocatedResources.length}</p>
              <p className="text-[11px] text-ink/50">Allocated</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-black text-red-700">{maintenanceResources.length}</p>
              <p className="text-[11px] text-ink/50">Maintenance</p>
            </div>
          </div>
          <div className="space-y-2">
            {resources.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Package size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{r.name}</p>
                  <p className="truncate text-[11px] text-ink/45">{r.category || 'Resource'} · Qty {r.qty || 1}</p>
                </div>
                <Badge status={r.status} label={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming logistics + vendor overview */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Upcoming Event Logistics</p>
            <Truck size={16} className="text-ink/35" />
          </div>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No upcoming events.</div>
            ) : (
              upcomingEvents.map((e) => {
                const venue = state.venues.find((v) => v.id === e.venueId)
                const allocations = (state.allocations || []).filter((a) => a.eventId === e.id)
                return (
                  <div key={e.id} className="rounded-lg border border-brand-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{e.name}</p>
                      <Badge status={e.status} label={e.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-ink/45">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} /> {venue?.name || 'No venue'}</span>
                      <span className="inline-flex items-center gap-1"><Package size={11} /> {allocations.length} resources</span>
                      <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {e.date || 'TBD'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Vendor Overview</p>
            <button onClick={() => navigate('/erp/vendors')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">All vendors <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {vendors.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Handshake size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{v.name}</p>
                  <p className="truncate text-[11px] text-ink/45">{v.type} · {v.contact}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gold-700">★ {v.rating || '-'}</p>
                  <Badge status={v.status} label={v.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
