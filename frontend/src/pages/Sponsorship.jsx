import React, { useState } from 'react'
import { BadgeDollarSign, Plus, FileText, CheckCircle2, Megaphone, Pencil, Mail, Phone, CalendarDays } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, Th, Td, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'
import { textRequired, nameOnly, numberPositive, emailValid, phoneValid, optional, validate } from '../store/validation'

const packages = [
  { id: 'pkg1', name: 'Platinum', price: 500000, perks: ['Keynote mention', 'Main stage branding', 'Logo on all tickets', 'VIP lounge access', 'Press coverage'] },
  { id: 'pkg2', name: 'Gold', price: 300000, perks: ['Booth A-tier', 'Announcement slot', 'Logo on screens', '2 VIP passes'] },
  { id: 'pkg3', name: 'Silver', price: 180000, perks: ['Booth B-tier', 'Logo on screens', '1 VIP pass'] },
]

export default function Sponsorship() {
  const { state, patch, addSponsor, updateSponsor, logActivity } = useData()
  const [view, setView] = useState('overview')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [allocLoc, setAllocLoc] = useState(null)
  const [allocSponsor, setAllocSponsor] = useState('')
  const [errors, setErrors] = useState({})

  const branding = state.brandingLocations
  const deliverables = state.sponsorDeliverables

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const sponsorSchema = {
    name: [textRequired('Sponsor name', { min: 2, max: 100 })],
    amount: [optional(numberPositive('Amount'))],
    email: [optional(emailValid('Email'))],
    phone: [optional(phoneValid('Phone number'))],
  }

  const openAdd = () => { setEditId(null); setForm({}); setErrors({}); setOpen(true) }

  const openEdit = (s) => {
    setEditId(s.id)
    setForm({ name: s.name || '', package: s.package || 'Silver', amount: s.amount ?? '', status: s.status || 'pending', deliverables: Array.isArray(s.deliverables) ? s.deliverables.join(', ') : s.deliverables || '', contact: s.contact || '', email: s.email || '', phone: s.phone || '', date: s.date || '' })
    setErrors({}); setOpen(true)
  }

  const submit = () => {
    const res = validate(form, sponsorSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    if (editId) {
      updateSponsor(editId, form)
      show(`${form.name} updated`)
    } else {
      addSponsor(form)
      show(`${form.name} added as ${form.package || 'Silver'} sponsor`)
    }
    setOpen(false); setForm({}); setErrors({}); setEditId(null)
  }

  const allocate = () => {
    const sponsor = state.sponsors.find((s) => s.id === allocSponsor)
    if (!sponsor) { show('Select a sponsor to allocate', 'warn'); return }
    patch('brandingLocations', (b) => b.map((x) => (x.loc === allocLoc ? { loc: x.loc, val: sponsor.amount, by: `${sponsor.package} · ${sponsor.name}` } : x)))
    logActivity(`Branding allocated: ${allocLoc} → ${sponsor.name}`, 'sponsorship')
    setAllocLoc(null); setAllocSponsor('')
    show(`Branding allocated to ${allocLoc}`)
  }

  const total = state.sponsors.reduce((a, s) => a + s.amount, 0)
  const collected = state.sponsors.filter((s) => s.status === 'active').reduce((a, s) => a + s.amount, 0)

  return (
    <div>
      <PageHeader
        title="Sponsorship Management"
        subtitle="Packages, agreements, deliverables and branding locations."
        icon={BadgeDollarSign}
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Sponsor</button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        {[['Total Portfolio', fmt(total), 'bg-brand-800 text-white'], ['Confirmed', fmt(collected), 'bg-brand-100 text-brand-800'], ['Active Sponsors', state.sponsors.length, 'bg-gold-100 text-gold-700']].map(([l, v, cls]) => (
          <div key={l} className={`card p-5 ${cls === 'bg-brand-800 text-white' ? 'bg-brand-900 border-transparent' : ''}`}>
            <p className="text-[13px] font-semibold opacity-70">{l}</p>
            <p className="mt-1 text-xl font-black">{v}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['overview', 'Sponsors', BadgeDollarSign], ['packages', 'Packages', FileText], ['deliverables', 'Deliverables', CheckCircle2], ['branding', 'Branding Locations', Megaphone]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {state.sponsors.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-950">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <Badge status={s.status} label={s.status} />
                  <button onClick={() => openEdit(s)} className="btn-ghost !p-1.5 text-ink/40 hover:text-brand-700" title="Edit sponsor"><Pencil size={14} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="chip bg-gold-100 text-gold-700">{s.package} package</span>
                <span className="text-lg font-black text-brand-950">ETB {s.amount.toLocaleString()}</span>
              </div>
              {(s.contact || s.email || s.phone) && (
                <div className="mt-2 space-y-0.5 text-[11px] text-ink/45">
                  {s.contact && <p className="font-semibold text-ink/60">{s.contact}</p>}
                  {s.email && <p className="flex items-center gap-1.5"><Mail size={11} /> {s.email}</p>}
                  {s.phone && <p className="flex items-center gap-1.5"><Phone size={11} /> {s.phone}</p>}
                  {s.date && <p className="flex items-center gap-1.5"><CalendarDays size={11} /> Agreed {s.date}</p>}
                </div>
              )}
              <div className="mt-3 rounded-lg bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase text-ink/40">Agreement Deliverables</p>
                <ul className="mt-1.5 space-y-1 text-[13px] text-ink/70">
                  {(Array.isArray(s.deliverables) ? s.deliverables : []).map((d, i) => <li key={i} className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-brand-600" /> {d}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'packages' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.id} className="card p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{p.name}</p>
              <p className="mt-1 text-2xl font-black text-brand-950">ETB {p.price.toLocaleString()}</p>
              <div className="mt-4 space-y-2">
                {p.perks.map((pk) => (
                  <p key={pk} className="flex items-start gap-2 text-sm text-ink/70"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600" /> {pk}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'deliverables' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Sponsor</Th><Th>Deliverable</Th><Th>Due</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {deliverables.map((d) => (
                <tr key={d.id} className="hover:bg-brand-50/40">
                  <Td className="font-semibold text-brand-950">{state.sponsors.find((s) => s.id === d.sponsorId)?.name}</Td>
                  <Td className="text-ink/70">{d.item}</Td>
                  <Td className="text-ink/50">{d.date}</Td>
                  <Td><Badge status={d.status} label={d.status.replace('-', ' ')} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'branding' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {branding.map(({ loc, val, by }) => (
            <div key={loc} className="card p-5">
              <p className="text-sm font-bold text-brand-950">{loc}</p>
              <p className="mt-1 text-xs text-ink/45">{by}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-black text-brand-800">{val ? fmt(val) : '—'}</span>
                <button className="btn-outline !py-1 text-xs" onClick={() => { setAllocLoc(loc); setAllocSponsor('') }}>{val ? 'Reallocate' : 'Allocate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditId(null) }} title={editId ? 'Edit Sponsor' : 'Register Sponsor'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sponsor Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coca-Cola Sabco" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Contact Person"><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Lidya Girma" /></Field>
          <Field label="Agreement Date"><input type="date" className="input" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="partner@company.et" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9XX XXX XXX" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Package"><select className="input" value={form.package || 'Silver'} onChange={(e) => setForm({ ...form, package: e.target.value })}><option>Platinum</option><option>Gold</option><option>Silver</option></select></Field>
          <Field label="Amount (ETB)"><input type="number" className="input" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="180000" />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Status"><select className="input" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="pending">Pending</option></select></Field>
          <Field label="Deliverables (comma separated)" className="col-span-2"><textarea className="input min-h-[60px] resize-y" value={form.deliverables || ''} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="e.g. Main stage branding, Logo on tickets, VIP lounge" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => { setOpen(false); setEditId(null) }}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editId ? 'Save Changes' : 'Register Sponsor'}</button>
        </div>
      </Modal>

      {/* Allocate branding modal */}
      <Modal open={!!allocLoc} onClose={() => setAllocLoc(null)} title={`Allocate Branding — ${allocLoc}`} width="max-w-md">
        <Field label="Sponsor">
          <select className="input" value={allocSponsor} onChange={(e) => setAllocSponsor(e.target.value)}>
            <option value="">Select sponsor…</option>
            {state.sponsors.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.package} ({fmt(s.amount)})</option>)}
          </select>
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setAllocLoc(null)}>Cancel</button>
          <button className="btn-primary" onClick={allocate}>Allocate</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
