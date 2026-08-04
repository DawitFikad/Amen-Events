import React, { useState } from 'react'
import { UserCog, Plus, CalendarDays, Award, Clock3, ShieldCheck } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, EmptyState, Th, Td, Avatar, Segmented, Modal, Field } from '../components/ui'

const attendance = [
  { id: 'at1', staffId: 'st2', eventId: 'ev3', role: 'Project Lead', hours: 18, status: 'present' },
  { id: 'at2', staffId: 'st3', eventId: 'ev3', role: 'Coordinator', hours: 18, status: 'present' },
  { id: 'at3', staffId: 'st5', eventId: 'ev3', role: 'Logistics', hours: 20, status: 'present' },
  { id: 'at4', staffId: 'st8', eventId: 'ev3', role: 'Technician', hours: 10, status: 'late' },
  { id: 'at5', staffId: 'st7', eventId: 'ev3', role: 'Marketing', hours: 0, status: 'absent' },
]

export default function Staff() {
  const { state, addStaffMember } = useData()
  const [q, setQ] = useState('')
  const [view, setView] = useState('directory')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const submit = () => {
    if (!form.name) { show('Name is required', 'warn'); return }
    addStaffMember(form)
    show(`${form.name} added to team`)
    setOpen(false); setForm({})
  }

  const filtered = state.staff.filter((m) => (m.name + m.role + m.dept).toLowerCase().includes(q.toLowerCase()))

  const load = state.staff.map((m) => {
    const tasks = state.tasks.filter((t) => t.assigneeId === m.id)
    const done = tasks.filter((t) => t.status === 'done').length
    return { ...m, load: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
  }).sort((a, b) => b.load - a.load)

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle="Directory, attendance, availability and performance."
        icon={UserCog}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Add Team Member</button>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={[{ value: 'directory', label: 'Directory' }, { value: 'attendance', label: 'Attendance' }, { value: 'performance', label: 'Performance' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search team…" className="w-full sm:w-64" />
      </div>

      {view === 'directory' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-center justify-between">
                <Avatar name={m.name} initials={m.initials} color={m.color} size="lg" />
                <Badge status={m.type === 'Employee' ? 'active' : 'pending'} label={m.type} />
              </div>
              <h3 className="mt-3 font-bold text-brand-950">{m.name}</h3>
              <p className="text-xs text-ink/50">{m.role}</p>
              <div className="mt-3 space-y-1.5 text-xs text-ink/55">
                <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-brand-600" /> {m.dept}</p>
                <p className="flex items-center gap-2"><Clock3 size={13} className="text-brand-600" /> {m.phone}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-3">
                <span className="text-xs text-ink/40">{m.email}</span>
                <Badge status={m.status} label={m.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'attendance' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-brand-100 p-4">
            <CalendarDays size={15} className="text-brand-600" />
            <span className="text-sm font-semibold text-brand-950">Abyssinia Bank Leadership Retreat — Day 1 attendance</span>
          </div>
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Member</Th><Th>Role</Th><Th>Hours</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {attendance.map((a) => {
                const m = state.staff.find((x) => x.id === a.staffId)
                return (
                  <tr key={a.id} className="hover:bg-brand-50/40">
                    <Td><span className="flex items-center gap-2"><Avatar name={m?.name} initials={m?.initials} color={m?.color} size="sm" /><span className="font-semibold text-brand-950">{m?.name}</span></span></Td>
                    <Td className="text-ink/60">{a.role}</Td>
                    <Td className="font-semibold">{a.hours}h</Td>
                    <Td><Badge status={a.status === 'present' ? 'active' : a.status === 'late' ? 'pending' : 'inactive'} label={a.status} /></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'performance' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {load.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} initials={m.initials} color={m.color} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-950">{m.name}</p>
                  <p className="text-xs text-ink/45">{m.role}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-ink/45">Workload: <span className="font-bold text-brand-900">{m.load} tasks</span></span>
                <span className="flex items-center gap-1 font-bold text-gold-600"><Award size={13} /> {m.pct}%</span>
              </div>
              <Progress value={m.pct} className="mt-2" color={m.pct >= 70 ? 'bg-brand-600' : 'bg-gold-500'} />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-ink/40">{m.done} completed</span>
                <span className={`chip ${m.load >= 4 ? 'bg-gold-100 text-gold-700' : 'bg-brand-50 text-brand-800'}`}>{m.load >= 4 ? 'High load' : 'Balanced'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add member modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Elias Bekele" /></Field>
          <Field label="Role"><input className="input" value={form.role || 'Coordinator'} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Department"><select className="input" value={form.dept || 'Operations'} onChange={(e) => setForm({ ...form, dept: e.target.value })}><option>Management</option><option>Operations</option><option>Finance</option><option>Procurement</option><option>Marketing</option><option>Technical</option></select></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Type"><select className="input" value={form.type || 'Employee'} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Employee</option><option>Freelancer</option><option>Volunteer</option></select></Field>
          <Field label="Status"><select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Add Member</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}