import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, TrendingUp, CheckCircle2, Clock3, Wallet, AlertCircle, Activity,
  Users, Target, ArrowUpRight, ArrowRight, Sparkles, Server, Database, ShieldCheck, Bell,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress, Avatar, PageHeader } from '../../components/ui'
import { fmtCompact, todayISO, revenueTrend, categorySplit } from '../../store/data'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const PIE_COLORS = ['#228b22', '#c9a227', '#9cc69c', '#175917', '#d1aa4d']

export default function AdminDashboard() {
  const { state } = useData()
  const navigate = useNavigate()

  const events = state.events
  const total = events.length
  const upcoming = events.filter((e) => e.status === 'upcoming').length
  const ongoing = events.filter((e) => e.status === 'ongoing').length
  const completed = events.filter((e) => e.status === 'completed').length

  const revenue = state.invoices.reduce((a, i) => a + i.paid, 0)
  const outstanding = state.invoices.filter((i) => i.status === 'outstanding').reduce((a, i) => a + (i.amount - i.paid), 0)
  const expenses = state.expenses.reduce((a, e) => a + e.amount, 0)
  const profit = revenue - expenses
  const totalBudget = state.events.reduce((a, e) => a + (e.budget || 0), 0)
  const totalSpent = state.events.reduce((a, e) => a + (e.spent || 0), 0)
  const budgetUsedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const totalClients = state.clients.length
  const activeClients = state.clients.filter((c) => c.status === 'active').length
  const totalStaff = state.staff.length
  const activeStaff = state.staff.filter((s) => s.status === 'active').length

  const stats = [
    { label: 'Total Revenue', value: `ETB ${fmtCompact(revenue)}`, icon: Wallet, tone: 'brand', sub: 'collected', delta: '8%' },
    { label: 'Total Events', value: total, icon: CalendarDays, tone: 'brand', sub: `${upcoming} upcoming · ${ongoing} ongoing`, delta: '12%' },
    { label: 'Completed', value: completed, icon: CheckCircle2, tone: 'gold', sub: `${total ? Math.round((completed / total) * 100) : 0}% of all events`, delta: null },
    { label: 'Total Clients', value: totalClients, icon: Users, tone: 'brand', sub: `${activeClients} active`, delta: null },
    { label: 'Outstanding', value: `ETB ${fmtCompact(outstanding)}`, icon: AlertCircle, tone: 'red', sub: 'due from clients', delta: null },
    { label: 'Net Profit', value: `ETB ${fmtCompact(Math.max(0, profit))}`, icon: TrendingUp, tone: 'gold', sub: 'after expenses', delta: '5%' },
    { label: 'Budget Pool', value: `ETB ${fmtCompact(totalBudget)}`, icon: Target, tone: 'brand', sub: `${budgetUsedPct}% utilized across events`, delta: null },
    { label: 'Staff', value: totalStaff, icon: Users, tone: 'brand', sub: `${activeStaff} active`, delta: null },
  ]

  const resourceUtil = state.resources.length > 0
    ? Math.round((state.resources.filter((r) => r.status === 'allocated' || r.status === 'booked').length / state.resources.length) * 100)
    : 0
  const venueUtil = state.venues.length > 0
    ? Math.round((state.venues.filter((v) => v.status === 'booked').length / state.venues.length) * 100)
    : 0

  const tasks = state.tasks
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const taskPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0

  const teamPerf = state.staff.map((m) => {
    const mine = tasks.filter((t) => t.assigneeId === m.id)
    const done = mine.filter((t) => t.status === 'done').length
    return { ...m, total: mine.length, done, pct: mine.length ? Math.round((done / mine.length) * 100) : 0 }
  }).sort((a, b) => b.pct - a.pct).slice(0, 5)

  const [week] = React.useState(() => {
    const out = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push({ d, iso: d.toISOString().slice(0, 10), name: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate() })
    }
    return out
  })

  // Month calendar cells for the Event Calendar widget
  const [calendar] = React.useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const first = new Date(year, month, 1).getDay() // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < first; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  })
  const eventsByDay = {}
  state.events.forEach((e) => { if (e.date) (eventsByDay[e.date] = eventsByDay[e.date] || []).push(e) })

  const meId = state.currentUserId
  const myNotifications = state.notifications.filter((n) => !n.userId || n.userId === meId).slice(0, 5)
  const notifTone = {
    alert: 'bg-red-100 text-red-600', crm: 'bg-brand-100 text-brand-700',
    inventory: 'bg-gold-100 text-gold-700', finance: 'bg-emerald-100 text-emerald-700',
    task: 'bg-sky-100 text-sky-700', budget: 'bg-emerald-100 text-emerald-700', general: 'bg-slate-100 text-slate-600',
  }

  return (
    <div>
      <PageHeader
        title="Company Overview"
        subtitle="Full-system visibility - revenue, events, staff and resource health."
        icon={Sparkles}
        actions={
          <>
            <button className="btn-outline" onClick={() => navigate('/erp/crm')}><Users size={15} /> New Client</button>
            <button className="btn-primary" onClick={() => navigate('/erp/admin/events')}><CalendarDays size={15} /> New Event</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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
                <linearGradient id="rev-admin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#228b22" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#228b22" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => [`ETB ${v}K`, 'Revenue']} />
              <Area type="monotone" dataKey="v" stroke="#228b22" strokeWidth={2.5} fill="url(#rev-admin)" />
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

      {/* Event calendar + notifications */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Event Calendar</p>
              <p className="text-xs text-ink/45">Scheduled events this month · click a day's event to open it</p>
            </div>
            <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => navigate('/erp/admin/events')}><CalendarDays size={13} /> All Events</button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink/40">{d}</div>
            ))}
            {calendar.map((day, i) => {
              if (day === null) return <div key={'x' + i} />
              const iso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsByDay[iso] || []
              const isToday = iso === todayISO()
              return (
                <div key={iso} className={`min-h-[64px] rounded-lg border p-1.5 ${isToday ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-brand-800' : 'text-ink/55'}`}>{day}</span>
                    {dayEvents.length > 0 && <span className="chip bg-brand-800 text-white !px-1.5 !py-0 text-[9px]">{dayEvents.length}</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button key={e.id} onClick={() => navigate('/erp/admin/events')} className="block w-full truncate rounded bg-brand-100 px-1 py-0.5 text-left text-[10px] font-semibold text-brand-800 hover:bg-brand-200">
                        {e.name}
                      </button>
                    ))}
                    {dayEvents.length > 2 && <p className="text-[9px] font-semibold text-ink/40">+{dayEvents.length - 2} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-brand-600" />
              <p className="font-bold text-brand-950">Notifications</p>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900" onClick={() => navigate('/erp/notifications')}>View all <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-1">
            {myNotifications.length === 0 && <p className="py-8 text-center text-sm text-ink/40">No notifications yet.</p>}
            {myNotifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-lg border border-brand-100 p-2.5 transition hover:bg-brand-50/40">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notifTone[n.type] || notifTone.general}`}><Bell size={14} /></span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug text-ink/80">{n.text}</p>
                  <p className="text-[11px] text-ink/35">{n.at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System health + resource utilization */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Server size={18} className="text-brand-600" />
            <p className="font-bold text-brand-950">System Health</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'Online', value: 'PostgreSQL 18', ok: true },
              { label: 'API Server', status: 'Running', value: 'Express on :4000', ok: true },
              { label: 'Auth Service', status: 'Active', value: 'JWT + Refresh', ok: true },
              { label: 'Storage', status: '42% used', value: '2.1 GB / 5 GB', ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-lg border border-brand-100 p-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.ok ? 'bg-brand-500' : 'bg-gold-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-brand-950">{s.label}</p>
                    <p className="text-[11px] text-ink/45">{s.value}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand-700">{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database size={18} className="text-brand-600" />
            <p className="font-bold text-brand-950">Resource Utilization</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink/70">Venues Booked</span>
                <span className="text-ink/50">{venueUtil}%</span>
              </div>
              <Progress value={venueUtil} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink/70">Resources Allocated</span>
                <span className="text-ink/50">{resourceUtil}%</span>
              </div>
              <Progress value={resourceUtil} color="bg-gold-500" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink/70">Task Completion</span>
                <span className="text-ink/50">{taskPct}%</span>
              </div>
              <Progress value={taskPct} color="bg-brand-600" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink/70">Client Retention</span>
                <span className="text-ink/50">{totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}%</span>
              </div>
              <Progress value={totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0} color="bg-brand-700" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Recent Activities</p>
            <Activity size={16} className="text-ink/35" />
          </div>
          <div className="space-y-1">
            {state.activities.slice(0, 7).map((a, i) => (
              <div key={a.id} className="relative flex gap-3 py-1.5">
                {i < 6 && <span className="absolute left-[7px] top-8 h-full w-px bg-brand-100" />}
                <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-brand-200 bg-white" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug text-ink/80">{a.text}</p>
                  <p className="text-[11px] text-ink/35">{a.at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team performance + staff overview */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Staff Overview</p>
            <button onClick={() => navigate('/erp/staff')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">Manage <ArrowRight size={13} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {state.staff.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-lg border border-brand-100 p-2.5">
                <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-brand-950">{m.name}</p>
                  <p className="truncate text-[10px] text-ink/45">{m.jobTitle || m.dept}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
    </div>
  )
}
