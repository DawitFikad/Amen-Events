import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock, GitBranch, User, CalendarDays,
  MapPin, Building2, CheckSquare, ChevronRight, FileText, Check,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Progress, SkeletonDetail } from '../../components/ui'
import { buildStepDetails } from '../WorkflowPage'

export default function ClientTimeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, loading } = useData()
  const clientId = state.currentUserId

  const [expandedSteps, setExpandedSteps] = useState(() => new Set([0]))
  const [timelineFilter, setTimelineFilter] = useState('all') // 'all' | 'completed' | 'active' | 'upcoming'

  const toggleStep = (stepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  if (loading) {
    return <SkeletonDetail />
  }
  const client = state.clients.find((c) => c.id === clientId)

  const myEvents = useMemo(() => {
    const list = state.events.filter((e) => {
      const isOwner = e.clientId === clientId
      const hasRegistration = state.registrations.some((r) =>
        r.eventId === e.id && (r.clientId === clientId || (client?.email && r.email?.toLowerCase() === client.email.toLowerCase()))
      )
      return isOwner || hasRegistration
    })
    return list.length > 0 ? list : state.events
  }, [state.events, state.registrations, clientId, client?.email])

  const [selectedEventId, setSelectedEventId] = useState(() => id || myEvents[0]?.id || '')

  const currentEvent = useMemo(() => {
    return state.events.find((e) => e.id === (selectedEventId || id)) || myEvents[0] || state.events[0]
  }, [state.events, selectedEventId, id, myEvents])

  const venue = state.venues.find((v) => v.id === currentEvent?.venueId)
  const pm = state.staff.find((s) => s.id === currentEvent?.pmId)
  const eventTasks = useMemo(() => {
    return state.tasks.filter((t) => t.eventId === currentEvent?.id)
  }, [state.tasks, currentEvent?.id])

  // Full detailed 14 steps for client transparency
  const stepDetails = useMemo(() => {
    if (!currentEvent) return []
    return buildStepDetails(currentEvent, state)
  }, [currentEvent, state])

  const filteredTimelineSteps = useMemo(() => {
    return stepDetails.filter((step) => {
      if (timelineFilter === 'completed') return step.isCompleted
      if (timelineFilter === 'active') return step.isCurrent
      if (timelineFilter === 'upcoming') return step.isUpcoming
      return true
    })
  }, [stepDetails, timelineFilter])

  if (!currentEvent) {
    return (
      <div className="card p-10 text-center">
        <GitBranch size={40} className="mx-auto mb-3 text-ink/20" />
        <p className="text-sm font-semibold text-ink/50">No events found</p>
        <button onClick={() => navigate('/erp/portal/events')} className="btn-primary mt-3">Browse Events</button>
      </div>
    )
  }

  const progress = currentEvent.progress || 0

  return (
    <div className="space-y-5">
      {/* Top navigation and event selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => navigate('/erp/portal/events')} className="flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
          <ArrowLeft size={16} /> Back to Events
        </button>

        {myEvents.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink/60">Select Event:</span>
            <select
              className="input text-xs font-bold max-w-[260px] py-1.5"
              value={currentEvent.id}
              onChange={(e) => {
                setSelectedEventId(e.target.value)
                navigate(`/erp/portal/timeline/${e.target.value}`)
              }}
            >
              {myEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {currentEvent.category || 'Corporate Event'}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium border capitalize ${currentEvent.status === 'upcoming'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : currentEvent.status === 'ongoing'
                    ? 'bg-brand-50 text-brand-800 border-brand-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                {currentEvent.status}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">{currentEvent.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <CalendarDays size={13} className="text-slate-400" /> {currentEvent.date || 'TBD'} · {currentEvent.time || '09:00'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <MapPin size={13} className="text-slate-400" /> {venue?.name || 'TBA'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <User size={13} className="text-slate-400" /> {pm?.name || 'Dawit Mengistu'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-center min-w-[120px]">
            <p className="text-2xl font-bold text-slate-900">{progress}%</p>
            <p className="text-[11px] font-medium text-slate-500">Lifecycle Progress</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 14-Step Canonical Lifecycle Pathway */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Event Lifecycle & Governance Journey</h2>
              <p className="text-xs text-slate-500">Step-by-step progress tracking operational actions, responsible leads (By Who), recipients (To Whom), and verified deliverables.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1">
                {['all', 'completed', 'active', 'upcoming'].map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setTimelineFilter(filterKey)}
                    className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition border ${timelineFilter === filterKey
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>

              {/* Step Dropdown Select */}
              <select
                className="rounded border border-slate-200 bg-white py-1 px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
                value={expandedSteps.size === 1 ? Array.from(expandedSteps)[0] : ''}
                onChange={(e) => {
                  if (e.target.value === '') return
                  const sId = Number(e.target.value)
                  setExpandedSteps(new Set([sId]))
                }}
              >
                <option value="">Jump to step...</option>
                {stepDetails.map((st) => (
                  <option key={st.id} value={st.id}>
                    Step {st.stepNumber}: {st.title} ({st.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 14 Step Detailed Accordion Cards */}
          <div className="space-y-2.5">
            {filteredTimelineSteps.map((step) => {
              const isExpanded = expandedSteps.has(step.id)
              return (
                <div
                  key={step.id}
                  className={`rounded-lg border transition-all overflow-hidden ${step.isCurrent
                      ? 'border-slate-300 bg-white border-l-4 border-l-brand-600 shadow-xs'
                      : step.isCompleted
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-white/70'
                    }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition ${step.isCurrent
                        ? 'bg-slate-50/70'
                        : 'bg-white hover:bg-slate-50/50'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${step.isCompleted
                            ? 'bg-slate-900 text-white'
                            : step.isCurrent
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {step.isCompleted ? <Check size={12} strokeWidth={2.5} /> : step.stepNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400">
                            Step {step.stepNumber} of 14 · {step.phase}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${step.isCompleted
                                ? 'bg-slate-50 text-slate-700 border-slate-200'
                                : step.isCurrent
                                  ? 'bg-brand-50 text-brand-800 border-brand-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}
                          >
                            {step.isCompleted ? 'Completed' : step.isCurrent ? 'Active' : 'Upcoming'}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{step.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {step.isCompleted ? `Verified: ${step.dateCompleted}` : step.isCurrent ? 'In Progress' : 'Scheduled'}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 transition ${isExpanded
                          ? 'bg-slate-100 text-slate-900 border-slate-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}>
                        <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                        <ChevronRight
                          size={12}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </span>
                    </div>
                  </div>

                  {/* Expanded Step Details: By Who, To Whom, What Was Done, Deliverables */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                      {/* Dual By Who / To Whom Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Responsible Lead */}
                        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Responsible Lead (By Who)
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">Amen Team</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900">{step.byWho.name}</p>
                          <p className="text-[11px] text-slate-600">{step.byWho.role} · {step.byWho.dept}</p>
                          <p className="text-[10px] text-slate-400">{step.byWho.email}</p>
                        </div>

                        {/* Counterpart */}
                        <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Counterpart (To Whom)
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">Recipient</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900">{step.toWhom.name}</p>
                          <p className="text-[11px] text-slate-600">{step.toWhom.org}</p>
                          <p className="text-[10px] text-slate-400">{step.toWhom.role} · {step.toWhom.contact}</p>
                        </div>
                      </div>

                      {/* Operational Actions */}
                      <div className="rounded-md bg-slate-50/50 border border-slate-200 p-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Operational Actions & Verification:
                        </p>
                        <ul className="space-y-1.5">
                          {step.whatDone.map((act, actIdx) => (
                            <li key={actIdx} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-slate-400 mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Verified Deliverables */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Verified Deliverables & Key Specs:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {step.deliverables.map((deliv, delivIdx) => (
                            <div
                              key={delivIdx}
                              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                            >
                              <span className="text-slate-400 mr-1.5">{deliv.label}:</span>
                              <span className="font-medium text-slate-900">{deliv.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event Tasks & Checklist */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-brand-950">Milestone Tasks</h3>
            <span className="chip bg-brand-50 text-brand-700">{eventTasks.length} tasks</span>
          </div>
          {eventTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink/40">No tasks logged for this event.</div>
          ) : (
            <div className="space-y-2.5">
              {eventTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-brand-50 p-3 hover:bg-brand-50/40 transition">
                  {t.status === 'done' ? (
                    <CheckCircle2 size={16} className="text-brand-600 shrink-0" />
                  ) : (
                    <Clock size={16} className="text-gold-500 shrink-0" />
                  )}
                  <span className="flex-1 text-xs font-semibold text-brand-950 truncate">{t.title}</span>
                  <Badge status={t.status === 'done' ? 'active' : 'pending'} label={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card p-5 space-y-3">
          <h3 className="font-bold text-brand-950">Event Details & Actions</h3>
          <p className="text-xs text-ink/50">Manage tickets, view financial invoices, or review documentation for this event.</p>
          <div className="pt-2 space-y-2">
            <button
              onClick={() => navigate(`/erp/portal/events/${currentEvent.id}`)}
              className="w-full flex items-center justify-between rounded-xl border border-brand-100 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays size={16} className="text-brand-600" />
                <div><p className="text-xs font-bold text-brand-950">Full Event Details</p><p className="text-[10px] text-ink/45">Venue, tickets, team and speakers</p></div>
              </div>
              <ChevronRight size={15} className="text-ink/40" />
            </button>
            <button
              onClick={() => navigate('/erp/portal/invoices')}
              className="w-full flex items-center justify-between rounded-xl border border-brand-100 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-brand-600" />
                <div><p className="text-xs font-bold text-brand-950">Invoices & Payments</p><p className="text-[10px] text-ink/45">Review payment schedule and balances</p></div>
              </div>
              <ChevronRight size={15} className="text-ink/40" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
