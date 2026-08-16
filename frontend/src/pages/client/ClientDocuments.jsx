import React, { useMemo, useState } from 'react'
import { FileText, Download, File, Image, FileCheck, FileSpreadsheet, Search } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { downloadCSV } from '../../store/exportUtils'

const DOC_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'contract', label: 'Contracts' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'layout', label: 'Layouts' },
  { key: 'report', label: 'Reports' },
  { key: 'certificate', label: 'Certificates' },
]

const MOCK_DOCS = [
  { id: 'd1', eventId: 'ev1', name: 'Service Contract - EthFinTech Summit.pdf', category: 'contract', size: '2.4 MB', date: '2026-07-15' },
  { id: 'd2', eventId: 'ev1', name: 'Quotation - Venue & Catering.pdf', category: 'quotation', size: '1.1 MB', date: '2026-07-10' },
  { id: 'd3', eventId: 'ev1', name: 'Invoice INV-2026-0141.pdf', category: 'invoice', size: '340 KB', date: '2026-07-15' },
  { id: 'd4', eventId: 'ev1', name: 'Floor Plan - Millennium Hall.pdf', category: 'layout', size: '3.2 MB', date: '2026-07-20' },
  { id: 'd5', eventId: 'ev1', name: 'Event Layout Design.png', category: 'layout', size: '5.8 MB', date: '2026-07-22' },
  { id: 'd6', eventId: 'ev1', name: 'Post-Event Report 2025.pdf', category: 'report', size: '1.5 MB', date: '2025-09-01' },
  { id: 'd7', eventId: 'ev1', name: 'Insurance Certificate.pdf', category: 'certificate', size: '890 KB', date: '2026-07-18' },
  { id: 'd8', eventId: 'ev3', name: 'Retreat Contract.pdf', category: 'contract', size: '1.8 MB', date: '2026-07-01' },
  { id: 'd9', eventId: 'ev3', name: 'Budget Breakdown.xlsx', category: 'quotation', size: '420 KB', date: '2026-07-05' },
]

const CATEGORY_ICONS = {
  contract: FileCheck,
  quotation: FileSpreadsheet,
  invoice: FileText,
  layout: Image,
  report: FileText,
  certificate: FileCheck,
}

export default function ClientDocuments() {
  const { state } = useData()
  const clientId = state.currentUserId
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])
  const myEventIds = useMemo(() => new Set(myEvents.map((e) => e.id)), [myEvents])

  const docs = useMemo(() => {
    let filtered = MOCK_DOCS.filter((d) => myEventIds.has(d.eventId))
    if (filter !== 'all') filtered = filtered.filter((d) => d.category === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(q))
    }
    return filtered
  }, [myEventIds, filter, search])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Documents</h1>
        <p className="text-sm text-ink/50">Download contracts, quotations, layouts and reports</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input className="input pl-10" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {DOC_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
              filter === c.key ? 'bg-brand-600 text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Documents grid */}
      {docs.length === 0 ? (
        <div className="card p-10 text-center">
          <File size={40} className="mx-auto mb-3 text-ink/20" />
          <p className="text-sm font-semibold text-ink/50">No documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const Icon = CATEGORY_ICONS[doc.category] || File
            const evt = myEvents.find((e) => e.id === doc.eventId)
            return (
              <div key={doc.id} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-brand-950">{doc.name}</p>
                  <p className="text-[11px] text-ink/45">{evt?.name || '-'} · {doc.size} · {doc.date}</p>
                </div>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 text-brand-700 transition hover:bg-brand-50"
                  onClick={() => downloadCSV(`${doc.name.replace(/\.[^/.]+$/, '')}.csv`, ['Document', 'Category', 'Event', 'Size', 'Date'], [[doc.name, doc.category, evt?.name || '-', doc.size, doc.date]])}
                >
                  <Download size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
