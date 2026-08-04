import React, { useState } from 'react'
import { Building2, Plus, LayoutGrid, Users, QrCode, CheckCircle2, XCircle } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, Th, Td, EmptyState, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'

const boothGrid = [
  { booth: 'A1', company: 'InnovPay', status: 'confirmed', tier: 'gold', x: 1, y: 1 },
  { booth: 'A2', company: null, status: 'free', tier: null, x: 2, y: 1 },
  { booth: 'A3', company: null, status: 'free', tier: null, x: 3, y: 1 },
  { booth: 'A4', company: 'PayCore', status: 'pending', tier: 'silver', x: 4, y: 1 },
  { booth: 'B1', company: null, status: 'free', tier: null, x: 1, y: 2 },
  { booth: 'B2', company: null, status: 'free', tier: null, x: 2, y: 2 },
  { booth: 'B3', company: 'SavaTech', status: 'confirmed', tier: 'standard', x: 3, y: 2 },
  { booth: 'B4', company: null, status: 'free', tier: null, x: 4, y: 2 },
  { booth: 'C1', company: null, status: 'free', tier: null, x: 1, y: 3 },
  { booth: 'C2', company: 'Mulu Hub', status: 'registering', tier: 'standard', x: 2, y: 3 },
  { booth: 'C3', company: null, status: 'free', tier: null, x: 3, y: 3 },
  { booth: 'C4', company: null, status: 'free', tier: null, x: 4, y: 3 },
]

const tierStyle = {
  gold: 'border-gold-400 bg-gold-50',
  silver: 'border-brand-300 bg-brand-50',
  standard: 'border-brand-200 bg-white',
}

const visitors = [
  { id: 'vs1', name: 'Samuel Tekle', company: 'Savvy Startups', checkin: '10:02', scanned: true },
  { id: 'vs2', name: 'Hanna Mamo', company: 'Mulu Hub', checkin: '10:14', scanned: true },
  { id: 'vs3', name: 'Yared Teshome', company: 'Addis Innovation', checkin: '10:31', scanned: true },
  { id: 'vs4', name: 'Bethel Alemu', company: 'Sof Omer', checkin: '—', scanned: false },
]

export default function Exhibition() {
  const { state, addExhibitor } = useData()
  const [view, setView] = useState('floor')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const freeBooths = boothGrid.filter((b) => b.status === 'free').map((b) => b.booth)

  const submit = () => {
    if (!form.company) { show('Company name is required', 'warn'); return }
    addExhibitor(form)
    show(`${form.company} registered (booth ${form.booth || 'TBD'})`)
    setOpen(false); setForm({})
  }

  const revenue = state.exhibitors.reduce((a, e) => a + e.paid, 0)
  const expected = state.exhibitors.reduce((a, e) => a + (e.package.includes('Gold') ? 400000 : e.package.includes('Silver') ? 250000 : 150000), 0)

  return (
    <div>
      <PageHeader
        title="Exhibition Management"
        subtitle="Exhibitors, booths, floor plan and visitor registration."
        icon={Building2}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Register Exhibitor</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Exhibitors', state.exhibitors.length, 'companies'], ['Booths Booked', boothGrid.filter((b) => b.status !== 'free').length, 'of ' + boothGrid.length], ['Booth Revenue', fmt(revenue), 'collected'], ['Expected', fmt(expected), 'target']].map(([l, v, s]) => (
          <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['floor', 'Floor Plan', LayoutGrid], ['exhibitors', 'Exhibitors', Building2], ['visitors', 'Visitor Registration', Users]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'floor' && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Hall A — Booth Floor Plan</p>
            <div className="flex gap-3 text-xs text-ink/50">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-gold-400 bg-gold-50" /> Gold</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-brand-300 bg-brand-50" /> Silver</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-brand-200 bg-white" /> Standard</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-brand-300 bg-transparent" /> Free</span>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-center">
            <span className="rounded-t-3xl bg-brand-100 px-8 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-700">Main Stage</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {boothGrid.map((b) => (
              <button
                key={b.booth}
                onClick={() => show(b.status === 'free' ? `Booth ${b.booth} reserved` : `Booth ${b.booth} — ${b.company}`)}
                className={`aspect-square rounded-xl border-2 p-2 text-left transition hover:scale-[1.02] ${b.status === 'free' ? 'border-dashed border-brand-200 bg-transparent hover:border-brand-400' : tierStyle[b.tier]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-800">{b.booth}</span>
                  {b.status === 'confirmed' && <CheckCircle2 size={13} className="text-brand-600" />}
                  {b.status === 'pending' && <span className="chip bg-gold-100 text-gold-700">pending</span>}
                  {b.status === 'registering' && <span className="chip bg-sky-100 text-sky-700">reg</span>}
                </div>
                <p className="mt-1 truncate text-[11px] font-semibold text-brand-950">{b.company || 'Available'}</p>
                {b.tier && <p className="text-[9px] font-bold uppercase tracking-wide text-ink/35">{b.tier}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'exhibitors' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50"><tr><Th>Company</Th><Th>Booth</Th><Th>Package</Th><Th>Size</Th><Th className="text-right">Paid</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {state.exhibitors.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{e.company}</Td>
                    <Td><span className="font-mono font-bold text-brand-800">{e.booth}</span></Td>
                    <Td className="text-ink/60">{e.package}</Td>
                    <Td className="text-ink/60">{e.size}</Td>
                    <Td className="text-right font-semibold">{e.paid ? fmt(e.paid) : <span className="text-red-500">Unpaid</span>}</Td>
                    <Td><Badge status={e.status} label={e.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'visitors' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-sm text-ink/55">{visitors.filter((v) => v.scanned).length} scanned today</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => show('Visitor registration opened')}><QrCode size={14} /> Register Visitor</button>
          </div>
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Name</Th><Th>Company</Th><Th>Check-in</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <Td className="font-semibold text-brand-950">{v.name}</Td>
                  <Td className="text-ink/60">{v.company}</Td>
                  <Td className="text-ink/50">{v.checkin}</Td>
                  <Td>{v.scanned ? <span className="flex items-center gap-1 text-xs font-bold text-brand-700"><CheckCircle2 size={14} /> Inside</span> : <span className="flex items-center gap-1 text-xs text-ink/45"><XCircle size={14} /> Not arrived</span>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Register Exhibitor">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company *" className="col-span-2"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. AddisTech Solutions" /></Field>
          <Field label="Booth"><select className="input" value={form.booth || ''} onChange={(e) => setForm({ ...form, booth: e.target.value })}><option value="">Auto-allocate…</option>{freeBooths.map((b) => <option key={b} value={b}>{b}</option>)}</select></Field>
          <Field label="Booth Size"><select className="input" value={form.size || 'Standard'} onChange={(e) => setForm({ ...form, size: e.target.value })}><option>Premium</option><option>Standard</option></select></Field>
          <Field label="Package"><select className="input" value={form.package || 'Exhibitor'} onChange={(e) => setForm({ ...form, package: e.target.value })}><option>Platinum Sponsor</option><option>Gold Sponsor</option><option>Silver Sponsor</option><option>Exhibitor</option></select></Field>
          <Field label="Initial Payment (ETB)"><input type="number" className="input" value={form.paid || 0} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status || 'registering'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="registering">Registering</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Register Exhibitor</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}