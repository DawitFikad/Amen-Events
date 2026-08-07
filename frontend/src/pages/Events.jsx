import React, { useState, useEffect } from 'react'
import {
  CalendarDays, Plus, MapPin, Users, Wallet, ClipboardCheck, FileText, Clock3,
  ChevronRight, ArrowLeft, ListChecks, Sparkles, BarChart3, GitBranch, Boxes,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Avatar, Modal, Field, SearchBox, Toast, EmptyState, Th, Td, Segmented } from '../components/ui'
import { fmt, todayISO } from '../store/data'
import { required, textRequired, numberPositive, dateRequired, optional, validate } from '../store/validation'

const eventTypes = ['Conference', 'Exhibition', 'Product Launch', 'Retreat', 'Gala', 'Ceremony', 'Wedding', 'Summit']

const teamByEvent = {
  ev1: ['st2', 'st3', 'st5', 'st7', 'st8'],
  ev2: ['st3', 'st6', 'st8'],
  ev3: ['st5', 'st2', 'st6'],
  ev4: ['st2', 'st5', 'st7'],
  ev5: ['st3', 'st4'],
  ev6: ['st5', 'st8'],
}

const checklists = {
  ev1: [
    { id: 'c1', label: 'Venue contract signed', done: true },
    { id: 'c2', label: 'Catering tasting completed', done: true },
    { id: 'c3', label: 'Speaker confirmations', done: true },
    { id: 'c4', label: 'AV & staging plan', done: false },
    { id: 'c5', label: 'Security briefing', done: false },
    { id: 'c6', label: 'VIP seating layout', done: false },
  ],
  ev3: [
    { id: 'c1', label: 'Retreat itinerary final', done: true },
    { id: 'c2', label: 'Transport booked', done: true },
    { id: 'c3', label: 'Accommodation allocated', done: true },
    { id: 'c4', label: 'Day 2 breakout rooms', done: false },
  ],
  ev4: [
    { id: 'c1', label: 'Booth floor plan', done: true },
    { id: 'c2', label: 'Exhibitor kits sent', done: false },
    { id: 'c3', label: 'Branding production', done: false },
  ],
}

const eventTimeline = {
  ev1: [
    { at: '2026-06-10', title: 'Event brief received', by: 'Dawit', type: 'created' },
    { at: '2026-06-24', title: 'Venue allocated — Millennium Hall', by: 'Sara', type: 'venue' },
    { at: '2026-07-15', title: 'Invoice #0141 paid (50%)', by: 'Yonas', type: 'finance' },
    { at: '2026-07-28', title: 'Catering contract signed', by: 'Sara', type: 'vendor' },
    { at: '2026-08-01', title: 'Marketing campaign launched', by: 'Liya', type: 'marketing' },
    { at: '2026-08-02', title: 'Speaker lineup confirmed', by: 'Dawit', type: 'speaker' },
  ],
  ev3: [
    { at: '2026-07-01', title: 'Event brief received', by: 'Sara', type: 'created' },
    { at: '2026-07-08', title: 'Resort venue blocked', by: 'Sara', type: 'venue' },
    { at: '2026-07-22', title: 'Transport & accommodation booked', by: 'Sara', type: 'vendor' },
    { at: '2026-08-01', title: 'Event started — day 1', by: 'Dawit', type: 'status' },
  ],
  ev4: [
    { at: '2026-07-20', title: 'Event brief received', by: 'Dawit', type: 'created' },
    { at: '2026-07-29', title: 'Skylight Center reserved', by: 'Sara', type: 'venue' },
    { at: '2026-08-02', title: 'Exhibition branding ordered', by: 'Mekonnen', type: 'vendor' },
  ],
}

const timelineDot = {
  created: 'bg-brand-600', venue: 'bg-gold-500', finance: 'bg-emerald-500', vendor: 'bg-sky-500', marketing: 'bg-violet-500', speaker: 'bg-brand-400', status: 'bg-red-400',
}

export default function Events() {
  const { state, addEvent, addTask, logActivity, patchBy, intent, clearIntent, markDone, setEventTeam, setEventBudget, allocateResource, allocateResources } = useData()
  const [viewId, setViewId] = useState(null)
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [detailTab, setDetailTab] = useState('overview')
  const [q, setQ] = useState('')
  const [teamOpen, setTeamOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetEvent, setBudgetEvent] = useState(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [budgetVal, setBudgetVal] = useState('')
  const [tlOpen, setTlOpen] = useState(false)
  const [tlMap, setTlMap] = useState(eventTimeline)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [tlAddOpen, setTlAddOpen] = useState(false)
  const [tlAddTitle, setTlAddTitle] = useState('')

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  // Demo intents
  useEffect(() => {
    if (!intent) return
    if (intent === 'new-event') { setOpen(true); setTab('all'); clearIntent() }
    if (intent === 'event-team') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setTeamOpen(true); clearIntent() }
    if (intent === 'event-resources') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setResOpen(true); clearIntent() }
    if (intent === 'event-budget') {
      const target = state.events.find((e) => e.id === state.demo.lastEventId)
      setViewId(state.demo.lastEventId); setDetailTab('budget'); setBudgetOpen(true)
      setBudgetEvent(target || state.events[0])
      setBudgetVal(String(target?.budget || '')); clearIntent()
    }
    if (intent === 'event-complete') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setCompleteOpen(true); clearIntent() }
  }, [intent])

  let events = state.events
  if (tab === 'upcoming') events = events.filter((e) => e.status === 'upcoming')
  if (tab === 'ongoing') events = events.filter((e) => e.status === 'ongoing')
  if (tab === 'completed') events = events.filter((e) => e.status === 'completed')
  if (q) events = events.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))

  const active = state.events.find((e) => e.id === viewId)
  const client = (id) => state.clients.find((c) => c.id === id)
  const venue = (id) => state.venues.find((v) => v.id === id)

  const submit = () => {
    const res = validate(form, { name: [textRequired('Event name', { max: 120 })], date: [dateRequired('Date')], budget: [optional(numberPositive('Budget'))] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    const rec = addEvent(form)
    show(`Event "${form.name}" created`)
    setOpen(false); setForm({}); setErrors({})
    if (rec) setViewId(rec.id)
  }

  const addChecklistTask = () => {
    addTask({ title: 'New checklist item', eventId: active.id, due: active.date, priority: 'medium', status: 'todo', assigneeId: active.pmId })
    show('Checklist task created')
  }

  const toggleStatus = () => {
    const next = active.status === 'ongoing' ? 'completed' : active.status === 'completed' ? 'upcoming' : 'ongoing'
    patchBy('events', active.id, { status: next })
    logActivity(`Event "${active.name}" moved to ${next}`, 'event')
    show(`Event status → ${next}`)
  }

  const saveEvent = () => {
    if (!editForm.name) { show('Event name is required', 'warn'); return }
    patchBy('events', active.id, { name: editForm.name, category: editForm.category, date: editForm.date, time: editForm.time, status: editForm.status })
    logActivity(`Event "${editForm.name}" details updated`, 'event')
    setEditOpen(false)
    show('Event updated')
  }

  const saveNote = () => {
    if (!noteText.trim()) { show('Write a note first', 'warn'); return }
    patchBy('events', active.id, { notes: [...(active.notes || []), noteText.trim()] })
    logActivity(`Note added to "${active.name}"`, 'event')
    setNoteText(''); setNoteOpen(false)
    show('Note added')
  }

  const saveTimelineEntry = () => {
    if (!tlAddTitle.trim()) { show('Describe the timeline entry', 'warn'); return }
    setTlMap((prev) => ({ ...prev, [active.id]: [...(prev[active.id] || []), { at: todayISO(), title: tlAddTitle.trim(), by: 'You', type: 'created' }] }))
    logActivity(`Timeline entry added to "${active.name}"`, 'event')
    setTlAddTitle(''); setTlAddOpen(false)
    show('Timeline entry added')
  }

  const openBudgetModal = (ev) => {
    setBudgetEvent(ev)
    setBudgetVal(String(ev.budget || ''))
    setBudgetOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Event Management"
        subtitle="Create, plan and execute events end-to-end."
        icon={CalendarDays}
        actions={
          <>
            <button className="btn-outline" onClick={() => setTlOpen(true)}><GitBranch size={15} /> Timeline</button>
            <button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Create Event</button>
          </>
        }
      />

      {!active ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented value={tab} onChange={setTab} options={[{ value: 'all', label: 'All' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search events…" className="w-full sm:w-72" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => {
              const c = client(e.clientId)
              const v = venue(e.venueId)
              const team = e.team?.length ? e.team : (teamByEvent[e.id] || [e.pmId])
              const pct = e.progress
              return (
                <button key={e.id} onClick={() => setViewId(e.id)} className="card group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
                  <div className="flex items-start justify-between">
                    <span className={`chip ${e.status === 'upcoming' ? 'bg-gold-100 text-gold-700' : e.status === 'ongoing' ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500'}`}>{e.status}</span>
                    <Badge status="done" label={e.category} />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold leading-snug text-brand-950 group-hover:text-brand-700">{e.name}</h3>
                  <p className="mt-1 text-xs text-ink/50">{c?.company} · {c?.industry}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-ink/55">
                    <p className="flex items-center gap-2"><Clock3 size={13} className="text-brand-600" /> {e.date} at {e.time}</p>
                    <p className="flex items-center gap-2"><MapPin size={13} className="text-brand-600" /> {v?.name || 'Venue TBD'}</p>
                    <p className="flex items-center gap-2"><Wallet size={13} className="text-brand-600" /> Budget {fmt(e.budget)}</p>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink/45">Progress</span>
                      <span className="font-bold text-brand-800">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {team.slice(0, 4).map((id) => {
                        const m = state.staff.find((x) => x.id === id)
                        return m ? <Avatar key={id} name={m.name} initials={m.initials} color={m.color} size="sm" /> : null
                      })}
                      {team.length > 4 && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-800 ring-2 ring-white">+{team.length - 4}</span>}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 opacity-0 transition group-hover:opacity-100">Open <ChevronRight size={14} /></span>
                  </div>
                </button>
              )
            })}
            {events.length === 0 && <div className="col-span-full"><EmptyState icon={CalendarDays} title="No events" subtitle="Create your first event to get started." /></div>}
          </div>
        </>
      ) : (
        <EventDetail
          event={active}
          client={client(active.clientId)}
          venue={venue(active.venueId)}
          state={state}
          onBack={() => setViewId(null)}
          onStatus={toggleStatus}
          onTask={addChecklistTask}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          show={show}
          teamOpen={teamOpen}
          setTeamOpen={setTeamOpen}
          resOpen={resOpen}
          setResOpen={setResOpen}
          budgetOpen={budgetOpen}
          setBudgetOpen={setBudgetOpen}
          budgetVal={budgetVal}
          setBudgetVal={setBudgetVal}
          completeOpen={completeOpen}
          setCompleteOpen={setCompleteOpen}
          setEventTeam={setEventTeam}
          setEventBudget={setEventBudget}
          allocateResource={allocateResource}
          allocateResources={allocateResources}
          budgetEvent={budgetEvent}
          openBudgetModal={openBudgetModal}
          markDone={markDone}
          timeline={tlMap[active.id] || []}
          tlOpen={tlOpen}
          setTlOpen={setTlOpen}
          tlMap={tlMap}
          editOpen={editOpen}
          setEditOpen={setEditOpen}
          editForm={editForm}
          setEditForm={setEditForm}
          noteOpen={noteOpen}
          setNoteOpen={setNoteOpen}
          noteText={noteText}
          setNoteText={setNoteText}
          tlAddOpen={tlAddOpen}
          setTlAddOpen={setTlAddOpen}
          tlAddTitle={tlAddTitle}
          setTlAddTitle={setTlAddTitle}
          saveEvent={saveEvent}
          patchBy={patchBy}
          saveNote={saveNote}
          saveTimelineEntry={saveTimelineEntry}
          onEditOpen={() => { setEditForm({ ...active }); setEditOpen(true) }}
          onAddTimeline={() => setTlAddOpen(true)}
          notes={active.notes || []}
          onAddNote={() => setNoteOpen(true)}
          logActivity={logActivity}
        />
      )}

      {/* Create event */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create New Event" width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Innovation Summit 2026" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Client"><select className="input" value={form.clientId || ''} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><option value="">Select client…</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}</select></Field>
          <Field label="Category"><select className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>{eventTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Venue"><select className="input" value={form.venueId || ''} onChange={(e) => setForm({ ...form, venueId: e.target.value })}><option value="">Select venue…</option>{state.venues.filter((v) => v.status === 'available').map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="input" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />{errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}</Field>
          <Field label="Time"><input type="time" className="input" value={form.time || '09:00'} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Budget (ETB)"><input type="number" className="input" value={form.budget || ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="850000" />{errors.budget && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.budget}</p>}</Field>
          <Field label="Project Manager"><select className="input" value={form.pmId || 'st2'} onChange={(e) => setForm({ ...form, pmId: e.target.value })}>{state.staff.filter((m) => m.type === 'Employee').map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="Status"><select className="input" value={form.status || 'upcoming'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create Event</button>
        </div>
      </Modal>

      {!active && (
        <Modal open={tlOpen} onClose={() => setTlOpen(false)} title="Project Timeline" width="max-w-2xl">
          <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
            {state.events.map((e) => {
              const entries = tlMap[e.id] || []
              if (!entries.length) return null
              return (
                <div key={e.id}>
                  <p className="mb-2 text-sm font-bold text-brand-950">{e.name}</p>
                  <div className="relative ml-2 space-y-3 border-l-2 border-brand-100 pl-5">
                    {entries.map((t, i) => (
                      <div key={i} className="relative">
                        <span className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ${timelineDot[t.type] || 'bg-brand-500'} ring-2 ring-white`} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{t.at}</p>
                        <p className="text-[13px] font-semibold text-brand-950">{t.title}</p>
                        <p className="text-[11px] text-ink/45">by {t.by}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {!state.events.some((e) => (tlMap[e.id] || []).length) && <p className="py-8 text-center text-sm text-ink/40">No timeline entries recorded yet.</p>}
          </div>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}

function EventDetail({ event, client, venue, state, onBack, onStatus, onTask, detailTab, setDetailTab, show, teamOpen, setTeamOpen, resOpen, setResOpen, budgetOpen, setBudgetOpen, budgetVal, setBudgetVal, completeOpen, setCompleteOpen, setEventTeam, setEventBudget, allocateResource, allocateResources, budgetEvent, openBudgetModal, markDone, timeline, tlOpen, setTlOpen, tlMap, editOpen, setEditOpen, editForm, setEditForm, noteOpen, setNoteOpen, noteText, setNoteText, tlAddOpen, setTlAddOpen, tlAddTitle, setTlAddTitle, saveEvent, patchBy, saveNote, saveTimelineEntry, onEditOpen, onAddTimeline, notes, onAddNote, logActivity }) {
  const { toggleChecklist, addChecklistItem, setEventSuppliers } = useData()
  const [errors, setErrors] = useState({})
  const [budgetErr, setBudgetErr] = useState('')
  useEffect(() => { if (!editOpen) setErrors({}) }, [editOpen])
  const editSave = () => {
    const res = validate(editForm, { name: [textRequired('Event name', { min: 2, max: 120 })] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    setErrors({})
    saveEvent()
  }
  const team = event.team?.length ? event.team : (teamByEvent[event.id] || [event.pmId])
  const myCheck = (state.eventChecklists || []).filter((c) => c.eventId === event.id)
  const doneCount = myCheck.filter((c) => c.done).length
  const spendPct = event.budget ? Math.round((event.spent / event.budget) * 100) : 0
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [checkDraft, setCheckDraft] = useState('')
  const mySuppliers = (state.eventSuppliers || []).filter((s) => s.eventId === event.id).map((s) => s.vendorId)

  const addCheck = () => {
    if (!checkDraft.trim()) { show('Describe the checklist item', 'warn'); return }
    addChecklistItem(event.id, checkDraft.trim())
    setCheckDraft('')
    show('Checklist item added')
  }

  const tabs = [
    ['overview', 'Overview', Sparkles], ['checklist', 'Checklists', ListChecks],
    ['timeline', 'Timeline', GitBranch], ['budget', 'Budget', Wallet], ['documents', 'Documents', FileText],
  ]

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"><ArrowLeft size={16} /> All events</button>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="bg-brand-900 p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex gap-2">
                <Badge status={event.status} label={event.status} />
                <Badge status="done" label={event.category} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{event.name}</h1>
              <p className="mt-1 text-sm text-brand-200">{client?.company} · {client?.industry}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-gold" onClick={onStatus}>{event.status === 'ongoing' ? 'Mark Completed' : event.status === 'completed' ? 'Reopen' : 'Start Event'}</button>
              <button className="btn-outline !border-white/20 !bg-white/10 !text-white hover:!bg-white/20" onClick={() => { setEditForm({ ...event }); setEditOpen(true) }}>Edit</button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info label="Date" value={`${event.date} · ${event.time}`} />
            <Info label="Venue" value={venue?.name || 'TBD'} />
            <Info label="Project Manager" value={state.staff.find((m) => m.id === event.pmId)?.name || '—'} />
            <Info label="Attendees" value={event.attendees ? `${event.attendees} confirmed` : 'Awaiting registration'} />
          </div>
        </div>

        {/* Detail tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-brand-100 bg-white px-4">
          {tabs.map(([v, l, I]) => (
            <button key={v} onClick={() => setDetailTab(v)} className={`tab ${detailTab === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
          ))}
        </div>

        <div className="p-6">
          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Left column */}
              <div className="space-y-6 xl:col-span-2">
                {/* Budget snapshot */}
                <div className="rounded-xl border border-brand-100 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold text-brand-950">Budget Snapshot</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink/45">{spendPct}% committed</span>
                      <button className="btn-outline !px-2.5 !py-1 text-[11px]" onClick={() => openBudgetModal(event)}><Wallet size={12} /> Edit Budget</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-brand-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Budget</p><p className="text-base font-black text-brand-950">{fmt(event.budget)}</p></div>
                    <div className="rounded-lg bg-gold-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Spent</p><p className="text-base font-black text-gold-700">{fmt(event.spent)}</p></div>
                    <div className="rounded-lg bg-brand-50 p-3"><p className="text-[11px] font-semibold text-ink/40">Remaining</p><p className="text-base font-black text-brand-800">{fmt(event.budget - event.spent)}</p></div>
                  </div>
                  <Progress value={spendPct} color={spendPct > 80 ? 'bg-red-500' : spendPct > 60 ? 'bg-gold-500' : 'bg-brand-600'} className="mt-3" />
                </div>

                {/* Team */}
                <div className="rounded-xl border border-brand-100 p-5">
                  <p className="mb-3 font-bold text-brand-950">Event Team ({team.length})</p>
                  <div className="space-y-2.5">
                    {team.map((id) => {
                      const m = state.staff.find((x) => x.id === id)
                      if (!m) return null
                      return (
                        <div key={id} className="flex items-center gap-3 rounded-lg border border-brand-50 p-2.5">
                          <Avatar name={m.name} initials={m.initials} color={m.color} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-950">{m.name} {id === event.pmId && <span className="chip bg-gold-100 text-gold-700 ml-1">PM</span>}</p>
                            <p className="text-xs text-ink/45">{m.role} · {m.dept}</p>
                          </div>
                          <Badge status={m.status} label={m.type} />
                        </div>
                      )
                    })}
                  </div>
                  <button className="btn-outline mt-3 w-full !py-2 text-xs" onClick={() => setTeamOpen(true)}><Users size={14} /> Assign Team Members</button>
                </div>

                {/* Allocated resources */}
                <div className="rounded-xl border border-brand-100 p-5">
                  <p className="mb-3 font-bold text-brand-950">Allocated Resources ({event.allocations?.length || 0})</p>
                  {event.allocations?.length ? (
                    <div className="space-y-2">
                      {event.allocations.map((a, i) => {
                        const r = state.resources.find((x) => x.id === a.resourceId)
                        if (!r) return null
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-brand-50 p-2.5">
                            <div>
                              <p className="text-[13px] font-semibold text-brand-950">{r.name}</p>
                              <p className="text-[11px] text-ink/45">{r.type}</p>
                            </div>
                            <span className="chip bg-brand-50 text-brand-800">{a.qty}x allocated</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-brand-50/50 p-3 text-xs text-ink/45">No resources allocated yet. Open the resource allocation modal to assign equipment.</p>
                  )}
                  <button className="btn-outline mt-3 w-full !py-2 text-xs" onClick={() => setResOpen(true)}><Boxes size={14} /> Allocate Resources</button>
                </div>

                {/* Notes */}
                <div className="rounded-xl border border-brand-100 p-5">
                  <p className="mb-3 font-bold text-brand-950">Internal Notes</p>
                  <div className="space-y-2">
                    {(notes.length ? notes : ['Client prefers gold accent decor on stage.', 'Reconfirm security count with Secure Shield 48hrs before.', 'VIP guests get valet at main entrance.']).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-brand-50/60 p-3 text-sm text-ink/70">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{n}
                      </div>
                    ))}
                  </div>
                  <button className="btn-outline mt-3 w-full !py-2 text-xs" onClick={onAddNote}>+ Add Note</button>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div className="rounded-xl border border-brand-100 p-5">
                  <p className="mb-3 font-bold text-brand-950">Event Details</p>
                  <dl className="space-y-2.5 text-sm">
                    {[
                      ['Client', client?.company], ['Venue', venue?.name], ['City', venue?.city || '—'],
                      ['Category', event.category], ['Date', event.date], ['Time', event.time],
                      ['Status', event.status], ['Progress', `${event.progress}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <dt className="text-ink/45">{k}</dt>
                        <dd className="font-semibold text-brand-950 text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-xl border border-brand-100 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold text-brand-950">Suppliers ({mySuppliers.length})</p>
                    <button className="btn-outline !px-2.5 !py-1 text-[11px]" onClick={() => setSupplierOpen(true)}>Manage</button>
                  </div>
                  <div className="space-y-2">
                    {mySuppliers.length === 0 && <p className="rounded-lg bg-brand-50/50 p-3 text-xs text-ink/45">No suppliers linked yet. Manage which vendors supply this event.</p>}
                    {mySuppliers.map((id) => {
                      const v = state.vendors.find((x) => x.id === id)
                      if (!v) return null
                      return (
                        <div key={id} className="flex items-center justify-between rounded-lg border border-brand-50 p-2.5">
                          <div>
                            <p className="text-[13px] font-semibold text-brand-950">{v.name}</p>
                            <p className="text-[11px] text-ink/45">{v.type}</p>
                          </div>
                          <Badge status={v.status} label={v.status} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-gold-50 p-4 ring-1 ring-gold-200">
                  <p className="text-sm font-bold text-gold-800">Demo tip</p>
                  <p className="mt-1 text-xs text-gold-900/80">Use "Start Event" to simulate moving the event live, then run check-ins from the QR Check-in module.</p>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'checklist' && (
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-ink/50">{doneCount} of {myCheck.length} items complete</p>
                <span className="text-sm font-black text-brand-800">{myCheck.length ? Math.round((doneCount / myCheck.length) * 100) : 0}%</span>
              </div>
              <Progress value={myCheck.length ? (doneCount / myCheck.length) * 100 : 0} className="mb-4" />
              <div className="space-y-2">
                {myCheck.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-100 p-3 transition hover:border-brand-300">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => toggleChecklist(event.id, c.id)}
                      className="h-4 w-4 accent-brand-700"
                    />
                    <span className={`text-sm ${c.done ? 'text-ink/40 line-through' : 'text-ink/80'}`}>{c.label}</span>
                  </label>
                ))}
                {myCheck.length === 0 && <p className="rounded-lg border border-dashed border-brand-200 p-4 text-center text-xs text-ink/35">No checklist items yet — add one below.</p>}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                  placeholder="Add a checklist item…"
                  value={checkDraft}
                  onChange={(e) => setCheckDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCheck()}
                />
                <button className="btn-primary" onClick={addCheck}><Plus size={14} /> Add</button>
              </div>
            </div>
          )}

          {detailTab === 'timeline' && (
            <div className="max-w-2xl">
              <div className="relative ml-2 space-y-5 border-l-2 border-brand-100 pl-6">
                {timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <span className={`absolute -left-[30px] top-1 h-3 w-3 rounded-full ${timelineDot[t.type] || 'bg-brand-500'} ring-4 ring-white`} />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{t.at}</p>
                    <p className="mt-0.5 text-sm font-semibold text-brand-950">{t.title}</p>
                    <p className="text-xs text-ink/45">by {t.by}</p>
                  </div>
                ))}
              </div>
              <button className="btn-outline mt-6" onClick={onAddTimeline}><Plus size={14} /> Add Entry</button>
            </div>
          )}

          {detailTab === 'budget' && (
            <BudgetView event={event} state={state} openBudgetModal={openBudgetModal} />
          )}

          {detailTab === 'documents' && (
            <div className="max-w-2xl">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[['Event Proposal.pdf', 'PDF', '2.4 MB'], ['Venue Contract.pdf', 'PDF', '1.1 MB'], ['Floor Plan.png', 'PNG', '4.8 MB'], ['Run of Show.xlsx', 'XLSX', '980 KB']].map(([f, t, s]) => (
                  <div key={f} className="flex items-center gap-3 rounded-xl border border-brand-100 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{f}</p>
                      <p className="text-[11px] text-ink/40">{t} · {s}</p>
                    </div>
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => { logActivity(`Opened document "${f}" on "${event.name}"`, 'event'); show(`Opening ${f}…`) }}>Open</button>
                  </div>
                ))}
              </div>
              <button className="btn-outline mt-4" onClick={() => { logActivity(`Uploaded a document to "${event.name}"`, 'event'); show('Document uploaded & archived') }}><Plus size={14} /> Upload Document</button>
            </div>
          )}
        </div>
      </div>

      {/* Project timeline modal */}
      <Modal open={tlOpen} onClose={() => setTlOpen(false)} title="Project Timeline" width="max-w-2xl">
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          {state.events.map((e) => {
            const entries = tlMap[e.id] || []
            if (!entries.length) return null
            return (
              <div key={e.id}>
                <p className="mb-2 text-sm font-bold text-brand-950">{e.name}</p>
                <div className="relative ml-2 space-y-3 border-l-2 border-brand-100 pl-5">
                  {entries.map((t, i) => (
                    <div key={i} className="relative">
                      <span className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ${timelineDot[t.type] || 'bg-brand-500'} ring-2 ring-white`} />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{t.at}</p>
                      <p className="text-[13px] font-semibold text-brand-950">{t.title}</p>
                      <p className="text-[11px] text-ink/45">by {t.by}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {!state.events.some((e) => (tlMap[e.id] || []).length) && <p className="py-8 text-center text-sm text-ink/40">No timeline entries recorded yet.</p>}
        </div>
      </Modal>

      {/* Edit event modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Event" width="max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event Name *" className="col-span-2"><input className="input" value={editForm.name || ''} onChange={(e) => { setEditForm({ ...editForm, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }) }} />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Category"><select className="input" value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>{eventTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Status"><select className="input" value={editForm.status || 'upcoming'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></Field>
          <Field label="Date"><input type="date" className="input" value={editForm.date || ''} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></Field>
          <Field label="Time"><input type="time" className="input" value={editForm.time || '09:00'} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      {/* Add note modal */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Add Internal Note" width="max-w-md">
        <Field label="Note *"><textarea className="input min-h-[100px]" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="e.g. Client requested gold table runners for the gala dinner." /></Field>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setNoteOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={saveNote}><Plus size={14} /> Add Note</button>
        </div>
      </Modal>

      {/* Add timeline entry modal */}
      <Modal open={tlAddOpen} onClose={() => setTlAddOpen(false)} title="Add Timeline Entry" width="max-w-md">
        <Field label="Milestone *"><input className="input" value={tlAddTitle} onChange={(e) => setTlAddTitle(e.target.value)} placeholder="e.g. Run of show rehearsal completed" /></Field>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setTlAddOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={saveTimelineEntry}><Plus size={14} /> Add Entry</button>
        </div>
      </Modal>

      {/* Assign team modal */}
      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title={`Assign Team — ${event.name}`} width="max-w-lg">
        <TeamPicker event={event} state={state} onClose={() => setTeamOpen(false)} onSave={setEventTeam} show={show} />
      </Modal>

      {/* Allocate resources modal */}
      <Modal open={resOpen} onClose={() => setResOpen(false)} title={`Allocate Resources — ${event.name}`} width="max-w-lg">
        <ResourcePicker event={event} state={state} onClose={() => setResOpen(false)} onAllocate={allocateResources} show={show} />
      </Modal>

      {/* Manage suppliers modal */}
      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title={`Suppliers — ${event.name}`} width="max-w-lg">
        <SupplierPicker event={event} state={state} onClose={() => setSupplierOpen(false)} onSave={setEventSuppliers} show={show} />
      </Modal>

      {/* Set budget modal */}
      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title={`Event Budget — ${(budgetEvent || event).name}`} width="max-w-md">
        <div>
          <p className="mb-3 text-sm text-ink/60">Set the total budget for this event. The budget powers the dashboard, finance and reporting views — edits update everywhere instantly.</p>
          <Field label="Budget (ETB) *">
            <input type="number" className="input" value={budgetVal} onChange={(e) => { setBudgetVal(e.target.value); if (budgetErr) setBudgetErr('') }} placeholder="850000" />
            {budgetErr && <p className="mt-1 text-[11px] font-medium text-red-600">{budgetErr}</p>}
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setBudgetOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => {
              const msg = numberPositive('Budget')(budgetVal)
              if (msg) { setBudgetErr(msg); return }
              setEventBudget((budgetEvent || event).id, budgetVal)
              setBudgetOpen(false)
              setBudgetErr('')
              show(`Budget set to ${fmt(Number(budgetVal))}`)
            }}>Save Budget</button>
          </div>
        </div>
      </Modal>

      {/* Complete event modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="Complete Event" width="max-w-md">
        <div className="text-center py-2">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700"><ClipboardCheck size={26} /></span>
          <p className="font-bold text-brand-950">Mark "{event.name}" as completed?</p>
          <p className="mt-1 text-sm text-ink/55">This closes the event lifecycle. The demo workflow will be marked as finished.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-lg bg-brand-50 p-2.5"><p className="text-[10px] font-semibold text-ink/40">Attendees</p><p className="text-sm font-black text-brand-950">{state.registrations.filter((r) => r.eventId === event.id).length}</p></div>
            <div className="rounded-lg bg-brand-50 p-2.5"><p className="text-[10px] font-semibold text-ink/40">Checked-in</p><p className="text-sm font-black text-brand-950">{state.registrations.filter((r) => r.eventId === event.id && r.checkedIn).length}</p></div>
            <div className="rounded-lg bg-brand-50 p-2.5"><p className="text-[10px] font-semibold text-ink/40">Budget</p><p className="text-sm font-black text-brand-950">{fmt(event.budget)}</p></div>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-outline" onClick={() => setCompleteOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => {
              patchBy('events', event.id, { status: 'completed' })
              markDone(11)
              logActivity(`Event "${event.name}" marked as completed`, 'event')
              setCompleteOpen(false)
              show('Event completed 🎉')
            }}>Confirm Completion</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TeamPicker({ event, state, onClose, onSave, show }) {
  const [selected, setSelected] = useState(new Set(event.team || []))
  const members = state.staff.filter((m) => m.type === 'Employee')
  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">Select the crew working on this event. The project manager is always included.</p>
      <div className="grid grid-cols-1 gap-2">
        {members.map((m) => {
          const on = selected.has(m.id)
          return (
            <button key={m.id} onClick={() => toggle(m.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
              <Avatar name={m.name} initials={m.initials} color={m.color} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-950">{m.name} {m.id === event.pmId && <span className="chip bg-gold-100 text-gold-700 ml-1">PM</span>}</p>
                <p className="text-xs text-ink/45">{m.role} · {m.dept}</p>
              </div>
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-transparent'}`}>✓</span>
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => {
          onSave(event.id, [...selected])
          onClose()
          show(`Team set (${selected.size} members)`)
        }}>Save Team</button>
      </div>
    </div>
  )
}

function ResourcePicker({ event, state, onClose, onAllocate, show }) {
  const [sel, setSel] = useState(new Set())
  const [qtys, setQtys] = useState({})
  const resources = state.resources

  const toggle = (id) => {
    const next = new Set(sel)
    next.has(id) ? next.delete(id) : next.add(id)
    setSel(next)
  }
  const setQty = (id, qty) => setQtys((prev) => ({ ...prev, [id]: Math.max(1, Number(qty) || 1) }))

  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">
        Select one or more resources to allocate to this event. Each quantity decrements available stock.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {resources.map((r) => {
          const on = sel.has(r.id)
          const avail = (r.qty || 0) - (r.allocated || 0)
          return (
            <button key={r.id} onClick={() => toggle(r.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Boxes size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-950">{r.name}</p>
                <p className="text-xs text-ink/45">{r.type} · {avail} available</p>
              </div>
              {on && (
                <span className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2 py-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-semibold text-ink/45">Qty</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, avail)}
                    className="w-14 rounded-md border border-brand-200 px-1.5 py-0.5 text-center text-xs font-bold outline-none focus:border-brand-500"
                    value={qtys[r.id] || 1}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); setQty(r.id, e.target.value) }}
                  />
                </span>
              )}
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-transparent'}`}>✓</span>
            </button>
          )
        })}
      </div>
      {sel.size > 0 && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
          {sel.size} resource{sel.size !== 1 ? 's' : ''} selected
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => {
          if (sel.size === 0) { show('Pick at least one resource', 'warn'); return }
          const items = [...sel].map((id) => ({ resourceId: id, qty: qtys[id] || 1 }))
          onAllocate(event.id, items)
          onClose()
          show(`${items.length} resource${items.length !== 1 ? 's' : ''} allocated`)
        }}>Allocate {sel.size > 0 ? `(${sel.size})` : ''}</button>
      </div>
    </div>
  )
}

function SupplierPicker({ event, state, onClose, onSave, show }) {
  const [selected, setSelected] = useState(new Set((state.eventSuppliers || []).filter((s) => s.eventId === event.id).map((s) => s.vendorId)))
  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">Link the vendors supplying this event — catering, security, AV, transport, etc.</p>
      <div className="grid grid-cols-1 gap-2">
        {state.vendors.map((v) => {
          const on = selected.has(v.id)
          return (
            <button key={v.id} onClick={() => toggle(v.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Boxes size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-950">{v.name}</p>
                <p className="text-xs text-ink/45">{v.type} · rating {v.rating}</p>
              </div>
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-transparent'}`}>✓</span>
            </button>
          )
        })}
      </div>
      {selected.size === 0 && <p className="mt-3 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-800">No suppliers linked for this event yet.</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => {
          onSave(event.id, [...selected])
          onClose()
          show(`Suppliers updated (${selected.size} linked)`)
        }}>Save {selected.size > 0 ? `(${selected.size})` : ''}</button>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-bold text-white">{value}</p>
    </div>
  )
}

function BudgetView({ event, state, openBudgetModal }) {
  const { recordExpense, addNotification } = useData()
  const [expOpen, setExpOpen] = useState(false)
  const [expForm, setExpForm] = useState({})
  const [errors, setErrors] = useState({})
  const related = state.expenses.filter((e) => e.eventId === event.id)
  const byCat = {}
  related.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount })
  const cats = Object.entries(byCat)
  const revenue = state.invoices.filter((i) => i.eventId === event.id).reduce((a, i) => a + i.paid, 0)

  const saveExpense = () => {
    const res = validate(expForm, { amount: [numberPositive('Amount')] })
    if (!res.ok) { setErrors(res.errors); return }
    recordExpense({ eventId: event.id, category: expForm.category || 'General', amount: Number(expForm.amount), date: expForm.date || new Date().toISOString().slice(0, 10), vendorId: expForm.vendorId })
    addNotification(`Expense recorded on ${event.name}`, 'finance')
    setExpOpen(false); setExpForm({}); setErrors({})
  }

  const totalBudget = state.events.reduce((a, e) => a + (e.budget || 0), 0)
  const totalSpent = state.events.reduce((a, e) => a + (e.spent || 0), 0)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Budget" value={fmt(event.budget)} />
          <MiniStat label="Spent" value={fmt(event.spent)} tone="gold" />
          <MiniStat label="Revenue" value={fmt(revenue)} tone="brand" />
          <MiniStat label="Net" value={fmt(revenue - event.spent)} tone={revenue - event.spent < 0 ? 'red' : 'brand'} />
        </div>
        <button className="btn-primary !py-2 text-xs" onClick={() => openBudgetModal(event)}><Wallet size={14} /> Edit Budget</button>
      </div>

      {/* All event budgets — admin can create/edit any budget here */}
      <div className="rounded-xl border border-brand-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <div>
            <p className="font-bold text-brand-950">Event Budgets</p>
            <p className="text-xs text-ink/45">Total budget {fmt(totalBudget)} · {fmt(totalSpent)} committed across all events</p>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-brand-50/50"><tr><Th>Event</Th><Th className="text-right">Budget</Th><Th className="text-right">Spent</Th><Th className="text-right">Remaining</Th><Th>Utilization</Th><Th></Th></tr></thead>
          <tbody className="divide-y divide-brand-50">
            {state.events.map((e) => {
              const pct = e.budget ? Math.round((e.spent / e.budget) * 100) : 0
              return (
                <tr key={e.id} className="hover:bg-brand-50/40">
                  <Td className="font-semibold text-brand-950">{e.name}</Td>
                  <Td className="text-right font-semibold">{fmt(e.budget)}</Td>
                  <Td className="text-right text-gold-700">{fmt(e.spent)}</Td>
                  <Td className="text-right text-brand-800">{fmt((e.budget || 0) - (e.spent || 0))}</Td>
                  <Td><div className="flex items-center gap-2"><div className="w-24"><Progress value={pct} color={pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-gold-500' : 'bg-brand-600'} /></div><span className="text-xs font-bold text-ink/55">{pct}%</span></div></Td>
                  <Td><button className="btn-outline !py-1 text-xs" onClick={() => openBudgetModal(e)}><Wallet size={12} /> Set</button></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-100">
          <div className="border-b border-brand-100 p-4">
            <p className="font-bold text-brand-950">Expenses by Category</p>
          </div>
          <div className="space-y-3 p-4">
            {cats.map(([c, amt]) => (
              <div key={c}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold text-ink/70">{c}</span>
                  <span className="font-bold text-brand-950">{fmt(amt)}</span>
                </div>
                <Progress value={event.budget ? (amt / event.budget) * 100 : 0} />
              </div>
            ))}
            {cats.length === 0 && <p className="py-6 text-center text-sm text-ink/40">No expenses recorded yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-brand-100">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <p className="font-bold text-brand-950">Expense Log</p>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => setExpOpen(true)}>+ Record Expense</button>
          </div>
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Category</Th><Th>Date</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {related.map((e) => (
                <tr key={e.id}><Td className="text-ink/70">{e.category}</Td><Td className="text-ink/45">{e.date}</Td><Td className="text-right font-semibold text-brand-950">{fmt(e.amount)}</Td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={`Record Expense — ${event.name}`}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><select className="input" value={expForm.category || 'General'} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}><option>Venue Rental</option><option>Catering</option><option>Technical</option><option>Decoration</option><option>Transport</option><option>Marketing</option><option>General</option></select></Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={expForm.amount || ''} onChange={(e) => { setExpForm({ ...expForm, amount: e.target.value }); if (errors.amount) setErrors({ ...errors, amount: undefined }) }} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Date"><input type="date" className="input" value={expForm.date || ''} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></Field>
          <Field label="Vendor"><select className="input" value={expForm.vendorId || ''} onChange={(e) => setExpForm({ ...expForm, vendorId: e.target.value })}><option value="">—</option>{state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setExpOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={saveExpense}>Save Expense</button>
        </div>
      </Modal>
    </div>
  )
}

function MiniStat({ label, value, tone = '' }) {
  const tones = { gold: 'bg-gold-50 text-gold-700', brand: 'bg-brand-50 text-brand-800', red: 'bg-red-50 text-red-600' }
  return (
    <div className={`rounded-xl p-4 ${tones[tone] || 'bg-brand-50 text-brand-800'}`}>
      <p className="text-[11px] font-semibold text-ink/40">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  )
}
