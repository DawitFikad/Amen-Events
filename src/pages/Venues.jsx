import React, { useState } from 'react'
import { MapPin, Plus, CalendarDays, Users, LayoutTemplate, Phone, Image } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Segmented, Avatar, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'

const bookings = [
  { id: 'bk1', venueId: 'vn1', eventId: 'ev1', date: '2026-08-18', status: 'confirmed', contact: 'Sara Ahmed' },
  { id: 'bk2', venueId: 'vn2', eventId: 'ev2', date: '2026-08-25', status: 'confirmed', contact: 'Sara Ahmed' },
  { id: 'bk3', venueId: 'vn4', eventId: 'ev3', date: '2026-08-02', status: 'ongoing', contact: 'Sara Ahmed' },
  { id: 'bk4', venueId: 'vn6', eventId: 'ev4', date: '2026-09-12', status: 'pending', contact: 'Sara Ahmed' },
]

const seatLayouts = {
  vn1: 'Theatre — 5000 seats · Main stage · 2 VIP tiers',
  vn2: 'Banquet — 1200 · Round tables of 10',
  vn6: 'Exhibition — 6000 · Booth grid A–D',
}

export default function Venues() {
  const { state, addVenue, patchBy, logActivity } = useData()
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const filtered = state.venues.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()))

  const submit = () => {
    if (!form.name) { show('Venue name is required', 'warn'); return }
    addVenue(form)
    show(`Venue "${form.name}" added`)
    setOpen(false); setForm({})
  }

  const bookVenue = (v) => {
    patchBy('venues', v.id, { status: 'booked' })
    logActivity(`Venue booked: ${v.name}`, 'venue')
    show(`"${v.name}" booked`)
  }

  return (
    <div>
      <PageHeader
        title="Venue Management"
        subtitle="Halls, capacity, equipment and booking availability."
        icon={MapPin}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Add Venue</button>}
      />

      <div className="mb-5">
        <SearchBox value={q} onChange={setQ} placeholder="Search venues…" className="w-full sm:w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v) => {
          const bks = bookings.filter((b) => b.venueId === v.id)
          return (
            <div key={v.id} className="card overflow-hidden">
              {/* Hero image placeholder */}
              <div className={`relative flex h-32 items-end p-4 ${v.color} bg-gradient-to-br to-black/40`}>
                <span className="text-3xl font-black text-white/90">{v.abbr}</span>
                <span className="absolute right-3 top-3"><Badge status={v.status} label={v.status} /></span>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/20 p-1.5 text-white"><Image size={14} /></span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-brand-950">{v.name}</h3>
                <p className="text-xs text-ink/50">{v.city} · {v.halls} halls</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-brand-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Capacity</p><p className="flex items-center justify-center gap-1 text-sm font-black text-brand-900"><Users size={12} />{v.capacity.toLocaleString()}</p></div>
                  <div className="rounded-lg bg-gold-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Daily Rate</p><p className="text-sm font-black text-gold-700">{fmt(v.price)}</p></div>
                  <div className="rounded-lg bg-brand-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Bookings</p><p className="text-sm font-black text-brand-900">{bks.length}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.equipment.map((e) => <span key={e} className="chip bg-brand-50 text-brand-800">{e}</span>)}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => setDetail(v)} className="btn-outline !py-1.5 text-xs">View Detail</button>
                  <button onClick={() => bookVenue(v)} disabled={v.status === 'booked' || v.status === 'maintenance'} className="btn-primary !py-1.5 text-xs">{v.status === 'booked' ? 'Booked' : 'Book Venue'}</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Calendar strip */}
      <div className="card mt-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 font-bold text-brand-950"><CalendarDays size={16} /> Venue Calendar</p>
          <span className="text-xs text-ink/45">Upcoming bookings</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {bookings.map((b) => {
            const v = state.venues.find((x) => x.id === b.venueId)
            const ev = state.events.find((e) => e.id === b.eventId)
            return (
              <div key={b.id} className="rounded-xl border border-brand-100 p-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-black text-brand-900">{new Date(b.date + 'T00:00').getDate()} <span className="text-[10px] uppercase text-ink/40">{new Date(b.date + 'T00:00').toLocaleDateString('en', { month: 'short' })}</span></span>
                  <Badge status={b.status} label={b.status} />
                </div>
                <p className="text-[13px] font-semibold text-brand-950">{ev?.name}</p>
                <p className="text-[11px] text-ink/45">{v?.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-brand-950/30" onClick={() => setDetail(null)} />
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-pop">
            <div className={`relative flex h-40 items-end p-6 ${detail.color}`}>
              <span className="text-5xl font-black text-white/90">{detail.abbr}</span>
              <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg bg-white/20 p-1.5 text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-950">{detail.name}</h3>
                  <p className="text-sm text-ink/50">{detail.city}</p>
                </div>
                <Badge status={detail.status} label={detail.status} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-brand-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Capacity</p><p className="mt-1 text-lg font-black">{detail.capacity.toLocaleString()}</p></div>
                <div className="rounded-xl bg-gold-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Daily Rate</p><p className="mt-1 text-lg font-black text-gold-700">{fmt(detail.price)}</p></div>
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Equipment Available</p>
              <div className="flex flex-wrap gap-1.5">{detail.equipment.map((e) => <span key={e} className="chip bg-brand-50 text-brand-800">{e}</span>)}</div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Seating Layout</p>
              <div className="rounded-xl border border-brand-100 p-4">
                <p className="flex items-center gap-2 text-sm text-ink/70"><LayoutTemplate size={15} className="text-brand-600" /> {seatLayouts[detail.id] || 'Custom layout available'}</p>
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Venue Contact</p>
              <div className="flex items-center gap-3 rounded-xl border border-brand-100 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Phone size={16} /></span>
                <div><p className="text-sm font-semibold">{detail.contact}</p><p className="text-[11px] text-ink/40">Booking office</p></div>
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Venue Images</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`flex aspect-square items-center justify-center rounded-lg ${detail.color} bg-opacity-80 text-white/70`}><Image size={20} /></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add venue modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Venue">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Intercontinental Ballroom" /></Field>
          <Field label="City"><input className="input" value={form.city || 'Addis Ababa'} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Halls"><input type="number" className="input" value={form.halls || 1} onChange={(e) => setForm({ ...form, halls: e.target.value })} /></Field>
          <Field label="Capacity *"><input type="number" className="input" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="1500" /></Field>
          <Field label="Daily Rate (ETB)"><input type="number" className="input" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="250000" /></Field>
          <Field label="Booking Contact"><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          <Field label="Equipment (comma separated)"><input className="input" value={form.equipment || ''} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="Stage, Sound, AV" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Venue</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}