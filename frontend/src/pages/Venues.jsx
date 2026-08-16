import React, { useState, useEffect } from 'react'
import { MapPin, Plus, CalendarDays, Users, LayoutTemplate, Phone, Mail, Image, Upload, Trash2, Info, Globe, Building2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, SearchBox, Toast, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'
import { textRequired, nameOnly, numberPositive, optional, phoneValid, emailValid, validate } from '../store/validation'

const bookings = [
  { id: 'bk1', venueId: 'vn1', eventId: 'ev1', date: '2026-08-18', status: 'confirmed', contact: 'Sara Ahmed' },
  { id: 'bk2', venueId: 'vn2', eventId: 'ev2', date: '2026-08-25', status: 'confirmed', contact: 'Sara Ahmed' },
  { id: 'bk3', venueId: 'vn4', eventId: 'ev3', date: '2026-08-02', status: 'ongoing', contact: 'Sara Ahmed' },
  { id: 'bk4', venueId: 'vn6', eventId: 'ev4', date: '2026-09-12', status: 'pending', contact: 'Sara Ahmed' },
]

const seatLayouts = {
  vn1: 'Theatre - 5000 seats · Main stage · 2 VIP tiers',
  vn2: 'Banquet - 1200 · Round tables of 10',
  vn6: 'Exhibition - 6000 · Booth grid A-D',
}

export default function Venues() {
  const { state, addVenue, updateVenue, patchBy, logActivity, intent, clearIntent } = useData()
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    if (intent === 'new-venue') {
      if (state.demo.autoplay) {
        const seed = { name: 'Friendship Park Hall', city: 'Addis Ababa', address: 'Africa Avenue', halls: 2, capacity: '850', price: '240000', parking: '150', equipment: 'Stage, Sound, WiFi' }
        setOpen(true); setForm(seed); setErrors({})
        setTimeout(() => {
          const rec = addVenue(seed)
          show(`Venue "${rec?.name || seed.name}" added automatically`); setOpen(false); setForm({})
        }, 1100)
      } else { setOpen(true); setErrors({}) }
      clearIntent()
    }
  }, [intent])

  const filtered = state.venues.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()))

  const venueSchema = {
    name: [textRequired('Venue name', { min: 2, max: 100 })],
    city: [textRequired('City', { min: 2, max: 60 })],
    capacity: [numberPositive('Capacity', { integer: true })],
    halls: [optional(numberPositive('Halls', { integer: true }))],
    price: [optional(numberPositive('Daily rate'))],
    contact: [optional(nameOnly('Booking contact'))],
    phone: [optional(phoneValid('Booking phone'))],
    email: [optional(emailValid('Booking email'))],
    parking: [optional(numberPositive('Parking slots', { integer: true }))],
  }

  const submit = () => {
    const res = validate(form, venueSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addVenue(form)
    show(`Venue "${form.name}" added`)
    setOpen(false); setForm({}); setErrors({})
  }

  const editSave = () => {
    const res = validate(editForm, venueSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    updateVenue(detail.id, editForm)
    show(`Venue "${editForm.name}" updated`)
    setEditOpen(false); setEditForm({}); setErrors({})
  }

  const openEdit = (v) => {
    const target = v || detail
    if (!target) return
    setEditForm({ ...target, equipment: Array.isArray(target.equipment) ? target.equipment.join(', ') : target.equipment || '' })
    setErrors({})
    setEditOpen(true)
  }

  const onPhoto = (e, setFn) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setFn((f) => ({ ...f, image: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const bookVenue = (v) => {
    patchBy('venues', v.id, { status: 'booked' })
    logActivity(`Venue booked: ${v.name}`, 'venue')
    show(`"${v.name}" booked`)
  }

  const setVenueStatus = (v, status) => {
    patchBy('venues', v.id, { status })
    logActivity(`Venue "${v.name}" marked ${status}`, 'venue')
    show(`"${v.name}" → ${status}`)
  }

  const VenueMedia = ({ v, className = '' }) => v.image
    ? <img src={v.image} alt={v.name} className={`object-cover ${className}`} />
    : <div className={`flex w-full items-center justify-center ${className} text-white/70`}><Image size={26} /></div>

  const renderFields = (f, setFn) => (
    <>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 ring-1 ring-brand-100">
          {f.image
            ? <img src={f.image} alt="Venue" className="h-full w-full object-cover" />
            : <span className="flex flex-col items-center gap-1 text-xl font-black text-brand-400"><Image size={24} /><span className="text-[10px] font-semibold">Preview</span></span>}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-950">Venue Image / Photos</p>
          <p className="text-xs text-ink/50">Upload the main venue photo shown on cards and booking pages (JPG, PNG - max 5MB).</p>
          <div className="mt-2 flex gap-2">
            <label className="btn-outline !py-1.5 cursor-pointer text-xs">
              <Upload size={14} /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e, setFn)} />
            </label>
            {f.image && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setFn((x) => ({ ...x, image: '' }))}><Trash2 size={13} /> Remove</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Venue Name *" className="col-span-2"><input className="input" value={f.name || ''} onChange={(e) => setFn({ ...f, name: e.target.value })} placeholder="e.g. Intercontinental Ballroom" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
        <Field label="City *"><input className="input" value={f.city || 'Addis Ababa'} onChange={(e) => setFn({ ...f, city: e.target.value })} />{errors.city && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.city}</p>}</Field>
        <Field label="Street Address"><input className="input" value={f.address || ''} onChange={(e) => setFn({ ...f, address: e.target.value })} placeholder="Street, building, landmark" /></Field>
        <Field label="Halls"><input type="number" className="input" value={f.halls || 1} onChange={(e) => setFn({ ...f, halls: e.target.value })} />{errors.halls && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.halls}</p>}</Field>
        <Field label="Capacity *"><input type="number" className="input" value={f.capacity || ''} onChange={(e) => setFn({ ...f, capacity: e.target.value })} placeholder="1500" />{errors.capacity && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.capacity}</p>}</Field>
        <Field label="Daily Rate (ETB)"><input type="number" className="input" value={f.price || ''} onChange={(e) => setFn({ ...f, price: e.target.value })} placeholder="250000" />{errors.price && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.price}</p>}</Field>
        <Field label="Parking Slots"><input type="number" className="input" value={f.parking || ''} onChange={(e) => setFn({ ...f, parking: e.target.value })} placeholder="e.g. 200" />{errors.parking && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.parking}</p>}</Field>
        <Field label="Status"><select className="input" value={f.status || 'available'} onChange={(e) => setFn({ ...f, status: e.target.value })}><option value="available">Available</option><option value="booked">Booked</option><option value="maintenance">Maintenance</option></select></Field>
        <Field label="Booking Contact"><input className="input" value={f.contact || ''} onChange={(e) => setFn({ ...f, contact: e.target.value })} />{errors.contact && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contact}</p>}</Field>
        <Field label="Booking Phone"><input className="input" value={f.phone || ''} onChange={(e) => setFn({ ...f, phone: e.target.value })} placeholder="+251 911 000 000" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
        <Field label="Booking Email" className="col-span-2 sm:col-span-1"><input className="input" value={f.email || ''} onChange={(e) => setFn({ ...f, email: e.target.value })} placeholder="venue@company.com" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
        <Field label="Equipment / Amenities" className="col-span-2"><input className="input" value={f.equipment || ''} onChange={(e) => setFn({ ...f, equipment: e.target.value })} placeholder="Stage, Sound System, AV, WiFi, VIP Lounge (comma separated)" /></Field>
        <Field label="Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={f.description || ''} onChange={(e) => setFn({ ...f, description: e.target.value })} placeholder="Layout, standout features, conditions, notes…" /></Field>
      </div>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Venue Management"
        subtitle="Halls, capacity, equipment and booking availability."
        icon={MapPin}
        actions={<button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Add Venue</button>}
      />

      <div className="mb-5">
        <SearchBox value={q} onChange={setQ} placeholder="Search venues…" className="w-full sm:w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v) => {
          const bks = bookings.filter((b) => b.venueId === v.id)
          return (
            <div key={v.id} className="card overflow-hidden">
              <div className="relative h-32">
                <VenueMedia v={v} className="h-full w-full" />
                {!v.image && <div className={`absolute inset-0 flex items-end bg-gradient-to-br to-black/40 p-4 ${v.color}`}><span className="text-3xl font-black text-white/90">{v.abbr}</span></div>}
                <span className="absolute right-3 top-3"><Badge status={v.status} label={v.status} /></span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-brand-950">{v.name}</h3>
                <p className="text-xs text-ink/50">{v.city}{v.address ? ' · ' + v.address : ''} · {v.halls} halls</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-brand-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Capacity</p><p className="flex items-center justify-center gap-1 text-sm font-black text-brand-900"><Users size={12} />{v.capacity.toLocaleString()}</p></div>
                  <div className="rounded-lg bg-gold-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Daily Rate</p><p className="text-sm font-black text-gold-700">{fmt(v.price)}</p></div>
                  <div className="rounded-lg bg-brand-50 p-2"><p className="text-[10px] font-semibold text-ink/40">Bookings</p><p className="text-sm font-black text-brand-900">{bks.length}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(v.equipment || []).map((e) => <span key={e} className="chip bg-brand-50 text-brand-800">{e}</span>)}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button onClick={() => setDetail(v)} className="btn-outline !py-1.5 text-xs">View Detail</button>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(v)} className="btn-ghost !px-2.5 !py-1.5 text-xs">Edit</button>
                    <button onClick={() => bookVenue(v)} disabled={v.status === 'booked' || v.status === 'maintenance'} className="btn-primary !py-1.5 text-xs">{v.status === 'booked' ? 'Booked' : 'Book Venue'}</button>
                  </div>
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
            <div className="relative h-44">
              <VenueMedia v={detail} className="h-full w-full" />
              {!detail.image && <div className={`absolute inset-0 flex items-end p-6 ${detail.color}`}><span className="text-5xl font-black text-white/90">{detail.abbr}</span></div>}
              <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg bg-black/30 p-1.5 text-white">✕</button>
              <button onClick={openEdit} className="absolute right-14 top-4 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-900 shadow hover:bg-brand-50">Edit</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-950">{detail.name}</h3>
                  <p className="text-sm text-ink/50">{detail.city}{detail.address ? ' · ' + detail.address : ''}</p>
                </div>
                <Badge status={detail.status} label={detail.status} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-brand-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Capacity</p><p className="mt-1 text-lg font-black">{detail.capacity.toLocaleString()}</p></div>
                <div className="rounded-xl bg-gold-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Daily Rate</p><p className="mt-1 text-lg font-black text-gold-700">{fmt(detail.price)}</p></div>
              </div>

              {detail.description && (
                <>
                  <p className="mt-6 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><Info size={12} /> About This Venue</p>
                  <p className="rounded-xl border border-brand-100 p-4 text-sm leading-relaxed text-ink/70">{detail.description}</p>
                </>
              )}

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Equipment / Amenities</p>
              <div className="flex flex-wrap gap-1.5">{(detail.equipment || []).map((e) => <span key={e} className="chip bg-brand-50 text-brand-800">{e}</span>)}</div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Seating Layout</p>
              <div className="rounded-xl border border-brand-100 p-4">
                <p className="flex items-center gap-2 text-sm text-ink/70"><LayoutTemplate size={15} className="text-brand-600" /> {seatLayouts[detail.id] || 'Custom layout available'}</p>
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Venue Contact</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-brand-100 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Phone size={16} /></span>
                  <div><p className="text-sm font-semibold">{detail.contact || detail.phone || '-'}</p><p className="text-[11px] text-ink/40">Booking office</p></div>
                </div>
                {detail.email && <div className="flex items-center gap-3 rounded-xl border border-brand-100 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Mail size={16} /></span>
                  <div><p className="text-sm font-semibold">{detail.email}</p><p className="text-[11px] text-ink/40">Booking email</p></div>
                </div>}
                {detail.parking > 0 && <div className="flex items-center gap-3 rounded-xl border border-brand-100 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Building2 size={16} /></span>
                  <div><p className="text-sm font-semibold">{detail.parking} parking slots</p><p className="text-[11px] text-ink/40">On-site parking</p></div>
                </div>}
              </div>

              {detail.website && <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-700"><Globe size={13} /> {detail.website}</p>}

              <div className="mt-6 flex gap-2">
                <button className="btn-outline flex-1" onClick={openEdit}><Info size={14} /> Edit Profile</button>
                <button className="btn-primary flex-1" onClick={() => setVenueStatus(detail, detail.status === 'maintenance' ? 'available' : 'maintenance')}>Mark Maintenance</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add venue modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Register New Venue" width="max-w-2xl">
        {renderFields(form, setForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}><Plus size={14} /> Add Venue</button>
        </div>
      </Modal>

      {/* Edit venue modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Venue" width="max-w-2xl">
        {renderFields(editForm, setEditForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}