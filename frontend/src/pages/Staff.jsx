import React, { useState, useEffect } from 'react'
import { UserCog, Plus, CalendarDays, Award, Clock3, ShieldCheck, Upload, Trash2, Info, MapPin, Wallet } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, SearchBox, Toast, Th, Td, Avatar, Segmented, Modal, Field } from '../components/ui'
import { nameOnly, phoneValid, emailValid, numberPositive, optional, dateRequired, textRequired, validate } from '../store/validation'

const attendance = [
  { id: 'at1', staffId: 'st2', eventId: 'ev3', role: 'Project Lead', hours: 18, status: 'present' },
  { id: 'at2', staffId: 'st3', eventId: 'ev3', role: 'Coordinator', hours: 18, status: 'present' },
  { id: 'at3', staffId: 'st5', eventId: 'ev3', role: 'Logistics', hours: 20, status: 'present' },
  { id: 'at4', staffId: 'st8', eventId: 'ev3', role: 'Technician', hours: 10, status: 'late' },
  { id: 'at5', staffId: 'st7', eventId: 'ev3', role: 'Marketing', hours: 0, status: 'absent' },
]

const departments = ['Management', 'Operations', 'Finance', 'Procurement', 'Marketing', 'Technical']

export default function Staff() {
  const { state, addStaffMember, updateStaffMember, intent, clearIntent } = useData()
  const [q, setQ] = useState('')
  const [view, setView] = useState('directory')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    if (intent === 'new-staff') {
      if (state.demo.autoplay) {
        const seed = { name: 'Elias Bekele', role: 'Project Manager', dept: 'Operations', phone: '+251 919 445 667', email: 'elias@amen.et', type: 'Employee', salary: '65000', joinedDate: '2026-08-01' }
        setOpen(true); setForm(seed); setErrors({})
        setTimeout(() => {
          addStaffMember(seed)
          show(`${seed.name} added to team automatically`); setOpen(false); setForm({})
        }, 1100)
      } else { setOpen(true); setErrors({}) }
      clearIntent()
    }
  }, [intent])

  const schema = { name: [nameOnly('Full name')], phone: [phoneValid('Phone number')], email: [emailValid('Email')], salary: [optional(numberPositive('Salary'))], joinedDate: [optional(dateRequired('Joined date'))], contractEnd: [optional(dateRequired('Contract end'))] }

  const submit = () => {
    const res = validate(form, schema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addStaffMember(form)
    show(`${form.name} added to team`)
    setOpen(false); setForm({}); setErrors({})
  }

  const openEdit = (m) => {
    setEditId(m.id)
    setEditForm({ ...m, role: m.role || m.jobTitle || '' })
    setErrors({})
    setEditOpen(true)
  }

  const editSave = () => {
    const res = validate(editForm, schema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    updateStaffMember(editId, editForm)
    show(`${editForm.name} updated`)
    setEditOpen(false); setEditForm({}); setEditId(null); setErrors({})
  }

  const onPhoto = (e, setFn) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { show('Please select an image file', 'warn'); return }
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB', 'warn'); return }
    const reader = new FileReader()
    reader.onload = () => { setFn((f) => ({ ...f, avatar: reader.result })) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const filtered = state.staff.filter((m) => (m.name + m.role + m.dept).toLowerCase().includes(q.toLowerCase()))

  const load = state.staff.map((m) => {
    const tasks = state.tasks.filter((t) => t.assigneeId === m.id)
    const done = tasks.filter((t) => t.status === 'done').length
    return { ...m, load: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
  }).sort((a, b) => b.load - a.load)

  const renderFields = (f, setFn, canEditEmail = true) => (
    <>
      <div className="mb-4 flex items-center gap-4">
        <div className="relative">
          {f.avatar
            ? <img src={f.avatar} alt={f.name} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-brand-200" />
            : <Avatar name={f.name || 'New Member'} initials={(f.name || 'NM').split(' ').map((p) => p[0]).slice(0, 2).join('')} color="bg-brand-500" size="lg" />}
          <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-white shadow hover:bg-brand-800">
            <Upload size={13} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e, setFn)} />
          </label>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-950">Profile Photo</p>
          <p className="text-xs text-ink/50">Used on the directory, team pickers and badges (JPG, PNG - max 5MB).</p>
          {f.avatar && <button className="btn-ghost mt-1 !py-1 text-xs !text-red-600" onClick={() => setFn((x) => ({ ...x, avatar: '' }))}><Trash2 size={13} /> Remove photo</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name *" className="col-span-2"><input className="input" value={f.name || ''} onChange={(e) => setFn({ ...f, name: e.target.value })} placeholder="e.g. Elias Bekele" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
        <Field label="Role / Job Title"><input className="input" value={f.role || f.jobTitle || ''} onChange={(e) => setFn({ ...f, role: e.target.value })} placeholder="Project Manager" /></Field>
        <Field label="Department"><select className="input" value={f.dept || 'Operations'} onChange={(e) => setFn({ ...f, dept: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Phone"><input className="input" value={f.phone || ''} onChange={(e) => setFn({ ...f, phone: e.target.value })} placeholder="+251 911 000 000" />{errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}</Field>
        <Field label="Email"><input className="input" value={f.email || ''} onChange={(e) => setFn({ ...f, email: e.target.value })} placeholder="name@amen.et" />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</Field>
        <Field label="Type"><select className="input" value={f.type || 'Employee'} onChange={(e) => setFn({ ...f, type: e.target.value })}><option>Employee</option><option>Freelancer</option><option>Volunteer</option></select></Field>
        <Field label="Status"><select className="input" value={f.status || 'active'} onChange={(e) => setFn({ ...f, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
      </div>

      <p className="mt-5 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/40"><Info size={13} /> Employment Details</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly Salary (ETB)"><div className="relative"><Wallet size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input type="number" className="input pl-9" value={f.salary || ''} onChange={(e) => setFn({ ...f, salary: e.target.value })} placeholder="e.g. 65000" /></div>{errors.salary && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.salary}</p>}</Field>
        <Field label="Joined Date"><input type="date" className="input" value={f.joinedDate || ''} onChange={(e) => setFn({ ...f, joinedDate: e.target.value })} />{errors.joinedDate && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.joinedDate}</p>}</Field>
        <Field label="Contract End Date"><input type="date" className="input" value={f.contractEnd || ''} onChange={(e) => setFn({ ...f, contractEnd: e.target.value })} />{errors.contractEnd && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contractEnd}</p>}</Field>
        <Field label="Residential / Work Address"><div className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input pl-9" value={f.address || ''} onChange={(e) => setFn({ ...f, address: e.target.value })} placeholder="Street, city" /></div></Field>
        <Field label="Notes / Bio" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={f.bio || ''} onChange={(e) => setFn({ ...f, bio: e.target.value })} placeholder="Specialties, certifications, emergency contact, notes…" /></Field>
      </div>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle="Directory, attendance, availability and performance."
        icon={UserCog}
        actions={<button className="btn-primary" onClick={() => { setOpen(true); setErrors({}) }}><Plus size={15} /> Add Team Member</button>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={[{ value: 'directory', label: 'Directory' }, { value: 'attendance', label: 'Attendance' }, { value: 'performance', label: 'Performance' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search team…" className="w-full sm:w-64" />
      </div>

      {view === 'directory' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between">
                {m.avatar
                  ? <img src={m.avatar} alt={m.name} className="h-12 w-12 rounded-xl object-cover ring-2 ring-brand-100" />
                  : <Avatar name={m.name} initials={m.initials} color={m.color} size="lg" />}
                <div className="flex items-center gap-2">
                  <Badge status={m.type === 'Employee' ? 'active' : 'pending'} label={m.type} />
                  <button onClick={() => openEdit(m)} className="btn-ghost !px-2 !py-1 text-[11px]">Edit</button>
                </div>
              </div>
              <h3 className="mt-3 font-bold text-brand-950">{m.name}</h3>
              <p className="text-xs text-ink/50">{m.role || m.jobTitle}</p>
              <div className="mt-3 space-y-1.5 text-xs text-ink/55">
                <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-brand-600" /> {m.dept}</p>
                <p className="flex items-center gap-2"><Clock3 size={13} className="text-brand-600" /> {m.phone}</p>
                {m.salary > 0 && <p className="flex items-center gap-2"><Wallet size={13} className="text-brand-600" /> ETB {Number(m.salary).toLocaleString()}/mo</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-3">
                <span className="truncate text-xs text-ink/40">{m.email}</span>
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
            <span className="text-sm font-semibold text-brand-950">Abyssinia Bank Leadership Retreat - Day 1 attendance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead className="bg-brand-50/50"><tr><Th>Member</Th><Th>Role</Th><Th>Hours</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {attendance.map((a) => {
                const m = state.staff.find((x) => x.id === a.staffId)
                return (
                  <tr key={a.id} className="hover:bg-brand-50/40">
                    <Td><span className="flex items-center gap-2">{m?.avatar ? <img src={m.avatar} alt="" className="h-7 w-7 rounded-lg object-cover" /> : <Avatar name={m?.name} initials={m?.initials} color={m?.color} size="sm" />}<span className="font-semibold text-brand-950">{m?.name}</span></span></Td>
                    <Td className="text-ink/60">{a.role}</Td>
                    <Td className="font-semibold">{a.hours}h</Td>
                    <Td><Badge status={a.status === 'present' ? 'active' : a.status === 'late' ? 'pending' : 'inactive'} label={a.status} /></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {view === 'performance' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {load.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-center gap-3">
                {m.avatar
                  ? <img src={m.avatar} alt={m.name} className="h-10 w-10 rounded-xl object-cover ring-2 ring-brand-100" />
                  : <Avatar name={m.name} initials={m.initials} color={m.color} />}
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-950">{m.name}</p>
                  <p className="text-xs text-ink/45">{m.role || m.jobTitle}</p>
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
      <Modal open={open} onClose={() => setOpen(false)} title="Register Team Member" width="max-w-2xl">
        {renderFields(form, setForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}><Plus size={14} /> Add Member</button>
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Team Member" width="max-w-2xl">
        {renderFields(editForm, setEditForm)}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={editSave}>Save Changes</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}