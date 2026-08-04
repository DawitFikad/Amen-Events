import React, { useState, useEffect, useRef } from 'react'
import { Ticket, Plus, QrCode, Users, Download, Search, Clock3, XCircle, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Segmented, Modal, Field } from '../components/ui'
import { fmt } from '../store/data'

const ticketTypes = [
  { id: 'tt1', name: 'Early Bird', price: 9000, qty: 200, sold: 148 },
  { id: 'tt2', name: 'Standard', price: 12000, qty: 300, sold: 176 },
  { id: 'tt3', name: 'VIP', price: 24000, qty: 80, sold: 54 },
  { id: 'tt4', name: 'Group (10)', price: 100000, qty: 20, sold: 6 },
]

const refundRequests = [
  { id: 'rf1', name: 'Dagmawi Hailu', type: 'Standard', amount: 6000, reason: 'Flight canceled', date: '2026-08-04', status: 'pending' },
  { id: 'rf2', name: 'Marta Bekele', type: 'VIP', amount: 12000, reason: 'Duplicate purchase', date: '2026-08-03', status: 'approved' },
]

export default function Ticketing() {
  const { state, registerAttendee, intent, clearIntent, viewQr } = useData()
  const [view, setView] = useState('registrations')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [qrView, setQrView] = useState(null)
  const [q, setQ] = useState('')
  const qrRef = useRef(null)

  const downloadQr = () => {
    const node = qrRef.current
    if (!node) return
    const svg = node.querySelector('svg')
    if (!svg) return
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${qrView.qr}.svg`
    a.click()
    URL.revokeObjectURL(url)
    show('QR ticket downloaded')
  }

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    if (intent === 'new-registration') { setOpen(true); setView('registrations'); clearIntent() }
    if (intent === 'view-qr') {
      const lastReg = state.registrations.find((r) => r.id === state.demo.lastRegId) || state.registrations.find((r) => r.eventId === activeEvent.id)
      if (lastReg) { setQrView(lastReg); viewQr() }
      setView('registrations')
      clearIntent()
    }
  }, [intent])

  const activeEvent = state.events.find((e) => e.status === 'ongoing') || state.events[0]
  const regs = state.registrations.filter((r) => r.eventId === activeEvent?.id)
  const filtered = regs.filter((r) => (r.name + r.email + r.type).toLowerCase().includes(q.toLowerCase()))
  const totalSold = ticketTypes.reduce((a, t) => a + t.sold, 0)
  const capacity = ticketTypes.reduce((a, t) => a + t.qty, 0)

  const submit = () => {
    if (!form.name) { show('Attendee name required', 'warn'); return }
    const rec = registerAttendee({ ...form, eventId: activeEvent.id, amount: ticketTypes.find((t) => t.name === form.type)?.price || 6000, paid: !!form.paid })
    show('Attendee registered')
    setQrView(rec)
    setOpen(false); setForm({})
  }

  return (
    <div>
      <PageHeader
        title="Registration & Ticketing"
        subtitle={`Ticket sales, registrations and capacity for "${activeEvent?.name}"`}
        icon={Ticket}
        actions={
          <>
            <button className="btn-outline"><Download size={15} /> Export Listd/button>
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Register Attendeed/button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Tickets Sold', totalSold, `${Math.round((totalSold / capacity) * 100)}% of capacity`], ['Capacity', capacity, 'available'], ['Revenue from Tickets', fmt(ticketTypes.reduce((a, t) => a + t.sold * t.price, 0)), 'collected'], ['Waiting List', 18, 'people queued']].map(([l, v, s]) => (
          <div key={l} className="card p-4">
            <p className="text-[13px] font-semibold text-ink/55">{l}</p>
            <p className="mt-1 text-xl font-black text-brand-950">{v}</p>
            <p className="mt-0.5 text-xs text-ink/40">{s}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ticket types */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Ticket Typesd/p>
            <button className="btn-outline !py-1 text-xs">Manage Typesd/button>
          </div>
          <div className="space-y-3">
            {ticketTypes.map((t) => {
              const pct = (t.sold / t.qty) * 100
              return (
                <div key={t.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`chip ${t.name.includes('VIP') ? 'bg-gold-100 text-gold-700' : 'bg-brand-100 text-brand-800'}`}>{t.name}</span>
                      <span className="text-sm font-bold text-brand-950">{fmt(t.price)}</span>
                    </div>
                    <span className="text-xs text-ink/45">{t.sold}/{t.qty} soldd/span>
                  </div>
                  <Progress value={pct} color={pct >= 90 ? 'bg-gold-500' : 'bg-brand-600'} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Capacity gauge */}
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Capacity Controld/p>
          <div className="flex items-center justify-center gap-6">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e8efe8" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#228b22" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${(totalSold / capacity) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-brand-950">{Math.round((totalSold / capacity) * 100)}%</span>
                <span className="text-[10px] uppercase tracking-wide text-ink/40">Soldd/span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-ink/55">Remaining: <span className="font-bold text-brand-950">{capacity - totalSold} seatsd/span></p>
              <p className="text-ink/55">VIP remaining: <span className="font-bold text-gold-700">{ticketTypes[2].qty - ticketTypes[2].sold}</span></p>
              <p className="text-ink/55">Waiting list: <span className="font-bold text-ink/80">18 peopled/span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={[{ value: 'registrations', label: 'Registrations' }, { value: 'refunds', label: 'Refund Requests' }, { value: 'waitlist', label: 'Waiting List' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search attendee…" className="w-full sm:w-64" />
      </div>

      {view === 'registrations' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50"><tr><Th>Attendeed/Th><Th>Typed/Th><Th className="text-right">Amountd/Th><Th>Paymentd/Th><Th>Check-ind/Th><Th>QR Coded/Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td>
                      <div>
                        <p className="font-semibold text-brand-950">{r.name}</p>
                        <p className="text-[11px] text-ink/40">{r.email}</p>
                      </div>
                    </Td>
                    <Td><Badge status={r.type === 'VIP' ? 'pending' : 'done'} label={r.type} /></Td>
                    <Td className="font-semibold">{fmt(r.amount)}</Td>
                    <Td><Badge status={r.paid ? 'paid' : 'outstanding'} label={r.paid ? 'Paid' : 'Unpaid'} /></Td>
                    <Td><Badge status={r.checkedIn ? 'active' : 'todo'} label={r.checkedIn ? 'Checked in' : 'Pending'} /></Td>
                    <Td><button onClick={() => setQrView(r)} className="btn-outline !py-1 text-xs"><QrCode size={13} /> Viewd/button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState icon={Users} title="No registrations" subtitle="Register the first attendee to see them here." />}
        </div>
      )}

      {view === 'refunds' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Attendeed/Th><Th>Typed/Th><Th className="text-right">Amountd/Th><Th>Reasond/Th><Th>Statusd/Th><Th></Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {refundRequests.map((r) => (
                <tr key={r.id}>
                  <Td className="font-semibold text-brand-950">{r.name}</Td>
                  <Td className="text-ink/60">{r.type}</Td>
                  <Td className="font-semibold">{fmt(r.amount)}</Td>
                  <Td className="text-ink/55">{r.reason}</Td>
                  <Td><Badge status={r.status} label={r.status} /></Td>
                  <Td>{r.status === 'pending' && <div className="flex gap-1"><button className="btn-outline !py-1 text-xs" onClick={() => show('Refund approved')}><CheckCircle2 size={12} /> Approved/button><button className="btn-ghost !py-1 text-xs text-red-600" onClick={() => show('Refund declined', 'warn')}><XCircle size={12} /> Declined/button></div>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'waitlist' && (
        <div className="card p-5">
          <div className="space-y-2">
            {['Hiwot Lemma', 'Abel Fikru', 'Luwam Gidey'].map((n, i) => (
              <div key={n} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">#{i + 1}</span>
                  <div><p className="text-sm font-semibold text-brand-950">{n}</p><p className="text-[11px] text-ink/40">Waiting for Standardd/p></div>
                </div>
                <button className="btn-outline !py-1 text-xs" onClick={() => show(`${n} moved to registrations`)}>Move to Registrationd/button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Register Attendee">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email" className="col-span-2"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Ticket Type"><select className="input" value={form.type || 'Standard'} onChange={(e) => setForm({ ...form, type: e.target.value })}>{ticketTypes.map((t) => <option key={t.id} value={t.name}>{t.name} — {fmt(t.price)}</option>)}</select></Field>
          <Field label="Payment"><select className="input" value={form.paid || true} onChange={(e) => setForm({ ...form, paid: e.target.value === 'true' })}><option value="true">Paidd/option><option value="false">Unpaidd/option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Canceld/button>
          <button className="btn-primary" onClick={submit}>Register & Generate QRd/button>
        </div>
      </Modal>

      {/* QR ticket view */}
      {qrView && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/60" onClick={() => setQrView(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-pop">
            <div className="bg-brand-900 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-brand-300">Digital Ticketd/p>
                  <p className="font-bold">{activeEvent?.name}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-brand-950 font-black">Ad/span>
              </div>
            </div>
            <div className="border-b border-dashed border-brand-200 px-6 py-5 text-center">
              <div ref={qrRef} className="mx-auto mb-3 flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-brand-100 bg-white p-3">
                <QRCodeSVG
                  value={qrView.qr || 'AE-REG-0012'}
                  size={152}
                  level="H"
                  includeMargin={false}
                  fgColor="#082408"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-mono text-sm font-bold tracking-widest text-brand-900">{qrView.qr || 'AE-REG-0012'}</p>
              <p className="mt-1 text-xs text-ink/45">Scan this ticket at the entrance to check ind/p>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-brand-950">{qrView.name}</p>
                  <p className="text-xs text-ink/45">{qrView.email}</p>
                </div>
                <Badge status={qrView.type === 'VIP' ? 'pending' : 'done'} label={qrView.type} />
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary flex-1" onClick={downloadQr}><Download size={15} /> Downloadd/button>
                <button className="btn-outline" onClick={() => setQrView(null)}>Closed/button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}


