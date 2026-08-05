import React, { useState } from 'react'
import { Handshake, Plus, Star, Phone, FileText, CheckCircle2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Modal, Field } from '../components/ui'

const typeIcon = { Caterer: '🍽️', Decorator: '🌸', Security: '🛡️', Photographer: '📷', Videographer: '🎥', Entertainment: '🎤', Printing: '🖨️', Transportation: '🚚' }

export default function Vendors() {
  const { state, addVendor } = useData()
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [pay, setPay] = useState(false)
  const [payForm, setPayForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const filtered = state.vendors.filter((v) => (v.name + v.type + v.contact).toLowerCase().includes(q.toLowerCase()))

  const submit = () => {
    if (!form.name) { show('Vendor name is required', 'warn'); return }
    addVendor(form)
    show(`Vendor "${form.name}" added`)
    setOpen(false); setForm({})
  }

  const submitPayment = () => {
    if (!payForm.amount) { show('Amount is required', 'warn'); return }
    show(`Payment of ETB ${Number(payForm.amount).toLocaleString()} recorded to ${state.vendors.find((v) => v.id === payForm.vendorId)?.name}`)
    setPay(false); setPayForm({})
  }

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        subtitle="Caterers, decorators, security, media and transport partners."
        icon={Handshake}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Add Vendor</button>}
      />

      <div className="mb-5">
        <SearchBox value={q} onChange={setQ} placeholder="Search vendors…" className="w-full sm:w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((v) => (
          <div key={v.id} className="card flex flex-col p-5" onClick={() => setDetail(v)}>
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">{typeIcon[v.type]}</span>
              <div className="flex items-center gap-1 rounded-lg bg-gold-50 px-2 py-1 text-xs font-bold text-gold-700"><Star size={12} fill="currentColor" /> {v.rating}</div>
            </div>
            <h3 className="mt-3 font-bold text-brand-950">{v.name}</h3>
            <p className="text-xs text-ink/50">{v.type}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/55"><Phone size={12} className="text-brand-600" /> {v.contact}</div>
            <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-3">
              <span className="text-xs text-ink/45">{v.contracts} contract(s)</span>
              <Badge status={v.status} label={v.status} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payments */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Vendor Payments</p>
            <span className="chip bg-brand-100 text-brand-800">{state.expenses.filter((e) => e.vendorId).reduce((a, e) => a + e.amount, 0).toLocaleString()}/etb total</span>
          </div>
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Ref</Th><Th>Vendor</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {state.expenses.filter((e) => e.vendorId).length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-sm text-ink/40">No vendor payments recorded yet.</td></tr>
              ) : state.expenses.filter((e) => e.vendorId).slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <Td className="font-mono text-xs text-brand-800">EXP-{p.id.slice(-6)}</Td>
                  <Td className="text-ink/70">{state.vendors.find((v) => v.id === p.vendorId)?.name || '—'}</Td>
                  <Td className="text-right font-semibold text-brand-950">{p.amount.toLocaleString()}</Td>
                  <Td><Badge status={p.status === 'paid' ? 'paid' : 'pending'} label={p.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance */}
        <div className="card p-5">
          <p className="mb-3 font-bold text-brand-950">Vendor Performance</p>
          <div className="space-y-3">
            {state.vendors.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-base">{typeIcon[v.type]}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate font-semibold text-ink/80">{v.name}</span>
                    <span className="flex items-center gap-0.5 font-bold text-gold-600"><Star size={11} fill="currentColor" /> {v.rating}</span>
                  </div>
                  <Progress value={v.rating * 20} color={v.rating >= 4.6 ? 'bg-brand-600' : 'bg-gold-500'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-brand-950/30" onClick={() => setDetail(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-pop">
            <div className="bg-brand-900 p-6 text-white">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 text-2xl">{typeIcon[detail.type]}</span>
                <div>
                  <h3 className="text-lg font-bold">{detail.name}</h3>
                  <p className="text-sm text-brand-200">{detail.type} · rating {detail.rating}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Contact</p><p className="mt-1 text-sm font-semibold">{detail.contact}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Phone</p><p className="mt-1 text-sm font-semibold">{detail.phone}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Contracts</p><p className="mt-1 text-sm font-semibold">{detail.contracts}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Status</p><p className="mt-1 text-sm font-semibold"><Badge status={detail.status} label={detail.status} /></p></div>
              </div>
              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Documents</p>
              <div className="space-y-2">
                {['Service Agreement.pdf', 'Signed MSA.pdf', 'Performance Review Q3.pdf'].map((f) => (
                  <div key={f} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                    <span className="flex items-center gap-2 text-sm text-ink/70"><FileText size={15} className="text-brand-600" /> {f}</span>
                    <CheckCircle2 size={16} className="text-brand-500" />
                  </div>
                ))}
              </div>
              <button className="btn-primary mt-6 w-full" onClick={() => { setPay(true); setPayForm({ ...payForm, vendorId: detail.id }) }}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Add vendor modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Vendor">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Addis Flower Co." /></Field>
          <Field label="Type"><select className="input" value={form.type || 'Caterer'} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.keys(typeIcon).map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Contact Person"><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Initial Rating"><input type="number" step="0.1" min="0" max="5" className="input" value={form.rating || 4.0} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Vendor</button>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal open={pay} onClose={() => setPay(false)} title="Record Vendor Payment">
        <div className="space-y-3">
          <Field label="Vendor">
            <select className="input" value={payForm.vendorId || ''} onChange={(e) => setPayForm({ ...payForm, vendorId: e.target.value })}>
              <option value="">Select…</option>
              {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={payForm.amount || ''} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></Field>
          <Field label="Payment Ref"><input className="input" value={payForm.ref || 'PAY-' + String(Math.floor(100 + Math.random() * 900))} onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setPay(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitPayment}>Confirm Payment</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
