import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, UserPlus, MapPin, Wallet, Ticket,
  QrCode, ScanLine, TrendingUp, BarChart3, CheckCircle2, Play, ArrowRight,
  Sparkles, X, ChevronRight, CircleCheck, PartyPopper,
} from 'lucide-react'
import { useData } from '../store/DataContext'

const steps = [
  { title: 'Dashboard Overview', desc: 'Review KPIs, charts and team performance.', route: '/dashboard', intent: null, icon: LayoutDashboard, marker: 'dashboard' },
  { title: 'Create a New Client', desc: 'Add a company + contact to the CRM pipeline.', route: '/crm', intent: 'new-client', icon: Users, marker: 'client' },
  { title: 'Create an Event', desc: 'Build the event, linked to your client.', route: '/events', intent: 'new-event', icon: CalendarDays, marker: 'event' },
  { title: 'Assign Team Members', desc: 'Pick the project manager and crew for the event.', route: '/events', intent: 'event-team', icon: UserPlus, marker: 'team' },
  { title: 'Allocate Venue & Resources', desc: 'Book the venue and allocate equipment.', route: '/events', intent: 'event-resources', icon: MapPin, marker: 'allocate' },
  { title: 'Create Budget', desc: 'Set the event budget and view spend.', route: '/events', intent: 'event-budget', icon: Wallet, marker: 'budget' },
  { title: 'Register Attendees', desc: 'Add attendees and ticket types.', route: '/ticketing', intent: 'new-registration', icon: Ticket, marker: 'register' },
  { title: 'Generate QR Tickets', desc: 'Open the digital QR ticket for an attendee.', route: '/ticketing', intent: 'view-qr', icon: QrCode, marker: 'qr' },
  { title: 'Perform QR Check-in', desc: 'Scan the ticket at the entrance.', route: '/checkin', intent: 'checkin', icon: ScanLine, marker: 'checkin' },
  { title: 'Track Expenses & Payments', desc: 'Record costs and client payments.', route: '/finance', intent: 'finance', icon: TrendingUp, marker: 'finance' },
  { title: 'Generate Reports', desc: 'Export the event and financial reports.', route: '/reports', intent: 'reports', icon: BarChart3, marker: 'reports' },
  { title: 'Complete Event', desc: 'Mark the event as completed.', route: '/events', intent: 'event-complete', icon: CheckCircle2, marker: 'complete' },
]

export default function DemoWizard() {
  const { state, markDone, setIntent, setDemoOpen, clearIntent } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  const { demo, events, clients, registrations, resources } = state
  const lastEvent = events.find((e) => e.id === demo.lastEventId)
  const lastClient = clients.find((c) => c.id === demo.lastClientId)
  const lastReg = registrations.find((r) => r.id === demo.lastRegId)
  const done = [...demo.done]

  // Auto-detect completion per step (idempotent)
  if (!done.includes(0) && location.pathname === '/dashboard') done.push(0)
  if (demo.lastClientId) { done.push(1) }
  if (demo.lastEventId) { done.push(2) }
  if (demo.teamAssigned) done.push(3)
  if (demo.allocated) done.push(4)
  if (demo.budgetSet || (lastEvent && lastEvent.budget > 0)) done.push(5)
  if (demo.lastRegId) done.push(6)
  if (demo.qrViewed) done.push(7)
  if (demo.lastCheckinId) done.push(8)
  if (demo.financeAction > 0) done.push(9)
  if (demo.visitedReports || location.pathname === '/reports') done.push(10)
  if (lastEvent && lastEvent.status === 'completed') done.push(11)

  const uniqueDone = [...new Set(done)].sort((a, b) => a - b)
  const current = steps.findIndex((_, i) => !uniqueDone.includes(i))
  const progress = Math.round((uniqueDone.length / steps.length) * 100)
  const allDone = current === -1

  // Keep the provider's done list in sync (fire-and-forget style, idempotent)
  useEffect(() => {
    uniqueDone.forEach((i) => markDone(i))
  }, [uniqueDone.join(',')])

  // Track report visits
  useEffect(() => {
    if (location.pathname === '/reports' && !state.demo.visitedReports) {
      setIntent(null)
    }
  }, [location.pathname])

  const go = (step, i) => {
    if (i > current) {
      return
    }
    if (step.intent) setIntent(step.intent)
    markDone(0)
    setDemoOpen(false)
    navigate(step.route)
  }

  const chip = (on) => (on ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-800')

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setDemoOpen(!demo.open)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-brand-800 pl-2 pr-4 py-2 text-white shadow-pop transition hover:bg-brand-900"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-400 text-brand-950">
          <Sparkles size={16} />
        </span>
        <span className="text-sm font-bold">Demo Mode</span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">{uniqueDone.length}/{steps.length}</span>
      </button>

      {/* Drawer */}
      {demo.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[1px]" onClick={() => setDemoOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-pop">
            {/* Header */}
            <div className="bg-brand-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400 text-brand-950"><Sparkles size={18} /></span>
                  <div>
                    <p className="font-bold">Interactive Demo</p>
                    <p className="text-xs text-brand-200">Full operational workflow</p>
                  </div>
                </div>
                <button onClick={() => setDemoOpen(false)} className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10"><X size={18} /></button>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-200">{allDone ? 'Workflow complete!' : `Step ${current + 1} of ${steps.length}`}</span>
                  <span className="font-black text-gold-300">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Current task callout */}
            {!allDone && (
              <div className="mx-4 mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold-800">
                  <Play size={12} /> Now: {steps[current].title}
                </p>
                <p className="mt-1.5 text-sm text-gold-900/90">{steps[current].desc}</p>
                <button onClick={() => go(steps[current], current)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-900">
                  Start this step <ArrowRight size={13} />
                </button>
              </div>
            )}
            {allDone && (
              <div className="mx-4 mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
                <PartyPopper size={20} className="mx-auto text-gold-500" />
                <p className="mt-1.5 text-sm font-bold text-brand-900">Demo workflow complete</p>
                <p className="text-xs text-ink/55">Every step was executed with live data.</p>
              </div>
            )}

            {/* Step list */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">Workflow steps</p>
              <div className="space-y-1">
                {steps.map((s, i) => {
                  const isDone = uniqueDone.includes(i)
                  const isCurrent = i === current
                  const isLocked = i > current
                  return (
                    <div
                      key={s.title}
                      onClick={() => !isLocked && go(s, i)}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        isDone ? 'border-brand-100 bg-brand-50/50'
                          : isCurrent ? 'border-gold-300 bg-white shadow-card'
                          : isLocked ? 'border-brand-50 bg-brand-50/20 cursor-not-allowed opacity-60'
                          : 'border-brand-50 bg-white cursor-pointer hover:border-brand-200 hover:bg-brand-50/40'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${isDone ? chip(true) : isCurrent ? 'bg-gold-400 text-brand-950' : isLocked ? 'bg-ink/5 text-ink/30' : 'bg-brand-50 text-ink/40'}`}>
                        {isDone ? <CircleCheck size={14} /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-bold ${isDone ? 'text-brand-800' : isCurrent ? 'text-brand-950' : isLocked ? 'text-ink/40' : 'text-ink/60'}`}>{s.title}</p>
                        {isCurrent && <p className="mt-0.5 text-[11px] leading-snug text-ink/50">{s.desc}</p>}
                        {isLocked && <p className="mt-0.5 text-[11px] leading-snug text-ink/35">Complete previous steps first</p>}
                      </div>
                      {isCurrent && (
                        <button onClick={(e) => { e.stopPropagation(); go(s, i) }} className="mt-0.5 rounded-lg bg-brand-800 p-1.5 text-white hover:bg-brand-900"><ChevronRight size={14} /></button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer context */}
            <div className="border-t border-brand-100 p-4 text-xs text-ink/55">
              {lastClient ? <p className="truncate">Client: <span className="font-semibold text-brand-900">{lastClient.company}</span></p> : <p>Client: not created yet</p>}
              {lastEvent ? <p className="mt-0.5 truncate">Event: <span className="font-semibold text-brand-900">{lastEvent.name}</span></p> : <p className="mt-0.5">Event: not created yet</p>}
              {lastReg && <p className="mt-0.5 truncate">Ticket: <span className="font-mono text-brand-800">{lastReg.qr}</span></p>}
              {!allDone && <button className="mt-2 text-brand-700 font-semibold hover:text-brand-900" onClick={() => { uniqueDone.forEach((i) => markDone(i)); setIntent(null) }}>Re-sync step detection</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}