import React, { useState, useEffect } from 'react'
import { Mic2, Plus, CalendarDays, Award, Upload, Clock3, Video, UserCheck, Pencil, Phone, Mail } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, EmptyState, Th, Td, Avatar, Segmented, Modal, Field } from '../components/ui'
import { downloadCSV } from '../store/exportUtils'
import { nameOnly, textRequired, emailValid, phoneValid, optional, validate } from '../store/validation'

export default function Speakers() {
  const { state, patch, addSpeaker, updateSpeaker, logActivity, intent, clearIntent } = useData()
  const [view, setView] = useState('speakers')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({})
  const [errors, setErrors] = useState({})

  const agendaList = state.sessions
  const sessionAttendance = state.sessionAttendance
  const certificateHolders = state.certificateHolders

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const speakerSchema = {
    name: [nameOnly('Full name')],
    company: [optional(textRequired('Organization', { min: 2, max: 100 }))],
    topic: [optional(textRequired('Topic', { min: 3, max: 120 }))],
    email: [optional(emailValid('Email'))],
    phone: [optional(phoneValid('Phone number'))],
  }

  const openAdd = () => { setEditId(null); setForm({}); setErrors({}); setOpen(true) }

  useEffect(() => {
    if (intent === 'new-speaker') {
      if (state.demo.autoplay) {
        const seed = { name: 'Dr. Hanna Tesfaye', company: 'Addis Insight Analytics', topic: 'Future of Event Tech', eventId: state.demo.lastEventId || 'ev1', time: '10:00', status: 'confirmed', email: 'hanna@addisinsight.et', phone: '+251 911 303 444', bio: 'Industry analyst and keynote speaker' }
        setForm(seed); openAdd(); setErrors({})
        setTimeout(() => {
          const rec = addSpeaker(seed)
          show(`${rec?.name || seed.name} added as speaker automatically`); setOpen(false); setForm({})
        }, 1100)
      } else openAdd()
      clearIntent()
    }
  }, [intent])

  const openEdit = (s) => { setEditId(s.id); setForm({ name: s.name || '', company: s.company || '', topic: s.topic || '', eventId: s.eventId || 'ev1', time: s.time || '12:00', status: s.status || 'pending', email: s.email || '', phone: s.phone || '', bio: s.bio || '' }); setErrors({}); setOpen(true) }

  const submit = () => {
    const res = validate(form, speakerSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    if (editId) {
      updateSpeaker(editId, form)
      show(`${form.name} updated`)
    } else {
      addSpeaker(form)
      show(`${form.name} added as speaker`)
    }
    setOpen(false); setForm({}); setErrors({}); setEditId(null)
  }

  const addSession = () => {
    const res = validate(sessionForm, { session: [textRequired('Session title', { min: 3, max: 120 })] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    patch('sessions', (a) => [...a, { id: 'ag' + (a.length + 1), time: sessionForm.time || '16:30', session: sessionForm.session, venue: sessionForm.venue || 'Grand Hall', type: sessionForm.type || 'talk', speakerId: sessionForm.speakerId || '' }])
    logActivity(`Agenda session "${sessionForm.session}" added`, 'speakers')
    setSessionOpen(false); setSessionForm({}); setErrors({})
    show('Session added to agenda')
  }

  const issueCertificate = (c) => {
    downloadCSV(`speaker-certificate-${c.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      ['Certificate of Appreciation', '', ''],
      [['Speaker', c.name, ''], ['Session', c.session, ''], ['Event', state.events[0]?.name || 'Amen Events', ''], ['Issued', new Date().toLocaleDateString(), '']])
    patch('certificateHolders', (arr) => arr.map((x) => (x.id === c.id ? { ...x, issued: true } : x)))
    logActivity(`Certificate issued to ${c.name}`, 'speakers')
    show(`Certificate generated for ${c.name}`)
  }

  const generateAll = () => {
    downloadCSV('speaker-certificates-all.csv',
      ['Speaker', 'Session', 'Event', 'Status'],
      certificateHolders.map((c) => [c.name, c.session, state.events[0]?.name || 'Amen Events', 'Issued']))
    patch('certificateHolders', (arr) => arr.map((c) => ({ ...c, issued: true })))
    logActivity(`Bulk certificates generated for ${certificateHolders.length} speakers`, 'speakers')
    show(`Generated ${certificateHolders.length} certificates`)
  }

  return (
    <div>
      <PageHeader
        title="Speaker & Conference Management"
        subtitle="Speakers, sessions, agenda and certificates."
        icon={Mic2}
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Speaker</button>}
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['speakers', 'Speakers', Mic2], ['agenda', 'Agenda Builder', CalendarDays], ['sessions', 'Session Attendance', UserCheck], ['certificates', 'Certificates', Award]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'speakers' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {state.speakers.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between">
                <Avatar name={s.name} initials={s.initials} color={s.color} size="lg" />
                <div className="flex items-center gap-1.5">
                  <Badge status={s.status} label={s.status} />
                  <button onClick={() => openEdit(s)} className="btn-ghost !p-1.5 text-ink/40 hover:text-brand-700" title="Edit speaker"><Pencil size={14} /></button>
                </div>
              </div>
              <h3 className="mt-3 font-bold text-brand-950">{s.name}</h3>
              <p className="text-xs text-ink/50">{s.company}</p>
              {(s.email || s.phone) && (
                <div className="mt-1.5 space-y-0.5">
                  {s.email && <p className="flex items-center gap-1.5 text-[11px] text-ink/45"><Mail size={11} /> {s.email}</p>}
                  {s.phone && <p className="flex items-center gap-1.5 text-[11px] text-ink/45"><Phone size={11} /> {s.phone}</p>}
                </div>
              )}
              <div className="mt-3 rounded-lg bg-brand-50 p-3">
                <p className="text-[11px] font-semibold text-ink/40">Topic</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-950">{s.topic}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink/45"><Clock3 size={12} /> {s.time} · {state.events.find((e) => e.id === s.eventId)?.name}</p>
              </div>
              {s.bio && <p className="mt-2 line-clamp-2 text-xs text-ink/50">{s.bio}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={() => { logActivity(`Presentation uploaded for ${s.name}`, 'speakers'); show(`Presentation uploaded for ${s.name}`) }}><Upload size={13} /> Upload</button>
                <button className="btn-ghost flex-1 !py-1.5 text-xs" onClick={() => { logActivity(`Certificate generated for ${s.name}`, 'speakers'); show(`Certificate generated for ${s.name}`) }}><Award size={13} /> Certificate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'agenda' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">EthFinTech Summit - Agenda</p>
            <button className="btn-outline !py-1.5 text-xs" onClick={() => { setErrors({}); setSessionOpen(true) }}><Plus size={14} /> Add Session</button>
          </div>
          <div className="relative ml-4 space-y-4 border-l-2 border-brand-100 pl-6">
            {agendaList.map((a) => {
              const s = a.speakerId ? state.speakers.find((x) => x.id === a.speakerId) : null
              return (
                <div key={a.id} className="relative">
                  <span className={`absolute -left-[33px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${a.type === 'keynote' ? 'bg-gold-400 text-brand-950 ring-4 ring-white' : 'bg-brand-100 text-brand-800'}`}>{a.time.slice(0, 2)}</span>
                  <p className="text-xs font-bold text-brand-700">{a.time}</p>
                  <div className="mt-1 flex items-start justify-between gap-3 rounded-xl border border-brand-100 p-3.5">
                    <div>
                      <p className="font-semibold text-brand-950">{a.session}</p>
                      <p className="text-xs text-ink/45">{a.venue} · {a.type}</p>
                      <p className="mt-1 text-xs font-semibold text-brand-700">{s ? `🎤 ${s.name}` : a.speakerIds ? 'Multi-speaker' : '-'}</p>
                    </div>
                    <Badge status="done" label={a.type} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'sessions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead className="bg-brand-50/50"><tr><Th>Session</Th><Th className="text-right">Registered</Th><Th className="text-right">Attended</Th><Th>Attend Rate</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {sessionAttendance.map((sa) => (
                <tr key={sa.id} className="hover:bg-brand-50/40">
                  <Td className="font-semibold text-brand-950">{sa.session}</Td>
                  <Td className="text-right text-ink/60">{sa.registered}</Td>
                  <Td className="text-right font-semibold">{sa.attended}</Td>
                  <Td>
                    <div className="flex w-40 items-center gap-2">
                      <Progress value={(sa.attended / sa.registered) * 100} className="flex-1" />
                      <span className="text-xs font-bold">{Math.round((sa.attended / sa.registered) * 100)}%</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {view === 'certificates' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Certificate Issue</p>
            <button className="btn-primary !py-1.5 text-xs" onClick={generateAll}>Generate All</button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {certificateHolders.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-brand-100 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 text-gold-700"><Award size={18} /></span>
                  <div>
                    <p className="font-semibold text-brand-950">{c.name}</p>
                    <p className="text-xs text-ink/45">Speaker certificate · {c.session}</p>
                  </div>
                </div>
                <button className="btn-outline !py-1 text-xs" onClick={() => issueCertificate(c)}>{c.issued ? 'Reissue' : 'Send'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditId(null) }} title={editId ? 'Edit Speaker' : 'Register Speaker'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Prof. Elias Bekele" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Organization/Company"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} />{errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}</Field>
          <Field label="Topic"><input className="input" value={form.topic || ''} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Digital Payments Trends" />{errors.topic && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.topic}</p>}</Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="speaker@org.et" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9XX XXX XXX" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
          <Field label="Event" className="col-span-2"><select className="input" value={form.eventId || 'ev1'} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>{state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}</select></Field>
          <Field label="Session Time"><input type="time" className="input" value={form.time || '12:00'} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="confirmed">Confirmed</option><option value="pending">Pending</option></select></Field>
          <Field label="Speaker Bio" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Background, expertise, talk highlights…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => { setOpen(false); setEditId(null) }}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{editId ? 'Save Changes' : 'Register Speaker'}</button>
        </div>
      </Modal>

      {/* Add session modal */}
      <Modal open={sessionOpen} onClose={() => setSessionOpen(false)} title="Add Agenda Session" width="max-w-md">
        <div className="space-y-3">
          <Field label="Session Title *"><input className="input" value={sessionForm.session || ''} onChange={(e) => setSessionForm({ ...sessionForm, session: e.target.value })} placeholder="e.g. Networking Lunch" />{errors.session && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.session}</p>}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time"><input type="time" className="input" value={sessionForm.time || '16:30'} onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })} /></Field>
            <Field label="Type"><select className="input" value={sessionForm.type || 'talk'} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })}><option value="keynote">Keynote</option><option value="panel">Panel</option><option value="workshop">Workshop</option><option value="fireside">Fireside</option><option value="talk">Talk</option><option value="networking">Networking</option></select></Field>
          </div>
          <Field label="Venue"><input className="input" value={sessionForm.venue || ''} onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })} placeholder="e.g. Grand Hall" /></Field>
          <Field label="Speaker (optional)"><select className="input" value={sessionForm.speakerId || ''} onChange={(e) => setSessionForm({ ...sessionForm, speakerId: e.target.value })}><option value="">No speaker</option>{state.speakers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setSessionOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={addSession}><Plus size={14} /> Add Session</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}