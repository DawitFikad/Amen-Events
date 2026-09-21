import React, { useState, useEffect } from 'react'
import { Handshake, Plus, Star, Phone, FileText, CheckCircle2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Modal, Field } from '../components/ui'
import { nameOnly, phoneValid, textRequired, numberPositive, validate } from '../store/validation'

const typeIcon = { Caterer: '🍽️', Decorator: '🌸', Security: '🛡️', Photographer: '📷', Videographer: '🎥', Entertainment: '🎤', Printing: '🖨️', Transportation: '🚚', Cleaner: '🧹', Technician: '🔧', AV: '🎛️', Floral: '💐', Furniture: '🪑', Lighting: '💡', Other: '✨' }

export default function Vendors() {
  const { state, addVendor, intent, clearIntent } = useData()
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    if (intent === 'new-vendor') {
      if (state.demo.autoplay) {
        const seed = { name: 'Addis Flower Co.', type: 'Decorator', contact: 'Yordanos Bekele', phone: '+251 918 111 222', rating: '4.5' }
        setOpen(true); setForm(seed); setErrors({})
        setTimeout(() => {
          addVendor(seed)
          show(`Vendor "${seed.name}" added automatically`); setOpen(false); setForm({})
        }, 1100)
      } else { setOpen(true); setErrors({}) }
      clearIntent()
    }
  }, [intent])

  const filtered = state.vendors.filter((v) => (v.name + v.type + v.contact).toLowerCase().includes(q.toLowerCase()))

  const vendorSchema = {
    name: [textRequired('Vendor name', { min: 2, max: 100 })],
    contact: [nameOnly('Contact person')],
    phone: [phoneValid('Phone number')],
    rating: [numberPositive('Rating', { max: 5 })],
  }

  const submit = () => {
    const res = validate(form, vendorSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addVendor(form)
    show(`Vendor "${form.name}" added`)
    setOpen(false); setForm({}); setErrors({})
  }

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        subtitle="Caterers, decorators, security, media and transport partners."
        icon={Handshake}
        actions={<button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Add Vendor</button>}
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
        {/* Service categories */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Vendor Categories</p>
            <span className="chip bg-brand-100 text-brand-800">{state.vendors.length} vendors</span>
          </div>
          <div className="space-y-3">
            {Object.keys(typeIcon).map((t) => {
              const count = state.vendors.filter((v) => v.type === t).length
              const max = Math.max(1, state.vendors.length)
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-base">{typeIcon[t]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-semibold text-ink/80">{t}</span>
                      <span className="font-bold text-brand-700">{count}</span>
                    </div>
                    <Progress value={(count / max) * 100} color={count > 0 ? 'bg-brand-600' : 'bg-brand-100'} />
                  </div>
                </div>
              )
            })}
          </div>
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
              <button className="btn-primary mt-6 w-full" onClick={() => { setErrors({}); setOpen(true); setForm({ type: detail.type, contact: detail.contact, phone: detail.phone, rating: detail.rating }) }}><Plus size={14} /> Add Similar Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* Add vendor modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Vendor">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Addis Flower Co." />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Type"><select className="input" value={form.type || 'Caterer'} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.keys(typeIcon).map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Contact Person *"><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} />{errors.contact && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contact}</p>}</Field>
          <Field label="Phone *"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Initial Rating"><input type="number" step="0.1" min="0" max="5" className="input" value={form.rating || 4.0} onChange={(e) => setForm({ ...form, rating: e.target.value })} />{errors.rating && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.rating}</p>}</Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Vendor</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
