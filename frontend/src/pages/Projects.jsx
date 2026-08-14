import React, { useState } from 'react'
import {
  KanbanSquare, Plus, CalendarDays, Calendar, Grid3x3, Users, MessageSquare,
  Paperclip, Clock3, ChevronRight, ArrowRight, LayoutGrid,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Avatar, Modal, Field, PriorityDot, SearchBox, Toast, EmptyState, Segmented, Th, Td } from '../components/ui'
import { fmt, todayISO } from '../store/data'
import { textRequired, optional, dateRequired, validate } from '../store/validation'

const columns = [
  { key: 'todo', label: 'To Do', color: 'text-slate-500', bg: 'bg-slate-100' },
  { key: 'in-progress', label: 'In Progress', color: 'text-brand-700', bg: 'bg-brand-100' },
  { key: 'review', label: 'In Review', color: 'text-gold-700', bg: 'bg-gold-100' },
  { key: 'done', label: 'Done', color: 'text-brand-700', bg: 'bg-brand-100' },
]

const milestones = [
  { id: 'ms1', title: 'Planning complete', eventId: 'ev1', due: '2026-08-08', pct: 100 },
  { id: 'ms2', title: 'Production ready', eventId: 'ev1', due: '2026-08-14', pct: 55 },
  { id: 'ms3', title: 'Event delivery', eventId: 'ev1', due: '2026-08-18', pct: 20 },
  { id: 'ms4', title: 'Post-event report', eventId: 'ev5', due: '2026-07-28', pct: 100 },
]

export default function Projects() {
  const { state, updateTask, addTask } = useData()
  const [view, setView] = useState('board')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [detail, setDetail] = useState(null)
  const [workloadOpen, setWorkloadOpen] = useState(false)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const workload = state.staff
    .map((m) => ({ member: m, count: state.tasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)

  const moveTask = (id, direction) => {
    const order = columns.map((c) => c.key)
    const t = state.tasks.find((x) => x.id === id)
    const idx = order.indexOf(t.status)
    const next = order[idx + direction]
    if (next) {
      updateTask(id, { status: next })
      show(`Task moved to "${columns.find((c) => c.key === next).label}"`)
    }
  }

const submit = () => {
    const res = validate(form, { title: [textRequired('Task title', { min: 3, max: 120 })], due: [optional(dateRequired('Due date'))], progress: [optional((v) => { const n = Number(v); if (v === '' || v === null || v === undefined) return ''; if (isNaN(n) || n < 0 || n > 100) return 'Progress must be 0–100'; return '' })] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addTask({ ...form, assigneeId: form.assigneeId || 'st2', priority: form.priority || 'medium', status: form.status || 'todo', eventId: form.eventId || 'ev1', progress: Number(form.progress) || 0, description: form.description || '' })
    show(`${form.title} added to board`)
    setOpen(false); setForm({}); setErrors({})
  }

  const total = state.tasks.length
  const done = state.tasks.filter((t) => t.status === 'done').length
  const activeStaff = new Set(state.tasks.map((t) => t.assigneeId))

  const [cal] = React.useState(() => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < first; i++) cells.push(null)
    for (let d = 1; d <= days; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  })
  const tasksByDay = {}
  state.tasks.forEach((t) => { if (t.due) (tasksByDay[t.due] = tasksByDay[t.due] || []).push(t) })

  return (
    <div>
      <PageHeader
        title="Project & Task Management"
        subtitle="Plan milestones, assign work and track delivery."
        icon={KanbanSquare}
        actions={
          <>
            <button className="btn-outline" onClick={() => setView('milestones')}><CalendarDays size={15} /> Milestones</button>
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Task</button>
          </>
        }
      />

      {/* Status strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total Tasks', total, 'bg-brand-800 text-white'], ['In Progress', state.tasks.filter((t) => t.status === 'in-progress').length, 'bg-gold-100 text-gold-700'], ['In Review', state.tasks.filter((t) => t.status === 'review').length, 'bg-brand-100 text-brand-800'], ['Completed', done, 'bg-brand-100 text-brand-800']].map(([l, v, cls]) => (
          <div key={l} className={`card flex items-center justify-between px-4 py-3`}>
            <p className="text-[13px] font-semibold text-ink/55">{l}</p>
            <span className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-black ${cls}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={[{ value: 'board', label: 'Kanban' }, { value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }, { value: 'milestones', label: 'Milestones' }]} />
        <button className="text-xs font-semibold text-brand-700 hover:text-brand-900" onClick={() => setWorkloadOpen(true)}>Team Workload →</button>
      </div>

      {view === 'board' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => {
            const tasks = state.tasks.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="rounded-xl bg-brand-50/60 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.bg}`} />
                    <span className="text-xs font-bold text-brand-950">{col.label}</span>
                    <span className="chip bg-white text-ink/50 ring-1 ring-brand-100">{tasks.length}</span>
                  </div>
                  <button onClick={() => { setErrors({}); setOpen(true); setForm({ ...form, status: col.key }) }} className="rounded-md p-1 text-ink/35 hover:bg-white hover:text-brand-800"><Plus size={15} /></button>
                </div>
                <div className="space-y-2.5">
                  {tasks.map((t) => {
                    const a = state.staff.find((m) => m.id === t.assigneeId)
                    const ev = state.events.find((e) => e.id === t.eventId)
                    const overdue = t.due < todayISO() && t.status !== 'done'
                    return (
                      <div key={t.id} onClick={() => setDetail(t)} className="cursor-pointer rounded-xl border border-brand-100 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/50"><PriorityDot level={t.priority} /> {t.priority}</span>
                          <Badge status={t.priority} label={col.label} />
                        </div>
                        <p className="text-sm font-semibold leading-snug text-brand-950">{t.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-ink/45">{ev?.name}</p>
                        {typeof t.progress === 'number' && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={t.progress} className="flex-1" color={t.progress >= 100 ? 'bg-brand-700' : t.progress >= 50 ? 'bg-brand-600' : 'bg-gold-500'} />
                            <span className="text-[11px] font-bold text-brand-800">{t.progress}%</span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-brand-50 pt-2.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? 'text-red-600' : 'text-ink/45'}`}><Clock3 size={12} /> {overdue ? 'Overdue' : t.due}</span>
                          <div className="flex items-center gap-1">
                            <span className="flex items-center gap-1 text-[11px] text-ink/40"><MessageSquare size={12} /> {t.comments}</span>
                            <Avatar name={a?.name} initials={a?.initials} color={a?.color} size="xs" />
                          </div>
                        </div>
                        {t.status !== 'done' && (
                          <div className="mt-2 flex gap-1">
                            {t.status !== 'todo' && <button onClick={(e) => { e.stopPropagation(); moveTask(t.id, -1) }} className="btn-ghost !py-1 text-[11px]">←</button>}
                            {t.status !== 'done' && <button onClick={(e) => { e.stopPropagation(); moveTask(t.id, 1) }} className="btn-ghost !py-1 text-[11px]">→</button>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {tasks.length === 0 && <div className="rounded-lg border border-dashed border-brand-200 p-4 text-center text-xs text-ink/35">Empty</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'list' && (
        <div className="card">
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Task</Th><Th>Event</Th><Th>Priority</Th><Th>Assignee</Th><Th>Status</Th><Th>Progress</Th><Th>Due</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {state.tasks.map((t) => {
                const a = state.staff.find((m) => m.id === t.assigneeId)
                return (
                  <tr key={t.id} onClick={() => setDetail(t)} className="cursor-pointer hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{t.title}</Td>
                    <Td className="text-ink/60">{state.events.find((e) => e.id === t.eventId)?.name}</Td>
                    <Td><Badge status={t.priority} label={t.priority} /></Td>
                    <Td><span className="flex items-center gap-2"><Avatar {...avatarMini(a)} size="xs" /> {a?.name}</span></Td>
                    <Td><Badge status={t.status} label={t.status.replace('-', ' ')} /></Td>
                    <Td>
                      <div className="flex w-28 items-center gap-2">
                        <Progress value={t.progress || 0} className="flex-1" color={(t.progress || 0) >= 100 ? 'bg-brand-700' : 'bg-brand-600'} />
                        <span className="text-[11px] font-bold text-brand-800">{t.progress || 0}%</span>
                      </div>
                    </Td>
                    <Td className="text-ink/50">{t.due}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'calendar' && (
        <div className="card p-5">
          <p className="mb-4 text-xs font-semibold text-ink/45">Tasks grouped by due date — click a task to open it.</p>
          <div className="grid grid-cols-7 gap-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink/40">{d}</div>
            ))}
            {cal.map((day, i) => {
              if (day === null) return <div key={'x' + i} />
              const iso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayTasks = tasksByDay[iso] || []
              const isToday = iso === todayISO()
              return (
                <div key={iso} className={`min-h-[76px] rounded-lg border p-1.5 ${isToday ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-brand-800' : 'text-ink/55'}`}>{day}</span>
                    {dayTasks.length > 0 && <span className="chip bg-brand-800 text-white !px-1.5 !py-0 text-[9px]">{dayTasks.length}</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 3).map((t) => {
                      const a = state.staff.find((m) => m.id === t.assigneeId)
                      return (
                        <button key={t.id} onClick={() => setDetail(t)} className="block w-full rounded bg-brand-100 px-1.5 py-1 text-left hover:bg-brand-200">
                          <p className="truncate text-[10px] font-semibold text-brand-800">{t.title}</p>
                          <p className="truncate text-[9px] text-ink/45">{a?.name} · {t.progress || 0}%</p>
                        </button>
                      )
                    })}
                    {dayTasks.length > 3 && <p className="text-[9px] font-semibold text-ink/40">+{dayTasks.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'milestones' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {milestones.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className={`chip ${m.pct === 100 ? 'bg-brand-100 text-brand-800' : 'bg-gold-100 text-gold-700'}`}>{m.pct === 100 ? 'Complete' : 'Active'}</span>
                <span className="text-xs text-ink/40">Due {m.due}</span>
              </div>
              <p className="font-bold text-brand-950">{m.title}</p>
              <p className="mt-1 text-xs text-ink/45">{state.events.find((e) => e.id === m.eventId)?.name}</p>
              <div className="mt-4 flex items-center gap-2">
                <Progress value={m.pct} className="flex-1" />
                <span className="text-xs font-bold text-brand-800">{m.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New task modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Task" width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title *" className="col-span-2"><input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Arrange VIP transport" />{errors.title && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.title}</p>}</Field>
          <Field label="Event"><select className="input" value={form.eventId || 'ev1'} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>{state.events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="Assignee"><select className="input" value={form.assigneeId || 'st2'} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>{state.staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="Priority"><select className="input" value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
          <Field label="Status"><select className="input" value={form.status || 'todo'} onChange={(e) => setForm({ ...form, status: e.target.value })}>{columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field>
          <Field label="Due Date"><input type="date" className="input" value={form.due || ''} onChange={(e) => setForm({ ...form, due: e.target.value })} />{errors.due && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.due}</p>}</Field>
          <Field label="Progress (%)"><input type="number" className="input" value={form.progress ?? ''} onChange={(e) => setForm({ ...form, progress: e.target.value })} placeholder="0" />{errors.progress && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.progress}</p>}</Field>
          <Field label="Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope, dependencies, acceptance criteria…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create Task</button>
        </div>
      </Modal>

      {/* Task detail */}
      {detail && state.tasks.find((t) => t.id === detail.id) && <TaskModal key={detail.id} task={{ ...state.tasks.find((t) => t.id === detail.id) }} state={state} onClose={() => setDetail(null)} show={show} updateTask={updateTask} />}

      {/* Team workload modal */}
      <Modal open={workloadOpen} onClose={() => setWorkloadOpen(false)} title="Team Workload" width="max-w-md">
        {workload.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/40">No active tasks assigned right now.</p>
        ) : (
          <div className="space-y-3">
            {workload.map((w) => (
              <div key={w.member.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                <Avatar name={w.member.name} initials={w.member.initials} color={w.member.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-950">{w.member.name}</p>
                  <p className="text-xs text-ink/45">{w.member.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(100, (w.count / Math.max(1, workload[0].count)) * 100)} className="w-24" />
                  <span className="text-sm font-black text-brand-800">{w.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}

function avatarMini(m) { return m ? { name: m.name, initials: m.initials, color: m.color } : { name: '?', initials: '?', color: 'bg-brand-400' } }

function TaskModal({ task, state, onClose, show, updateTask }) {
  const [edit, setEdit] = useState({ title: task.title || '', eventId: task.eventId || 'ev1', assigneeId: task.assigneeId || '', priority: task.priority || 'medium', status: task.status || 'todo', due: task.due || '', progress: task.progress || 0, description: task.description || '' })
  const [comments, setComments] = useState([
    'Locking stage layout with client this week.',
    'Confirmed — tracker updated.',
  ])
  const [draft, setDraft] = useState('')
  const addComment = () => {
    if (!draft.trim()) return
    setComments((c) => [...c, draft.trim()])
    setDraft('')
    show('Comment added')
  }
  const save = () => {
    const res = validate(edit, { title: [textRequired('Task title', { min: 3, max: 120 })], due: [optional(dateRequired('Due date'))] })
    if (!res.ok) { show(res.first, 'warn'); return }
    updateTask(task.id, { ...edit, progress: Number(edit.progress) || 0 })
    show('Task updated')
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-pop">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2"><Badge status={edit.priority} label={edit.priority} /><Badge status={edit.status} label={edit.status.replace('-', ' ')} /></div>
          <button onClick={onClose} className="rounded-lg p-1 text-ink/40 hover:bg-brand-50"><X /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Title *" className="col-span-2"><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Event"><select className="input" value={edit.eventId} onChange={(e) => setEdit({ ...edit, eventId: e.target.value })}>{state.events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="Assignee"><select className="input" value={edit.assigneeId} onChange={(e) => setEdit({ ...edit, assigneeId: e.target.value })}>{state.staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="Priority"><select className="input" value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
          <Field label="Status"><select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field>
          <Field label="Due Date"><input type="date" className="input" value={edit.due} onChange={(e) => setEdit({ ...edit, due: e.target.value })} /></Field>
        </div>

        <div className="mt-4 rounded-xl border border-brand-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Progress</p>
            <span className="text-sm font-black text-brand-800">{edit.progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={edit.progress}
            onChange={(e) => setEdit({ ...edit, progress: Number(e.target.value) })}
            className="w-full accent-brand-700"
          />
          <div className="mt-2"><Progress value={edit.progress} color={edit.progress >= 100 ? 'bg-brand-700' : 'bg-brand-600'} /></div>
        </div>

        <Field label="Description" className="mt-4"><textarea className="input min-h-[70px] resize-y" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>

        <p className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Comments ({comments.length})</p>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-brand-100 p-3">
          {comments.map((c, i) => (
            <p key={i} className="text-sm text-ink/70">{c}</p>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            className="flex-1 rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder="Write a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addComment()}
          />
          <button className="btn-primary" onClick={addComment}>Comment</button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-brand-50 pt-4">
          <button className="btn-outline" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function X() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
}