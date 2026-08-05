import React, { useState, useEffect, useMemo } from 'react'
import {
  Workflow, ChevronRight, ChevronLeft, CheckCircle2, Circle, Clock,
  Building2, FileText, Handshake, CalendarDays, KanbanSquare, MapPin,
  Package, Wallet, Ticket, QrCode, BarChart3, Trophy, ArrowRight, History,
} from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, Th, Td, Avatar } from '../components/ui'

const STAGE_ICONS = [
  Building2, FileText, FileText, Handshake, CalendarDays, KanbanSquare,
  MapPin, Package, Wallet, Ticket, QrCode, BarChart3, Trophy, Trophy,
]

export default function WorkflowPage() {
  const { rbac, backendOnline } = useData()
  const [events, setEvents] = useState([])
  const [stages, setStages] = useState([])
  const [selected, setSelected] = useState(null)
  const [logs, setLogs] = useState([])
  const [view, setView] = useState('pipeline')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (backendOnline) {
      loadWorkflow()
    } else {
      setLoading(false)
    }
  }, [backendOnline])

  const loadWorkflow = async () => {
    try {
      const { events: evts, stages: sts } = await api.workflow.getAll()
      setEvents(evts)
      setStages(sts)
      if (evts.length > 0) setSelected(evts[0])
    } catch (err) {
      show(err.message || 'Failed to load workflow data', 'error')
    }
    setLoading(false)
  }

  const selectEvent = async (event) => {
    setSelected(event)
    setView('pipeline')
    try {
      const { logs: l } = await api.workflow.getLogs(event.id)
      setLogs(l)
    } catch (err) {
      setLogs([])
    }
  }

  const advance = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await api.workflow.advance(selected.id)
      show(`Advanced to next stage`)
      await loadWorkflow()
      const refreshed = events.find((e) => e.id === selected.id)
      if (refreshed) selectEvent(refreshed)
      // Refresh selected from updated list
      const { events: evts } = await api.workflow.getAll()
      const updated = evts.find((e) => e.id === selected.id)
      if (updated) setSelected(updated)
    } catch (err) {
      show(err.message || 'Failed to advance', 'error')
    }
    setBusy(false)
  }

  const revert = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await api.workflow.revert(selected.id)
      show(`Reverted to previous stage`)
      const { events: evts } = await api.workflow.getAll()
      setEvents(evts)
      const updated = evts.find((e) => e.id === selected.id)
      if (updated) setSelected(updated)
      const { logs: l } = await api.workflow.getLogs(selected.id)
      setLogs(l)
    } catch (err) {
      show(err.message || 'Failed to revert', 'error')
    }
    setBusy(false)
  }

  const setStage = async (stageId) => {
    if (!selected) return
    setBusy(true)
    try {
      await api.workflow.setStage(selected.id, stageId)
      show(`Stage set to ${stages[stageId]?.name}`)
      const { events: evts } = await api.workflow.getAll()
      setEvents(evts)
      const updated = evts.find((e) => e.id === selected.id)
      if (updated) setSelected(updated)
      const { logs: l } = await api.workflow.getLogs(selected.id)
      setLogs(l)
    } catch (err) {
      show(err.message || 'Failed to set stage', 'error')
    }
    setBusy(false)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Event Workflow" subtitle="Track events through the full pipeline" icon={Workflow} />
        <div className="card p-8 text-center text-ink/50">Loading workflow…</div>
      </div>
    )
  }

  if (!backendOnline) {
    return (
      <div>
        <PageHeader title="Event Workflow" subtitle="Track events through the full pipeline" icon={Workflow} />
        <div className="card p-8 text-center text-ink/50">
          Workflow requires backend connection. Start the backend server to use this feature.
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Event Workflow"
        subtitle="14-stage pipeline from client creation to event completion."
        icon={Workflow}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Event list sidebar */}
        <div className="card overflow-hidden">
          <div className="border-b border-brand-100 p-3">
            <p className="font-bold text-brand-950 text-sm">Events ({events.length})</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-brand-50">
            {events.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink/40">No events yet</div>
            ) : (
              events.map((e) => {
                const stage = stages[e.stage] || stages[0]
                const Icon = STAGE_ICONS[e.stage] || Circle
                return (
                  <button
                    key={e.id}
                    onClick={() => selectEvent(e)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-brand-50/40 ${selected?.id === e.id ? 'bg-brand-50/60 ring-1 ring-inset ring-brand-200' : ''}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${e.stage === 13 ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{e.name}</p>
                      <p className="truncate text-[11px] text-ink/45">{stage?.name} · {e.completedSteps}/{e.totalSteps} steps</p>
                    </div>
                    <span className="text-xs font-bold text-brand-700">{e.progress}%</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Pipeline view */}
        <div className="space-y-4">
          {selected && (
            <>
              {/* Event header */}
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-brand-950">{selected.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink/50">
                      <span className="inline-flex items-center gap-1"><Building2 size={12} /> {selected.client?.company || 'No client'}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {selected.date || 'No date'}</span>
                      <Badge status={selected.status} label={selected.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline !py-2 text-xs" onClick={revert} disabled={busy || selected.stage === 0}>
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button className="btn-primary !py-2 text-xs" onClick={advance} disabled={busy || selected.stage === 13}>
                      {busy ? <Clock size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                      {selected.stage === 13 ? 'Completed' : 'Advance'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-brand-950">Pipeline Progress</span>
                    <span className="text-ink/50">{selected.completedSteps}/{selected.totalSteps} stages complete</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-brand-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500" style={{ width: `${selected.progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setView('pipeline')} className={`tab ${view === 'pipeline' ? 'tab-active' : 'tab-idle'}`}>
                  <Workflow size={15} /> Pipeline
                </button>
                <button onClick={() => setView('history')} className={`tab ${view === 'history' ? 'tab-active' : 'tab-idle'}`}>
                  <History size={15} /> History
                </button>
              </div>

              {/* Pipeline stages */}
              {view === 'pipeline' && (
                <div className="card overflow-hidden">
                  <div className="divide-y divide-brand-50">
                    {selected.checklist?.map((step, idx) => {
                      const Icon = STAGE_ICONS[idx] || Circle
                      const isCurrent = idx === selected.stage
                      const isPast = idx < selected.stage
                      const isFuture = idx > selected.stage
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 p-4 transition ${isCurrent ? 'bg-brand-50/50' : ''} ${isFuture ? 'opacity-50' : ''}`}
                        >
                          {/* Status icon */}
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isPast ? 'bg-brand-700 text-white' :
                            isCurrent ? 'bg-gold-400 text-white ring-4 ring-gold-100' :
                            'bg-brand-100 text-brand-400'
                          }`}>
                            {isPast ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                          </span>

                          {/* Stage info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${isCurrent ? 'text-brand-950' : isPast ? 'text-brand-800' : 'text-ink/50'}`}>
                                {idx + 1}. {step.name}
                              </p>
                              {isCurrent && <span className="chip bg-gold-100 text-gold-700 text-[10px]">Current</span>}
                              {isPast && <span className="chip bg-brand-100 text-brand-700 text-[10px]">Done</span>}
                            </div>
                            <p className="text-xs text-ink/45 mt-0.5">{step.detail}</p>
                          </div>

                          {/* Action */}
                          {isFuture && (
                            <button
                              onClick={() => setStage(step.id)}
                              disabled={busy}
                              className="btn-outline !py-1.5 text-[11px]"
                            >
                              Jump to
                            </button>
                          )}
                          {isPast && (
                            <button
                              onClick={() => setStage(step.id)}
                              disabled={busy}
                              className="text-[11px] text-ink/40 hover:text-brand-700"
                            >
                              Revisit
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* History view */}
              {view === 'history' && (
                <div className="card p-5">
                  <div className="flex items-center justify-between border-b border-brand-100 pb-3 mb-3">
                    <p className="font-bold text-brand-950">Workflow History</p>
                    <span className="chip bg-brand-100 text-brand-800">{logs.length} entries</span>
                  </div>
                  {logs.length === 0 ? (
                    <div className="py-6 text-center text-ink/40">No workflow actions logged yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            log.action === 'advanced' ? 'bg-brand-100 text-brand-700' :
                            log.action === 'reverted' ? 'bg-gold-100 text-gold-700' :
                            'bg-sky-100 text-sky-700'
                          }`}>
                            {log.action === 'advanced' ? <ArrowRight size={14} /> :
                             log.action === 'reverted' ? <ChevronLeft size={14} /> :
                             <Clock size={14} />}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-ink/75">
                              <span className="font-semibold text-brand-950">{log.user?.name || 'System'}</span>
                              {' '}{log.action} to <span className="font-semibold">{log.stageName}</span>
                            </p>
                            {log.note && <p className="text-xs text-ink/45 mt-0.5">{log.note}</p>}
                            <p className="text-[11px] text-ink/35 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!selected && (
            <div className="card p-8 text-center text-ink/40">
              Select an event from the left to view its workflow pipeline.
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
