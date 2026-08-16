import React, { useState, useEffect } from 'react'
import { Package, Plus, Wrench, Truck, Boxes, AlertTriangle, CheckCircle2, Upload, Trash2, Image, Info, CircleDollarSign, Store, CalendarClock } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Modal, Field } from '../components/ui'
import { textRequired, required, numberPositive, optional, dateRequired, nameOnly, validate } from '../store/validation'

const categories = ['LED Screens', 'Sound Systems', 'Lighting', 'Stages', 'Furniture', 'Decoration', 'Vehicles', 'Generators', 'Branding']

const allocations = [
  { id: 'al1', resourceId: 'rc2', eventId: 'ev1', qty: 2, by: 'st5', date: '2026-08-10' },
  { id: 'al2', resourceId: 'rc5', eventId: 'ev1', qty: 260, by: 'st5', date: '2026-08-12' },
  { id: 'al3', resourceId: 'rc7', eventId: 'ev3', qty: 3, by: 'st5', date: '2026-08-01' },
]

const statuses = ['available', 'in-use', 'maintenance']

export default function Resources() {
  const { state, addResource, updateResource, scheduleMaintenance, completeMaintenance, intent, clearIntent } = useData()
  const [q, setQ] = useState('')
  const [toast, setToast] = useState(null)
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [mtOpen, setMtOpen] = useState(false)
  const [mtForm, setMtForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    if (intent === 'new-resource') {
      if (state.demo.autoplay) {
        const seed = { name: 'Par LED Lights (10)', category: 'Lighting', qty: '20', unitCost: '85000', location: 'Main Warehouse', supplier: 'Beam Lights Co', purchaseDate: '2026-08-01' }
        setOpen(true); setForm(seed); setErrors({})
        setTimeout(() => {
          const rec = addResource(seed)
          show(`Asset "${rec?.name || seed.name}" added automatically`); setOpen(false); setForm({})
        }, 1100)
      } else { setOpen(true); setErrors({}) }
      clearIntent()
    }
  }, [intent])

  const mtSchema = { resourceId: [required('Asset')], task: [optional(textRequired('Task', { min: 3, max: 100 }))], date: [optional(dateRequired('Date'))] }

  const submitMaintenance = () => {
    const res = validate(mtForm, mtSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    scheduleMaintenance(mtForm.resourceId, mtForm.date || new Date().toISOString().slice(0, 10), mtForm.task || 'Routine maintenance')
    show('Maintenance scheduled - asset moved to maintenance')
    setMtOpen(false); setMtForm({}); setErrors({})
  }

  const resourceSchema = {
    name: [textRequired('Asset name', { min: 2, max: 100 })],
    qty: [numberPositive('Quantity', { integer: true })],
    unitCost: [optional(numberPositive('Unit cost'))],
    purchaseDate: [optional(dateRequired('Purchase date'))],
    supplier: [optional(nameOnly('Supplier'))],
  }

  const submit = () => {
    const res = validate(form, resourceSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addResource({ ...form, category: form.category || 'Branding', code: form.code || 'A-AS-' + String(Math.floor(Math.random() * 99)).padStart(2, '0'), unitCost: Number(form.unitCost) || 0 })
    show(`Asset "${form.name}" added to inventory`)
    setOpen(false); setForm({}); setErrors({})
  }

  const openEdit = (r) => {
    setEditId(r.id)
    setEditForm({ ...r })
    setErrors({})
    setEditOpen(true)
  }

  const editSave = () => {
    const res = validate(editForm, resourceSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    updateResource(editId, editForm)
    show(`Asset "${editForm.name}" updated`)
    setEditOpen(false); setEditForm({}); setEditId(null); setErrors({})
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

  const filtered = state.resources.filter((r) =>
    (r.name + r.category + r.code).toLowerCase().includes(q.toLowerCase()) &&
    (cat === 'All' || r.category === cat))

  const counts = {
    available: state.resources.filter((r) => r.status === 'available').length,
    inUse: state.resources.filter((r) => r.status === 'in-use').length,
    maintenance: state.resources.filter((r) => r.status === 'maintenance').length,
  }

  const AssetThumb = ({ r, className = 'h-9 w-9' }) => r.image
    ? <img src={r.image} alt={r.name} className={`${className} rounded-lg object-cover ring-1 ring-brand-100`} />
    : <span className={`${className} flex items-center justify-center rounded-lg bg-brand-50 text-brand-700`}><Boxes size={16} /></span>

  const renderFields = (f, setFn) => (
    <>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
          {f.image
            ? <img src={f.image} alt="Asset" className="h-full w-full object-cover" />
            : <Upload size={24} className="text-brand-400" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-950">Asset Photo</p>
          <p className="text-xs text-ink/50">Show the item on inventory and allocation views (JPG, PNG - max 5MB).</p>
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
        <Field label="Asset Name *" className="col-span-2"><input className="input" value={f.name || ''} onChange={(e) => setFn({ ...f, name: e.target.value })} placeholder="e.g. Par LED Lights (10)" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
        <Field label="Category"><select className="input" value={f.category || 'Branding'} onChange={(e) => setFn({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Asset Code"><input className="input font-mono" value={f.code || ''} onChange={(e) => setFn({ ...f, code: e.target.value })} placeholder="A-LE-01" /></Field>
        <Field label="Quantity *"><input type="number" className="input" value={f.qty || ''} onChange={(e) => setFn({ ...f, qty: e.target.value })} placeholder="e.g. 10" />{errors.qty && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.qty}</p>}</Field>
        <Field label="Unit Cost (ETB)"><div className="relative"><CircleDollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input type="number" className="input pl-9" value={f.unitCost || ''} onChange={(e) => setFn({ ...f, unitCost: e.target.value })} placeholder="e.g. 120000" /></div>{errors.unitCost && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.unitCost}</p>}</Field>
        <Field label="Location"><input className="input" value={f.location || 'Main Warehouse'} onChange={(e) => setFn({ ...f, location: e.target.value })} placeholder="e.g. Main Warehouse / Stage B" /></Field>
        <Field label="Supplier / Vendor"><div className="relative"><Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={f.supplier || ''} onChange={(e) => setFn({ ...f, supplier: e.target.value })} placeholder="e.g. Addis AV Traders" /></div>{errors.supplier && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.supplier}</p>}</Field>
        <Field label="Purchase Date"><div className="relative"><CalendarClock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input type="date" className="input pl-9" value={f.purchaseDate || ''} onChange={(e) => setFn({ ...f, purchaseDate: e.target.value })} /></div>{errors.purchaseDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.purchaseDate}</p>}</Field>
        <Field label="Status"><select className="input" value={f.status || 'available'} onChange={(e) => setFn({ ...f, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></Field>
        <Field label="Notes / Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={f.notes || ''} onChange={(e) => setFn({ ...f, notes: e.target.value })} placeholder="Condition, specifications, serial numbers, warranty…" /></Field>
      </div>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Resource & Asset Inventory"
        subtitle="Assets, availability, maintenance and allocation."
        icon={Package}
        actions={<button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Add Asset</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total Assets', state.resources.length, 'bg-brand-800 text-white', Boxes], ['Available', counts.available, 'bg-brand-100 text-brand-800', CheckCircle2], ['In Use', counts.inUse, 'bg-gold-100 text-gold-700', Truck], ['Maintenance', counts.maintenance, 'bg-red-100 text-red-600', Wrench]].map(([l, v, cls, I]) => (
          <div key={l} className="card flex items-center justify-between p-4">
            <div><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className={`mt-1 text-xl font-black ${cls.split(' ')[2] || 'text-brand-950'}`}>{v}</p></div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><I size={18} /></span>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`tab ${cat === c ? 'tab-active' : 'tab-idle'}`}>{c}</button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search assets…" className="w-full sm:w-64" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead className="bg-brand-50/50">
              <tr><Th>Asset</Th><Th>Category</Th><Th>Stock</Th><Th>Allocated</Th><Th>Availability</Th><Th>Status</Th><Th>Location</Th><Th></Th></tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((r) => {
                const total = r.qty || 1
                const used = r.allocated || 0
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <AssetThumb r={r} />
                        <div>
                          <p className="font-semibold text-brand-950">{r.name}</p>
                          <p className="font-mono text-[11px] text-ink/35">{r.code}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge status="done" label={r.category} /></Td>
                    <Td className="font-bold text-brand-950">{total}</Td>
                    <Td className="font-semibold text-ink/70">{used}</Td>
                    <Td>
                      <div className="w-28">
                        <div className="mb-1 flex justify-between text-[11px]"><span className="text-ink/40">Utilization</span><span className="font-bold">{Math.round((used / total) * 100)}%</span></div>
                        <Progress value={(used / total) * 100} color={used / total > 0.8 ? 'bg-gold-500' : 'bg-brand-600'} />
                      </div>
                    </Td>
                    <Td><Badge status={r.status} label={r.status} /></Td>
                    <Td className="text-ink/55">{r.location}</Td>
                    <Td>
                      <button className="btn-ghost !px-2 !py-1 text-[11px]" onClick={() => openEdit(r)}>Edit</button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={Package} title="No assets match" subtitle="Try a different category or search term." />}
      </div>

      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-brand-950">Active Allocations</p>
          <span className="flex items-center gap-1.5 text-xs text-ink/45"><AlertTriangle size={13} className="text-gold-500" /> Auto-syncs with events</span>
        </div>
        <div className="space-y-2">
          {allocations.map((al) => {
            const r = state.resources.find((x) => x.id === al.resourceId)
            const ev = state.events.find((e) => e.id === al.eventId)
            const m = state.staff.find((x) => x.id === al.by)
            return (
              <div key={al.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-100 p-3">
                <AssetThumb r={r} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-950">{r?.name} × {al.qty}</p>
                  <p className="text-[11px] text-ink/45">{ev?.name} · allocated {al.date}</p>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink/50">by <Avatar name={m?.name} initials={m?.initials} color={m?.color} size="xs" />{m?.name}</span>
                <Badge status={r?.status} label={r?.status} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-brand-950">Maintenance Schedule</p>
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setMtOpen(true)}><Plus size={13} /> Schedule</button>
        </div>
        <div className="space-y-2">
          {(state.maintenance || []).length === 0 && <p className="rounded-lg border border-dashed border-brand-200 p-4 text-center text-xs text-ink/35">No maintenance tasks scheduled.</p>}
          {(state.maintenance || []).map((mt) => {
            const r = state.resources.find((x) => x.id === mt.resourceId)
            const overdue = mt.status !== 'done' && mt.date < new Date().toISOString().slice(0, 10)
            return (
              <div key={mt.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-100 p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${mt.status === 'done' ? 'bg-brand-100 text-brand-700' : 'bg-gold-100 text-gold-700'}`}><Wrench size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-950">{r?.name} - {mt.task}</p>
                  <p className="text-[11px] text-ink/45">{r?.code} · scheduled {mt.date}{overdue ? ' · overdue' : ''}</p>
                </div>
                <Badge status={mt.status === 'done' ? 'done' : 'scheduled'} label={mt.status} />
                {mt.status !== 'done' && (
                  <button className="btn-outline !px-2.5 !py-1 text-xs" onClick={() => { completeMaintenance(mt.id); show('Maintenance marked complete') }}>Complete</button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Register Asset to Inventory" width="max-w-2xl">
        {renderFields(form, setForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}><Plus size={14} /> Add Asset</button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Asset" width="max-w-2xl">
        {renderFields(editForm, setEditForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      <Modal open={mtOpen} onClose={() => setMtOpen(false)} title="Schedule Maintenance">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asset *" className="col-span-2">
            <select className="input" value={mtForm.resourceId || ''} onChange={(e) => setMtForm({ ...mtForm, resourceId: e.target.value })}>
              <option value="">Select asset…</option>
              {state.resources.filter((r) => r.status !== 'maintenance').map((r) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
            </select>
            {errors.resourceId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.resourceId}</p>}
          </Field>
          <Field label="Task"><input className="input" value={mtForm.task || ''} onChange={(e) => setMtForm({ ...mtForm, task: e.target.value })} placeholder="Routine maintenance" />{errors.task && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.task}</p>}</Field>
          <Field label="Date"><input type="date" className="input" value={mtForm.date || ''} onChange={(e) => setMtForm({ ...mtForm, date: e.target.value })} />{errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}</Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setMtOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitMaintenance}><Plus size={14} /> Schedule</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}