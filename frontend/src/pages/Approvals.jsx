import React, { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, RotateCcw, FileText, DollarSign, Handshake,
  ShoppingBag, Wallet, Clock, Sparkles, ArrowRight,
} from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Avatar, Toast } from '../components/ui'
import { fmtCompact } from '../store/data'

const TYPE_ICONS = {
  budget: Wallet,
  contract: FileText,
  sponsorship: Handshake,
  vendor_payment: DollarSign,
  purchase_request: ShoppingBag,
}

const STATUS_TONES = {
  pending: { bg: 'bg-gold-100', text: 'text-gold-700', label: 'Pending' },
  approved: { bg: 'bg-brand-100', text: 'text-brand-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  revision_requested: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Revision Requested' },
}

export default function Approvals() {
  const { backendOnline, state, patch, setApprovalStatus, addApprovalRequest, logActivity } = useData()
  const [approvals, setApprovals] = useState([])
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const [reviewNote, setReviewNote] = useState({})
  const [showNote, setShowNote] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (backendOnline) loadApprovals()
  }, [backendOnline])

  const loadApprovals = async () => {
    try {
      const { approvals: a } = await api.approvals.list()
      setApprovals(a)
    } catch (err) {
      show(err.message || 'Failed to load approvals', 'error')
    }
  }

  // Offline mode: enrich store approvals with staff names for the cards
  const enrich = (a) => {
    const sb = state.staff.find((s) => s.id === a.submittedBy) || (a.submittedByUser && state.staff.find((s) => s.id === a.submittedByUser.id))
    const rb = state.staff.find((s) => s.id === a.reviewedBy) || (a.reviewedByUser && state.staff.find((s) => s.id === a.reviewedByUser.id))
    return {
      ...a,
      createdAt: a.createdAt || a.date,
      submittedByUser: sb ? { name: sb.name, initials: sb.initials } : a.submittedByUser,
      reviewedByUser: rb ? { name: rb.name, initials: rb.initials } : a.reviewedByUser,
    }
  }

  const offlineApprovals = state.approvals.map(enrich)
  const list = backendOnline ? approvals : offlineApprovals

  const handleAction = async (id, action) => {
    setBusy(true)
    const note = reviewNote[id] || ''
    if (backendOnline) {
      try {
        if (action === 'approve') await api.approvals.approve(id, note)
        else if (action === 'reject') await api.approvals.reject(id, note)
        else if (action === 'revision') await api.approvals.revision(id, note)
        show(`Request ${action}d`)
        await loadApprovals()
      } catch (err) {
        show(err.message || 'Action failed', 'error')
      }
    } else {
      setApprovalStatus(id, action === 'revision' ? 'revision_requested' : action === 'approve' ? 'approved' : 'rejected', note)
      show(`Request ${action}d`)
    }
    setShowNote((s) => ({ ...s, [id]: false }))
    setReviewNote((s) => ({ ...s, [id]: '' }))
    setBusy(false)
  }

  const handleSubmit = async (type, entityId, entityName, amount, note) => {
    setBusy(true)
    if (backendOnline) {
      try {
        await api.approvals.submit({ type, entityId, entityName, amount, note })
        show('Approval request submitted')
        await loadApprovals()
      } catch (err) {
        show(err.message || 'Submit failed', 'error')
      }
    } else {
      addApprovalRequest({ type, entityId, entityName, amount, note })
      show('Approval request submitted')
    }
    setBusy(false)
  }

  const filtered = filter === 'all' ? list : list.filter((a) => a.status === filter)
  const pendingCount = list.filter((a) => a.status === 'pending').length

  return (
    <div>
      <PageHeader
        title="Approval Workflows"
        subtitle={`${pendingCount} pending approval${pendingCount !== 1 ? 's' : ''} - budget, contracts, sponsorships, vendor payments, purchase requests`}
        icon={FileText}
      />

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {['all', 'pending', 'approved', 'rejected', 'revision_requested'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tab ${filter === f ? 'tab-active' : 'tab-idle'}`}
          >
            {f === 'revision_requested' ? 'Revision' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 chip bg-gold-200 text-gold-800 text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Approval cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="card col-span-full p-8 text-center text-ink/40">
            No {filter !== 'all' ? filter.replace('_', ' ') : ''} approvals.
          </div>
        ) : (
          filtered.map((a) => {
            const Icon = TYPE_ICONS[a.type] || FileText
            const tone = STATUS_TONES[a.status] || STATUS_TONES.pending
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-brand-950">{a.entityName}</p>
                      <span className={`chip ${tone.bg} ${tone.text} text-[10px]`}>{tone.label}</span>
                    </div>
                    <p className="text-xs text-ink/45 mt-0.5">
                      {a.type.replace(/_/g, ' ')} · ETB {fmtCompact(a.amount)}
                    </p>
                    {a.note && <p className="text-xs text-ink/55 mt-1.5 italic">"{a.note}"</p>}
                    {a.reviewNote && <p className="text-xs text-ink/55 mt-1">Review: "{a.reviewNote}"</p>}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-ink/40">
                      {a.submittedByUser && (
                        <span className="inline-flex items-center gap-1">
                          <Avatar name={a.submittedByUser.name} initials={a.submittedByUser.initials} size="xs" />
                          {a.submittedByUser.name}
                        </span>
                      )}
                      <span>· {new Date(a.createdAt).toLocaleDateString()}</span>
                      {a.reviewedByUser && <span>· Reviewed by {a.reviewedByUser.name}</span>}
                    </div>
                  </div>
                </div>

                {/* Action buttons for pending */}
                {a.status === 'pending' && (
                  <div className="mt-4 border-t border-brand-50 pt-3">
                    {showNote[a.id] ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Review note (optional)…"
                          value={reviewNote[a.id] || ''}
                          onChange={(e) => setReviewNote((s) => ({ ...s, [a.id]: e.target.value }))}
                          className="input !py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(a.id, 'approve')} disabled={busy} className="btn-primary !py-2 text-xs flex-1">
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button onClick={() => handleAction(a.id, 'reject')} disabled={busy} className="btn-outline !py-2 text-xs !text-red-600 !border-red-200 hover:!bg-red-50 flex-1">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => handleAction(a.id, 'revision')} disabled={busy} className="btn-outline !py-2 text-xs flex-1">
                            <RotateCcw size={14} /> Revision
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowNote((s) => ({ ...s, [a.id]: true }))} className="btn-outline !py-2 text-xs w-full">
                        Review Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
