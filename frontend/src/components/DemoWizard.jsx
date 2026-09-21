import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, ShieldCheck, CalendarDays, UserPlus, MapPin, Wallet,
  Ticket, QrCode, ScanLine, TrendingUp, KanbanSquare, Handshake, UserCog, Mic2,
  Building2, BadgeDollarSign, Megaphone, Tag, Settings, CheckCircle2, Play, ArrowRight,
  ChevronLeft, ChevronRight, Check, Sparkles, X, CircleCheck, PartyPopper, BarChart3,
} from 'lucide-react'
import { useData } from '../store/DataContext'

const steps = [
  { title: 'Dashboard Overview', desc: 'Start here - KPIs, charts and team performance.', route: '/erp/dashboard', intent: null, icon: LayoutDashboard },
  { title: 'Create a New Client', desc: 'Add a company + contact to the CRM pipeline.', route: '/erp/crm', intent: 'new-client', icon: Users },
  { title: 'Create an Event', desc: 'Build the event, linked to your client.', route: '/erp/admin/events', intent: 'new-event', icon: CalendarDays },
  { title: 'Assign Team Members', desc: 'Pick the project manager and crew for the event.', route: '/erp/admin/events', intent: 'event-team', icon: UserPlus },
  { title: 'Allocate Venue & Resources', desc: 'Book the venue and allocate equipment.', route: '/erp/admin/events', intent: 'event-resources', icon: MapPin },
  { title: 'Create Budget', desc: 'Define the event budget and track spend.', route: '/erp/admin/events', intent: 'event-budget', icon: Wallet },
  { title: 'Register Attendees', desc: 'Add attendees and ticket types.', route: '/erp/ticketing', intent: 'new-registration', icon: Ticket },
  { title: 'Generate QR Tickets', desc: 'Open the digital QR ticket for an attendee.', route: '/erp/ticketing', intent: 'view-qr', icon: QrCode },
  { title: 'Perform QR Check-in', desc: 'Scan the ticket at the entrance.', route: '/erp/checkin', intent: 'checkin', icon: ScanLine },
  { title: 'Track Expenses & Payments', desc: 'Record costs and client payments.', route: '/erp/finance', intent: 'finance', icon: TrendingUp },
  { title: 'Generate Reports', desc: 'Export the event and financial reports.', route: '/erp/reports', intent: 'reports', icon: BarChart3 },
  { title: 'Complete Event', desc: 'Mark the event as completed.', route: '/erp/admin/events', intent: 'event-complete', icon: CheckCircle2 },
]

export default function DemoWizard() {
  const { state, rbac, markDone, setIntent, setDemoOpen, clearIntent, setDemoFlag } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  const { demo, events, clients, registrations } = state
  const lastEvent = events.find((e) => e.id === demo.lastEventId)
  const lastClient = clients.find((c) => c.id === demo.lastClientId)
  const lastReg = registrations.find((r) => r.id === demo.lastRegId)

  // Only surface workflow steps within the signed-in role's permissions.
  const stepModuleMap = {
    '/erp/dashboard': 'dashboard', '/erp/crm': 'crm', '/erp/admin/events': 'events',
    '/erp/ticketing': 'ticketing', '/erp/checkin': 'checkin', '/erp/finance': 'finance',
    '/erp/reports': 'reports',
  }
  const visibleSteps = steps.filter((s) => {
    if (!rbac || rbac.roleKey === 'admin') return true
    const mod = stepModuleMap[s.route]
    return !mod || rbac.canAccess(mod)
  })

  const done = [...demo.done]

  // Auto-detect completion per step (idempotent)
  if (!done.includes(0) && location.pathname === '/erp/dashboard') done.push(0)
  if (demo.lastClientId) done.push(1)
  if (demo.lastEventId) done.push(2)
  if (demo.teamAssigned) done.push(3)
  if (demo.allocated) done.push(4)
  if (demo.budgetSet || (lastEvent && lastEvent.budget > 0)) done.push(5)
  if (demo.lastRegId) done.push(6)
  if (demo.qrViewed) done.push(7)
  if (demo.lastCheckinId) done.push(8)
  if (demo.financeAction > 0) done.push(9)
  if (demo.visitedReports || location.pathname === '/erp/reports') done.push(10)
  if (lastEvent && lastEvent.status === 'completed') done.push(11)

  const uniqueDone = [...new Set(done)].sort((a, b) => a - b)
  const visibleIdx = steps.map((s, i) => (visibleSteps.includes(s) ? i : -1)).filter((i) => i >= 0)
  const current = visibleIdx.find((i) => !uniqueDone.includes(i))
  const currentVisible = current === undefined ? -1 : visibleIdx.indexOf(current)
  const doneVisible = visibleIdx.filter((i) => uniqueDone.includes(i)).length
  const progress = Math.round((doneVisible / Math.max(1, visibleIdx.length)) * 100)
  const allDone = current === undefined

  // Keep the provider's done list in sync (idempotent)
  useEffect(() => {
    uniqueDone.forEach((i) => markDone(i))
  }, [uniqueDone.join(',')])

  // Track report visits
  useEffect(() => {
    if (location.pathname === '/erp/reports' && !state.demo.visitedReports) {
      markDone(10)
      clearIntent()
    }
  }, [location.pathname])

  // Autoplay: when the current step is finished (its flag auto-detected),
  // automatically trigger the next one. Runs hands-free for client demos.
  const autoplay = !!demo.autoplay

  useEffect(() => {
    if (!autoplay) return
    if (allDone) { setDemoFlag('autoplay', false); return }
    if (current === undefined) return
    // Schedule the current step once per transition; any uniqueDone/current
    // change tears down the pending timer and re-schedules, never stranding it.
    const t = setTimeout(() => go(steps[current], current), 900)
    return () => clearTimeout(t)
  }, [autoplay, current, uniqueDone.join(',')])

  useEffect(() => {
    if (demo.open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [demo.open])

  const go = (step, i, opts = {}) => {
    if (i > current && !opts.force) return
    if (step.intent) setIntent(step.intent)
    markDone(0)
    setDemoOpen(false)
    navigate(step.route)
  }

  const goAdjacent = (dir) => {
    const next = current + dir
    if (next < 0 || next >= steps.length) return
    if (dir > 0 && next > current) return
    go(steps[next], next, { force: true })
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
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">{doneVisible}/{visibleIdx.length}</span>
      </button>

      {/* Drawer */}
      {demo.open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-[1px] transition-opacity" onClick={() => setDemoOpen(false)} />
          <div className="fixed right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-pop z-10 animate-fade-in">
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
              {autoplay ? (
                <button onClick={() => setDemoFlag('autoplay', false)} className="mt-4 w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20">
                  Stop Autoplay
                </button>
              ) : (
                <button onClick={() => { setDemoFlag('autoplay', true); setDemoOpen(false) }} className="mt-4 w-full rounded-lg bg-gold-400 px-3 py-2 text-xs font-bold text-brand-950 transition hover:bg-gold-300">
                  Run Autoplay - show all steps automatically
                </button>
              )}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-200">{allDone ? 'Workflow complete!' : `Step ${currentVisible + 1} of ${visibleIdx.length}`}</span>
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
                <p className="mt-2 text-[11px] text-gold-700/80">After this comes: <span className="font-semibold">{steps[current + 1]?.title || 'Finish'}</span></p>
                <div className="mt-3 flex items-center gap-2">
                  {current > 0 && (
                    <button onClick={() => goAdjacent(-1)} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-2 text-xs font-bold text-brand-800 transition hover:bg-brand-50">
                      <ChevronLeft size={13} /> Previous
                    </button>
                  )}
                  <button onClick={() => go(steps[current], current)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-900">
                    Start this step <ArrowRight size={13} />
                  </button>
                </div>
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
                  if (!visibleSteps.includes(s)) return null
                  const isDone = uniqueDone.includes(i)
                  const isCurrent = i === current
                  const isLocked = i > current
                  const isPrev = i < current
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
                        {isDone ? <CircleCheck size={14} /> : <>{i + 1}</>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-bold ${isDone ? 'text-brand-800' : isCurrent ? 'text-brand-950' : isLocked ? 'text-ink/40' : 'text-ink/60'}`}>{s.title}</p>
                        {isCurrent && <p className="mt-0.5 text-[11px] leading-snug text-ink/50">{s.desc}</p>}
                        {isLocked && <p className="mt-0.5 text-[11px] leading-snug text-ink/35">Complete previous steps first</p>}
                        {isPrev && <p className="mt-0.5 text-[11px] leading-snug text-brand-700/60">Done - review or revisit</p>}
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
              <div className="mt-2 flex items-center gap-2">
                <button className="text-brand-700 font-semibold hover:text-brand-900" onClick={() => { uniqueDone.forEach((i) => markDone(i)); setIntent(null) }}>Re-sync</button>
                <span className="text-ink/25">|</span>
                <button className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:text-brand-900" onClick={() => setDemoOpen(false)}><Check size={13} /> Finish preview</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}