import React, { useMemo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Download, File, Image, FileCheck, FileSpreadsheet, Search, Upload, Plus, X, CheckCircle2 } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { exportTableToPDF } from '../../store/exportUtils'
import { Toast } from '../../components/ui'

const DOC_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'contract', label: 'Contracts' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'layout', label: 'Layouts' },
  { key: 'report', label: 'Reports' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'file', label: 'General Files' },
]

const MOCK_DOCS_FALLBACK = [
  { id: 'd1', eventId: 'ev1', name: 'Service Contract - EthFinTech Summit.pdf', category: 'contract', size: '2.4 MB', date: '2026-07-15', url: '' },
  { id: 'd2', eventId: 'ev1', name: 'Quotation - Venue & Catering.pdf', category: 'quotation', size: '1.1 MB', date: '2026-07-10', url: '' },
  { id: 'd3', eventId: 'ev1', name: 'Invoice INV-2026-0141.pdf', category: 'invoice', size: '340 KB', date: '2026-07-15', url: '' },
  { id: 'd4', eventId: 'ev1', name: 'Floor Plan - Millennium Hall.pdf', category: 'layout', size: '3.2 MB', date: '2026-07-20', url: '' },
  { id: 'd5', eventId: 'ev1', name: 'Event Layout Design.png', category: 'layout', size: '5.8 MB', date: '2026-07-22', url: '' },
  { id: 'd6', eventId: 'ev1', name: 'Post-Event Report 2025.pdf', category: 'report', size: '1.5 MB', date: '2025-09-01', url: '' },
  { id: 'd7', eventId: 'ev1', name: 'Insurance Certificate.pdf', category: 'certificate', size: '890 KB', date: '2026-07-18', url: '' },
]

const CATEGORY_ICONS = {
  contract: FileCheck,
  quotation: FileSpreadsheet,
  invoice: FileText,
  layout: Image,
  report: FileText,
  certificate: FileCheck,
  file: File,
}

export default function ClientDocuments() {
  const { state, uploadDocument } = useData()
  const clientId = state.currentUserId
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    category: 'contract',
    eventId: '',
    fileData: '',
    fileSize: '',
    mimeType: '',
  })

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (showUpload) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showUpload])

  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])
  const myEventIds = useMemo(() => new Set(myEvents.map((e) => e.id)), [myEvents])

  // Combine real Supabase documents with fallbacks
  const allDocs = useMemo(() => {
    const list = []
    // 1. Supabase documents
    ;(state.documents || []).forEach((d) => {
      const isMine = d.entityId === clientId || myEventIds.has(d.entityId) || d.uploadedBy === clientId
      if (isMine) {
        list.push({
          id: d.id,
          eventId: d.entityId,
          name: d.name,
          category: d.type || 'file',
          size: d.size ? (d.size > 1024 * 1024 ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(d.size / 1024)} KB`) : '-',
          date: d.createdAt ? d.createdAt.split('T')[0] : 'Recently',
          url: d.url || '',
        })
      }
    })

    // 2. Client docs from state
    ;(state.clientDocs || []).forEach((d) => {
      if (d.clientId === clientId) {
        list.push({
          id: d.id,
          eventId: null,
          name: d.name,
          category: 'contract',
          size: d.size || '-',
          date: '2026-07-15',
          url: '',
        })
      }
    })

    // 3. Fallbacks if list is empty
    if (list.length === 0) {
      return MOCK_DOCS_FALLBACK.filter((d) => myEventIds.has(d.eventId) || !d.eventId)
    }

    return list
  }, [state.documents, state.clientDocs, clientId, myEventIds])

  const docs = useMemo(() => {
    let filtered = allDocs
    if (filter !== 'all') filtered = filtered.filter((d) => d.category === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(q))
    }
    return filtered
  }, [allDocs, filter, search])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      show('File must be under 10MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        name: prev.name || file.name,
        fileData: reader.result,
        fileSize: file.size,
        mimeType: file.type,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      show('Document title is required', 'error')
      return
    }
    setUploading(true)
    try {
      await uploadDocument({
        name: form.name.trim(),
        type: form.category,
        module: 'clients',
        entityId: form.eventId || clientId,
        mimeType: form.mimeType || 'application/pdf',
        size: Number(form.fileSize) || 0,
        url: form.fileData || '',
        uploadedBy: clientId,
      })
      show('Document uploaded successfully to Supabase!')
      setShowUpload(false)
      setForm({ name: '', category: 'contract', eventId: '', fileData: '', fileSize: '', mimeType: '' })
    } catch (err) {
      show(`Upload failed: ${err.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (doc, evt) => {
    if (doc.url && doc.url.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = doc.url
      a.download = doc.name
      a.click()
    } else if (doc.url) {
      window.open(doc.url, '_blank')
    } else {
      exportTableToPDF(
        `${doc.name.replace(/\.[^/.]+$/, '')}`,
        `Document Metadata: ${doc.name}`,
        ['Field', 'Value'],
        [
          ['Document', doc.name],
          ['Category', doc.category],
          ['Event', evt?.name || '-'],
          ['File Size', doc.size],
          ['Date', doc.date],
        ],
        { orientation: 'portrait', subtitle: 'Client Document Registry — Amen Event Organizer' }
      )
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-brand-950">Documents</h1>
          <p className="text-sm text-ink/50">Download contracts, quotations, layouts and reports stored in Supabase</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Upload Document
        </button>
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
                  <p className="truncate text-sm font-bold text-brand-950" title={doc.name}>{doc.name}</p>
                  <p className="text-[11px] text-ink/45">{evt?.name || 'Company Document'} · {doc.size} · {doc.date}</p>
                </div>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 text-brand-700 transition hover:bg-brand-50"
                  onClick={() => handleDownload(doc, evt)}
                  title="Download / View"
                >
                  <Download size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 overflow-y-auto" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-md my-auto rounded-2xl bg-white p-6 shadow-2xl z-10 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-brand-950">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 hover:bg-brand-50">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink/60">Document Title *</label>
                <input
                  className="input"
                  placeholder="e.g. Identity Proof / Floor Plan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink/60">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="contract">Contract</option>
                    <option value="quotation">Quotation</option>
                    <option value="layout">Layout / Floor Plan</option>
                    <option value="certificate">Certificate</option>
                    <option value="file">General File</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-ink/60">Related Event</label>
                  <select
                    className="input"
                    value={form.eventId}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  >
                    <option value="">Company General</option>
                    {myEvents.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink/60">File Attachment</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="input !py-2 text-xs"
                />
                <p className="mt-1 text-[11px] text-ink/40">Max size: 10MB (PDF, PNG, JPG, XLSX)</p>
              </div>

              <button
                type="submit"
                disabled={uploading || !form.name.trim()}
                className="btn-primary w-full mt-2"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Uploading to Supabase…
                  </span>
                ) : (
                  <><Upload size={16} /> Save Document</>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      <Toast toast={toast} />
    </div>
  )
}
