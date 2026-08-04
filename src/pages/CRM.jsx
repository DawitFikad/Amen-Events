import React, { useState, useEffect } from 'react'
import {
  Users, Building2, FileText, Phone, Mail, MapPin, Plus, Filter, StickyNote,
  MessageSquare, ShieldCheck, Eye, ArrowRight,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, SearchBox, Avatar, Modal, Field, EmptyState, Toast, Th, Td } from '../components/ui'
import { fmt, todayISO } from '../store/data'

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
  const { state, addClient, patchBy, logActivity, intent, clearIntent } = useData()
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

  const show = (m, t = 'success') => {
    setToast({ message: m, type: t })
    setTimeout(() => setToast(null), 2600)
  }

  const filtered = state.clients.filter((c) => (c.company + c.contactPerson + c.industry).toLowerCase().includes(q.toLowerCase()))

  const pipeline = pipelineStages.map((st) => ({
    stage: st,
    items: state.clients.filter((c) => c.stage === st),
  }))

  const submit = () => {
    if (!form.company) { show('Company name is required', 'warn'); return }
    addClient(form)
    show(`Client "${form.company}" created — added to pipeline`)
    setOpen(false); setForm({}); clearIntent()
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
    if (!quoteForm.company) { show('Client is required', 'warn'); return }
    setQuotes((q) => [{ id: uid(), ref: 'QUO-' + String(1000 + q.length + 1), company: quoteForm.company, type: quoteForm.type || 'Event', amount: Number(quoteForm.amount) || 0, date: todayISO(), status: quoteForm.status || 'draft' }, ...q])
    setQuoteOpen(false); setQuoteForm({})
    show('Quotation created')
  }

  const detail = view && state.clients.find((c) => c.id === view.id)
  const detailEvents = state.events.filter((e) => e.clientId === view?.id)

  useEffect(() => {
    if (intent === 'new-client') { setOpen(true); setTab('clients') }
  }, [intent])

  return (
    <div>
      <PageHeader
        title="CRM & Client Management"
        subtitle="Pipeline, companies, inquiries and quotations in one place."
        icon={Users}
        actions={
          <>
            <button className="btn-outline"><Filter size={15} /> Filter</button>
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Client</button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['clients', 'Client Database', Building2], ['pipeline', 'Pipeline', ArrowRight], ['inquiries', 'Inquiries', StickyNote], ['quotations', 'Quotations', FileText], ['comms', 'Communication', MessageSquare]].map(([v, l, I]) => (
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
            <button className="btn-primary !py-1.5 text-xs" onClick={() => setQuoteOpen(true)}><Plus size={14} /> New Quotation</button>
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
          <Field label="Company Name *"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Walia Telecom" /></Field>
          <Field label="Industry"><select className="input" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })}><option value="">Select…</option><option>Financial Services</option><option>Telecommunications</option><option>Healthcare</option><option>Banking</option><option>Education</option><option>Hospitality</option><option>Construction</option></select></Field>
          <Field label="Contact Person"><input className="input" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></Field>
          <Field label="Role"><input className="input" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Events Director" /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
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

              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Client Documents</p>
              <div className="space-y-2">
                {[['Signed Contract · Contract_2026.pdf', 'PDF'], ['Requirements Brief · brief.pdf', 'PDF'], ['Brand Guidelines · brand.zip', 'ZIP']].map(([f, t]) => (
                  <div key={f} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                    <span className="flex items-center gap-2 text-sm text-ink/70"><ShieldCheck size={15} className="text-brand-600" /> {f}</span>
                    <span className="chip bg-brand-50 text-brand-800">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-brand-100 p-4">
              <button className="btn-primary w-full" onClick={() => { show('Opened communication history'); }}>Open Communication History</button>
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
          <Field label="Event Type"><input className="input" value={quoteForm.type || ''} onChange={(e) => setQuoteForm({ ...quoteForm, type: e.target.value })} placeholder="Product Launch" /></Field>
          <Field label="Amount (ETB)"><input type="number" className="input" value={quoteForm.amount || ''} onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={quoteForm.status || 'draft'} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setQuoteOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitQuote}>Create Quotation</button>
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
