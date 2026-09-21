import React, { useState, useEffect, useMemo } from 'react'
import { useData } from '../store/DataContext'
import {
  CalendarDays, Users, UserCheck, Ticket, TrendingUp, Wallet, AlertTriangle,
  CheckCircle2, MapPin, Activity, Trophy,
} from 'lucide-react'

const fmt = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'k'
  return Math.round(v).toString()
}
const etb = (n) => 'ETB ' + fmt(n)

function StatPill({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'text-brand-700',
    green: 'text-green-600',
    gold: 'text-gold-600',
    red: 'text-red-500',
    sky: 'text-sky-600',
    ink: 'text-ink/50',
  }
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap border-r border-brand-100 px-3 first:pl-0">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[12px] shadow-sm ring-1 ring-brand-100">
        <Icon size={14} className={tones[tone] || tones.brand} />
      </span>
      <div className="leading-tight">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>
        <p className="text-sm font-black text-brand-950 tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export default function LiveKpiBar({ scope = 'staff' }) {
  const { state, rbac } = useData()
  const [now, setNow] = useState(() => new Date())

  // Live clock tick - re-renders the strip every second for a "live" feel
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const roleKey = rbac?.roleKey

  const stats = useMemo(() => {
    const evs = state.events
    const regs = state.registrations
    const active = evs.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').length
    const completed = evs.filter((e) => e.status === 'completed').length
    const checkedIn = regs.filter((r) => r.checkedIn).length
    const paid = (state.invoices || []).reduce((s, i) => s + (i.paid || 0), 0)
    const outstanding = (state.invoices || []).reduce((s, i) => s + ((i.amount || 0) - (i.paid || 0)), 0)
    const spent = (state.expenses || []).reduce((s, x) => s + (x.amount || 0), 0)
    const pendingTasks = (state.tasks || []).filter((t) => t.status !== 'done').length
    const pendingApprovals = (state.approvals || []).filter((a) => a.status === 'pending').length
    const bookedVenues = (state.venues || []).filter((v) => v.status === 'booked').length

    if (scope === 'client') {
      const myId = state.currentUserId
      const myEvents = evs.filter((e) => e.clientId === myId)
      const myEventIds = new Set(myEvents.map((e) => e.id))
      const myRegs = regs.filter((r) => myEventIds.has(r.eventId))
      const myInv = (state.invoices || []).filter((i) => i.clientId === myId)
      const myPaid = myInv.reduce((s, i) => s + (i.paid || 0), 0)
      const myOut = myInv.reduce((s, i) => s + ((i.amount || 0) - (i.paid || 0)), 0)
      return [
        { icon: CalendarDays, label: 'My Events', value: myEvents.length, tone: 'brand' },
        { icon: Users, label: 'My Attendees', value: myRegs.length, tone: 'sky' },
        { icon: UserCheck, label: 'Checked In', value: myRegs.filter((r) => r.checkedIn).length, tone: 'green' },
        { icon: Wallet, label: 'Paid', value: etb(myPaid), tone: 'green' },
        { icon: AlertTriangle, label: 'Outstanding', value: etb(myOut), tone: 'red' },
      ]
    }

    const common = [
      { icon: CalendarDays, label: 'Active Events', value: active, tone: 'brand' },
      { icon: Users, label: 'Registrations', value: regs.length, tone: 'sky' },
      { icon: UserCheck, label: 'Checked-in', value: checkedIn, tone: 'green' },
      { icon: Wallet, label: 'Collected', value: etb(paid), tone: 'green' },
      { icon: AlertTriangle, label: 'Outstanding', value: etb(outstanding), tone: 'red' },
      { icon: CheckCircle2, label: 'Done', value: completed, tone: 'brand' },
    ]
    switch (roleKey) {
      case 'finance':
        return [
          { icon: Wallet, label: 'Collected', value: etb(paid), tone: 'green' },
          { icon: AlertTriangle, label: 'Outstanding', value: etb(outstanding), tone: 'red' },
          { icon: TrendingUp, label: 'Spent', value: etb(spent), tone: 'gold' },
          { icon: CheckCircle2, label: 'Pending Approvals', value: pendingApprovals, tone: 'sky' },
          { icon: Ticket, label: 'Registrations', value: regs.length, tone: 'brand' },
          { icon: CalendarDays, label: 'Active Events', value: active, tone: 'brand' },
        ]
      case 'operations':
        return [
          { icon: MapPin, label: 'Venues Booked', value: bookedVenues, tone: 'brand' },
          { icon: CalendarDays, label: 'Active Events', value: active, tone: 'brand' },
          { icon: CheckCircle2, label: 'Not Done Tasks', value: pendingTasks, tone: 'gold' },
          { icon: Users, label: 'Checked-in', value: checkedIn, tone: 'green' },
          { icon: Ticket, label: 'Registrations', value: regs.length, tone: 'sky' },
        ]
      case 'marketing':
        return [
          { icon: Ticket, label: 'Registrations', value: regs.length, tone: 'brand' },
          { icon: Users, label: 'Checked In', value: checkedIn, tone: 'green' },
          { icon: CalendarDays, label: 'Active Events', value: active, tone: 'brand' },
          { icon: Trophy, label: 'Campaigns', value: (state.campaigns || []).length, tone: 'gold' },
          { icon: CheckCircle2, label: 'Sponsors', value: (state.sponsors || []).length, tone: 'sky' },
        ]
      default:
        return common
    }
  }, [state, scope, roleKey])

  const liveActivity = state.activities?.[0]

  return (
    <div data-testid="live-kpi" className="mb-5 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/70 shadow-sm">
      <div className="flex items-center gap-4 overflow-x-auto px-4 py-2.5">
        {/* LIVE badge + clock */}
        <div className="flex shrink-0 items-center gap-2 pr-2">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Live</span>
          <span className="text-[11px] font-bold tabular-nums text-brand-950">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* KPIs */}
        <div className="flex flex-1 items-center overflow-x-auto">
          {stats.map((s, i) => (
            <StatPill key={i} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
          ))}
        </div>

        {/* Recent live activity */}
        {liveActivity && (
          <div className="hidden shrink-0 items-center gap-2 border-l border-brand-100 pl-3 lg:flex">
            <Activity size={14} className="text-brand-600" />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold text-brand-900 max-w-[180px] truncate">{liveActivity.text}</p>
              <p className="text-[9px] text-ink/40">{liveActivity.at}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}