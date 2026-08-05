import React, { useState } from 'react'
import { Mic2, Plus, CalendarDays, Award, Upload, Clock3, Video, UserCheck } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, EmptyState, Th, Td, Avatar, Segmented, Modal, Field } from '../components/ui'

const agenda = [
  { id: 'ag1', time: '09:00', session: 'Registration & Welcome Coffee', venue: 'Main Foyer', type: 'networking' },
  { id: 'ag2', time: '10:00', session: 'Keynote: The Future of Digital Banking', venue: 'Grand Hall', type: 'keynote', speakerId: 'sp1' },
  { id: 'ag3', time: '11:30', session: 'Panel: RegTech & Compliance', venue: 'Grand Hall', type: 'panel', speakerIds: ['sp2', 'sp3'] },
  { id: 'ag4', time: '13:30', session: 'Workshop: AI in Finance', venue: 'Breakout A', type: 'workshop', speakerId: 'sp3' },
  { id: 'ag5', time: '15:30', session: 'Closing Fireside Chat', venue: 'Grand Hall', type: 'fireside', speakerId: 'sp1' },
]

const sessionAttendance = [
  { id: 'sa1', session: 'Keynote', registered: 640, attended: 590 },
  { id: 'sa2', session: 'Panel: RegTech', registered: 520, attended: 470 },
  { id: 'sa3', session: 'AI Workshop', registered: 220, attended: 205 },
]

export default function Speakers() {
  const { state, addSpeaker } = useData()
  const [view, setView] = useState('speakers')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const submit = () => {
    if (!form.name) { show('Speaker name is required', 'warn'); return }
    addSpeaker(form)
    show(`${form.name} added as speaker`)
    setOpen(false); setForm({})
  }

  return (
    <div>
      <PageHeader
        title="Speaker & Conference Management"
        subtitle="Speakers, sessions, agenda and certificates."
        icon={Mic2}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Add Speaker</button>}
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
                <Badge status={s.status} label={s.status} />
              </div>
              <h3 className="mt-3 font-bold text-brand-950">{s.name}</h3>
              <p className="text-xs text-ink/50">{s.company}</p>
              <div className="mt-3 rounded-lg bg-brand-50 p-3">
                <p className="text-[11px] font-semibold text-ink/40">Topic</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-950">{s.topic}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink/45"><Clock3 size={12} /> {s.time} · {state.events.find((e) => e.id === s.eventId)?.name}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={() => show('Uploading presentation…', 'info')}><Upload size={13} /> Upload</button>
                <button className="btn-ghost flex-1 !py-1.5 text-xs" onClick={() => show('Certificates generated')}><Award size={13} /> Certificate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'agenda' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">EthFinTech Summit — Agenda</p>
            <button className="btn-outline !py-1.5 text-xs" onClick={() => show('Added session')}><Plus size={14} /> Add Session</button>
          </div>
          <div className="relative ml-4 space-y-4 border-l-2 border-brand-100 pl-6">
            {agenda.map((a) => {
              const s = a.speakerId ? state.speakers.find((x) => x.id === a.speakerId) : null
              return (
                <div key={a.id} className="relative">
                  <span className={`absolute -left-[33px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${a.type === 'keynote' ? 'bg-gold-400 text-brand-950 ring-4 ring-white' : 'bg-brand-100 text-brand-800'}`}>{a.time.slice(0, 2)}</span>
                  <p className="text-xs font-bold text-brand-700">{a.time}</p>
                  <div className="mt-1 flex items-start justify-between gap-3 rounded-xl border border-brand-100 p-3.5">
                    <div>
                      <p className="font-semibold text-brand-950">{a.session}</p>
                      <p className="text-xs text-ink/45">{a.venue} · {a.type}</p>
                      <p className="mt-1 text-xs font-semibold text-brand-700">{s ? `🎤 ${s.name}` : a.speakerIds ? 'Multi-speaker' : '—'}</p>
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
          <table className="w-full">
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
      )}

      {view === 'certificates' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Certificate Issue</p>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => show('Bulk certificates generated')}>Generate All</button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {['Meseret Lemma', 'Tigist Fikru', 'Beza Tadesse', 'Nahom Girma'].map((n) => (
              <div key={n} className="flex items-center justify-between rounded-xl border border-brand-100 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 text-gold-700"><Award size={18} /></span>
                  <div>
                    <p className="font-semibold text-brand-950">{n}</p>
                    <p className="text-xs text-ink/45">Speaker certificate · Keynote session</p>
                  </div>
                </div>
                <button className="btn-outline !py-1 text-xs" onClick={() => show('Certificate emailed to ' + n)}>Send</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Speaker">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Prof. Elias Bekele" /></Field>
          <Field label="Organization/Company"><input className="input" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label="Topic"><input className="input" value={form.topic || ''} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Digital Payments Trends" /></Field>
          <Field label="Event"><select className="input" value={form.eventId || 'ev1'} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>{state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}</select></Field>
          <Field label="Session Time"><input type="time" className="input" value={form.time || '12:00'} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="confirmed">Confirmed</option><option value="pending">Pending</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Speaker</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}