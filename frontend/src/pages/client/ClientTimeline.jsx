import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, GitBranch, User } from 'lucide-react'
import { useData } from '../../store/DataContext'

const TIMELINE_STAGES = [
  { key: 'inquiry', label: 'Inquiry', desc: 'Initial contact and requirements gathering', threshold: 10 },
  { key: 'planning', label: 'Planning', desc: 'Event concept, timeline and budget planning', threshold: 25 },
  { key: 'venue', label: 'Venue Confirmed', desc: 'Venue booked and contract signed', threshold: 40 },
  { key: 'resources', label: 'Resources Ready', desc: 'Equipment, staff and vendors assigned', threshold: 55 },
  { key: 'marketing', label: 'Marketing', desc: 'Campaigns launched and promotions active', threshold: 70 },
  { key: 'registration', label: 'Registration Open', desc: 'Ticket sales and attendee registration live', threshold: 80 },
  { key: 'running', label: 'Event Running', desc: 'Event is in progress', threshold: 90 },
  { key: 'completed', label: 'Completed', desc: 'Event finished and post-event reports ready', threshold: 100 },
]

export default function ClientTimeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useData()

  const event = state.events.find((e) => e.id === id)
  const pm = state.staff.find((s) => s.id === event?.pmId)

  if (!event) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-ink/50">Select an event to view its timeline</p>
        <button onClick={() => navigate('/erp/portal/events')} className="btn-primary mt-3">Browse Events</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/erp/portal/events')} className="flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
        <ArrowLeft size={16} /> Back to Events
      </button>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
          <h1 className="text-xl font-black">{event.name}</h1>
          <p className="mt-1 text-sm text-brand-100">Event Timeline · {event.progress || 0}% Complete</p>
        </div>

        <div className="p-6">
          <div className="space-y-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const isComplete = (event.progress || 0) >= stage.threshold
              const isCurrent = !isComplete && (i === 0 || (event.progress || 0) >= TIMELINE_STAGES[i - 1].threshold)
              return (
                <div key={stage.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isComplete ? 'border-brand-600 bg-brand-600 text-white' : isCurrent ? 'border-gold-400 bg-gold-50 text-gold-600' : 'border-brand-100 bg-white text-ink/30'
                    }`}>
                      {isComplete ? <CheckCircle2 size={18} /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                    {i < TIMELINE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-16 ${isComplete ? 'bg-brand-500' : 'bg-brand-100'}`} />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className={`text-sm font-bold ${isComplete ? 'text-brand-950' : isCurrent ? 'text-gold-700' : 'text-ink/40'}`}>{stage.label}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{stage.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                      <span className={`inline-flex items-center gap-1 ${isComplete ? 'text-brand-600' : 'text-ink/40'}`}>
                        {isComplete ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {isComplete ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                      </span>
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 text-ink/50">
                          <User size={11} /> {pm?.name || 'Team'}
                        </span>
                      )}
                      {isComplete && (
                        <span className="text-ink/50">{event.date || 'TBD'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
