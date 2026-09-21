import React, { useState } from 'react'
import {
  ClipboardList, Truck, Mic2, Coffee, Users, MapPin, Package, Handshake,
  Plus, CheckCircle2, Circle, CalendarClock, ArrowRight, ArrowLeft,
  KanbanSquare, UserCog, Sparkles, Presentation, FileCheck2, Send, ShieldCheck,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import {
  PageHeader, Badge, Progress, Segmented, Toast, EmptyState, Avatar,
  Modal, Field, StatCard,
} from '../components/ui'
import { textRequired, dateRequired, optional, validate } from '../store/validation'

const toMin = (t) => {
  const [h, m] = String(t || '00:00').split(':').map(Number)
  return h * 60 + (Number.isNaN(m) ? 0 : m)
}
const toHM = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const taskOrder = ['todo', 'in-progress', 'review', 'done']
const taskCols = [
  { key: 'todo', label: 'To Do', bg: 'bg-slate-200' },
  { key: 'in-progress', label: 'In Progress', bg: 'bg-gold-500' },
  { key: 'review', label: 'In Review', bg: 'bg-brand-500' },
  { key: 'done', label: 'Done', bg: 'bg-brand-700' },
]

const rndType = {
  setup: { icon: Truck, cls: 'bg-gold-100 text-gold-700' },
  brief: { icon: Users, cls: 'bg-sky-100 text-sky-700' },
  session: { icon: Presentation, cls: 'bg-brand-100 text-brand-700' },
  keynote: { icon: Mic2, cls: 'bg-brand-100 text-brand-700' },
  panel: { icon: Users, cls: 'bg-brand-100 text-brand-700' },
  workshop: { icon: UserCog, cls: 'bg-brand-100 text-brand-700' },
  fireside: { icon: Mic2, cls: 'bg-brand-100 text-brand-700' },
  networking: { icon: Coffee, cls: 'bg-gold-100 text-gold-700' },
  break: { icon: Coffee, cls: 'bg-gold-100 text-gold-700' },
  loadout: { icon: Truck, cls: 'bg-red-100 text-red-700' },
}

export default function Operations() {
  const {
    state, setEventTeam, allocateResource, setEventSuppliers,
    toggleChecklist, addChecklistItem, addTask, updateTask,
    addApprovalRequest, addNotification,
  } = useData()
  const [view, setView] = useState('rundown')
  const [toast, setToast] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [checkAdd, setCheckAdd] = useState('')
  const [vendorPicker, setVendorPicker] = useState(false)
  const [personPicker, setPersonPicker] = useState(false)
  const [allocOpen, setAllocOpen] = useState(false)
  const [allocForm, setAllocForm] = useState({})
  const [errors, setErrors] = useState({})
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({})
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyForm, setVerifyForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const events = [...state.events].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  const active = events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
  const currentId = selectedId || active[0]?.id || events[0]?.id || ''
  const ev = state.events.find((e) => e.id === currentId)

  const venue = ev ? state.venues.find((v) => v.id === ev.venueId) : null
  const checklist = state.eventChecklists.filter((c) => c.eventId === currentId)
  const doneCount = checklist.filter((c) => c.done).length
  const suppliers = state.eventSuppliers.filter((s) => s.eventId === currentId)
  const supVendorIds = suppliers.map((s) => s.vendorId)
  const teamIds = ev?.team?.length ? ev.team : (ev?.pmId ? [ev.pmId] : [])
  const allocations = (ev?.allocations || []).map((a) => ({ ...a, resource: state.resources.find((r) => r.id === a.resourceId) }))
  const openTasks = state.tasks.filter((t) => t.eventId === currentId)

  // ── Run of show ──────────────────────────────────────────────
  const isConference = ev?.id === 'ev1'
  const buildRundown = () => {
    if (!ev) return []
    const start = toMin(ev.time) || 540
    const end = toMin(ev.endTime) || start + 480
    const blocks = []
    blocks.push({ time: toHM(start - 120), label: 'Load-in & Setup', type: 'setup', note: 'Equipment delivery, staging & branding install' })
    blocks.push({ time: toHM(start - 60), label: 'Crew Briefing', type: 'brief', note: 'Roles, safety & run-of-show walkthrough' })
    blocks.push({ time: ev.time, label: 'Doors Open / Registration', type: 'setup', note: `${ev.capacity?.toLocaleString?.() || '-'} expected guests` })
    if (isConference) {
      state.sessions.forEach((s) => blocks.push({ time: s.time, label: s.session, type: s.type, note: s.venue }))
      blocks.push({ time: toHM(end - 45), label: 'Closing Remarks', type: 'session', note: 'Wrap-up & thanks' })
    } else {
      const mid = Math.floor((start + 105 + end - 90) / 2)
      blocks.push({ time: toHM(start + 45), label: 'Opening & Welcome', type: 'session', note: 'Host welcome & logistics briefing' })
      blocks.push({ time: toHM(start + 105), label: 'Main Program', type: 'session', note: 'Content, speakers & entertainment' })
      blocks.push({ time: toHM(mid), label: 'Refreshment Break', type: 'break', note: 'Catering & comfort break' })
      blocks.push({ time: toHM(end - 90), label: 'Closing Remarks', type: 'session', note: 'Wrap-up & thanks' })
      blocks.push({ time: toHM(end - 30), label: 'Networking', type: 'networking', note: 'Guests mingle & photos' })
    }
    blocks.push({ time: toHM(end + 60), label: 'Load-out & Teardown', type: 'loadout', note: 'Return assets, clean & hand over' })
    return blocks.sort((a, b) => toMin(a.time) - toMin(b.time))
  }

  // ── Checklist ────────────────────────────────────────────────
  const addItem = () => {
    if (!checkAdd.trim()) { show('Enter a checklist item', 'warn'); return }
    addChecklistItem(currentId, checkAdd.trim())
    setCheckAdd('')
    show('Checklist item added')
  }

  // ── Coordination ─────────────────────────────────────────────
  const saveVendors = (ids) => {
    setEventSuppliers(currentId, ids)
    setVendorPicker(false)
    show('Suppliers updated')
  }
  const assignCrew = (ids) => {
    setEventTeam(currentId, ids)
    setPersonPicker(false)
    show('Crew roster updated')
  }
  const allocSchema = { resourceId: [textRequired('Resource')], qty: [optional((v) => { const n = Number(v); if (v === '' || v === null || v === undefined) return ''; if (isNaN(n) || n < 1) return 'Quantity must be at least 1'; return '' })] }
  const submitAlloc = () => {
    const res = validate(allocForm, allocSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    allocateResource(allocForm.resourceId, currentId, Number(allocForm.qty) || 1)
    show('Resource allocated to event')
    setAllocOpen(false); setAllocForm({}); setErrors({})
  }

  // ── Crew ─────────────────────────────────────────────────────
  const onShift = state.staff.filter((m) => m.id && m.status !== 'on-leave' && m.status !== 'terminated')

  // ── Tasks ────────────────────────────────────────────────────
  const taskSchema = { title: [textRequired('Task title', { min: 3, max: 120 })], due: [optional(dateRequired('Due date'))] }
  const submitTask = () => {
    const res = validate(taskForm, taskSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addTask({ ...taskForm, eventId: currentId, assigneeId: taskForm.assigneeId || 'st5', priority: taskForm.priority || 'medium', status: taskForm.status || 'todo', progress: Number(taskForm.progress) || 0, description: taskForm.description || '' })
    show('Task added to board')
    setTaskOpen(false); setTaskForm({}); setErrors({})
  }
  const moveTask = (t, dir) => {
    const next = taskOrder[taskOrder.indexOf(t.status) + dir]
    if (next) { updateTask(t.id, { status: next }); show(`Moved to "${taskCols.find((c) => c.key === next).label}"`) }
  }

  // ── Verification to admin ────────────────────────────────────
  const verifySchema = { entityName: [textRequired('Description', { min: 3, max: 160 })] }
  const submitVerify = () => {
    const res = validate(verifyForm, verifySchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    const rec = addApprovalRequest({
      type: 'operational',
      entityName: verifyForm.entityName.trim(),
      note: verifyForm.note || '',
      amount: Number(verifyForm.amount) || 0,
      eventId: currentId,
    })
    addNotification(`New verification request from operations: "${rec.entityName}"`, 'alert', {})
    show('Verification request sent to admin')
    setVerifyOpen(false); setVerifyForm({}); setErrors({})
  }
  const myRequests = state.approvals.filter((a) => a.submittedBy === state.currentUserId)

  const eventSelect = (
    <select className="input !w-auto !py-2 pr-8 max-w-[240px]" value={currentId} onChange={(e) => setSelectedId(e.target.value)}>
      {events.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.date}</option>)}
    </select>
  )

  return (
    <div>
      <PageHeader
        title="Operations Control Room"
        subtitle="Run-of-show, logistics checklists, coordination, crew & task board."
        icon={Sparkles}
        actions={
          <>
            {eventSelect}
            <button className="btn-primary" onClick={() => setTaskOpen(true)}><Plus size={15} /> New Task</button>
          </>
        }
      />

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Events" value={active.length} icon={CalendarClock} tone="brand" sub="upcoming / ongoing" />
        <StatCard label="Checklist Progress" value={`${doneCount}/${checklist.length}`} icon={CheckCircle2} tone="gold" sub={ev?.name ? `${Math.round((doneCount / (checklist.length || 1)) * 100)}% ready` : 'no items'} />
        <StatCard label="Crew Assigned" value={`${teamIds.length}/${onShift.length}`} icon={Users} tone="sky" sub="staff on this event" />
        <StatCard label="Open Tasks" value={openTasks.filter((t) => t.status !== 'done').length} icon={KanbanSquare} tone="red" sub={`${openTasks.length} total for event`} />
      </div>

      {/* Tool tabs */}
      <div className="mb-5">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'rundown', label: 'Run of Show' },
            { value: 'checklist', label: 'Checklist' },
            { value: 'coordination', label: 'Coordination' },
            { value: 'crew', label: 'Crew Board' },
            { value: 'tasks', label: 'Task Board' },
            { value: 'verify', label: 'Verification' },
          ]}
        />
      </div>

      {!ev ? (
        <EmptyState icon={ClipboardList} title="No events yet" subtitle="Create an event first to start operational planning." />
      ) : (
        <>
          {/* Event summary strip */}
          <div className="mb-5 card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-brand-950">{ev.name}</p>
                <Badge status={ev.status} label={ev.status} />
              </div>
              <p className="text-xs text-ink/50 mt-0.5">{ev.date} · {ev.time} → {ev.endTime} · {venue?.name || 'No venue'}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink/55">
              <span className="inline-flex items-center gap-1.5"><Users size={13} /> {ev.capacity?.toLocaleString?.() || '-'} capacity</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {venue?.city || '-'}</span>
              <span className="inline-flex items-center gap-1.5"><Package size={13} /> {allocations.length} assets</span>
              <span className="inline-flex items-center gap-1.5"><Handshake size={13} /> {suppliers.length} vendors</span>
            </div>
          </div>

          {view === 'rundown' && (
            <RunOfShow ev={ev} blocks={buildRundown()} suppliersCount={supVendorIds.length} allocationsCount={allocations.length} />
          )}

          {view === 'checklist' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="card p-5 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-950">Logistics Checklist</p>
                    <p className="text-xs text-ink/50 mt-0.5">{doneCount} of {checklist.length} items done</p>
                  </div>
                  <span className="text-xl font-black text-brand-700">{Math.round((doneCount / (checklist.length || 1)) * 100)}%</span>
                </div>
                <Progress value={(doneCount / (checklist.length || 1)) * 100} className="mb-4" />
                <div className="space-y-2">
                  {checklist.length === 0 && <p className="py-4 text-center text-sm text-ink/40">No checklist items yet — add below.</p>}
                  {checklist.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleChecklist(currentId, c.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-brand-100 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      {c.done
                        ? <CheckCircle2 size={20} className="shrink-0 text-brand-600" />
                        : <Circle size={20} className="shrink-0 text-ink/25" />}
                      <span className={`flex-1 text-sm ${c.done ? 'text-ink/40 line-through' : 'font-medium text-brand-950'}`}>{c.label}</span>
                      <Badge status={c.done ? 'done' : 'todo'} label={c.done ? 'Done' : 'Open'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="card p-5 self-start">
                <p className="mb-3 font-bold text-brand-950">Add Item</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="e.g. Backdrop install"
                    value={checkAdd}
                    onChange={(e) => setCheckAdd(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
                  />
                  <button className="btn-primary shrink-0" onClick={addItem}><Plus size={15} /></button>
                </div>
                <p className="mt-4 text-xs text-ink/45 leading-relaxed">
                  Operations-specific preparation for this event. Items are shared with the event team.
                </p>
              </div>
            </div>
          )}

          {view === 'coordination' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Venue */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><MapPin size={16} /></span>
                    <p className="font-bold text-brand-950">Venue</p>
                  </div>
                  <Badge status={venue?.status || 'available'} label={venue ? (venue.status || 'available') : 'No venue'} />
                </div>
                {venue ? (
                  <>
                    <p className="font-semibold text-brand-950">{venue.name}</p>
                    <p className="text-xs text-ink/50">{venue.address}</p>
                    <div className="mt-3 space-y-1.5 text-xs text-ink/55">
                      <p>Capacity: <b className="text-ink">{venue.capacity?.toLocaleString?.()}</b></p>
                      <p>Parking: <b className="text-ink">{venue.parking} spots</b></p>
                      <p>Contact: <b className="text-ink">{venue.contact}</b></p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(venue.equipment || []).slice(0, 4).map((q) => <span key={q} className="chip bg-brand-50 text-brand-700">{q}</span>)}
                    </div>
                  </>
                ) : <p className="text-sm text-ink/40">Assign a venue to this event.</p>}
              </div>

              {/* Resource allocations */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Package size={16} /></span>
                    <p className="font-bold text-brand-950">Asset Allocation</p>
                  </div>
                  <button className="btn-ghost !py-1 text-xs" onClick={() => { setAllocOpen(true); setErrors({}) }}><Plus size={13} /> Allocate</button>
                </div>
                {allocations.length === 0 ? (
                  <p className="text-sm text-ink/40">No assets allocated to this event.</p>
                ) : (
                  <div className="space-y-2">
                    {allocations.map((a) => (
                      <div key={a.resourceId} className="flex items-center gap-3 rounded-lg border border-brand-100 px-3 py-2.5">
                        <Package size={15} className="text-brand-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-brand-950">{a.resource?.name}</p>
                          <p className="text-[11px] text-ink/45">{a.resource?.category || 'Asset'}</p>
                        </div>
                        <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">× {a.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendors */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Handshake size={16} /></span>
                    <p className="font-bold text-brand-950">Vendors & Suppliers</p>
                  </div>
                  <button className="btn-ghost !py-1 text-xs" onClick={() => setVendorPicker(true)}><Plus size={13} /> Add</button>
                </div>
                {suppliers.length === 0 ? (
                  <p className="text-sm text-ink/40">No vendors assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {suppliers.map((s) => {
                      const v = state.vendors.find((x) => x.id === s.vendorId)
                      return (
                        <div key={s.vendorId} className="flex items-center gap-3 rounded-lg border border-brand-100 px-3 py-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">{v?.name?.slice(0, 2) || '??'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-950">{v?.name}</p>
                            <p className="text-[11px] text-ink/45">{v?.type} · {v?.contact}</p>
                          </div>
                          <button
                            className="text-2xl leading-none text-ink/25 hover:text-red-500"
                            title="Remove vendor"
                            onClick={() => saveVendors(supVendorIds.filter((id) => id !== s.vendorId))}
                          >×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'crew' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Assigned crew */}
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-950">Assigned Crew</p>
                    <p className="text-xs text-ink/50 mt-0.5">{teamIds.length} rostered for this event</p>
                  </div>
                  <button className="btn-ghost !py-1 text-xs" onClick={() => setPersonPicker(true)}><Plus size={13} /> Add</button>
                </div>
                {teamIds.length === 0 ? (
                  <p className="text-sm text-ink/40">No crew assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {teamIds.map((id) => {
                      const m = state.staff.find((x) => x.id === id)
                      if (!m) return null
                      return (
                        <div key={id} className="flex items-center gap-3 rounded-lg border border-brand-100 px-3 py-2.5">
                          <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" img={m.avatar} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-950">{m.name}</p>
                            <p className="text-[11px] text-ink/45">{m.role} · {m.dept}</p>
                          </div>
                          <Badge status={m.status || 'active'} label={m.status || 'active'} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Shift board */}
              <div className="card p-5 xl:col-span-2">
                <div className="mb-3">
                  <p className="font-bold text-brand-950">Shift Board — Upcoming Events</p>
                  <p className="text-xs text-ink/50 mt-0.5">Who is rostered on each upcoming event</p>
                </div>
                <div className="space-y-2">
                  {active.length === 0 && <p className="py-4 text-center text-sm text-ink/40">No upcoming events.</p>}
                  {active.map((e) => {
                    const ids = e.team?.length ? e.team : (e.pmId ? [e.pmId] : [])
                    return (
                      <div key={e.id} className="rounded-xl border border-brand-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-brand-950">{e.name}</p>
                            <p className="text-[11px] text-ink/45">{e.date} · {e.time}</p>
                          </div>
                          <Badge status={e.status} label={e.status} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {ids.length === 0 && <span className="text-xs text-ink/40 italic">No crew rostered</span>}
                          {ids.map((id) => {
                            const m = state.staff.find((x) => x.id === id)
                            return m
                              ? <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-800"><Avatar name={m.name} initials={m.initials} color={m.color} size="xs" img={m.avatar} /> {m.name.split(' ')[0]}</span>
                              : null
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {view === 'tasks' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink/55">{openTasks.length} operation tasks for this event.</p>
                <button className="btn-outline" onClick={() => setTaskOpen(true)}><Plus size={15} /> New Task</button>
              </div>
              {openTasks.length === 0 ? (
                <EmptyState icon={KanbanSquare} title="No tasks for this event" subtitle="Create operational tasks to track delivery." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {taskCols.map((col) => {
                    const tasks = openTasks.filter((t) => t.status === col.key)
                    return (
                      <div key={col.key} className="rounded-xl bg-brand-50/60 p-3">
                        <div className="mb-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${col.bg}`} />
                            <p className="text-[13px] font-bold text-brand-950">{col.label}</p>
                          </div>
                          <span className="text-xs font-bold text-ink/40">{tasks.length}</span>
                        </div>
                        <div className="space-y-2">
                          {tasks.map((t) => {
                            const assignee = state.staff.find((s) => s.id === t.assigneeId)
                            return (
                              <div key={t.id} className="card !p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="flex-1 text-sm font-semibold text-brand-950 leading-snug">{t.title}</p>
                                  <div className="flex items-center gap-1">
                                    <button className="btn-ghost !px-1.5 !py-0.5 text-xs" disabled={taskOrder.indexOf(t.status) === 0} onClick={() => moveTask(t, -1)}><ArrowLeft size={13} /></button>
                                    <button className="btn-ghost !px-1.5 !py-0.5 text-xs" disabled={taskOrder.indexOf(t.status) === taskOrder.length - 1} onClick={() => moveTask(t, 1)}><ArrowRight size={13} /></button>
                                  </div>
                                </div>
                                {t.description && <p className="mt-1 text-xs text-ink/50 line-clamp-2">{t.description}</p>}
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    {assignee ? <Avatar name={assignee.name} initials={assignee.initials} color={assignee.color} size="xs" img={assignee.avatar} /> : null}
                                    <span className="text-[11px] text-ink/45">{t.progress || 0}%</span>
                                  </div>
                                  {t.due && <span className="text-[11px] font-semibold text-ink/40">due {t.due}</span>}
                                </div>
                              </div>
                            )
                          })}
                          {tasks.length === 0 && <p className="px-1 py-3 text-xs text-ink/35 italic">Empty column</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'verify' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="card p-5 self-start">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Send size={16} /></span>
                  <div>
                    <p className="font-bold text-brand-950">Request Verification</p>
                    <p className="text-xs text-ink/50">Send an operational check to admin for approval.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Field label="What needs verification? *">
                    <textarea
                      className="input min-h-[90px]"
                      placeholder="e.g. Run-of-show finalised for EthFinTech summit & crew briefed, request sign-off…"
                      value={verifyForm.entityName || ''}
                      onChange={(e) => setVerifyForm({ ...verifyForm, entityName: e.target.value })}
                    />
                  </Field>
                  <Field label="Amount (ETB, optional)">
                    <input className="input" type="number" min="0" placeholder="0" value={verifyForm.amount || ''} onChange={(e) => setVerifyForm({ ...verifyForm, amount: e.target.value })} />
                  </Field>
                  <Field label="Note">
                    <input className="input" placeholder="Optional note to admin" value={verifyForm.note || ''} onChange={(e) => setVerifyForm({ ...verifyForm, note: e.target.value })} />
                  </Field>
                  <button className="btn-primary w-full" onClick={submitVerify}><ShieldCheck size={15} /> Send to Admin</button>
                </div>
              </div>
              <div className="card p-5 xl:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-950">My Verification Requests</p>
                    <p className="text-xs text-ink/50 mt-0.5">{myRequests.length} submitted · {myRequests.filter((r) => r.status === 'pending').length} awaiting admin</p>
                  </div>
                  <FileCheck2 size={18} className="text-ink/30" />
                </div>
                {myRequests.length === 0 ? (
                  <EmptyState icon={FileCheck2} title="No requests yet" subtitle="Use the form to send a verification request to admin." />
                ) : (
                  <div className="space-y-2">
                    {myRequests.map((r) => (
                      <div key={r.id} className="flex items-start gap-3 rounded-xl border border-brand-100 px-4 py-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><ShieldCheck size={15} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-brand-950">{r.entityName}</p>
                            <Badge status={r.status} label={r.status === 'revision_requested' ? 'Revision' : r.status} />
                          </div>
                          <p className="text-[11px] text-ink/45 mt-0.5">
                            {state.events.find((e) => e.id === r.eventId)?.name || 'Operations'} · {r.createdAt}
                            {r.amount > 0 && ` · ETB ${r.amount.toLocaleString()}`}
                          </p>
                          {r.reviewNote && <p className="mt-1 text-xs text-ink/55">Admin note: "{r.reviewNote}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Allocate resource modal */}
      <Modal open={allocOpen} onClose={() => setAllocOpen(false)} title="Allocate Asset">
        <div className="space-y-3">
          <Field label="Asset *">
            <select className="input" value={allocForm.resourceId || ''} onChange={(e) => { setAllocForm({ ...allocForm, resourceId: e.target.value }); if (errors.resourceId) setErrors({ ...errors, resourceId: undefined }) }}>
              <option value="">Select asset…</option>
              {state.resources.filter((r) => r.status !== 'retired').map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.qty - r.allocated} available)</option>
              ))}
            </select>
            {errors.resourceId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.resourceId}</p>}
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" min="1" value={allocForm.qty || ''} placeholder="1" onChange={(e) => setAllocForm({ ...allocForm, qty: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-outline" onClick={() => setAllocOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitAlloc}>Allocate</button>
          </div>
        </div>
      </Modal>

      {/* Vendor picker */}
      <Modal open={vendorPicker} onClose={() => setVendorPicker(false)} title="Assign Vendors">
        <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
          {state.vendors.map((v) => {
            const checked = supVendorIds.includes(v.id)
            return (
              <button
                key={v.id}
                onClick={() => saveVendors(checked ? supVendorIds.filter((id) => id !== v.id) : [...supVendorIds, v.id])}
                className="flex w-full items-center gap-3 rounded-xl border border-brand-100 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${checked ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'}`}>{v.name.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{v.name}</p>
                  <p className="text-[11px] text-ink/45">{v.type} · ★ {v.rating}</p>
                </div>
                {checked && <CheckCircle2 size={18} className="text-brand-600" />}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Crew picker */}
      <Modal open={personPicker} onClose={() => setPersonPicker(false)} title="Add Crew Member">
        <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
          {onShift.map((m) => {
            const checked = teamIds.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => assignCrew(checked ? teamIds.filter((id) => id !== m.id) : [...teamIds, m.id])}
                className="flex w-full items-center gap-3 rounded-xl border border-brand-100 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" img={m.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{m.name}</p>
                  <p className="text-[11px] text-ink/45">{m.role} · {m.dept}</p>
                </div>
                {checked && <CheckCircle2 size={18} className="text-brand-600" />}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* New task modal */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="New Operational Task">
        <div className="space-y-3">
          <Field label="Task title *">
            <input className="input" value={taskForm.title || ''} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Verify generator fuel levels" />
          </Field>
          <Field label="Assign to">
            <select className="input" value={taskForm.assigneeId || 'st5'} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
              <option value="st5">Sara Ahmed — Logistics Lead</option>
              <option value="st6">Mekonnen Assefa — Vendor Liaison</option>
              <option value="st8">Bereket Tesfaye — Technician</option>
              <option value="st3">Selam Bekele — Event Coordinator</option>
              <option value="st2">Dawit Mengistu — Project Manager</option>
              <option value="st1">Hana Tadesse — Director</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select className="input" value={taskForm.priority || 'medium'} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Due date">
              <input className="input" type="date" value={taskForm.due || ''} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-outline" onClick={() => setTaskOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitTask}>Add Task</button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}

function RunOfShow({ ev, blocks, suppliersCount, allocationsCount }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Timeline */}
      <div className="card p-5 xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-brand-950">Run of Show</p>
            <p className="text-xs text-ink/50 mt-0.5">{ev.date} · generated from {ev.time} → {ev.endTime}</p>
          </div>
          <CalendarClock size={18} className="text-ink/30" />
        </div>
        <div className="relative pl-2">
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-brand-100" />
          <div className="space-y-0">
            {blocks.map((b, i) => {
              const spec = rndType[b.type] || rndType.session
              const Icon = spec.icon
              return (
                <div key={i} className="relative flex gap-4 pb-1">
                  <div className="relative z-10 flex flex-col items-center gap-1.5 pt-1">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${spec.cls}`}><Icon size={14} /></span>
                    {i < blocks.length - 1 && <span className="w-px flex-1 bg-brand-100" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-800">{b.time}</span>
                      <p className="text-sm font-semibold text-brand-950">{b.label}</p>
                    </div>
                    {b.note && <p className="text-xs text-ink/50 mt-0.5">{b.note}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Side cards */}
      <div className="space-y-4 self-start">
        <div className="card p-5">
          <p className="mb-3 font-bold text-brand-950">Production Notes</p>
          <ul className="space-y-2.5 text-sm text-ink/60">
            <li className="flex items-start gap-2"><Truck size={15} className="mt-0.5 shrink-0 text-gold-600" /> Allow <b>2 hours</b> for load-in and <b>1 hour</b> for load-out.</li>
            <li className="flex items-start gap-2"><Users size={15} className="mt-0.5 shrink-0 text-sky-600" /> Crew briefing 1 hour before doors.</li>
            <li className="flex items-start gap-2"><Mic2 size={15} className="mt-0.5 shrink-0 text-brand-600" /> Rehearse stage opens before guest arrival.</li>
            <li className="flex items-start gap-2"><Coffee size={15} className="mt-0.5 shrink-0 text-gold-600" /> Catering confirmed for refreshment breaks.</li>
          </ul>
        </div>
        <div className="card p-5">
          <p className="mb-3 font-bold text-brand-950">Dependencies</p>
          <div className="space-y-2">
            {[
              { l: 'Asset allocation', v: allocationsCount, c: 'text-brand-700' },
              { l: 'Vendors assigned', v: suppliersCount, c: 'text-gold-600' },
              { l: 'Crew rostered', v: ev?.team?.length || 0, c: 'text-sky-600' },
            ].map((d) => (
              <div key={d.l} className="flex items-center justify-between rounded-lg bg-brand-50/60 px-3 py-2">
                <span className="text-xs font-semibold text-ink/55">{d.l}</span>
                <span className={`text-sm font-black ${d.c}`}>{d.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}