import React, { useState, useEffect } from 'react'
import { Building2, Plus, LayoutGrid, CheckCircle2, Pencil, Image as ImageIcon } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, Th, Td, Modal, Field, Avatar } from '../components/ui'
import { textRequired, nameOnly, numberPositive, phoneValid, emailValid, optional, validate } from '../store/validation'

const tierStyle = {
  gold: 'border-gold-400 bg-gold-50',
  silver: 'border-brand-300 bg-brand-50',
  standard: 'border-brand-200 bg-white',
}

export default function Exhibition() {
  const { state, patch, addExhibitor, updateExhibitor, logActivity, intent, clearIntent } = useData()
  const [view, setView] = useState('floor')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const booths = state.exhibitionBooths

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const freeBooths = booths.filter((b) => b.status === 'free').map((b) => b.booth)

  const exhibitorSchema = {
    company: [textRequired('Company name', { min: 2, max: 100 })],
    contact: [nameOnly('Contact name')],
    email: [emailValid('Contact email')],
    phone: [phoneValid('Contact phone')],
    website: [optional((v) => { const s = String(v || '').trim(); if (s === '') return ''; if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:\d+)?(\/[^\s]*)?$/.test(s)) return 'Website looks invalid (e.g. company.com)'; return '' })],
    paid: [optional(numberPositive('Initial payment'))],
  }

  const openCreate = () => { setEditingId(null); setForm({}); setErrors({}); setOpen(true) }
  const openEdit = (e) => { setEditingId(e.id); setForm({ company: e.company || '', contact: e.contact || '', email: e.email || '', phone: e.phone || '', website: e.website || '', booth: e.booth || '', size: e.size || 'Standard', package: e.package || 'Exhibitor', paid: e.paid || 0, status: e.status || 'registering', description: e.description || '', logo: e.logo || '' }); setErrors({}); setOpen(true) }

  useEffect(() => {
    if (intent === 'new-exhibitor') {
      if (state.demo.autoplay) {
        const seed = { company: 'Habesha Tech Hub', contact: 'Nahom Girma', email: 'booths@habeshatech.et', phone: '+251 912 808 909', website: 'habeshatech.et', booth: 'B-04', size: 'Premium', package: 'Exhibitor', paid: '150000', status: 'confirmed' }
        setForm(seed); openCreate(); setErrors({})
        setTimeout(() => {
          const rec = addExhibitor(seed)
          if (seed.booth) patch('exhibitionBooths', (bs) => bs.map((b) => (b.booth === seed.booth ? { ...b, company: seed.company, status: seed.status || 'registering', tier: 'gold' } : b)))
          show(`${rec?.company || seed.company} registered automatically`); setOpen(false); setForm({})
        }, 1100)
      } else openCreate()
      clearIntent()
    }
  }, [intent])

  const onLogo = (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { show('Logo must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result }))
    reader.readAsDataURL(file)
  }

  const boothOptions = editingId ? freeBooths.concat(state.exhibitors.find((e) => e.id === editingId)?.booth || '') : freeBooths

  const submit = () => {
    const res = validate(form, exhibitorSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    const tier = form.size === 'Premium' ? 'gold' : form.size === 'Featured' ? 'silver' : 'standard'
    if (editingId) {
      const prev = state.exhibitors.find((e) => e.id === editingId)
      updateExhibitor(editingId, form)
      patch('exhibitionBooths', (bs) => bs.map((b) => {
        if (prev && prev.booth && prev.booth !== form.booth && b.booth === prev.booth) return { ...b, company: null, status: 'free', tier: null }
        if (form.booth && b.booth === form.booth) return { ...b, company: form.company, status: form.status || 'registering', tier }
        return b
      }))
      show(`${form.company} updated`)
    } else {
      addExhibitor(form)
      if (form.booth) {
        patch('exhibitionBooths', (bs) => bs.map((b) => (b.booth === form.booth ? { ...b, company: form.company, status: form.status || 'registering', tier } : b)))
      }
      logActivity(`${form.company} registered as exhibitor (booth ${form.booth || 'TBD'})`, 'exhibition')
      show(`${form.company} registered (booth ${form.booth || 'TBD'})`)
    }
    setOpen(false); setForm({}); setEditingId(null); setErrors({})
  }

  return (
    <div>
      <PageHeader
        title="Exhibition Management"
        subtitle="Exhibitors, booths and floor plan."
        icon={Building2}
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={15} /> Register Exhibitor</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Exhibitors', state.exhibitors.length, 'companies'], ['Booths Booked', booths.filter((b) => b.status !== 'free').length, 'of ' + booths.length], ['Confirmed', state.exhibitors.filter((e) => e.status === 'confirmed').length, 'ready'], ['Pending', state.exhibitors.filter((e) => e.status === 'pending' || e.status === 'registering').length, 'in progress']].map(([l, v, s]) => (
          <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['floor', 'Floor Plan', LayoutGrid], ['exhibitors', 'Exhibitors', Building2]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'floor' && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Hall A - Booth Floor Plan</p>
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
            {booths.map((b) => (
              <button
                key={b.booth}
                onClick={() => {
                  if (b.status === 'free') { setErrors({}); setForm({ booth: b.booth }); setOpen(true); return }
                  show(`Booth ${b.booth} - ${b.company}`)
                }}
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
            <table className="w-full min-w-[860px]">
              <thead className="bg-brand-50/50"><tr><Th>Company</Th><Th>Booth</Th><Th>Package</Th><Th>Size</Th><Th>Contact</Th><Th>Status</Th><Th /></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {state.exhibitors.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <Td>
                      <span className="flex items-center gap-2.5">
                        {e.logo ? <img src={e.logo} alt={e.company} className="h-7 w-7 shrink-0 rounded-full object-cover" /> : <Avatar name={e.company} size="sm" />}
                        <span>
                          <span className="block font-semibold text-brand-950">{e.company}</span>
                          {e.website && <a href={e.website.startsWith('http') ? e.website : `https://${e.website}`} target="_blank" rel="noreferrer" className="text-[11px] text-brand-600 hover:underline">{e.website}</a>}
                        </span>
                      </span>
                    </Td>
                    <Td><span className="font-mono font-bold text-brand-800">{e.booth}</span></Td>
                    <Td className="text-ink/60">{e.package}</Td>
                    <Td className="text-ink/60">{e.size}</Td>
                    <Td>
                      {e.contact || e.email || e.phone ? (
                        <span className="block text-ink/70">{e.contact || '-'}</span>
                      ) : <span className="text-ink/35">-</span>}
                      <span className="text-[11px] text-ink/45">{e.email}{e.email && e.phone ? ' · ' : ''}{e.phone}</span>
                    </Td>
                    <Td><Badge status={e.status} label={e.status} /></Td>
                    <Td className="text-right"><button onClick={() => openEdit(e)} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Pencil size={13} /> Edit</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Exhibitor' : 'Register Exhibitor'} width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company *" className="col-span-2"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. AddisTech Solutions" />{errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}</Field>
          <Field label="Logo">
            <div className="flex items-center gap-2">
              {form.logo ? <img src={form.logo} alt="logo" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><ImageIcon size={15} /></span>}
              <label className="btn-outline !py-1.5 cursor-pointer text-xs"><input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files[0])} /> {form.logo ? 'Change' : 'Upload'}</label>
              {form.logo && <button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={() => setForm({ ...form, logo: '' })}>Remove</button>}
            </div>
          </Field>
          <Field label="Booth"><select className="input" value={form.booth || ''} onChange={(e) => setForm({ ...form, booth: e.target.value })}><option value="">Auto-allocate…</option>{boothOptions.filter((b, i, a) => b && a.indexOf(b) === i).map((b) => <option key={b} value={b}>{b}</option>)}</select></Field>
          <Field label="Booth Size"><select className="input" value={form.size || 'Standard'} onChange={(e) => setForm({ ...form, size: e.target.value })}><option>Premium</option><option>Featured</option><option>Standard</option><option>Other</option></select></Field>
          <Field label="Package"><select className="input" value={form.package || 'Exhibitor'} onChange={(e) => setForm({ ...form, package: e.target.value })}><option>Platinum Sponsor</option><option>Gold Sponsor</option><option>Silver Sponsor</option><option>Exhibitor</option><option>Other</option></select></Field>
          <Field label="Contact Person *"><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Hanna Kebede" />{errors.contact && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contact}</p>}</Field>
          <Field label="Email *"><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@company.com" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
          <Field label="Phone *"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9xx xxx xxx" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Website"><input className="input" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="company.com" />{errors.website && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.website}</p>}</Field>
          <Field label="Status"><select className="input" value={form.status || 'registering'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="registering">Registering</option><option value="Other">Other</option></select></Field>
          <Field label="Profile / Product Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What the company showcases, target audience, special requests…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editingId ? 'Save Changes' : 'Register Exhibitor'}</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
