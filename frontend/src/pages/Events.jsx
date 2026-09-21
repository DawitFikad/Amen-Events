import React, { useState, useEffect } from 'react'
import {
  CalendarDays, Plus, MapPin, Users, Wallet, ClipboardCheck, FileText, Clock3,
  ChevronRight, ArrowLeft, ListChecks, Sparkles, BarChart3, GitBranch, Boxes,
  Upload, Globe, Trash2, Info as InfoIcon, Tag, Megaphone, Ticket, Image as ImageIcon, Phone,
  ChevronDown, Check, CheckCircle2, PackageCheck, Activity,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Avatar, Modal, ConfirmModal, Field, SearchBox, Toast, EmptyState, Th, Td, Segmented, StatCard } from '../components/ui'
import RegisterAttendeeModal from '../components/RegisterAttendeeModal'
import { fmt, todayISO } from '../store/data'
import { required, textRequired, numberPositive, dateRequired, optional, validate } from '../store/validation'

const eventTypes = ['Conference', 'Exhibition', 'Product Launch', 'Retreat', 'Gala', 'Ceremony', 'Wedding', 'Summit', 'Workshop', 'Seminar', 'Award Night', 'Fashion Show', 'Concert', 'Sporting Event', 'Networking Mixer', 'Charity Fundraiser', 'Festival', 'Trade Show']

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
    { at: '2026-06-24', title: 'Venue allocated - Millennium Hall', by: 'Sara', type: 'venue' },
    { at: '2026-07-15', title: 'Invoice #0141 paid (50%)', by: 'Yonas', type: 'finance' },
    { at: '2026-07-28', title: 'Catering contract signed', by: 'Sara', type: 'vendor' },
    { at: '2026-08-01', title: 'Marketing campaign launched', by: 'Liya', type: 'marketing' },
    { at: '2026-08-02', title: 'Speaker lineup confirmed', by: 'Dawit', type: 'speaker' },
  ],
  ev3: [
    { at: '2026-07-01', title: 'Event brief received', by: 'Sara', type: 'created' },
    { at: '2026-07-08', title: 'Resort venue blocked', by: 'Sara', type: 'venue' },
    { at: '2026-07-22', title: 'Transport & accommodation booked', by: 'Sara', type: 'vendor' },
    { at: '2026-08-01', title: 'Event started - day 1', by: 'Dawit', type: 'status' },
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
  const { state, addEvent, updateEvent, addEventDoc, addTask, logActivity, patchBy, intent, clearIntent, markDone, setEventTeam, setEventBudget, allocateResource, allocateResources } = useData()
  const [viewId, setViewId] = useState(null)
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [regStep, setRegStep] = useState(1)
  const [createdSuccessModal, setCreatedSuccessModal] = useState(null)
  const [expandedEventId, setExpandedEventId] = useState(null)
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
    const lastEventId = state.demo.lastEventId
    if (state.demo.autoplay) {
      if (intent === 'new-event') {
        const seed = {
          name: 'Amen Staff Summit 2026', date: '2026-09-24',
          clientId: state.demo.lastClientId || 'cl1', category: 'Conference',
          status: 'upcoming', pmId: 'st2', time: '09:00', capacity: '400',
          published: true, tags: 'Internal, Summit',
        }
        setOpen(true); setForm(seed); setErrors({}); setTab('all'); setRegStep(1)
        setTimeout(async () => {
          const rec = await addEvent(seed)
          setViewId(rec.id); setOpen(false); setForm({}); show('Event created automatically')
        }, 1100)
      }
      if (intent === 'event-team' && lastEventId) {
        setTimeout(() => {
          setEventTeam(lastEventId, ['st2', 'st3', 'st5', 'st7'])
          show('Team assigned automatically'); setTeamOpen(false)
        }, 1100)
      }
      if (intent === 'event-resources' && lastEventId) {
        setTimeout(() => {
          allocateResources(lastEventId, [{ resourceId: 'rc1', qty: 2 }, { resourceId: 'rc5', qty: 120 }])
          show('Resources allocated automatically'); setResOpen(false)
        }, 1100)
      }
      if (intent === 'event-budget' && lastEventId) {
        setTimeout(() => {
          setEventBudget(lastEventId, '1500000')
          show('Budget set automatically'); setBudgetOpen(false)
        }, 1100)
      }
      if (intent === 'event-complete' && lastEventId) {
        setTimeout(() => {
          const ev = state.events.find((e) => e.id === lastEventId)
          patchBy('events', lastEventId, { status: 'completed' })
          show(`Event ${ev?.name || ''} completed automatically`); setCompleteOpen(false)
        }, 1100)
      }
    } else {
      if (intent === 'new-event') { setOpen(true); setTab('all'); setRegStep(1) }
      if (intent === 'event-team') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setTeamOpen(true) }
      if (intent === 'event-resources') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setResOpen(true) }
      if (intent === 'event-budget') {
        const target = state.events.find((e) => e.id === state.demo.lastEventId)
        setViewId(state.demo.lastEventId); setDetailTab('budget'); setBudgetOpen(true)
        setBudgetEvent(target || state.events[0])
        setBudgetVal(String(target?.budget || ''))
      }
      if (intent === 'event-complete') { setViewId(state.demo.lastEventId); setDetailTab('overview'); setCompleteOpen(true) }
    }
    clearIntent()
  }, [intent])

  let events = state.events
  if (tab === 'upcoming') events = events.filter((e) => e.status === 'upcoming')
  if (tab === 'ongoing') events = events.filter((e) => e.status === 'ongoing')
  if (tab === 'completed') events = events.filter((e) => e.status === 'completed')
  if (q) events = events.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))

  const active = state.events.find((e) => e.id === viewId)
  const client = (id) => state.clients.find((c) => c.id === id)
  const venue = (id) => state.venues.find((v) => v.id === id)

  const validateStep = (s) => {
    if (s === 1) {
      const res = validate(form, {
        name: [textRequired('Event name', { max: 120 })],
        clientId: [required('Client')],
        category: [textRequired('Category')],
      })
      if (!res.ok) {
        setErrors(res.errors)
        show(res.first || 'Please fill mandatory event details', 'warn')
        return false
      }
    }
    if (s === 2) {
      const res = validate(form, {
        date: [dateRequired('Start date')],
        time: [textRequired('Start time')],
        budget: [numberPositive('Budget (ETB)')],
      })
      if (!res.ok) {
        setErrors(res.errors)
        show(res.first || 'Please fill schedule and budget', 'warn')
        return false
      }
    }
    setErrors({})
    return true
  }

  const submit = async () => {
    const res = validate(form, {
      name: [textRequired('Event name', { max: 120 })],
      clientId: [required('Client')],
      category: [textRequired('Category')],
      date: [dateRequired('Start date')],
      time: [textRequired('Start time')],
      budget: [numberPositive('Budget (ETB)')],
    })
    if (!res.ok) { setErrors(res.errors); show(res.first || 'Please fill all mandatory fields', 'warn'); return }
    const payload = {
      ...form,
      category: form.category || 'Conference',
      time: form.time || '09:00',
      tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : Array.isArray(form.tags) ? form.tags : [],
      capacity: Number(form.capacity) || 0,
      price: Number(form.price) || 0,
      published: !!form.published,
    }
    const rec = await addEvent(payload)
    const docs = form.docs || []
    for (const d of docs) {
      await addEventDoc(rec.id, d.name, d.ext || 'PDF', d.size || '-', { type: d.type || 'file', sizeBytes: d.sizeBytes, mimeType: d.mimeType })
    }
    show(`Event "${form.name}" registered successfully!`)
    setOpen(false)
    setForm({})
    setErrors({})
    setRegStep(1)
    if (rec) {
      setCreatedSuccessModal(rec)
    }
  }

  const onEventImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setForm((f) => ({ ...f, image: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onEventDocs = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const added = files.map((file) => ({
      id: 'eft-' + Math.random().toString(36).slice(2, 8),
      name: file.name,
      ext: (file.name.split('.').pop() || 'PDF').toUpperCase(),
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB',
      sizeBytes: file.size,
      mimeType: file.type || '',
      type: 'file',
    }))
    setForm((f) => ({ ...f, docs: [...(f.docs || []), ...added] }))
    e.target.value = ''
  }

  const removeEventDoc = (id) => {
    setForm((f) => ({ ...f, docs: (f.docs || []).filter((d) => d.id !== id) }))
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
    const tags = typeof editForm.tags === 'string' ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : Array.isArray(editForm.tags) ? editForm.tags : []
    patchBy('events', active.id, {
      name: editForm.name, category: editForm.category, date: editForm.date,
      time: editForm.time, endDate: editForm.endDate || '', endTime: editForm.endTime || '',
      deadline: editForm.deadline || '', capacity: Number(editForm.capacity) || 0,
      price: Number(editForm.price) || 0, status: editForm.status,
      description: editForm.description || '', tags, published: !!editForm.published,
      contactName: editForm.contactName || '', contactPhone: editForm.contactPhone || '',
    })
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

  const totalEvents = state.events.length
  const upcomingEvents = state.events.filter((e) => e.status === 'upcoming').length
  const ongoingEvents = state.events.filter((e) => e.status === 'ongoing').length
  const activeEvents = upcomingEvents + ongoingEvents
  const completedEvents = state.events.filter((e) => e.status === 'completed').length

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
          {/* Live stat cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Active Events" value={activeEvents} icon={CalendarDays} tone="brand" sub={`${upcomingEvents} upcoming · ${ongoingEvents} ongoing`} />
            <StatCard label="Upcoming" value={upcomingEvents} icon={Clock3} tone="gold" sub="in planning" />
            <StatCard label="Ongoing" value={ongoingEvents} icon={Activity} tone="brand" sub="live execution" />
            <StatCard label="Completed" value={completedEvents} icon={CheckCircle2} tone="brand" sub="finished events" />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: `All (${totalEvents})` },
                { value: 'upcoming', label: `Upcoming (${upcomingEvents})` },
                { value: 'ongoing', label: `Ongoing (${ongoingEvents})` },
                { value: 'completed', label: `Completed (${completedEvents})` },
              ]}
            />
            <SearchBox value={q} onChange={setQ} placeholder="Search events…" className="w-full sm:w-72" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => {
              const c = client(e.clientId)
              const v = venue(e.venueId)
              const team = e.team?.length ? e.team : (teamByEvent[e.id] || [e.pmId])
              const pct = e.progress
              return (
                <button key={e.id} onClick={() => setViewId(e.id)} className="card group overflow-hidden p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
                  {e.image && <div className="mb-3 -mx-5 -mt-5 h-28 overflow-hidden"><img src={e.image} alt={e.name} className="h-full w-full object-cover" /></div>}
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
                    <div className="flex items-center gap-2">
                      {e.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={(evt) => {
                            evt.stopPropagation()
                            if (updateEvent) updateEvent(e.id, { status: 'completed' })
                            else patchBy('events', e.id, { status: 'completed' })
                            logActivity(`Event "${e.name}" marked as completed`, 'event')
                            show(`"${e.name}" completed! 🎉`)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/60 hover:bg-emerald-100 transition"
                          title="Mark event as completed"
                        >
                          <CheckCircle2 size={12} /> Complete
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                          <Check size={12} /> Done
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 sm:opacity-0 sm:transition sm:group-hover:opacity-100">Open <ChevronRight size={14} /></span>
                    </div>
                  </div>

                  {/* Expandable Assigned Details */}
                  <div className="mt-3 border-t border-brand-50/80 pt-2.5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(evt) => {
                        evt.stopPropagation()
                        setExpandedEventId(expandedEventId === e.id ? null : e.id)
                      }}
                      onKeyDown={(evt) => {
                        if (evt.key === 'Enter' || evt.key === ' ') {
                          evt.stopPropagation()
                          setExpandedEventId(expandedEventId === e.id ? null : e.id)
                        }
                      }}
                      className="flex w-full items-center justify-between text-left text-xs font-semibold text-brand-700 hover:text-brand-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users size={12} /> Assigned Details ({team.length} crew, {(state.allocations || []).filter((a) => a.eventId === e.id).length} resources)
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${expandedEventId === e.id ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {expandedEventId === e.id && (
                      <div className="mt-2.5 space-y-2 rounded-xl bg-brand-50/50 p-2.5 text-xs text-ink/70" onClick={(evt) => evt.stopPropagation()}>
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-brand-900 mb-1">Assigned Crew ({team.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {team.map((id) => {
                              const m = state.staff.find((x) => x.id === id)
                              return m ? (
                                <span key={id} className="chip bg-white text-brand-950 ring-1 ring-brand-200 text-[10px] font-medium">
                                  {m.name} {id === e.pmId ? '(PM)' : ''}
                                </span>
                              ) : null
                            })}
                            {team.length === 0 && <span className="text-[10px] text-ink/40">No crew assigned yet</span>}
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-brand-900 mb-1">Allocated Resources</p>
                          {(() => {
                            const allocs = (state.allocations || []).filter((a) => a.eventId === e.id)
                            if (allocs.length === 0) return <p className="text-[10px] text-ink/40">No resources allocated</p>
                            return (
                              <div className="flex flex-wrap gap-1">
                                {allocs.map((a, idx) => {
                                  const r = state.resources.find((res) => res.id === a.resourceId)
                                  return (
                                    <span key={idx} className="chip bg-white text-brand-950 ring-1 ring-brand-200 text-[10px]">
                                      {r?.name || 'Resource'}: <strong>{a.qty} qty</strong>
                                    </span>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
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

      {/* Create event - Multi-step Stepper with Top Progress Bar */}
      <Modal open={open} onClose={() => { setOpen(false); setRegStep(1) }} title="Register New Event" width="max-w-2xl" dirty={Boolean(form.name || form.clientId || form.category || regStep > 1)}>
        {/* Stepper Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/60">
            <span className={regStep >= 1 ? 'text-brand-700' : ''}>1. Basics & Banner</span>
            <span className={regStep >= 2 ? 'text-brand-700' : ''}>2. Schedule & Venue</span>
            <span className={regStep >= 3 ? 'text-brand-700' : ''}>3. Ticketing & Contact</span>
            <span className={regStep >= 4 ? 'text-brand-700' : ''}>4. Review & Docs</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: regStep === 1 ? '25%' : regStep === 2 ? '50%' : regStep === 3 ? '75%' : '100%',
                background: 'linear-gradient(90deg, #188A2E, #39D353)',
              }}
            />
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ Please fill all mandatory fields marked with an asterisk (*) to proceed.
          </div>
        )}

        {/* STEP 1: BASICS & BANNER */}
        {regStep === 1 && (
          <div className="space-y-4">
            {/* Event image */}
            <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/30 p-3.5">
              <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 ring-1 ring-brand-100">
                {form.image
                  ? <img src={form.image} alt="Event" className="h-full w-full object-cover" />
                  : <span className="flex flex-col items-center gap-1 text-xl font-black text-brand-400"><ImageIcon size={22} /><span className="text-[10px] font-semibold">Preview</span></span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-950">Event Image / Banner</p>
                <p className="text-xs text-ink/50">Upload banner for public site and cards (JPG, PNG - max 5MB).</p>
                <div className="mt-2 flex gap-2">
                  <label className="btn-outline !py-1.5 cursor-pointer text-xs">
                    <Upload size={14} /> Choose image
                    <input type="file" accept="image/*" className="hidden" onChange={onEventImage} />
                  </label>
                  {form.image && <button className="btn-ghost !py-1.5 text-xs !text-red-600" onClick={() => setForm((f) => ({ ...f, image: '' }))}><Trash2 size={13} /> Remove</button>}
                </div>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><InfoIcon size={13} /> Event Identity</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Event Name *" className="sm:col-span-2">
                <input className={`input ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.name || ''} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }) }} placeholder="e.g. Annual Innovation Summit 2026" />
                {errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}
              </Field>
              <Field label="Client *">
                <select className={`input ${errors.clientId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.clientId || ''} onChange={(e) => { setForm({ ...form, clientId: e.target.value }); if (errors.clientId) setErrors({ ...errors, clientId: undefined }) }}>
                  <option value="">Select client…</option>
                  {state.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
                </select>
                {errors.clientId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.clientId}</p>}
              </Field>
              <Field label="Category *">
                <select className={`input ${errors.category ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.category || ''} onChange={(e) => { setForm({ ...form, category: e.target.value }); if (errors.category) setErrors({ ...errors, category: undefined }) }}>
                  <option value="">Select category…</option>
                  {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.category}</p>}
              </Field>
              <Field label="Status">
                <select className="input" value={form.status || 'upcoming'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Project Manager">
                <select className="input" value={form.pmId || (state.staff[0]?.id || '')} onChange={(e) => setForm({ ...form, pmId: e.target.value })}>
                  {state.staff.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.jobTitle || m.role || m.dept || 'Staff'})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-between pt-2 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (validateStep(1)) setRegStep(2)
                }}
              >
                Next: Schedule & Venue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SCHEDULE & VENUE */}
        {regStep === 2 && (
          <div className="space-y-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><CalendarDays size={13} /> Schedule</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Start Date *">
                <input type="date" className={`input ${errors.date ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.date || ''} onChange={(e) => { setForm({ ...form, date: e.target.value }); if (errors.date) setErrors({ ...errors, date: undefined }) }} />
                {errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}
              </Field>
              <Field label="Start Time *">
                <input type="time" className={`input ${errors.time ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.time || '09:00'} onChange={(e) => { setForm({ ...form, time: e.target.value }); if (errors.time) setErrors({ ...errors, time: undefined }) }} />
                {errors.time && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.time}</p>}
              </Field>
              <Field label="End Date"><input type="date" className="input" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
              <Field label="End Time"><input type="time" className="input" value={form.endTime || ''} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><MapPin size={13} /> Venue & Logistics</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Venue">
                <select className="input" value={form.venueId || ''} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
                  <option value="">Select venue…</option>
                  {state.venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city || 'Addis Ababa'})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Expected Attendees">
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="number" className="input pl-9" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 800" />
                </div>
              </Field>
              <Field label="Registration Deadline"><input type="date" className="input" value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
              <Field label="Budget (ETB) *">
                <div className="relative">
                  <Wallet size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="number" className={`input pl-9 ${errors.budget ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.budget || ''} onChange={(e) => { setForm({ ...form, budget: e.target.value }); if (errors.budget) setErrors({ ...errors, budget: undefined }) }} placeholder="850000" />
                </div>
                {errors.budget && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.budget}</p>}
              </Field>
            </div>

            <div className="mt-6 flex justify-between pt-2 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={() => setRegStep(1)}>← Back</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (validateStep(2)) setRegStep(3)
                }}
              >
                Next: Ticketing & Contact →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PUBLIC & TICKETING */}
        {regStep === 3 && (
          <div className="space-y-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><Megaphone size={13} /> Public Site & Ticketing</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ticket price from (ETB)" className="col-span-2 sm:col-span-1">
                <div className="relative">
                  <Ticket size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="number" className="input pl-9" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0 = free" />
                </div>
              </Field>
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-brand-100 px-4 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-brand-950">Published on public site</p>
                    <p className="text-[11px] text-ink/50">Visible for attendee registration</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.published ? 'bg-brand-600' : 'bg-ink/20'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.published ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </label>
              </div>
              <Field label="Contact Person">
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input className="input pl-9" value={form.contactName || ''} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Event contact name" />
                </div>
              </Field>
              <Field label="Contact Phone">
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input className="input pl-9" value={form.contactPhone || ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+251 9XX XXX XXX" />
                </div>
              </Field>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><InfoIcon size={13} /> Description & Tags</p>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Description"><textarea className="input min-h-[70px] resize-y" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this event about? Who is it for?" /></Field>
              <Field label="Tags">
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input className="input pl-9" value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Fintech, Conference, Networking (comma separated)" />
                </div>
              </Field>
            </div>

            <div className="mt-6 flex justify-between pt-2 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={() => setRegStep(2)}>← Back</button>
              <button type="button" className="btn-primary" onClick={() => setRegStep(4)}>Next: Review & Docs →</button>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS & REVIEW */}
        {regStep === 4 && (
          <div className="space-y-4">
            {/* Review summary cards */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-2">Event Summary Review</p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Event Name</p>
                  <p className="font-bold text-brand-950 truncate mt-0.5">{form.name || '-'}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Client</p>
                  <p className="font-bold text-brand-950 truncate mt-0.5">{state.clients.find(c => c.id === form.clientId)?.company || '-'}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Schedule</p>
                  <p className="font-bold text-brand-950 truncate mt-0.5">{form.date || '-'} at {form.time || '09:00'}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Venue</p>
                  <p className="font-bold text-brand-950 truncate mt-0.5">{state.venues.find(v => v.id === form.venueId)?.name || 'Venue TBD'}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Budget</p>
                  <p className="font-bold text-brand-900 truncate mt-0.5">{fmt(Number(form.budget || 0))}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="text-[10px] text-ink/40 font-bold uppercase">Project Manager</p>
                  <p className="font-bold text-brand-950 truncate mt-0.5">{state.staff.find(s => s.id === form.pmId)?.name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><FileText size={13} /> Registration Documents (Optional)</p>
            <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 py-4 text-center transition hover:border-brand-400 hover:bg-brand-50">
              <Upload size={20} className="text-brand-500" />
              <span className="text-xs font-bold text-brand-700">Click to attach event documents</span>
              <span className="text-[11px] text-ink/45">Proposal, venue agreement, floor plan, agenda…</span>
              <input type="file" multiple className="hidden" onChange={onEventDocs} />
            </label>
            {(form.docs || []).length > 0 && (
              <div className="mt-2 space-y-1.5">
                {(form.docs || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-brand-100 bg-white px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink/80"><FileText size={14} className="shrink-0 text-brand-600" /><span className="truncate">{d.name}</span></span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="chip bg-brand-50 text-brand-800">{d.ext} · {d.size}</span>
                      <button onClick={() => removeEventDoc(d.id)} className="rounded-md p-1 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-between pt-2 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={() => setRegStep(3)}>← Back</button>
              <button type="button" className="btn-primary !px-6" onClick={submit}>
                <Sparkles size={16} /> Complete & Register Event
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Celebration Modal on Successful Event Creation */}
      <Modal
        open={!!createdSuccessModal}
        onClose={() => setCreatedSuccessModal(null)}
        title="Event Registered!"
        width="max-w-md"
      >
        {createdSuccessModal && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-brand-950">Event Created Successfully!</h3>
            <p className="mt-1 text-xs text-ink/60">
              <strong>{createdSuccessModal.name}</strong> is now registered and active in the Amen EMS pipeline.
            </p>

            <div className="my-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-left text-xs space-y-1.5">
              <p><strong className="text-brand-900">Client:</strong> {state.clients.find(c => c.id === createdSuccessModal.clientId)?.company || '-'}</p>
              <p><strong className="text-brand-900">Date & Time:</strong> {createdSuccessModal.date} at {createdSuccessModal.time}</p>
              <p><strong className="text-brand-900">Budget:</strong> {fmt(createdSuccessModal.budget)}</p>
              <p><strong className="text-brand-900">Project Manager:</strong> {state.staff.find(s => s.id === createdSuccessModal.pmId)?.name || '-'}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline flex-1"
                onClick={() => setCreatedSuccessModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  setViewId(createdSuccessModal.id)
                  setCreatedSuccessModal(null)
                }}
              >
                Open Event Workspace →
              </button>
            </div>
          </div>
        )}
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
  const { toggleChecklist, addChecklistItem, setEventSuppliers, patch, addEventDoc, deleteEvent } = useData()
  const [errors, setErrors] = useState({})
  const [budgetErr, setBudgetErr] = useState('')
  const [edFile, setEdFile] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
  const eventDocs = (state.eventDocs || []).filter((d) => d.eventId === event.id)

  const onEventDocFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const size = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB'
    addEventDoc(event.id, file.name, (file.name.split('.').pop() || 'PDF').toUpperCase(), size, { sizeBytes: file.size, mimeType: file.type || '' })
    logActivity(`Uploaded document "${file.name}" to "${event.name}"`, 'event')
    show('Document uploaded & archived')
    e.target.value = ''
    setEdFile(file.name)
  }

  const removeEventDocFile = (id) => {
    const d = eventDocs.find((x) => x.id === id)
    patch('eventDocs', (l) => l.filter((x) => x.id !== id))
    logActivity(`Removed document "${d?.name || id}" from "${event.name}"`, 'event')
    show('Document removed')
  }
  useEffect(() => { if (!editOpen) setErrors({}) }, [editOpen])
  const editSave = () => {
    const res = validate(editForm, { name: [textRequired('Event name', { min: 2, max: 120 })], date: [dateRequired('Date')] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    setErrors({})
    setConfirmEditOpen(true)
  }

  const handleConfirmEdit = () => {
    setConfirmEditOpen(false)
    saveEvent()
    show('Event updated successfully!')
  }

  const handleConfirmDelete = () => {
    setDeleteConfirmOpen(false)
    if (deleteEvent) deleteEvent(event.id)
    else patch('events', (list) => list.filter((e) => e.id !== event.id))
    logActivity(`Deleted event "${event.name}"`, 'event')
    show(`Event "${event.name}" deleted`)
    onBack()
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
    ['overview', 'Overview', Sparkles],
    ['speakers', 'Speakers', Megaphone],
    ['sponsors', 'Sponsors', Tag],
    ['exhibitors', 'Exhibitors', Boxes],
    ['attendees', 'Attendees', Ticket],
    ['checklist', 'Checklists', ListChecks],
    ['timeline', 'Timeline', GitBranch],
    ['budget', 'Budget', Wallet],
    ['documents', 'Documents', FileText],
  ]

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"><ArrowLeft size={16} /> All events</button>

      {/* Header */}
      <div className="card overflow-hidden">
        {event.image && <div className="relative h-44 w-full"><img src={event.image} alt={event.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 to-transparent" /></div>}
        <div className="bg-brand-900 p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex gap-2">
                <Badge status={event.status} label={event.status} />
                <Badge status="done" label={event.category} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{event.name}</h1>
              <p className="mt-1 text-sm text-brand-200">{client?.company} · {client?.industry}</p>
              {event.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.tags.map((t) => <span key={t} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-100">{t}</span>)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn-gold" onClick={onStatus}>{event.status === 'ongoing' ? 'Mark Completed' : event.status === 'completed' ? 'Reopen' : 'Start Event'}</button>
              <button className="btn-outline !border-white/20 !bg-white/10 !text-white hover:!bg-white/20" onClick={() => { setEditForm({ ...event }); setEditOpen(true) }}>Edit</button>
              <button className="rounded-xl border border-red-400/40 bg-red-500/20 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/30 transition flex items-center gap-1" onClick={() => setDeleteConfirmOpen(true)} title="Delete Event"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info label="Date" value={event.date ? `${event.date} · ${event.time || ''}` : 'TBD'} />
            <Info label="Ends" value={event.endDate ? `${event.endDate}${event.endTime ? ' · ' + event.endTime : ''}` : 'One day event'} />
            <Info label="Venue" value={venue?.name || 'TBD'} />
            <Info label="Project Manager" value={state.staff.find((m) => m.id === event.pmId)?.name || '-'} />
            <Info label="Attendees" value={event.capacity ? `${event.capacity} capacity` : 'Open capacity'} />
            <Info label="Reg. deadline" value={event.deadline || 'No deadline'} />
            <Info label="Tickets from" value={event.price > 0 ? `ETB ${event.price.toLocaleString()}` : 'Free entry'} />
            <Info label="Status" value={event.published ? 'Published on public site' : 'Draft (hidden)'} />
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
                {event.description && (
                  <div className="rounded-xl border border-brand-100 p-5">
                    <p className="mb-2 flex items-center gap-1.5 font-bold text-brand-950"><InfoIcon size={15} className="text-brand-600" /> About This Event</p>
                    <p className="text-sm leading-relaxed text-ink/70">{event.description}</p>
                  </div>
                )}
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
                      ['Client', client?.company], ['Venue', venue?.name], ['City', venue?.city || '-'],
                      ['Category', event.category], ['Date', event.date], ['Time', event.time || '-'],
                      ['End', event.endDate ? `${event.endDate}${event.endTime ? ' · ' + event.endTime : ''}` : '-'],
                      ['Reg. deadline', event.deadline || '-'], ['Capacity', event.capacity ? `${event.capacity} people` : 'Open'],
                      ['Status', event.status], ['Published', event.published ? 'Yes' : 'No'],
                      ['Contact', event.contactName ? `${event.contactName}${event.contactPhone ? ' · ' + event.contactPhone : ''}` : '-'],
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
                {myCheck.length === 0 && <p className="rounded-lg border border-dashed border-brand-200 p-4 text-center text-xs text-ink/35">No checklist items yet - add one below.</p>}
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
              <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 py-5 text-center transition hover:border-brand-400 hover:bg-brand-50">
                <Upload size={18} className="text-brand-500" />
                <span className="text-xs font-bold text-brand-700">Upload a document</span>
                <span className="text-[11px] text-ink/45">Proposal, venue contract, floor plan, run of show…</span>
                <input type="file" className="hidden" onChange={onEventDocFile} />
              </label>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {eventDocs.length === 0 && <p className="col-span-full rounded-lg border border-dashed border-brand-100 p-4 text-center text-xs text-ink/45">No documents attached yet. Upload the proposal, contracts and floor plans here.</p>}
                {eventDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-brand-100 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{d.name}</p>
                      <p className="text-[11px] text-ink/40">{d.ext} · {d.size}</p>
                    </div>
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => { logActivity(`Opened document "${d.name}" on "${event.name}"`, 'event'); show(`Opening ${d.name}…`) }}>Open</button>
                    <button className="rounded-md p-1 text-ink/40 hover:bg-red-50 hover:text-red-600" onClick={() => removeEventDocFile(d.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailTab === 'speakers' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-brand-950">Speakers & Keynotes</h3>
                  <p className="text-xs text-ink/50">Speakers assigned to this event schedule</p>
                </div>
                <span className="chip bg-brand-50 text-brand-700 font-bold">
                  {(state.speakers || []).filter((s) => s.eventId === event.id).length} Confirmed
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(state.speakers || []).filter((s) => s.eventId === event.id).map((s) => (
                  <div key={s.id} className="card p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <Avatar name={s.name} initials={s.initials} color={s.color} size="md" />
                        <Badge status={s.status} label={s.status} />
                      </div>
                      <h4 className="mt-3 font-bold text-brand-950">{s.name}</h4>
                      <p className="text-xs text-ink/50">{s.company}</p>
                      <p className="mt-2 text-xs font-semibold text-brand-700 bg-brand-50 rounded-lg p-2">
                        Topic: {s.topic || 'General Keynote'}
                      </p>
                      {s.time && <p className="mt-1 text-[11px] text-ink/40">Session: {s.time}</p>}
                    </div>
                    {(s.email || s.phone) && (
                      <div className="mt-3 pt-2 border-t border-brand-50 text-[11px] text-ink/50">
                        {s.email && <p>{s.email}</p>}
                        {s.phone && <p>{s.phone}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(state.speakers || []).filter((s) => s.eventId === event.id).length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-brand-100 p-8 text-center text-sm text-ink/40">
                    No speakers assigned to this event yet. Add speakers in the Speaker Management module to link them here.
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === 'sponsors' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-brand-950">Event Sponsors</h3>
                  <p className="text-xs text-ink/50">Corporate partners and sponsorship deliverables</p>
                </div>
                <span className="chip bg-gold-50 text-gold-700 font-bold">
                  {(state.sponsors || []).length} Sponsors
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(state.sponsors || []).map((sp) => (
                  <div key={sp.id} className="card p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="chip bg-brand-50 text-brand-800 font-bold uppercase text-[10px]">{sp.package} Sponsor</span>
                        <Badge status={sp.status} label={sp.status} />
                      </div>
                      <h4 className="mt-2 text-base font-bold text-brand-950">{sp.name}</h4>
                      <p className="text-sm font-black text-gold-700 mt-1">ETB {Number(sp.amount || 0).toLocaleString()}</p>
                      {sp.deliverables && (
                        <div className="mt-2 text-xs text-ink/60 bg-brand-50/50 rounded-lg p-2">
                          <p className="font-semibold text-brand-900 mb-1">Deliverables:</p>
                          <p>{Array.isArray(sp.deliverables) ? sp.deliverables.join(', ') : sp.deliverables}</p>
                        </div>
                      )}
                    </div>
                    {(sp.contact || sp.email || sp.phone) && (
                      <div className="mt-3 pt-2 border-t border-brand-50 text-[11px] text-ink/50">
                        {sp.contact && <p className="font-semibold">{sp.contact}</p>}
                        {sp.email && <p>{sp.email}</p>}
                        {sp.phone && <p>{sp.phone}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(state.sponsors || []).length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-brand-100 p-8 text-center text-sm text-ink/40">
                    No sponsors recorded. Add sponsors in the Sponsorship module.
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === 'exhibitors' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-brand-950">Exhibitors & Booths</h3>
                  <p className="text-xs text-ink/50">Trade show floor exhibitors and booth assignments</p>
                </div>
                <span className="chip bg-brand-50 text-brand-700 font-bold">
                  {(state.exhibitors || []).length} Exhibitors
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(state.exhibitors || []).map((ex) => (
                  <div key={ex.id} className="card p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="chip bg-sky-50 text-sky-800 font-bold text-[10px]">Booth {ex.booth || '-'}</span>
                        <Badge status={ex.status} label={ex.status} />
                      </div>
                      <h4 className="mt-2 text-base font-bold text-brand-950">{ex.company}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink/60">
                        <span>{ex.size || 'Standard'}</span>
                        <span>·</span>
                        <span className="font-semibold text-brand-700">{ex.package || 'Exhibitor'}</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-700 mt-2">Paid: ETB {Number(ex.paid || 0).toLocaleString()}</p>
                    </div>
                    {(ex.contact || ex.email || ex.phone) && (
                      <div className="mt-3 pt-2 border-t border-brand-50 text-[11px] text-ink/50">
                        {ex.contact && <p className="font-semibold">{ex.contact}</p>}
                        {ex.email && <p>{ex.email}</p>}
                        {ex.phone && <p>{ex.phone}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(state.exhibitors || []).length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-brand-100 p-8 text-center text-sm text-ink/40">
                    No exhibitors registered. Add exhibitors in the Exhibition module.
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === 'attendees' && (
            <EventAttendeesTab event={event} state={state} show={show} />
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
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Event"
        width="max-w-2xl"
        dirty={Boolean(editForm.name !== event.name || editForm.date !== event.date || editForm.category !== event.category || editForm.capacity !== event.capacity || editForm.price !== event.price)}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event Name *" className="col-span-2"><input className="input" value={editForm.name || ''} onChange={(e) => { setEditForm({ ...editForm, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }) }} />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Category"><select className="input" value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>{eventTypes.map((t) => <option key={t}>{t}</option>)}<option>Other</option></select></Field>
          <Field label="Status"><select className="input" value={editForm.status || 'upcoming'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="Other">Other</option></select></Field>
          <Field label="Start Date *"><input type="date" className="input" value={editForm.date || ''} onChange={(e) => { setEditForm({ ...editForm, date: e.target.value }); if (errors.date) setErrors({ ...errors, date: undefined }) }} />{errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}</Field>
          <Field label="Start Time"><input type="time" className="input" value={editForm.time || '09:00'} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} /></Field>
          <Field label="End Date"><input type="date" className="input" value={editForm.endDate || ''} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} /></Field>
          <Field label="End Time"><input type="time" className="input" value={editForm.endTime || ''} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} /></Field>
          <Field label="Reg. Deadline"><input type="date" className="input" value={editForm.deadline || ''} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} /></Field>
          <Field label="Capacity"><input type="number" className="input" value={editForm.capacity || ''} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} placeholder="e.g. 800" /></Field>
          <Field label="Ticket price (ETB)"><input type="number" className="input" value={editForm.price ?? ''} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="0 = free" /></Field>
          <Field label="Contact Person"><input className="input" value={editForm.contactName || ''} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} /></Field>
          <Field label="Contact Phone"><input className="input" value={editForm.contactPhone || ''} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} /></Field>
          <Field label="Tags" className="col-span-2"><input className="input" value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : (editForm.tags || '')} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="Fintech, Conference (comma separated)" /></Field>
          <Field label="Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></Field>
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-brand-100 px-4 py-2.5">
              <div>
                <p className="text-xs font-bold text-brand-950">Published on public site</p>
                <p className="text-[11px] text-ink/50">Visible for attendee registration</p>
              </div>
              <button
                type="button"
                onClick={() => setEditForm((f) => ({ ...f, published: !f.published }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${editForm.published ? 'bg-brand-600' : 'bg-ink/20'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${editForm.published ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This action cannot be undone and will permanently remove this event and its associated records.`}
        confirmText="Delete Event"
        confirmTone="danger"
      />

      {/* Edit Event Confirmation Modal */}
      <ConfirmModal
        open={confirmEditOpen}
        onClose={() => setConfirmEditOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Save Changes to Event"
        message={`Are you sure you want to apply the updates to "${editForm.name || event.name}"?`}
        confirmText="Apply Changes"
        confirmTone="primary"
      />

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
      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title={`Assign Team - ${event.name}`} width="max-w-lg">
        <TeamPicker event={event} state={state} onClose={() => setTeamOpen(false)} onSave={setEventTeam} show={show} />
      </Modal>

      {/* Allocate resources modal */}
      <Modal open={resOpen} onClose={() => setResOpen(false)} title={`Allocate Resources - ${event.name}`} width="max-w-lg">
        <ResourcePicker event={event} state={state} onClose={() => setResOpen(false)} onAllocate={allocateResources} show={show} />
      </Modal>

      {/* Manage suppliers modal */}
      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title={`Suppliers - ${event.name}`} width="max-w-lg">
        <SupplierPicker event={event} state={state} onClose={() => setSupplierOpen(false)} onSave={setEventSuppliers} show={show} />
      </Modal>

      {/* Set budget modal */}
      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title={`Event Budget - ${(budgetEvent || event).name}`} width="max-w-md">
        <div>
          <p className="mb-3 text-sm text-ink/60">Set the total budget for this event. The budget powers the dashboard, finance and reporting views - edits update everywhere instantly.</p>
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
              markDone(22)
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
  const members = state.staff
  const toggle = (id, isBusy) => {
    if (isBusy) {
      show('This staff member is already assigned to another event on this date', 'warn')
      return
    }
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">
        Select the crew working on this event. Staff already booked on <strong>{event.date || 'this date'}</strong> cannot be double-booked.
      </p>
      <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {members.map((m) => {
          const on = selected.has(m.id)
          const conflictingEvent = state.events.find((e) =>
            e.id !== event.id &&
            e.date === event.date &&
            (e.team?.includes(m.id) || e.pmId === m.id)
          )
          const isBusy = !!conflictingEvent && !on

          return (
            <button
              key={m.id}
              type="button"
              disabled={isBusy}
              onClick={() => toggle(m.id, isBusy)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                on
                  ? 'border-brand-400 bg-brand-50'
                  : isBusy
                  ? 'border-red-200 bg-red-50/40 opacity-80 cursor-not-allowed'
                  : 'border-brand-100 bg-white hover:border-brand-300'
              }`}
            >
              <Avatar name={m.name} initials={m.initials} color={m.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-brand-950">
                    {m.name} {m.id === event.pmId && <span className="chip bg-gold-100 text-gold-700 ml-1">PM</span>}
                  </p>
                  {isBusy ? (
                    <span className="chip bg-red-100 text-red-700 text-[10px] font-bold">
                      Busy: {conflictingEvent.name}
                    </span>
                  ) : (
                    <span className="chip bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Available
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/45 mt-0.5">{m.role || m.jobTitle} · {m.dept}</p>
              </div>
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-transparent'
              }`}>✓</span>
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
  const { addPurchaseRequest } = useData()
  const [sel, setSel] = useState(new Set())
  const [qtys, setQtys] = useState({})
  const [orderingId, setOrderingId] = useState(null)
  const resources = state.resources

  const toggle = (id, isOut) => {
    if (isOut) {
      show('Resource is out of stock. Use the Order Resource button to submit a request.', 'warn')
      return
    }
    const next = new Set(sel)
    next.has(id) ? next.delete(id) : next.add(id)
    setSel(next)
  }
  const setQty = (id, qty, max) => setQtys((prev) => ({ ...prev, [id]: Math.min(max, Math.max(1, Number(qty) || 1)) }))

  const handleOrder = async (r) => {
    setOrderingId(r.id)
    try {
      if (addPurchaseRequest) {
        await addPurchaseRequest({
          resourceId: r.id,
          name: r.name,
          qty: 10,
          reason: `Out-of-stock order for event: ${event.name}`,
          status: 'pending',
        })
      }
      show(`Procurement order submitted for ${r.name}!`, 'success')
    } catch (e) {
      show(`Procurement order recorded for ${r.name}`)
    } finally {
      setOrderingId(null)
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">
        Select resources to allocate to <strong>{event.name}</strong>. Out-of-stock items cannot be allocated and must be ordered.
      </p>
      <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {resources.map((r) => {
          const on = sel.has(r.id)
          const avail = (r.qty || 0) - (r.allocated || 0)
          const isOut = avail <= 0

          return (
            <div
              key={r.id}
              onClick={() => toggle(r.id, isOut)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                on
                  ? 'border-brand-400 bg-brand-50'
                  : isOut
                  ? 'border-red-200 bg-red-50/40 cursor-default'
                  : 'border-brand-100 bg-white hover:border-brand-300'
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isOut ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-700'}`}>
                <Boxes size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-brand-950">{r.name}</p>
                  {isOut ? (
                    <span className="chip bg-red-100 text-red-700 text-[10px] font-bold">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="chip bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ {avail} available
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/45 mt-0.5">{r.type || r.category} · Total stock: {r.qty || 0}</p>
              </div>

              {isOut ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOrder(r) }}
                  disabled={orderingId === r.id}
                  className="btn-outline !py-1 !px-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50 shrink-0"
                >
                  {orderingId === r.id ? 'Ordering…' : '+ Order Resource'}
                </button>
              ) : on ? (
                <span className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2 py-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-semibold text-ink/45">Qty</span>
                  <input
                    type="number"
                    min="1"
                    max={avail}
                    className="w-14 rounded-md border border-brand-200 px-1.5 py-0.5 text-center text-xs font-bold outline-none focus:border-brand-500"
                    value={qtys[r.id] || 1}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); setQty(r.id, e.target.value, avail) }}
                  />
                </span>
              ) : null}

              {!isOut && (
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-transparent'
                }`}>✓</span>
              )}
            </div>
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
      <p className="mb-3 text-sm text-ink/60">Link the vendors supplying this event - catering, security, AV, transport, etc.</p>
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

      {/* All event budgets - admin can create/edit any budget here */}
      <div className="rounded-xl border border-brand-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <div>
            <p className="font-bold text-brand-950">Event Budgets</p>
            <p className="text-xs text-ink/45">Total budget {fmt(totalBudget)} · {fmt(totalSpent)} committed across all events</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead className="bg-brand-50/50"><tr><Th>Category</Th><Th>Date</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {related.map((e) => (
                <tr key={e.id}><Td className="text-ink/70">{e.category}</Td><Td className="text-ink/45">{e.date}</Td><Td className="text-right font-semibold text-brand-950">{fmt(e.amount)}</Td></tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={`Record Expense - ${event.name}`}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><select className="input" value={expForm.category || 'General'} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}><option>Venue Rental</option><option>Catering</option><option>Technical</option><option>Decoration</option><option>Transport</option><option>Marketing</option><option>Security</option><option>Staffing</option><option>Printing & Signage</option><option>Entertainment</option><option>Insurance</option><option>Accommodation</option><option>Miscellaneous</option><option>Other</option></select></Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={expForm.amount || ''} onChange={(e) => { setExpForm({ ...expForm, amount: e.target.value }); if (errors.amount) setErrors({ ...errors, amount: undefined }) }} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Date"><input type="date" className="input" value={expForm.date || ''} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></Field>
          <Field label="Vendor"><select className="input" value={expForm.vendorId || ''} onChange={(e) => setExpForm({ ...expForm, vendorId: e.target.value })}><option value="">-</option>{state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
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

function EventAttendeesTab({ event, state, show }) {
  const { checkIn } = useData()
  const [q, setQ] = useState('')
  const [regOpen, setRegOpen] = useState(false)
  const regs = (state.registrations || []).filter((r) => r.eventId === event.id)
  const filtered = regs.filter((r) => {
    if (!q) return true
    const s = q.toLowerCase()
    return r.name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.qr?.toLowerCase().includes(s)
  })
  const checkedInCount = regs.filter((r) => r.checkedIn).length
  const totalRevenue = regs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const handleCheckIn = async (r) => {
    try {
      const res = await checkIn(r.qr || r.id, event.id)
      if (res?.ok) {
        show(`${r.name} checked in successfully!`)
      } else {
        show(res?.reason || 'Check-in processed')
      }
    } catch (e) {
      show('Check-in error', 'error')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-950">Registered Attendees ({regs.length})</h3>
          <p className="text-xs text-ink/50">{checkedInCount} checked in · ETB {totalRevenue.toLocaleString()} revenue collected</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input max-w-xs text-xs"
            placeholder="Search by name, email, or QR code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary text-xs !py-2 shrink-0" onClick={() => setRegOpen(true)}>
            <Plus size={14} /> Register Attendee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 bg-brand-50/60">
          <p className="text-[11px] font-semibold text-ink/50">Total Registrations</p>
          <p className="text-lg font-black text-brand-950">{regs.length}</p>
        </div>
        <div className="card p-3 bg-emerald-50/60">
          <p className="text-[11px] font-semibold text-emerald-800">Checked In</p>
          <p className="text-lg font-black text-emerald-700">{checkedInCount}</p>
        </div>
        <div className="card p-3 bg-gold-50/60">
          <p className="text-[11px] font-semibold text-gold-800">Pending Arrival</p>
          <p className="text-lg font-black text-gold-700">{regs.length - checkedInCount}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/40">
            {regs.length === 0 ? 'No attendees registered for this event yet.' : 'No attendees match search query.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-brand-50/50">
                <tr>
                  <Th>Attendee</Th>
                  <Th>Email & Phone</Th>
                  <Th>Ticket Type</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/30">
                    <Td className="font-bold text-brand-950">{r.name}</Td>
                    <Td className="text-xs text-ink/60">
                      <div>{r.email || '-'}</div>
                      <div className="text-[10px] text-ink/40">{r.phone}</div>
                    </Td>
                    <Td><span className="chip bg-brand-50 text-brand-800 font-semibold text-[11px]">{r.type || 'Standard'}</span></Td>
                    <Td className="text-right font-bold text-brand-900">ETB {Number(r.amount || 0).toLocaleString()}</Td>
                    <Td>
                      {r.checkedIn ? (
                        <Badge status="active" label="Checked In" />
                      ) : (
                        <Badge status="pending" label="Pending" />
                      )}
                    </Td>
                    <Td className="text-right">
                      {!r.checkedIn ? (
                        <button
                          className="btn-primary !py-1 !px-2.5 text-xs"
                          onClick={() => handleCheckIn(r)}
                        >
                          Check In
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">✓ Arrived</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegisterAttendeeModal
        open={regOpen}
        onClose={() => setRegOpen(false)}
        defaultEventId={event.id}
        onSuccess={() => show('Attendee registered for ' + event.name)}
      />
    </div>
  )
}


