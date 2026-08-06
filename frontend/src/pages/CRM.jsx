import React, { useState, useEffect } from 'react'
import {
  Users, Building2, FileText, Phone, Mail, MapPin, Plus, Filter, StickyNote,
  MessageSquare, ShieldCheck, Eye, ArrowRight,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, SearchBox, Avatar, Modal, Field, EmptyState, Toast, Th, Td } from '../components/ui'
import { fmt, todayISO } from '../store/data'
import { downloadCSV } from '../store/exportUtils'
import { required, nameOnly, emailValid, phoneValid, textRequired, numberPositive, dateRequired, dateRange, validate } from '../store/validation'

const inquiries = [
  { id: 'iq1', company: 'Sheba Construction', contact: 'Ashenafi Wolde', type: 'Corporate Gala', value: 450000, date: '2026-08-02', status: 'new' },
  { id: 'iq2', company: 'Koka University', contact: 'Prof. Taddese Kassa', type: 'Graduation Ceremony', value: 320000, date: '2026-07-28', status: 'qualified' },
  { id: 'iq3', company: 'Abyssinia Bank', contact: 'Selamawit Desta', type: 'Leadership Retreat', value: 2400000, date: '2026-07-15', status: 'quoted' },
  { id: 'iq4', company: 'Sof Omer Hotel', contact: 'Daniel Haile', type: 'Hospitality Gala', value: 520000, date: '2026-07-12', status: 'negotiation' },
]

const quotations = [
  { id: 'qt1', ref: 'QUO-2026-0031', company: 'Walia Telecom', type: 'Partner Expo', amount: 980000, date: '2026-07-22', status: 'sent' },
  { id: 'qt2', ref: 'QUO-2026-0042', company: 'Koka University', type: 'Graduation', amount: 320000, date: '2026-07-29', status: 'draft' },
  { id: 'qt3', ref: 'QUO-2026-0050', company: 'Zemen Pharmaceuticals', type: 'Product Launch', amount: 640000, date: '2026-08-01', status: 'accepted' },
  { id: 'qt4', ref: 'QUO-2026-0045', company: 'Sof Omer Hotel', type: 'Gala', amount: 520000, date: '2026-07-25', status: 'sent' },
]

const commLog = [
  { id: 'cm1', client: 'EthFinTech Group', from: 'Dawit Mengistu', channel: 'Email', subject: 'Venue & catering confirmation', date: '2026-08-03' },
  { id: 'cm2', client: 'Zemen Pharmaceuticals', from: 'Selam Bekele', channel: 'Phone', subject: 'Product launch walkthrough', date: '2026-08-02' },
  { id: 'cm3', client: 'Abyssinia Bank', from: 'Dawit Mengistu', channel: 'WhatsApp', subject: 'Retreat agenda draft', date: '2026-08-01' },
  { id: 'cm4', client: 'Walia Telecom', from: 'Liya Kebede', channel: 'Email', subject: 'Expo sponsor package', date: '2026-07-30' },
]

const pipelineStages = ['lead', 'opportunity', 'quotation', 'negotiation', 'contract']
const pipelineLabels = { lead: 'Lead', opportunity: 'Opportunity', quotation: 'Quotation', negotiation: 'Negotiation', contract: 'Contract' }

export default function CRM() {
  const { state, addClient, patchBy, logActivity, intent, clearIntent, addContract, updateContractStatus, addClientDoc } = useData()
  const [tab, setTab] = useState('clients')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [view, setView] = useState(null) // client detail
  const [form, setForm] = useState({})
  const [quotes, setQuotes] = useState(quotations)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteForm, setQuoteForm] = useState({})
  const [convList, setConvList] = useState(inquiries)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ stage: '', status: '', industry: '' })
  const [commOpen, setCommOpen] = useState(false)
  const [commClient, setCommClient] = useState(null)
  const [contractOpen, setContractOpen] = useState(false)
  const [contractForm, setContractForm] = useState({})
  const [docOpen, setDocOpen] = useState(false)
  const [docForm, setDocForm] = useState({})
  const [errors, setErrors] = useState({})

  const clientSchema = {
    company: [textRequired('Company name', { max: 120 })],
    contactPerson: [nameOnly('Contact person')],
    phone: [phoneValid('Phone number')],
    email: [emailValid('Email')],
  }
  const quoteSchema = {
    company: [required('Client')],
    type: [textRequired('Event type')],
    amount: [numberPositive('Amount')],
  }
  const contractSchema = {
    clientId: [required('Client')],
    value: [numberPositive('Value')],
    startDate: [dateRequired('Start date')],
    endDate: [dateRange('startDate', 'endDate', 'End date')],
  }
  const docSchema = { name: [textRequired('File name', { max: 120 })] }

  const show = (m, t = 'success') => {
    setToast({ message: m, type: t })
    setTimeout(() => setToast(null), 2600)
  }

  const industries = [...new Set(state.clients.map((c) => c.industry).filter(Boolean))].sort()

  const filtered = state.clients.filter((c) => {
    const matchesQ = (c.company + c.contactPerson + c.industry).toLowerCase().includes(q.toLowerCase())
    const matchesStage = !filters.stage || c.stage === filters.stage
    const matchesStatus = !filters.status || c.status === filters.status
    const matchesIndustry = !filters.industry || c.industry === filters.industry
    return matchesQ && matchesStage && matchesStatus && matchesIndustry
  })

  const resetFilters = () => setFilters({ stage: '', status: '', industry: '' })
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const exportClients = () => {
    downloadCSV(
      'clients.csv',
      ['Company', 'Contact Person', 'Role', 'Industry', 'City', 'Pipeline Stage', 'Status', 'Email', 'Phone', 'Value (ETB)'],
      filtered.map((c) => [c.company, c.contactPerson, c.role, c.industry, c.city, pipelineLabels[c.stage] || c.stage, c.status, c.email, c.phone, c.totalValue])
    )
    show(`Exported ${filtered.length} client(s) to CSV`)
  }

  const pipeline = pipelineStages.map((st) => ({
    stage: st,
    items: state.clients.filter((c) => c.stage === st),
  }))

  const submit = () => {
    const res = validate(form, clientSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addClient(form)
    show(`Client "${form.company}" created — added to pipeline`)
    setOpen(false); setForm({}); setErrors({}); clearIntent()
  }

  const convertInquiry = (inq) => {
    setQuotes((q) => [{ id: uid(), ref: 'QUO-' + String(1000 + q.length + 1), company: inq.company, type: inq.type, amount: inq.value, date: todayISO(), status: 'sent' }, ...q])
    const cl = state.clients.find((c) => c.company === inq.company)
    if (cl) patchBy('clients', cl.id, { stage: 'quotation' })
    setConvList((l) => l.filter((x) => x.id !== inq.id))
    logActivity(`Inquiry converted to quotation for ${inq.company}`, 'crm')
    show(`Quotation created for ${inq.company}`)
  }

  const submitQuote = () => {
    const res = validate(quoteForm, quoteSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    setQuotes((q) => [{ id: uid(), ref: 'QUO-' + String(1000 + q.length + 1), company: quoteForm.company, type: quoteForm.type || 'Event', amount: Number(quoteForm.amount) || 0, date: todayISO(), status: quoteForm.status || 'draft' }, ...q])
    setQuoteOpen(false); setQuoteForm({}); setErrors({})
    show('Quotation created')
  }

  const submitContract = () => {
    const res = validate(contractForm, contractSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    const rec = addContract({
      clientId: contractForm.clientId,
      eventId: contractForm.eventId || null,
      value: Number(contractForm.value) || 0,
      startDate: contractForm.startDate || todayISO(),
      endDate: contractForm.endDate || '',
      notes: contractForm.notes || '',
      status: 'draft',
    })
    show(`Contract ${rec?.ref || ''} drafted`)
    setContractOpen(false); setContractForm({}); setErrors({})
  }

  const signContract = (ct) => {
    updateContractStatus(ct.id, 'signed')
    patchBy('clients', ct.clientId, { stage: 'contract' })
    show(`Contract ${ct.ref} signed — client moved to Contract`)
  }

  const submitDoc = () => {
    const res = validate(docForm, docSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addClientDoc(detail.clientId, docForm.name, docForm.ext || 'PDF', docForm.size || '—')
    show(`Document "${docForm.name}" attached`)
    setDocOpen(false); setDocForm({}); setErrors({})
  }

  const detail = view && state.clients.find((c) => c.id === view.id)
  const detailEvents = state.events.filter((e) => e.clientId === view?.id)

  useEffect(() => {
    if (intent === 'new-client') { setOpen(true); setErrors({}); setTab('clients') }
  }, [intent])

  return (
    <div>
      <PageHeader
        title="CRM & Client Management"
        subtitle="Pipeline, companies, inquiries and quotations in one place."
        icon={Users}
        actions={
          <>
            <button className="btn-outline" onClick={() => setFilterOpen(true)}><Filter size={15} /> Filter{activeFilterCount > 0 && <span className="ml-1 rounded-full bg-brand-700 px-1.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}</button>
            <button className="btn-outline" onClick={exportClients}><FileText size={15} /> Export</button>
            <button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> New Client</button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['clients', 'Client Database', Building2], ['pipeline', 'Pipeline', ArrowRight], ['inquiries', 'Inquiries', StickyNote], ['quotations', 'Quotations', FileText], ['contracts', 'Contracts', ShieldCheck], ['comms', 'Communication', MessageSquare]].map(([v, l, I]) => (
          <button key={v} onClick={() => setTab(v)} className={`tab ${tab === v ? 'tab-active' : 'tab-idle'}`}>
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {/* ------- Client database ------- */}
      {tab === 'clients' && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 p-4">
            <SearchBox value={q} onChange={setQ} placeholder="Search clients…" className="w-full sm:w-80" />
            <div className="flex gap-2 text-xs text-ink/45">
              <span className="chip bg-brand-50 text-brand-800">{state.clients.length} companies</span>
              <span className="chip bg-gold-50 text-gold-700">{state.clients.filter((c) => c.status === 'active').length} active</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-brand-50/50">
                <tr>
                  <Th>Company</Th><Th>Contact Person</Th><Th>Industry</Th><Th>City</Th><Th>Pipeline</Th><Th>Value</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setView(c)} className="cursor-pointer transition hover:bg-brand-50/50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-xs font-black text-white">{c.logo}</span>
                        <div>
                          <p className="font-semibold text-brand-950">{c.company}</p>
                          <p className="text-[11px] text-ink/40">{c.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium">{c.contactPerson}</p>
                      <p className="text-[11px] text-ink/40">{c.role}</p>
                    </Td>
                    <Td className="text-ink/60">{c.industry}</Td>
                    <Td className="text-ink/60">{c.city}</Td>
                    <Td><Badge status={c.stage} label={pipelineLabels[c.stage]} /></Td>
                    <Td className="font-semibold text-brand-950">{c.totalValue ? fmt(c.totalValue) : '—'}</Td>
                    <Td><Badge status={c.status} label={c.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState icon={Building2} title="No clients found" subtitle="Adjust your search or create a new client." />}
        </div>
      )}

      {/* ------- Pipeline ------- */}
      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pipeline.map((col) => (
            <div key={col.stage} className="rounded-xl bg-brand-50/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wide text-brand-800">{pipelineLabels[col.stage]}</span>
                <span className="chip bg-white text-brand-800 ring-1 ring-brand-100">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.map((c) => (
                  <button key={c.id} onClick={() => setView(c)} className="w-full rounded-lg border border-brand-100 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-card">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800 text-[10px] font-black text-white">{c.logo}</span>
                      <p className="truncate text-[13px] font-semibold text-brand-950">{c.company}</p>
                    </div>
                    <p className="mt-2 truncate text-[11px] text-ink/45">{c.contactPerson} · {c.industry}</p>
                    <p className="mt-1 text-xs font-bold text-brand-800">{c.totalValue ? fmt(c.totalValue) : 'No value yet'}</p>
                  </button>
                ))}
                {col.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-brand-200 p-4 text-center text-xs text-ink/35">Drop or add a client</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------- Inquiries ------- */}
      {tab === 'inquiries' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-brand-100 p-4">
            <span className="chip bg-gold-100 text-gold-700">{convList.length} new/active</span>
            <span className="text-xs text-ink/45">Convert inquiries into quotations with one click.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-brand-50/50"><tr><Th>Company</Th><Th>Event Type</Th><Th>Contact</Th><Th>Est. Value</Th><Th>Received</Th><Th>Status</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {convList.map((i) => (
                  <tr key={i.id} className="hover:bg-brand-50/40">
                    <Td><p className="font-semibold text-brand-950">{i.company}</p></Td>
                    <Td className="text-ink/60">{i.type}</Td>
                    <Td className="text-ink/60">{i.contact}</Td>
                    <Td className="font-semibold">{fmt(i.value)}</Td>
                    <Td className="text-ink/50">{i.date}</Td>
                    <Td><Badge status={i.status} label={i.status} /></Td>
                    <Td>
                      <button className="btn-outline !py-1 !px-2.5 text-xs" onClick={() => convertInquiry(i)}>Convert <ArrowRight size={12} /></button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------- Quotations ------- */}
      {tab === 'quotations' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-xs text-ink/45">Win rate {quotes.length ? Math.round((quotes.filter((x) => x.status === 'accepted').length / quotes.length) * 100) : 0}%</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setQuoteOpen(true); setErrors({}) }}><Plus size={14} /> New Quotation</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-brand-50/50"><tr><Th>Reference</Th><Th>Client</Th><Th>Type</Th><Th>Amount</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {quotes.map((qt) => (
                  <tr key={qt.id} className="hover:bg-brand-50/40">
                    <Td className="font-mono text-xs font-semibold text-brand-800">{qt.ref}</Td>
                    <Td><p className="font-semibold text-brand-950">{qt.company}</p></Td>
                    <Td className="text-ink/60">{qt.type}</Td>
                    <Td className="font-semibold">{fmt(qt.amount)}</Td>
                    <Td className="text-ink/50">{qt.date}</Td>
                    <Td><Badge status={qt.status} label={qt.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------- Contracts ------- */}
      {tab === 'contracts' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-xs text-ink/45">{state.contracts.filter((c) => c.status === 'signed').length} signed · {state.contracts.filter((c) => c.status === 'draft').length} drafts</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setContractOpen(true); setErrors({}) }}><Plus size={14} /> New Contract</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-brand-50/50"><tr><Th>Reference</Th><Th>Client</Th><Th>Event</Th><Th className="text-right">Value</Th><Th>Term</Th><Th>Status</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {state.contracts.map((ct) => {
                  const c = state.clients.find((x) => x.id === ct.clientId)
                  const ev = state.events.find((x) => x.id === ct.eventId)
                  return (
                    <tr key={ct.id} className="hover:bg-brand-50/40">
                      <Td className="font-mono text-xs font-semibold text-brand-800">{ct.ref}</Td>
                      <Td className="font-semibold text-brand-950">{c?.company}</Td>
                      <Td className="text-ink/60">{ev?.name || '—'}</Td>
                      <Td className="text-right font-semibold">{fmt(ct.value)}</Td>
                      <Td className="text-ink/50">{ct.startDate} → {ct.endDate || 'Open'}</Td>
                      <Td><Badge status={ct.status} label={ct.status} /></Td>
                      <Td>
                        {ct.status === 'draft'
                          ? <button className="btn-outline !py-1 text-xs" onClick={() => signContract(ct)}><ShieldCheck size={12} /> Sign</button>
                          : ct.status === 'signed'
                            ? <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => updateContractStatus(ct.id, 'closed')}>Close</button>
                            : null}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {state.contracts.length === 0 && <EmptyState icon={ShieldCheck} title="No contracts yet" subtitle="Draft a contract from quotations or a signed agreement." />}
        </div>
      )}

      {/* ------- Communication ------- */}
      {tab === 'comms' && (
        <div className="card">
          <div className="divide-y divide-brand-50">
            {commLog.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-brand-50/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  {c.channel === 'Email' ? <Mail size={16} /> : c.channel === 'Phone' ? <Phone size={16} /> : <MessageSquare size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-brand-950">{c.subject}</p>
                  <p className="text-xs text-ink/45">{c.client} · from {c.from} · via {c.channel}</p>
                </div>
                <span className="text-xs text-ink/35">{c.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New client modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create New Client" width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company Name *"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Walia Telecom" />{errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}</Field>
          <Field label="Industry"><select className="input" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })}><option value="">Select…</option><option>Financial Services</option><option>Telecommunications</option><option>Healthcare</option><option>Banking</option><option>Education</option><option>Hospitality</option><option>Construction</option></select></Field>
          <Field label="Contact Person"><input className="input" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />{errors.contactPerson && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contactPerson}</p>}</Field>
          <Field label="Role"><input className="input" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Events Director" /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 911 000 000" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@company.com" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
          <Field label="City"><input className="input" value={form.city || 'Addis Ababa'} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Pipeline Stage"><select className="input" value={form.stage || 'lead'} onChange={(e) => setForm({ ...form, stage: e.target.value })}>{pipelineStages.map((s) => <option key={s} value={s}>{pipelineLabels[s]}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create Client</button>
        </div>
      </Modal>

      {/* Client detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-brand-950/30 backdrop-blur-[1px]" onClick={() => setView(null)} />
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-pop">
            <div className="bg-brand-900 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 text-lg font-black text-brand-950">{detail.logo}</span>
                  <div>
                    <h3 className="text-lg font-bold">{detail.company}</h3>
                    <p className="text-sm text-brand-200">{detail.industry} · {detail.city}</p>
                  </div>
                </div>
                <button onClick={() => setView(null)} className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10"><XIcon /></button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-200">
                <Badge status={detail.status} label={detail.status} />
                <Badge status={detail.stage} label={pipelineLabels[detail.stage]} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Contact Person</p><p className="mt-1 text-sm font-semibold">{detail.contactPerson}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Role</p><p className="mt-1 text-sm font-semibold">{detail.role}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Phone</p><p className="mt-1 text-sm font-semibold">{detail.phone}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Email</p><p className="mt-1 truncate text-sm font-semibold">{detail.email}</p></div>
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Associated Events</p>
              <div className="space-y-2">
                {detailEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                    <div>
                      <p className="text-[13px] font-semibold text-brand-950">{e.name}</p>
                      <p className="text-[11px] text-ink/45">{e.date} · {e.budget ? fmt(e.budget) : 'No budget'}</p>
                    </div>
                    <Badge status={e.status} label={e.status} />
                  </div>
                ))}
                {detailEvents.length === 0 && <p className="text-sm text-ink/40">No events linked yet.</p>}
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Contracts</p>
              <div className="space-y-2">
                {state.contracts.filter((c) => c.clientId === view.id).map((ct) => (
                  <div key={ct.id} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                    <div>
                      <p className="text-[13px] font-semibold text-brand-950">{ct.ref} · {fmt(ct.value)}</p>
                      <p className="text-[11px] text-ink/45">{ct.startDate} → {ct.endDate || 'Open'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={ct.status} label={ct.status} />
                      {ct.status === 'draft' && <button className="btn-outline !px-2 !py-0.5 text-[11px]" onClick={() => signContract(ct)}><ShieldCheck size={11} /> Sign</button>}
                    </div>
                  </div>
                ))}
                {state.contracts.filter((c) => c.clientId === view.id).length === 0 && <p className="text-sm text-ink/40">No contracts yet.</p>}
              </div>

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Client Documents</p>
              <div className="space-y-2">
                {state.clientDocs.filter((d) => d.clientId === view.id).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                    <span className="flex items-center gap-2 text-sm text-ink/70"><ShieldCheck size={15} className="text-brand-600" /> {d.name}</span>
                    <span className="chip bg-brand-50 text-brand-800">{d.ext}</span>
                  </div>
                ))}
                <button className="mt-2 w-full rounded-lg border border-dashed border-brand-200 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => setDocOpen(true)}><Plus size={13} /> Upload Document</button>
              </div>
            </div>
            <div className="border-t border-brand-100 p-4">
              <button className="btn-primary w-full" onClick={() => { setCommClient(detail.company); setCommOpen(true) }}>Open Communication History</button>
            </div>
          </div>
        </div>
      )}

      {/* New quotation modal */}
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="New Quotation">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client" className="col-span-2">
            <select className="input" value={quoteForm.company || ''} onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}>
              <option value="">Select client…</option>
              {state.clients.map((c) => <option key={c.id} value={c.company}>{c.company}</option>)}
            </select>
          </Field>
          <Field label="Event Type"><input className="input" value={quoteForm.type || ''} onChange={(e) => setQuoteForm({ ...quoteForm, type: e.target.value })} placeholder="Product Launch" />{errors.type && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.type}</p>}</Field>
          <Field label="Amount (ETB)"><input type="number" className="input" value={quoteForm.amount || ''} onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Status"><select className="input" value={quoteForm.status || 'draft'} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setQuoteOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitQuote}>Create Quotation</button>
        </div>
      </Modal>

      {/* New contract modal */}
      <Modal open={contractOpen} onClose={() => setContractOpen(false)} title="New Contract" width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client *" className="col-span-2">
            <select className="input" value={contractForm.clientId || ''} onChange={(e) => setContractForm({ ...contractForm, clientId: e.target.value })}>
              <option value="">Select client…</option>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
          </Field>
          <Field label="Event">
            <select className="input" value={contractForm.eventId || ''} onChange={(e) => setContractForm({ ...contractForm, eventId: e.target.value })}>
              <option value="">—</option>
              {state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </Field>
          <Field label="Value (ETB)"><input type="number" className="input" value={contractForm.value || ''} onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })} />{errors.value && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.value}</p>}</Field>
          <Field label="Start Date"><input type="date" className="input" value={contractForm.startDate || ''} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />{errors.startDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.startDate}</p>}</Field>
          <Field label="End Date"><input type="date" className="input" value={contractForm.endDate || ''} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />{errors.endDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.endDate}</p>}</Field>
          <Field label="Notes" className="col-span-2"><input className="input" value={contractForm.notes || ''} onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })} placeholder="Scope of work…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setContractOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitContract}>Create Contract</button>
        </div>
      </Modal>

      {/* Upload document modal */}
      <Modal open={docOpen} onClose={() => setDocOpen(false)} title={`Upload Document — ${detail?.company || ''}`} width="max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <Field label="File Name *" className="col-span-2"><input className="input" value={docForm.name || ''} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} placeholder="e.g. Signed MOU.pdf" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Type"><select className="input" value={docForm.ext || 'PDF'} onChange={(e) => setDocForm({ ...docForm, ext: e.target.value })}><option>PDF</option><option>DOCX</option><option>XLSX</option><option>ZIP</option><option>PNG</option></select></Field>
          <Field label="Size"><input className="input" value={docForm.size || ''} onChange={(e) => setDocForm({ ...docForm, size: e.target.value })} placeholder="980 KB" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDocOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitDoc}><Plus size={14} /> Attach</button>
        </div>
      </Modal>

      {/* Filter modal */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Clients" width="max-w-md">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Pipeline Stage">
            <select className="input" value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
              <option value="">All stages</option>
              {pipelineStages.map((s) => <option key={s} value={s}>{pipelineLabels[s]}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Industry">
            <select className="input" value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })}>
              <option value="">All industries</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-between">
          <button className="btn-ghost !text-red-600" onClick={() => { resetFilters(); setFilterOpen(false); show('Filters cleared') }}>Clear filters</button>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => setFilterOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setFilterOpen(false); show(`Showing ${filtered.length} client(s)`) }}>Apply Filters</button>
          </div>
        </div>
      </Modal>

      {/* Communication history modal */}
      <Modal open={commOpen} onClose={() => setCommOpen(false)} title={`Communication History${commClient ? ` — ${commClient}` : ''}`} width="max-w-lg">
        <div className="divide-y divide-brand-50">
          {(commClient ? commLog.filter((c) => c.client === commClient) : commLog).map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                {c.channel === 'Email' ? <Mail size={16} /> : c.channel === 'Phone' ? <Phone size={16} /> : <MessageSquare size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-brand-950">{c.subject}</p>
                <p className="text-xs text-ink/45">{c.client} · from {c.from} · via {c.channel}</p>
              </div>
              <span className="text-xs text-ink/35">{c.date}</span>
            </div>
          ))}
          {commClient && commLog.filter((c) => c.client === commClient).length === 0 && (
            <p className="py-8 text-center text-sm text-ink/40">No recorded communication for {commClient} yet.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary" onClick={() => { setCommOpen(false); show('New message drafted') }}><MessageSquare size={14} /> New Message</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}

function uid() {
  return 'qt-' + Math.random().toString(36).slice(2, 8)
}

function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
}
