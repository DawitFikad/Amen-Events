import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handshake, Plus, Star, Phone, FileText, CheckCircle2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Modal, Field, StatCard, SkeletonPage } from '../components/ui'
import { nameOnly, phoneValid, textRequired, numberPositive, validate } from '../store/validation'
import { exportTableToPDF } from '../store/exportUtils'

const typeIcon = { Caterer: '🍽️', Decorator: '🌸', Security: '🛡️', Photographer: '📷', Videographer: '🎥', Entertainment: '🎤', Printing: '🖨️', Transportation: '🚚', Cleaner: '🧹', Technician: '🔧', AV: '🎛️', Floral: '💐', Furniture: '🪑', Lighting: '💡', Other: '✨' }

export default function Vendors() {
  const { state, addVendor, intent, clearIntent, loading } = useData()
  if (loading) return <SkeletonPage />
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const openWizard = () => { setOpen(true); setStep(1); setForm({}); setErrors({}) }
  const closeWizard = () => { setOpen(false); setStep(1); setForm({}); setErrors({}) }

  useEffect(() => {
    if (intent === 'new-vendor') {
      if (state.demo.autoplay) {
        const seed = { name: 'Addis Flower Co.', type: 'Decorator', contact: 'Yordanos Bekele', phone: '+251 918 111 222', rating: '4.5' }
        setOpen(true); setStep(1); setForm(seed); setErrors({})
        setTimeout(() => {
          addVendor(seed)
          show(`Vendor "${seed.name}" added automatically`); closeWizard()
        }, 1100)
      } else { openWizard() }
      clearIntent()
    }
  }, [intent])

  const filtered = state.vendors.filter((v) => (v.name + v.type + v.contact).toLowerCase().includes(q.toLowerCase()))

  const isDirty = Boolean(form.name || form.contact || form.phone || step > 1)

  const step1Schema = {
    name: [textRequired('Vendor name', { min: 2, max: 100 })],
  }
  const step2Schema = {
    contact: [nameOnly('Contact person')],
    phone: [phoneValid('Phone number')],
  }
  const step3Schema = {
    rating: [numberPositive('Rating', { max: 5 })],
  }

  const handleNext = () => {
    if (step === 1) {
      const res = validate(form, step1Schema)
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    } else if (step === 2) {
      const res = validate(form, step2Schema)
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    } else if (step === 3) {
      const res = validate(form, step3Schema)
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    }
    setErrors({})
    setStep((s) => Math.min(s + 1, 4))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const submit = () => {
    addVendor({ ...form, rating: form.rating || '4.0' })
    show(`Vendor "${form.name}" added`)
    closeWizard()
  }

  const totalVendors = state.vendors.length
  const activeVendors = state.vendors.filter((v) => v.status === 'active').length
  const topRated = state.vendors.filter((v) => (Number(v.rating) || 0) >= 4.5).length
  const totalContracts = state.vendors.reduce((s, v) => s + (Number(v.contracts) || 0), 0)

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        subtitle="Caterers, decorators, security, media and transport partners."
        icon={Handshake}
        actions={
          <>
            <button className="btn-outline" onClick={() => exportTableToPDF(
              'vendor-directory',
              'Vendor & Partner Directory',
              ['Vendor Name', 'Type', 'Contact', 'Phone', 'Rating', 'Contracts', 'Status'],
              state.vendors.map((v) => [v.name, v.type, v.contact, v.phone, v.rating, v.contracts, v.status]),
              { subtitle: `Total Vendors: ${state.vendors.length}` }
            )}><FileText size={15} /> Export PDF</button>
            <button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Add Vendor</button>
          </>
        }
      />

      {/* Live stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Vendors" value={totalVendors} icon={Handshake} tone="brand" sub="registered partners" />
        <StatCard label="Active Partners" value={activeVendors} icon={CheckCircle2} tone="brand" sub="in active service" />
        <StatCard label="Top Rated (4.5+)" value={topRated} icon={Star} tone="gold" sub="premier vendors" />
        <StatCard label="Total Contracts" value={totalContracts} icon={FileText} tone="brand" sub="across events" />
      </div>

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

      {detail && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="fixed inset-0 bg-brand-950/30 backdrop-blur-[2px] transition-opacity" onClick={() => setDetail(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-pop z-10 animate-fade-in">
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
        </div>,
        document.body
      )}

      {/* 4-Step Add Vendor Wizard */}
      <Modal open={open} onClose={closeWizard} title="Register Vendor / Service Partner" width="max-w-2xl" dirty={isDirty}>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/60">
            <span className={step >= 1 ? 'text-brand-700' : ''}>1. Company Profile (25%)</span>
            <span className={step >= 2 ? 'text-brand-700' : ''}>2. Key Contacts (50%)</span>
            <span className={step >= 3 ? 'text-brand-700' : ''}>3. Commercial Terms (75%)</span>
            <span className={step >= 4 ? 'text-brand-700' : ''}>4. Review & Submit (100%)</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%', background: 'linear-gradient(90deg, #188A2E, #39D353)' }}
            />
          </div>
        </div>

        {/* STEP 1: Company Profile */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Handshake size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Company / Business Profile</p>
                <p className="text-[11px] text-ink/55">Enter the vendor's core identity and category of service.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vendor / Business Name *" className="col-span-2">
                <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Addis Flower Co." />
                {errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}
              </Field>
              <Field label="Service Category *">
                <select className="input" value={form.type || 'Caterer'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.keys(typeIcon).map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Business License / TIN">
                <input className="input font-mono" value={form.licenseNo || ''} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} placeholder="e.g. ET-LIC-2020-00123" />
              </Field>
              <Field label="City / Location">
                <input className="input" value={form.city || 'Addis Ababa'} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Website (Optional)">
                <input className="input" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://vendor.com" />
              </Field>
              <Field label="Street Address" className="col-span-2">
                <input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, building, area" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={closeWizard}>Cancel</button>
              <button className="btn-primary" onClick={handleNext}>Next: Key Contacts →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Key Personnel & Contacts */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Phone size={18} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Key Personnel & Contact Details</p>
                <p className="text-[11px] text-ink/55">Primary and secondary contacts for coordination.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Contact Person *" className="col-span-2">
                <input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Yordanos Bekele" />
                {errors.contact && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contact}</p>}
              </Field>
              <Field label="Contact Role / Title">
                <input className="input" value={form.contactRole || ''} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} placeholder="e.g. Sales Manager" />
              </Field>
              <Field label="Primary Phone *">
                <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9XX XXX XXX" />
                {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}
              </Field>
              <Field label="Alternate Phone">
                <input className="input" value={form.phone2 || ''} onChange={(e) => setForm({ ...form, phone2: e.target.value })} placeholder="+251 9XX XXX XXX" />
              </Field>
              <Field label="Email">
                <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@vendor.com" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleBack}>← Back</button>
              <button className="btn-primary" onClick={handleNext}>Next: Commercial Terms →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Commercial Terms & Capacity */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Star size={18} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Commercial Terms, Capacity & Rating</p>
                <p className="text-[11px] text-ink/55">Pricing model, capacity, bank details, and performance rating.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Rate Model">
                <select className="input" value={form.rateModel || 'Fixed'} onChange={(e) => setForm({ ...form, rateModel: e.target.value })}>
                  <option>Fixed</option><option>Per Day</option><option>Per Hour</option><option>Per Unit</option><option>Negotiable</option>
                </select>
              </Field>
              <Field label="Daily / Base Rate (ETB)">
                <input type="number" className="input" value={form.dailyRate || ''} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} placeholder="e.g. 25000" />
              </Field>
              <Field label="Max Event Capacity">
                <input type="number" className="input" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 500 guests" />
              </Field>
              <Field label="Initial Rating (0-5)">
                <input type="number" step="0.1" min="0" max="5" className="input" value={form.rating || '4.0'} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                {errors.rating && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.rating}</p>}
              </Field>
              <Field label="Bank Name">
                <input className="input" value={form.bank || ''} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="e.g. Commercial Bank of Ethiopia" />
              </Field>
              <Field label="Account Number">
                <input className="input font-mono" value={form.accountNo || ''} onChange={(e) => setForm({ ...form, accountNo: e.target.value })} placeholder="1000012345678" />
              </Field>
              <Field label="Notes / Scope of Work" className="col-span-2">
                <textarea className="input min-h-[70px] resize-y" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Describe services, terms, past performance…" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleBack}>← Back</button>
              <button className="btn-primary" onClick={handleNext}>Next: Review & Submit →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><CheckCircle2 size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Review & Submit Registration</p>
                <p className="text-[11px] text-ink/55">Verify all vendor information before finalizing.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2">Company Profile</p>
                <p className="text-sm font-bold text-brand-950">{form.name}</p>
                <p className="text-xs text-ink/60">{typeIcon[form.type]} {form.type}</p>
                {form.city && <p className="text-xs text-ink/50 mt-1">{form.city}</p>}
                {form.licenseNo && <p className="text-xs font-mono text-ink/40 mt-0.5">{form.licenseNo}</p>}
              </div>
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2">Key Contact</p>
                <p className="text-sm font-bold text-brand-950">{form.contact}</p>
                {form.contactRole && <p className="text-xs text-ink/60">{form.contactRole}</p>}
                <p className="text-xs text-ink/55 mt-1">{form.phone}</p>
                {form.email && <p className="text-xs text-ink/45">{form.email}</p>}
              </div>
              <div className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800">Commercial Terms</p>
                  <span className="flex items-center gap-1 text-xs font-bold text-gold-600"><Star size={12} fill="currentColor" /> {form.rating || '4.0'} Rating</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-[10px] text-ink/45 block">Rate Model</span><span className="font-semibold">{form.rateModel || 'Fixed'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Daily Rate</span><span className="font-semibold">{form.dailyRate ? `ETB ${Number(form.dailyRate).toLocaleString()}` : '-'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Capacity</span><span className="font-semibold">{form.capacity || '-'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Bank</span><span className="font-semibold">{form.bank || '-'}</span></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleBack}>← Back</button>
              <button className="btn-primary !px-6" onClick={submit}><CheckCircle2 size={16} /> Register Vendor</button>
            </div>
          </div>
        )}
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
