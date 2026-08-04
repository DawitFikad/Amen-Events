import React, { useState } from 'react'
import { BadgeDollarSign, Plus, FileText, CheckCircle2, Megaphone } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, Th, Td, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'

const packages = [
  { id: 'pkg1', name: 'Platinum', price: 500000, perks: ['Keynote mention', 'Main stage branding', 'Logo on all tickets', 'VIP lounge access', 'Press coverage'] },
  { id: 'pkg2', name: 'Gold', price: 300000, perks: ['Booth A-tier', 'Announcement slot', 'Logo on screens', '2 VIP passes'] },
  { id: 'pkg3', name: 'Silver', price: 180000, perks: ['Booth B-tier', 'Logo on screens', '1 VIP pass'] },
]

const deliverables = [
  { id: 'dv1', sponsorId: 'spn1', item: 'Main stage branding installed', status: 'done', date: '2026-08-16' },
  { id: 'dv2', sponsorId: 'spn1', item: 'Logo on printed tickets', status: 'in-progress', date: '2026-08-20' },
  { id: 'dv3', sponsorId: 'spn2', item: 'VIP lounge setup', status: 'pending', date: '2026-08-17' },
  { id: 'dv4', sponsorId: 'spn2', item: 'Opening announcement script', status: 'done', date: '2026-08-12' },
]

export default function Sponsorship() {
  const { state, addSponsor } = useData()
  const [view, setView] = useState('overview')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const submit = () => {
    if (bform.name) { show('Sponsor name is required', 'warn'); return }
    addSponsor(form)
    show(`${form.name} added as ${form.package || 'Silver'} sponsor`)
    setOpen(false); setForm({})
  }

  const total = state.sponsors.reduce((a, s) => a + s.amount, 0)
  const collected = state.sponsors.filter((s) => s.status === 'active').reduce((a, s) => a + s.amount, 0)

  return (
    <div>
      <PageHeader
        title="Sponsorship Management"
        subtitle="Packages, agreements, deliverables and branding locations."
        icon={BadgeDollarSign}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Add Sponsor</button>}
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
                <Badge status={s.status} label={s.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="chip bg-gold-100 text-gold-700">{s.package} package</span>
                <span className="text-lg font-black text-brand-950">ETB {s.amount.toLocaleString()}</span>
              </div>
              <div className="mt-3 rounded-lg bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase text-ink/40">Agreement Deliverables</p>
                <ul className="mt-1.5 space-y-1 text-[13px] text-ink/70">
                  {s.deliverables.map((d, i) => <li key={i} className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-brand-600" /> {d}</li>)}
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
          {[['Main Stage', 400000, 'Platinum · Sheba Bank'], ['VIP Lounge', 0, 'Gold · Ethio Air'], ['Ticket Backs', 0, 'Platinum'], ['Registration Desk', 0, 'Silver']].map(([loc, val, by]) => (
            <div key={loc} className="card p-5">
              <p className="text-sm font-bold text-brand-950">{loc}</p>
              <p className="mt-1 text-xs text-ink/45">{by}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-black text-brand-800">{val ? fmt(val) : '—'}</span>
                <button className="btn-outline !py-1 text-xs" onClick={() => show(`Branding allocated to ${loc}`)}>Allocate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Sponsor">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sponsor Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coca-Cola Sabco" /></Field>
          <Field label="Package"><select className="input" value={form.package || 'Silver'} onChange={(e) => setForm({ ...form, package: e.target.value })}><option>Platinum</option><option>Gold</option><option>Silver</option></select></Field>
          <Field label="Amount (ETB)"><input type="number" className="input" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="180000" /></Field>
          <Field label="Status"><select className="input" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="pending">Pending</option></select></Field>
          <Field label="Key Deliverable"><input className="input" value={form.deliverables || ''} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="e.g. Main stage branding" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Sponsor</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
