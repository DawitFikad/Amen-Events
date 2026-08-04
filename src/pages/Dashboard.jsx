import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, TrendingUp, CheckCircle2, Clock3, Wallet, AlertCircle, Activity,
  Users, Target, ArrowUpRight, ArrowRight, CalendarCheck2, Sparkles,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { StatCard, Badge, Progress, Avatar, PageHeader } from '../components/ui'
import { fmtCompact, todayISO, revenueTrend, categorySplit } from '../store/data'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const PIE_COLORS = ['#228b22', '#c9a227', '#9cc69c', '#175917', '#d1aa4d']

function Dashboard() {
  const { state } = useData()
  const navigate = useNavigate()
  const [week] = useState(() => {
    const out = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push({ d, iso: d.toISOString().slice(0, 10), name: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate() })
    }
    return out
  })

  const events = state.events
  const total = events.length
  const upcoming = events.filter((e) => e.status === 'upcoming').length
  const ongoing = events.filter((e) => e.status === 'ongoing').length
  const completed = events.filter((e) => e.status === 'completed').length

  const revenue = state.invoices.reduce((a, i) => a + i.paid, 0)
  const outstanding = state.invoices.filter((i) => i.status === 'outstanding').reduce((a, i) => a + (i.amount - i.paid), 0)
  const expenses = state.expenses.reduce((a, e) => a + e.amount, 0)
  const profit = revenue - expenses

  const stats = [
    { label: 'Total Events', value: total, icon: CalendarDays, tone: 'brand', sub: `${upcoming} upcoming`, delta: '12%' },
    { label: 'Ongoing', value: ongoing, icon: Clock3, tone: 'gold', sub: 'live right now', delta: null },
    { label: 'Completed', value: completed, icon: CheckCircle2, tone: 'brand', sub: 'this period', delta: null },
    { label: 'Revenue', value: `ETB ${fmtCompact(revenue)}`, icon: Wallet, tone: 'brand', sub: 'collected', delta: '8%' },
    { label: 'Outstanding', value: `ETB ${fmtCompact(outstanding)}`, icon: AlertCircle, tone: 'red', sub: 'due from clients', delta: null },
    { label: 'Net Profit', value: `ETB ${fmtCompact(Math.max(0, profit))}`, icon: TrendingUp, tone: 'gold', sub: 'after expenses', delta: '5%' },
  ]

  const upcomingEvents = events
    .filter((e) => e.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  const tasks = state.tasks
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const taskPct = Math.round((doneTasks / tasks.length) * 100)

  const teamPerf = state.staff.map((m) => {
    const mine = tasks.filter((t) => t.assigneeId === m.id)
    const done = mine.filter((t) => t.status === 'done').length
    return { ...m, total: mine.length, done, pct: mine.length ? Math.round((done / mine.length) * 100) : 0 }
  }).sort((a, b) => b.pct - a.pct)

  return (
    <div>
      <PageHeader
        title="Good morning, Dawit"
        subtitle="Here's what's happening across your events today."
        icon={Sparkles}
        actions={
          <>
            <button className="btn-outline" onClick={() => navigate('/crm')}><Users size={15} /> New Client</button>
            <button className="btn-primary" onClick={() => navigate('/events')}><CalendarDays size={15} /> New Event</button>
          </>
        }
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Revenue Overview</p>
              <p className="text-xs text-ink/45">Monthly collections (ETB thousands)</p>
            </div>
            <span className="chip bg-brand-50 text-brand-800">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#228b22" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#228b22" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => [`ETB ${v}K`, 'Revenue']} />
              <Area type="monotone" dataKey="v" stroke="#228b22" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="font-bold text-brand-950">Revenue by Category</p>
          <p className="text-xs text-ink/45 mb-2">Event type share</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categorySplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3}>
                {categorySplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #cfe0cf', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 space-y-1.5">
            {categorySplit.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink/60"><span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.name}</span>
                <span className="font-semibold text-ink/80">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + activity + team */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Mini calendar */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">This Week</p>
            <span className="text-xs font-semibold text-brand-700">{todayISO().slice(0, 10)}</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {week.map((w) => {
              const dayEvents = events.filter((e) => e.date === w.iso)
              const isToday = w.iso === todayISO()
              return (
                <div key={w.iso} className={`flex flex-col items-center rounded-lg py-2 ${isToday ? 'bg-brand-600 text-white' : 'hover:bg-brand-50'}`}>
                  <span className="text-[10px] font-semibold uppercase">{w.name}</span>
                  <span className={`text-sm font-bold ${isToday ? '' : 'text-brand-950'}`}>{w.day}</span>
                  {dayEvents.length > 0 && <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isToday ? 'bg-gold-400' : 'bg-gold-500'}`} />}
                </div>
              )
            })}
          </div>
          <div className="mt-3 space-y-2">
            {upcomingEvents.map((e) => {
              const v = state.venues.find((x) => x.id === e.venueId)
              return (
                <button key={e.id} onClick={() => navigate('/events')} className="flex w-full items-center gap-3 rounded-lg border border-brand-100 p-2.5 text-left hover:border-brand-300 hover:bg-brand-50/50">
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                    <span className="text-[9px] font-bold uppercase">{new Date(e.date + 'T00:00').toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-sm font-black leading-none">{new Date(e.date + 'T00:00').getDate()}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{e.name}</p>
                    <p className="truncate text-[11px] text-ink/45">{v?.name} · {e.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}</p>
                  </div>
                  <ArrowUpRight size={15} className="shrink-0 text-ink/30" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Recent Activity</p>
            <Activity size={16} className="text-ink/35" />
          </div>
          <div className="space-y-1">
            {state.activities.slice(0, 8).map((a, i) => (
              <div key={a.id} className="relative flex gap-3 py-1.5">
                {i < 7 && <span className="absolute left-[7px] top-8 h-full w-px bg-brand-100" />}
                <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-brand-200 bg-white" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug text-ink/80">{a.text}</p>
                  <p className="text-[11px] text-ink/35">{a.at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team performance */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Team Performance</p>
            <Target size={16} className="text-ink/35" />
          </div>
          <div className="mb-3 flex items-end justify-between">
            <span className="text-3xl font-black text-brand-950">{taskPct}%</span>
            <span className="text-xs text-ink/45">{doneTasks}/{tasks.length} tasks done</span>
          </div>
          <Progress value={taskPct} className="mb-4" />
          <div className="space-y-3">
            {teamPerf.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink/80">{m.name}</span>
                    <span className="text-ink/45">{m.done}/{m.total}</span>
                  </div>
                  <Progress value={m.pct} color={m.pct >= 70 ? 'bg-brand-600' : 'bg-gold-500'} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task overview strip */}
      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-brand-950">Task Overview</p>
          <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">View board <ArrowRight size={13} /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {state.tasks.slice(0, 4).map((t) => {
            const assignee = state.staff.find((m) => m.id === t.assigneeId)
            const ev = state.events.find((e) => e.id === t.eventId)
            return (
              <div key={t.id} className="rounded-xl border border-brand-100 p-3.5 hover:border-brand-300 hover:shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <Badge status={t.status} label={t.status.replace('-', ' ')} />
                  <Badge status={t.priority} label={t.priority} />
                </div>
                <p className="text-[13px] font-semibold leading-snug text-brand-950">{t.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-ink/45">{ev?.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-ink/40">Due {t.due}</span>
                  <Avatar name={assignee?.name} initials={assignee?.initials} color={assignee?.color} size="xs" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard