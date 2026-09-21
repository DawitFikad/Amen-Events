import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock, GitBranch, User, CalendarDays,
  MapPin, Building2, CheckSquare, ChevronRight, FileText,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Progress } from '../../components/ui'

const TIMELINE_STAGES = [
  { key: 'inquiry', label: 'Inquiry', desc: 'Initial contact, client brief and requirements gathering', threshold: 10 },
  { key: 'planning', label: 'Planning', desc: 'Concept, theme, budget allocation and milestone roadmap', threshold: 25 },
  { key: 'venue', label: 'Venue Confirmed', desc: 'Venue selection, layout design, and contract execution', threshold: 40 },
  { key: 'resources', label: 'Resources Ready', desc: 'AV equipment, stage setup, catering and vendor allocation', threshold: 55 },
  { key: 'marketing', label: 'Marketing & Promotion', desc: 'Campaign launch, ticketing setup and promotional drives', threshold: 70 },
  { key: 'registration', label: 'Registration Open', desc: 'Attendee sign-up, ticket sales and QR code issuance', threshold: 80 },
  { key: 'running', label: 'Live Event Execution', desc: 'On-site check-in, stage operations and live logistics', threshold: 90 },
  { key: 'completed', label: 'Completed & Evaluation', desc: 'Post-event reports, vendor settlement and client feedback', threshold: 100 },
]

export default function ClientTimeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useData()
  const clientId = state.currentUserId
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
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex gap-2">
                <span className="chip bg-white/20 text-white">{currentEvent.category || 'Event'}</span>
                <span className={`chip ${currentEvent.status === 'upcoming' ? 'bg-gold-400 text-white' : currentEvent.status === 'ongoing' ? 'bg-brand-400 text-white' : 'bg-ink/60 text-white'}`}>
                  {currentEvent.status}
                </span>
              </div>
              <h1 className="text-2xl font-black">{currentEvent.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-100">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {currentEvent.date || 'TBD'} · {currentEvent.time || '09:00'}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {venue?.name || 'TBA'}</span>
                <span className="inline-flex items-center gap-1.5"><User size={14} /> {pm?.name || 'Project Manager'}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-3xl font-black">{progress}%</p>
              <p className="text-[11px] font-semibold text-brand-200">Overall Progress</p>
            </div>
          </div>

          <div className="mt-5">
            <Progress value={progress} />
          </div>
        </div>

        {/* Timeline Stages */}
        <div className="p-6">
          <h2 className="mb-6 text-lg font-bold text-brand-950">Lifecycle Stages</h2>
          <div className="space-y-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const isComplete = progress >= stage.threshold
              const isCurrent = !isComplete && (i === 0 || progress >= TIMELINE_STAGES[i - 1].threshold)
              return (
                <div key={stage.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isComplete
                        ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                        : isCurrent
                        ? 'border-gold-500 bg-gold-50 text-gold-700 ring-4 ring-gold-100'
                        : 'border-brand-100 bg-white text-ink/30'
                    }`}>
                      {isComplete ? <CheckCircle2 size={18} /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                    {i < TIMELINE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-16 ${isComplete ? 'bg-brand-500' : 'bg-brand-100'}`} />
                    )}
                  </div>
                  <div className="pb-8 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-sm font-bold ${isComplete ? 'text-brand-950' : isCurrent ? 'text-gold-800' : 'text-ink/40'}`}>
                        {stage.label}
                      </p>
                      <span className={`chip text-[10px] ${
                        isComplete ? 'bg-brand-50 text-brand-700' : isCurrent ? 'bg-gold-50 text-gold-700' : 'bg-ink/5 text-ink/40'
                      }`}>
                        {isComplete ? 'Completed' : isCurrent ? 'Active Phase' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-xs text-ink/55 mt-1">{stage.desc}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-ink/50">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className={isComplete ? 'text-brand-600' : isCurrent ? 'text-gold-600' : 'text-ink/30'} />
                        {isComplete ? 'Phase completed' : isCurrent ? 'In progress' : 'Scheduled'}
                      </span>
                      {isComplete && pm && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} className="text-brand-600" /> Managed by {pm.name}
                        </span>
                      )}
                      {isComplete && currentEvent.date && (
                        <span>· {currentEvent.date}</span>
                      )}
                    </div>
                  </div>
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
