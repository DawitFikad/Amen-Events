import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, Building2, FileText, Phone, Mail, MapPin, Plus, Filter, StickyNote,
  MessageSquare, ShieldCheck, Eye, ArrowRight, Upload, Globe, Link, Trash2, Info,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, SearchBox, Avatar, Modal, ConfirmModal, Field, EmptyState, Toast, Th, Td, StatCard } from '../components/ui'
import { fmt, todayISO } from '../store/data'
import { exportTableToPDF } from '../store/exportUtils'
import { required, nameOnly, emailValid, phoneValid, textRequired, numberPositive, dateRequired, dateRange, optional, validate } from '../store/validation'

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

const pipelineStages = ['lead', 'opportunity', 'quotation', 'negotiation', 'contract', 'Other']
const pipelineLabels = { lead: 'Lead', opportunity: 'Opportunity', quotation: 'Quotation', negotiation: 'Negotiation', contract: 'Contract', Other: 'Other' }

export default function CRM() {
  const { state, addClient, updateClient, deleteClient, patchBy, patch, logActivity, intent, clearIntent, addContract, updateContractStatus, addClientDoc, setDemoFlag } = useData()
  const [tab, setTab] = useState('clients')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [clientStep, setClientStep] = useState(1)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
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
    website: [optional((v) => {
      const s = String(v || '').trim()
      if (!s) return ''
      const ok = /^https?:\/\/[^\s]+\.[^\s]+/.test(s) || /^(www\.)?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(\/(\S)*)?$/.test(s)
      return ok ? '' : 'Enter a valid website (e.g. https://company.com)'
    })],
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
    exportTableToPDF(
      'clients-directory',
      'Client & Partner Directory Report',
      ['Company', 'Contact Person', 'Role', 'Industry', 'City', 'Pipeline Stage', 'Status', 'Email', 'Phone', 'Value (ETB)'],
      filtered.map((c) => [c.company, c.contactPerson, c.role, c.industry, c.city, pipelineLabels[c.stage] || c.stage, c.status, c.email, c.phone, c.totalValue]),
      { rightAlignCols: [9], subtitle: `Pipeline: ${filters.stage ? pipelineLabels[filters.stage] : 'All Stages'}  ·  Filtered: ${filtered.length} clients` }
    )
    show(`Exported ${filtered.length} client(s) to PDF`)
  }

  const pipeline = pipelineStages.map((st) => ({
    stage: st,
    items: state.clients.filter((c) => c.stage === st),
  }))

  const submit = async () => {
    const res = validate(form, clientSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    const client = await addClient(form)
    const docs = form.docs || []
    for (const d of docs) {
      await addClientDoc(client.id, d.name, d.ext || 'PDF', d.size || '-', { type: d.type || 'company_doc', sizeBytes: d.sizeBytes, mimeType: d.mimeType })
    }
    show(`Client "${form.company}" created - added to pipeline${docs.length ? ` with ${docs.length} document(s)` : ''}`)
    setOpen(false); setClientStep(1); setForm({}); setErrors({}); clearIntent()
  }

  const openClientWizard = () => { setOpen(true); setClientStep(1); setForm({}); setErrors({}) }
  const closeClientWizard = () => { setOpen(false); setClientStep(1); setForm({}); setErrors({}) }

  const handleClientNext = () => {
    if (clientStep === 1) {
      const res = validate(form, { company: [textRequired('Company name', { max: 120 })] })
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    } else if (clientStep === 2) {
      const res = validate(form, { contactPerson: [nameOnly('Contact person')], phone: [phoneValid('Phone')], email: [emailValid('Email')] })
      if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    }
    setErrors({})
    setClientStep((s) => Math.min(s + 1, 4))
  }

  const handleClientBack = () => setClientStep((s) => Math.max(s - 1, 1))

  const detail = view && state.clients.find((c) => c.id === view.id)
  const detailEvents = state.events.filter((e) => e.clientId === view?.id)
  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setForm((f) => ({ ...f, photo: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const openEdit = () => {
    setEditForm({ ...detail, role: detail.role || detail.contactRole || '', contactPerson: detail.contactPerson || '' })
    setErrors({})
    setEditOpen(true)
  }

  const editSave = async () => {
    const res = validate(editForm, clientSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    setErrors({})
    setConfirmEditOpen(true)
  }

  const handleConfirmEdit = async () => {
    setConfirmEditOpen(false)
    await updateClient(detail.id, { ...editForm, contactRole: editForm.role || editForm.contactRole || '' })
    show(`Client "${editForm.company}" updated`)
    setEditOpen(false); setEditForm({}); setErrors({})
  }

  const handleConfirmDelete = () => {
    setDeleteConfirmOpen(false)
    if (deleteClient) deleteClient(detail.id)
    else patch('clients', (list) => list.filter((c) => c.id !== detail.id))
    logActivity(`Deleted client "${detail.company}"`, 'crm')
    show(`Client "${detail.company}" deleted`)
    setView(null)
  }

  const onEditPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setEditForm((f) => ({ ...f, photo: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onDocs = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const added = files.map((file) => ({
      id: 'dft-' + Math.random().toString(36).slice(2, 8),
      name: file.name,
      ext: (file.name.split('.').pop() || 'PDF').toUpperCase(),
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB',
      sizeBytes: file.size,
      mimeType: file.type || '',
      type: 'company_doc',
    }))
    setForm((f) => ({ ...f, docs: [...(f.docs || []), ...added] }))
    e.target.value = ''
  }

  const removeSelectedDoc = (id) => {
    setForm((f) => ({ ...f, docs: (f.docs || []).filter((d) => d.id !== id) }))
  }

  const onDocFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocForm({
      name: file.name,
      ext: (file.name.split('.').pop() || 'PDF').toUpperCase(),
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB',
      sizeBytes: file.size,
      mimeType: file.type || '',
    })
    e.target.value = ''
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
    setDemoFlag('quoteCreated', true)
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
    show(`Contract ${ct.ref} signed - client moved to Contract`)
  }

  const submitDoc = () => {
    const res = validate(docForm, docSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addClientDoc(detail.clientId, docForm.name, docForm.ext || 'PDF', docForm.size || '-', { sizeBytes: docForm.sizeBytes, mimeType: docForm.mimeType, type: 'company_doc' })
    show(`Document "${docForm.name}" attached`)
    setDocOpen(false); setDocForm({}); setErrors({})
  }

  useEffect(() => {
    if (detail) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [detail])

  useEffect(() => {
    if (!intent) return
    if (state.demo.autoplay) {
      if (intent === 'new-client') {
        const seed = { company: 'Habesha Agro PLC', contactPerson: 'Lensa Tesfaye', phone: '+251 919 220 331', email: 'lensa@habeshaagro.et', industry: 'Construction', city: 'Addis Ababa', stage: 'lead' }
        setOpen(true); setForm(seed); setErrors({}); setTab('clients')
        setTimeout(() => { addClient(seed); show('Client profile created automatically'); setOpen(false); setForm({}) }, 1100)
      }
      if (intent === 'new-quote') {
        const company = state.clients.find((c) => c.id === state.demo.lastClientId)?.company || state.clients[0]?.company || 'Amen Client'
        const seed = { company, type: 'Corporate Gala', amount: '850000', status: 'draft' }
        setQuoteOpen(true); setQuoteForm(seed); setErrors({}); setTab('quotations')
        setTimeout(() => {
          setQuotes((q) => [{ id: 'qtp-' + Math.random().toString(36).slice(2, 8), ref: 'QUO-' + String(1000 + q.length + 1), company, type: seed.type, amount: 850000, date: todayISO(), status: 'draft' }, ...q])
          setDemoFlag('quoteCreated', true); setQuoteOpen(false); setQuoteForm({})
        }, 1100)
      }
      if (intent === 'new-contract') {
        const seed = { clientId: state.demo.lastClientId || 'cl1', eventId: '', value: '1250000', startDate: todayISO(), endDate: '2026-12-31', notes: 'Full production & design scope' }
        setContractOpen(true); setContractForm(seed); setErrors({}); setTab('clients')
        setTimeout(() => { addContract(seed); show('Contract drafted automatically'); setContractOpen(false); setContractForm({}) }, 1100)
      }
    } else {
      if (intent === 'new-client') { openClientWizard(); setTab('clients') }
      if (intent === 'new-quote') { setQuoteOpen(true); setQuoteForm({}); setErrors({}); setTab('quotations') }
      if (intent === 'new-contract') { setContractOpen(true); setContractForm({ clientId: state.demo.lastClientId || '' }); setErrors({}); setTab('clients') }
    }
    if (intent) clearIntent()
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
            <button className="btn-outline" onClick={exportClients}><FileText size={15} /> Export PDF</button>
            <button className="btn-primary" onClick={openClientWizard}><Plus size={15} /> New Client</button>
          </>
        }
      />

      {/* Live stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Clients" value={state.clients.length} icon={Building2} tone="brand" sub="registered accounts" />
        <StatCard label="Active Clients" value={state.clients.filter((c) => c.status === 'active').length} icon={Users} tone="brand" sub="in current pipeline" />
        <StatCard label="Inquiries" value={convList.length} icon={StickyNote} tone="gold" sub="prospects" />
        <StatCard label="Contracts" value={state.contracts.filter((c) => c.status === 'active' || c.status === 'signed').length} icon={ShieldCheck} tone="brand" sub="active & signed" />
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[
          ['clients', `Client Database (${state.clients.length})`, Building2],
          ['pipeline', 'Pipeline', ArrowRight],
          ['inquiries', `Inquiries (${convList.length})`, StickyNote],
          ['quotations', `Quotations (${quotes.length})`, FileText],
          ['contracts', `Contracts (${state.contracts.length})`, ShieldCheck],
          ['comms', 'Communication', MessageSquare],
        ].map(([v, l, I]) => (
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
                    <Td className="font-semibold text-brand-950">{c.totalValue ? fmt(c.totalValue) : '-'}</Td>
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
                      <Td className="text-ink/60">{ev?.name || '-'}</Td>
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

      {/* New client 4-Step Wizard */}
      <Modal
        open={open}
        onClose={closeClientWizard}
        title="Register New Client"
        width="max-w-2xl"
        dirty={Boolean(form.company || form.contactPerson || form.email || form.phone || clientStep > 1)}
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/60">
            <span className={clientStep >= 1 ? 'text-brand-700' : ''}>1. Corporate Identity (25%)</span>
            <span className={clientStep >= 2 ? 'text-brand-700' : ''}>2. Key Contacts (50%)</span>
            <span className={clientStep >= 3 ? 'text-brand-700' : ''}>3. Commercial Profile (75%)</span>
            <span className={clientStep >= 4 ? 'text-brand-700' : ''}>4. Documents & Review (100%)</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: clientStep === 1 ? '25%' : clientStep === 2 ? '50%' : clientStep === 3 ? '75%' : '100%', background: 'linear-gradient(90deg, #188A2E, #39D353)' }}
            />
          </div>
        </div>

        {/* STEP 1: Corporate Identity */}
        {clientStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Building2 size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Corporate Identity & Industry</p>
                <p className="text-[11px] text-ink/55">Company profile, industry sector, TIN and address.</p>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                {form.photo ? <img src={form.photo} alt="Client" className="h-full w-full object-cover" /> : <Upload size={24} className="text-brand-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-950">Company Logo</p>
                <p className="text-xs text-ink/50">Upload a company logo or representative image (JPG, PNG, max 5MB).</p>
                <div className="mt-2 flex gap-2">
                  <label className="btn-outline !py-1.5 cursor-pointer text-xs"><Upload size={14} /> Choose image<input type="file" accept="image/*" className="hidden" onChange={onPhoto} /></label>
                  {form.photo && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setForm((f) => ({ ...f, photo: '' }))}><Trash2 size={13} /> Remove</button>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company Name *" className="col-span-2">
                <input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Walia Telecom" />
                {errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}
              </Field>
              <Field label="Industry">
                <select className="input" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                  <option value="">Select…</option>
                  {['Financial Services','Telecommunications','Healthcare','Banking','Education','Hospitality','Construction','Technology','Retail & Consumer Goods','Manufacturing','Energy & Utilities','Agriculture','Media & Entertainment','Government','Nonprofit / NGO','Transportation & Logistics','Mining','Pharmaceuticals','Insurance','Legal Services','Real Estate','Travel & Tourism','Other'].map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Tax ID (TIN)">
                <input className="input font-mono" value={form.taxId || ''} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="e.g. ET-ABC-2020-12345" />
              </Field>
              <Field label="City">
                <input className="input" value={form.city || 'Addis Ababa'} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Website">
                <div className="relative"><Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://company.com" /></div>
                {errors.website && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.website}</p>}
              </Field>
              <Field label="Street Address" className="col-span-2">
                <div className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, building, city" /></div>
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={closeClientWizard}>Cancel</button>
              <button className="btn-primary" onClick={handleClientNext}>Next: Key Contacts →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Key Contacts & Communication */}
        {clientStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Users size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Key Contacts & Communication Channels</p>
                <p className="text-[11px] text-ink/55">Primary and secondary contacts for all client communications.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Person *" className="col-span-2">
                <input className="input" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Selamawit Desta" />
                {errors.contactPerson && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contactPerson}</p>}
              </Field>
              <Field label="Role / Title">
                <input className="input" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Events Director" />
              </Field>
              <Field label="Phone *">
                <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 911 000 000" />
                {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}
              </Field>
              <Field label="Email *">
                <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@company.com" />
                {errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}
              </Field>
              <Field label="Secondary Contact Name">
                <input className="input" value={form.contact2 || ''} onChange={(e) => setForm({ ...form, contact2: e.target.value })} placeholder="Backup contact person" />
              </Field>
              <Field label="Secondary Phone">
                <input className="input" value={form.phone2 || ''} onChange={(e) => setForm({ ...form, phone2: e.target.value })} placeholder="+251 9XX XXX XXX" />
              </Field>
              <Field label="Preferred Channel">
                <select className="input" value={form.preferredChannel || 'Email'} onChange={(e) => setForm({ ...form, preferredChannel: e.target.value })}>
                  <option>Email</option><option>Phone</option><option>WhatsApp</option><option>Telegram</option><option>In Person</option>
                </select>
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleClientBack}>← Back</button>
              <button className="btn-primary" onClick={handleClientNext}>Next: Commercial Profile →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Commercial Profile & Engagement */}
        {clientStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><StickyNote size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Commercial Profile & Engagement</p>
                <p className="text-[11px] text-ink/55">Pipeline, annual budget, event frequency, and terms.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pipeline Stage">
                <select className="input" value={form.stage || 'lead'} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  {pipelineStages.map((s) => <option key={s} value={s}>{pipelineLabels[s]}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="prospect">Prospect</option>
                </select>
              </Field>
              <Field label="Annual Event Budget (ETB)">
                <input type="number" className="input" value={form.annualBudget || ''} onChange={(e) => setForm({ ...form, annualBudget: e.target.value })} placeholder="e.g. 2000000" />
              </Field>
              <Field label="Events Per Year">
                <input type="number" className="input" value={form.eventFrequency || ''} onChange={(e) => setForm({ ...form, eventFrequency: e.target.value })} placeholder="e.g. 4" />
              </Field>
              <Field label="Payment Terms">
                <select className="input" value={form.paymentTerms || 'Net 30'} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
                  <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Advance Full</option><option>50% Advance</option>
                </select>
              </Field>
              <Field label="Client Value (ETB)">
                <input type="number" className="input" value={form.totalValue || ''} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} placeholder="Estimated total contract value" />
              </Field>
              <Field label="Strategic Notes" className="col-span-2">
                <textarea className="input min-h-[70px] resize-y" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Background, preferences, history, special requirements…" />
              </Field>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleClientBack}>← Back</button>
              <button className="btn-primary" onClick={handleClientNext}>Next: Documents & Review →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Documents, Verification & Review */}
        {clientStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><ShieldCheck size={20} /></span>
              <div>
                <p className="text-xs font-bold text-brand-950">Documents, Verification & Final Review</p>
                <p className="text-[11px] text-ink/55">Attach supporting documents and confirm the registration.</p>
              </div>
            </div>
            {/* Document upload */}
            <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 py-5 text-center transition hover:border-brand-400 hover:bg-brand-50">
              <Upload size={20} className="text-brand-500" />
              <span className="text-xs font-bold text-brand-700">Attach Registration Documents</span>
              <span className="text-[11px] text-ink/45">Contracts, company profile, TIN certificate, licenses (multiple files)</span>
              <input type="file" multiple className="hidden" onChange={onDocs} />
            </label>
            {(form.docs || []).length > 0 && (
              <div className="space-y-1.5">
                {(form.docs || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-brand-100 bg-white px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink/80"><FileText size={14} className="shrink-0 text-brand-600" /><span className="truncate">{d.name}</span></span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="chip bg-brand-50 text-brand-800">{d.ext} · {d.size}</span>
                      <button onClick={() => removeSelectedDoc(d.id)} className="rounded-md p-1 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2">Corporate Identity</p>
                <p className="text-sm font-bold text-brand-950">{form.company}</p>
                <p className="text-xs text-ink/60">{form.industry || 'Industry not set'}</p>
                {form.city && <p className="text-xs text-ink/50 mt-0.5">{form.city}</p>}
                {form.taxId && <p className="text-xs font-mono text-ink/40 mt-0.5">{form.taxId}</p>}
              </div>
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2">Key Contact</p>
                <p className="text-sm font-bold text-brand-950">{form.contactPerson}</p>
                {form.role && <p className="text-xs text-ink/60">{form.role}</p>}
                <p className="text-xs text-ink/55 mt-1">{form.phone}</p>
                <p className="text-xs text-ink/45">{form.email}</p>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-[10px] text-ink/45 block">Stage</span><span className="font-semibold capitalize">{form.stage || 'lead'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Payment Terms</span><span className="font-semibold">{form.paymentTerms || 'Net 30'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Annual Budget</span><span className="font-semibold">{form.annualBudget ? `ETB ${Number(form.annualBudget).toLocaleString()}` : '-'}</span></div>
                  <div><span className="text-[10px] text-ink/45 block">Documents</span><span className="font-semibold">{(form.docs || []).length} attached</span></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
              <button className="btn-outline" onClick={handleClientBack}>← Back</button>
              <button className="btn-primary !px-6" onClick={submit}><ShieldCheck size={16} /> Create Client Profile</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit client modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Client Profile"
        width="max-w-2xl"
        dirty={Boolean(editForm.company !== detail?.company || editForm.contactPerson !== detail?.contactPerson || editForm.email !== detail?.email || editForm.phone !== detail?.phone)}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
            {editForm.photo
              ? <img src={editForm.photo} alt="Client" className="h-full w-full object-cover" />
              : <span className="text-xl font-black text-brand-400"><Upload size={24} /></span>}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-950">Company Logo / Photo</p>
            <p className="text-xs text-ink/50">Update the logo or representative image (JPG, PNG - max 5MB).</p>
            <div className="mt-2 flex gap-2">
              <label className="btn-outline !py-1.5 cursor-pointer text-xs">
                <Upload size={14} /> Change image
                <input type="file" accept="image/*" className="hidden" onChange={onEditPhoto} />
              </label>
              {editForm.photo && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setEditForm((f) => ({ ...f, photo: '' }))}><Trash2 size={13} /> Remove</button>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company Name *"><input className="input" value={editForm.company || ''} onChange={(e) => { setEditForm({ ...editForm, company: e.target.value }); if (errors.company) setErrors({ ...errors, company: undefined }) }} />{errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}</Field>
          <Field label="Industry"><select className="input" value={editForm.industry || ''} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}><option value="">Select…</option><option>Financial Services</option><option>Telecommunications</option><option>Healthcare</option><option>Banking</option><option>Education</option><option>Hospitality</option><option>Construction</option><option>Technology</option><option>Retail & Consumer Goods</option><option>Manufacturing</option><option>Energy & Utilities</option><option>Agriculture</option><option>Media & Entertainment</option><option>Government</option><option>Nonprofit / NGO</option><option>Transportation & Logistics</option><option>Mining</option><option>Pharmaceuticals</option><option>Insurance</option><option>Legal Services</option><option>Real Estate</option><option>Travel & Tourism</option><option>Other</option></select></Field>
          <Field label="Contact Person *"><input className="input" value={editForm.contactPerson || ''} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} />{errors.contactPerson && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contactPerson}</p>}</Field>
          <Field label="Role"><input className="input" value={editForm.role || ''} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} placeholder="Events Director" /></Field>
          <Field label="Phone *"><input className="input" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+251 911 000 000" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Email *"><input className="input" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="contact@company.com" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
          <Field label="City"><input className="input" value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></Field>
          <Field label="Pipeline Stage"><select className="input" value={editForm.stage || 'lead'} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}>{pipelineStages.map((s) => <option key={s} value={s}>{pipelineLabels[s]}</option>)}</select></Field>
        </div>

        <p className="mt-5 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><Info size={13} /> Additional Details</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Website"><div className="relative"><Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={editForm.website || ''} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://company.com" /></div>{errors.website && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.website}</p>}</Field>
          <Field label="Tax ID (TIN)"><input className="input" value={editForm.taxId || ''} onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })} placeholder="e.g. ET-ABC-2020-12345" /></Field>
          <Field label="Street Address" className="col-span-2"><div className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Street, building, city" /></div></Field>
          <Field label="Notes" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Background, preferences, requirements…" /></Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      {/* Delete Client Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${detail?.company}"? All client information, quotations, and contract records will be permanently removed.`}
        confirmText="Delete Client"
        confirmTone="danger"
      />

      {/* Edit Client Confirmation Modal */}
      <ConfirmModal
        open={confirmEditOpen}
        onClose={() => setConfirmEditOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Save Changes to Client"
        message={`Are you sure you want to update "${editForm.company || detail?.company}"?`}
        confirmText="Apply Changes"
        confirmTone="primary"
      />

      {/* Client detail drawer */}
      {detail && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="fixed inset-0 bg-brand-950/30 backdrop-blur-[1px] transition-opacity" onClick={() => setView(null)} />
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-pop z-10 animate-fade-in">
            <div className="bg-brand-900 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {detail.photo
                    ? <img src={detail.photo} alt={detail.company} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-gold-400" />
                    : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 text-lg font-black text-brand-950">{detail.logo}</span>}
                  <div>
                    <h3 className="text-lg font-bold">{detail.company}</h3>
                    <p className="text-sm text-brand-200">{detail.industry} · {detail.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-gold !px-3 !py-1.5 text-xs" onClick={openEdit}>Edit Profile</button>
                  <button className="rounded-lg border border-red-400/40 bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-100 hover:bg-red-500/30 transition flex items-center gap-1" onClick={() => setDeleteConfirmOpen(true)} title="Delete Client"><Trash2 size={13} /> Delete</button>
                  <button onClick={() => setView(null)} className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10"><XIcon /></button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-200">
                <Badge status={detail.status} label={detail.status} />
                <Badge status={detail.stage} label={pipelineLabels[detail.stage]} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Contact Person</p><p className="mt-1 text-sm font-semibold">{detail.contactPerson}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Role</p><p className="mt-1 text-sm font-semibold">{detail.contactRole || detail.role}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Phone</p><p className="mt-1 text-sm font-semibold">{detail.phone}</p></div>
                <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Email</p><p className="mt-1 truncate text-sm font-semibold">{detail.email}</p></div>
                {detail.website && <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Website</p><p className="mt-1 flex items-center gap-1 truncate text-sm font-semibold text-brand-700"><Link size={13} className="shrink-0" /> {detail.website}</p></div>}
                {detail.taxId && <div className="rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Tax ID</p><p className="mt-1 font-mono text-sm font-semibold">{detail.taxId}</p></div>}
                {detail.address && <div className="col-span-2 rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Street Address</p><p className="mt-1 flex items-center gap-1 text-sm font-semibold"><MapPin size={13} className="shrink-0 text-ink/40" /> {detail.address}</p></div>}
                {detail.notes && <div className="col-span-2 rounded-xl border border-brand-100 p-3"><p className="text-[11px] font-semibold text-ink/40">Notes</p><p className="mt-1 text-sm text-ink/75">{detail.notes}</p></div>}
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
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink/70"><ShieldCheck size={15} className="shrink-0 text-brand-600" /><span className="truncate">{d.name}</span></span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="chip bg-brand-50 text-brand-800">{d.ext}</span>
                      <button className="rounded-md p-1 text-ink/40 hover:bg-red-50 hover:text-red-600" onClick={() => { patch('clientDocs', (l) => l.filter((x) => x.id !== d.id)); show(`Removed ${d.name}`) }}><Trash2 size={14} /></button>
                    </span>
                  </div>
                ))}
                <button className="mt-2 w-full rounded-lg border border-dashed border-brand-200 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => setDocOpen(true)}><Plus size={13} /> Upload Document</button>
              </div>
            </div>
            <div className="border-t border-brand-100 p-4">
              <button className="btn-primary w-full" onClick={() => { setCommClient(detail.company); setCommOpen(true) }}>Open Communication History</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* New quotation modal */}
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="New Quotation">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client *" className="col-span-2">
            <select className="input" value={quoteForm.company || ''} onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}>
              <option value="">Select client…</option>
              {state.clients.map((c) => <option key={c.id} value={c.company}>{c.company}</option>)}
            </select>
            {errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}
          </Field>
          <Field label="Event Type *"><input className="input" value={quoteForm.type || ''} onChange={(e) => setQuoteForm({ ...quoteForm, type: e.target.value })} placeholder="Product Launch" />{errors.type && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.type}</p>}</Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={quoteForm.amount || ''} onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Status"><select className="input" value={quoteForm.status || 'draft'} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option><option value="Other">Other</option></select></Field>
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
              <option value="">-</option>
              {state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </Field>
          <Field label="Value (ETB) *"><input type="number" className="input" value={contractForm.value || ''} onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })} />{errors.value && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.value}</p>}</Field>
          <Field label="Start Date *"><input type="date" className="input" value={contractForm.startDate || ''} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />{errors.startDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.startDate}</p>}</Field>
          <Field label="End Date *"><input type="date" className="input" value={contractForm.endDate || ''} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />{errors.endDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.endDate}</p>}</Field>
          <Field label="Notes" className="col-span-2"><input className="input" value={contractForm.notes || ''} onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })} placeholder="Scope of work…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setContractOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitContract}>Create Contract</button>
        </div>
      </Modal>

      {/* Upload document modal */}
      <Modal open={docOpen} onClose={() => setDocOpen(false)} title={`Upload Document - ${detail?.company || ''}`} width="max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 py-5 text-center transition hover:border-brand-400 hover:bg-brand-50">
            <Upload size={18} className="text-brand-500" />
            <span className="text-xs font-bold text-brand-700">Choose a file to attach</span>
            <span className="text-[11px] text-ink/45">PDF, DOCX, XLSX, ZIP, PNG…</span>
            <input type="file" className="hidden" onChange={onDocFile} />
          </label>
          <Field label="File Name *" className="col-span-2"><input className="input" value={docForm.name || ''} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} placeholder="e.g. Signed MOU.pdf" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Type"><select className="input" value={docForm.ext || 'PDF'} onChange={(e) => setDocForm({ ...docForm, ext: e.target.value })}><option>PDF</option><option>DOCX</option><option>XLSX</option><option>ZIP</option><option>PNG</option><option>JPG</option><option>Other</option></select></Field>
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
      <Modal open={commOpen} onClose={() => setCommOpen(false)} title={`Communication History${commClient ? ` - ${commClient}` : ''}`} width="max-w-lg">
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
