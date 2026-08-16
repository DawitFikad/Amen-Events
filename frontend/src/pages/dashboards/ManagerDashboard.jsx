import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, CheckCircle2, Clock3, AlertCircle, ArrowRight, ArrowUpRight,
  KanbanSquare, Sparkles, CalendarCheck2, Users,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress, Avatar, PageHeader } from '../../components/ui'
import { todayISO } from '../../store/data'

export default function ManagerDashboard() {
  const { state, rbac } = useData()
  const navigate = useNavigate()
  const userId = state.currentUser?.id || state.currentUserId

  // My events - events where I'm PM or on the team
  const myEvents = state.events.filter((e) =>
    e.pmId === userId || (e.team && e.team.includes(userId))
  )
  const myUpcoming = myEvents.filter((e) => e.status === 'upcoming')
  const myOngoing = myEvents.filter((e) => e.status === 'ongoing')
  const myCompleted = myEvents.filter((e) => e.status === 'completed')

  // My tasks - tasks assigned to me or on my events
  const myEventIds = new Set(myEvents.map((e) => e.id))
  const myTasks = state.tasks.filter((t) =>
    t.assigneeId === userId || myEventIds.has(t.eventId)
  )
  const todoTasks = myTasks.filter((t) => t.status === 'todo')
  const inProgressTasks = myTasks.filter((t) => t.status === 'in-progress' || t.status === 'doing')
  const doneTasks = myTasks.filter((t) => t.status === 'done')
  const overdueTasks = myTasks.filter((t) => {
    if (t.status === 'done' || !t.due) return false
    return t.due < todayISO()
  })

  const stats = [
    { label: 'My Events', value: myEvents.length, icon: CalendarDays, tone: 'brand', sub: `${myOngoing.length} ongoing · ${myUpcoming.length} upcoming`, delta: null },
    { label: 'Ongoing', value: myOngoing.length, icon: Clock3, tone: 'gold', sub: 'live right now', delta: null },
    { label: 'My Tasks', value: myTasks.length, icon: KanbanSquare, tone: 'brand', sub: `${doneTasks.length} done · ${todoTasks.length} todo`, delta: null },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertCircle, tone: 'red', sub: 'needs attention', delta: null },
  ]

  // Event timeline - sorted by date
  const eventTimeline = [...myEvents].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))

  // Team members on my events
  const teamMemberIds = new Set()
  myEvents.forEach((e) => {
    if (e.pmId) teamMemberIds.add(e.pmId)
    if (e.team) e.team.forEach((id) => teamMemberIds.add(id))
  })
  const teamMembers = state.staff.filter((s) => teamMemberIds.has(s.id))

  // Upcoming deadlines - tasks due in next 7 days
  const upcomingDeadlines = myTasks
    .filter((t) => t.status !== 'done' && t.due)
    .filter((t) => {
      const due = new Date(t.due + 'T00:00')
      const now = new Date()
      const diff = (due - now) / (1000 * 60 * 60 * 24)
      return diff >= -1 && diff <= 7
    })
    .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
    .slice(0, 5)

  const [week] = useState(() => {
    const out = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push({ d, iso: d.toISOString().slice(0, 10), name: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate() })
    }
    return out
  })

  return (
    <div>
      <PageHeader
        title={`My Events`}
        subtitle="Your assigned events, tasks, team and upcoming deadlines."
        icon={Sparkles}
        actions={
          <>
            <button className="btn-outline" onClick={() => navigate('/erp/projects')}><KanbanSquare size={15} /> View Tasks</button>
            <button className="btn-primary" onClick={() => navigate('/erp/admin/events')}><CalendarDays size={15} /> New Event</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Event Timeline */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Event Timeline</p>
            <button onClick={() => navigate('/erp/admin/events')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">All events <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-3">
            {eventTimeline.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No events assigned to you yet.</div>
            ) : (
              eventTimeline.map((e) => {
                const venue = state.venues.find((v) => v.id === e.venueId)
                const client = state.clients.find((c) => c.id === e.clientId)
                const eventTasks = state.tasks.filter((t) => t.eventId === e.id)
                const eventDone = eventTasks.filter((t) => t.status === 'done').length
                const eventPct = eventTasks.length ? Math.round((eventDone / eventTasks.length) * 100) : e.progress || 0
                return (
                  <div key={e.id} className="flex items-center gap-4 rounded-xl border border-brand-100 p-3.5 hover:border-brand-300 hover:shadow-card">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                      <span className="text-[9px] font-bold uppercase">{e.date ? new Date(e.date + 'T00:00').toLocaleDateString('en', { month: 'short' }) : 'TBD'}</span>
                      <span className="text-base font-black leading-none">{e.date ? new Date(e.date + 'T00:00').getDate() : '-'}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-brand-950">{e.name}</p>
                        <Badge status={e.status} label={e.status} />
                      </div>
                      <p className="truncate text-[11px] text-ink/45">{client?.company || 'No client'} · {venue?.name || 'No venue'}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={eventPct} className="flex-1" />
                        <span className="text-[11px] font-semibold text-ink/50">{eventPct}%</span>
                      </div>
                    </div>
                    <button onClick={() => navigate('/erp/admin/events')} className="shrink-0 text-ink/30 hover:text-brand-700"><ArrowUpRight size={16} /></button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Upcoming Deadlines</p>
            <Clock3 size={16} className="text-ink/35" />
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No deadlines this week.</div>
            ) : (
              upcomingDeadlines.map((t) => {
                const ev = state.events.find((e) => e.id === t.eventId)
                const assignee = state.staff.find((s) => s.id === t.assigneeId)
                const isOverdue = t.due < todayISO()
                return (
                  <div key={t.id} className={`rounded-lg border p-3 ${isOverdue ? 'border-gold-200 bg-gold-50/50' : 'border-brand-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge status={t.status} label={t.status.replace('-', ' ')} />
                      <span className={`text-[11px] font-semibold ${isOverdue ? 'text-gold-700' : 'text-ink/45'}`}>{isOverdue ? 'Overdue' : t.due}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-brand-950">{t.title}</p>
                    <p className="text-[11px] text-ink/45 truncate">{ev?.name || 'No event'}</p>
                    {assignee && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Avatar name={assignee.name} initials={assignee.initials} color={assignee.color} size="xs" />
                        <span className="text-[11px] text-ink/50">{assignee.name}</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Team assignments + task overview */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Team Assignments</p>
            <Users size={16} className="text-ink/35" />
          </div>
          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No team members assigned.</div>
            ) : (
              teamMembers.map((m) => {
                const memberTasks = myTasks.filter((t) => t.assigneeId === m.id)
                const memberDone = memberTasks.filter((t) => t.status === 'done').length
                const memberPct = memberTasks.length ? Math.round((memberDone / memberTasks.length) * 100) : 0
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink/80">{m.name}</span>
                        <span className="text-ink/45">{memberDone}/{memberTasks.length} tasks</span>
                      </div>
                      <Progress value={memberPct} color={memberPct >= 70 ? 'bg-brand-600' : 'bg-gold-500'} className="mt-1" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">My Tasks</p>
            <button onClick={() => navigate('/erp/projects')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">View board <ArrowRight size={13} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-brand-50 p-3 text-center">
              <p className="text-2xl font-black text-brand-700">{todoTasks.length}</p>
              <p className="text-[11px] text-ink/50">To Do</p>
            </div>
            <div className="rounded-lg bg-gold-50 p-3 text-center">
              <p className="text-2xl font-black text-gold-700">{inProgressTasks.length}</p>
              <p className="text-[11px] text-ink/50">In Progress</p>
            </div>
            <div className="rounded-lg bg-brand-100 p-3 text-center">
              <p className="text-2xl font-black text-brand-800">{doneTasks.length}</p>
              <p className="text-[11px] text-ink/50">Done</p>
            </div>
          </div>
          <div className="space-y-2">
            {myTasks.filter((t) => t.status !== 'done').slice(0, 4).map((t) => {
              const ev = state.events.find((e) => e.id === t.eventId)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-2.5">
                  <Badge status={t.priority} label={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand-950">{t.title}</p>
                    <p className="truncate text-[11px] text-ink/45">{ev?.name || 'No event'} · Due {t.due || 'TBD'}</p>
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
