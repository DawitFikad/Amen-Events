import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CalendarDays, MapPin, Building2, Wallet, Users, Ticket, FileText,
  CheckCircle2, Clock, ArrowLeft, GitBranch, User, Phone, Mail,
  TrendingUp, AlertCircle, Download,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Progress, Th, Td } from '../../components/ui'
import { fmtCompact, fmt } from '../../store/data'

const TABS = [
  ['overview', 'Overview', Building2],
  ['timeline', 'Timeline', GitBranch],
  ['venue', 'Venue', MapPin],
  ['budget', 'Budget', Wallet],
  ['invoices', 'Invoices', FileText],
  ['attendees', 'Attendees', Users],
  ['tickets', 'Tickets', Ticket],
  ['team', 'Team', User],
]

const TIMELINE_STAGES = [
  { key: 'inquiry', label: 'Inquiry', threshold: 10 },
  { key: 'planning', label: 'Planning', threshold: 25 },
  { key: 'venue', label: 'Venue Confirmed', threshold: 40 },
  { key: 'resources', label: 'Resources Ready', threshold: 55 },
  { key: 'marketing', label: 'Marketing', threshold: 70 },
  { key: 'registration', label: 'Registration Open', threshold: 80 },
  { key: 'running', label: 'Event Running', threshold: 90 },
  { key: 'completed', label: 'Completed', threshold: 100 },
]

export default function ClientEventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useData()
  const [tab, setTab] = useState('overview')

  const event = state.events.find((e) => e.id === id)
  const venue = state.venues.find((v) => v.id === event?.venueId)
  const pm = state.staff.find((s) => s.id === event?.pmId)

  const eventInvoices = useMemo(() => state.invoices.filter((inv) => inv.eventId === id), [state.invoices, id])
  const eventExpenses = useMemo(() => state.expenses.filter((ex) => ex.eventId === id), [state.expenses, id])
  const eventRegistrations = useMemo(() => state.registrations.filter((r) => r.eventId === id), [state.registrations, id])
  const eventSpeakers = useMemo(() => state.speakers.filter((s) => s.eventId === id), [state.speakers, id])
  const eventTasks = useMemo(() => state.tasks.filter((t) => t.eventId === id), [state.tasks, id])

  if (!event) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-ink/50">Event not found</p>
        <button onClick={() => navigate('/erp/portal/events')} className="btn-primary mt-3">Back to Events</button>
      </div>
    )
  }

  const paidAmount = eventInvoices.reduce((a, i) => a + (i.paid || 0), 0)
  const totalInvoiced = eventInvoices.reduce((a, i) => a + i.amount, 0)
  const outstanding = totalInvoiced - paidAmount
  const totalExpenses = eventExpenses.reduce((a, e) => a + e.amount, 0)
  const checkedIn = eventRegistrations.filter((r) => r.checkedIn).length
  const pending = eventRegistrations.filter((r) => !r.checkedIn).length
  const vipCount = eventRegistrations.filter((r) => r.type?.toLowerCase().includes('vip')).length

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/erp/portal/events')} className="flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
        <ArrowLeft size={16} /> Back to Events
      </button>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex gap-2">
              <span className="chip bg-white/20 text-white">{event.category}</span>
              <span className={`chip ${event.status === 'upcoming' ? 'bg-gold-400 text-white' : event.status === 'ongoing' ? 'bg-brand-400 text-white' : 'bg-ink/60 text-white'}`}>{event.status}</span>
            </div>
            <h1 className="text-2xl font-black">{event.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-100">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {event.date || 'TBD'} · {event.time || '09:00'}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {venue?.name || 'TBA'}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 size={14} /> {pm?.name || 'Unassigned'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-2xl font-black">{event.progress || 0}%</p>
              <p className="text-[11px] text-brand-200">Complete</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-2xl font-black">{eventRegistrations.length}</p>
              <p className="text-[11px] text-brand-200">Attendees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-brand-100 pb-2">
        {TABS.map(([v, l, I]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold transition ${
              tab === v ? 'bg-brand-600 text-white' : 'text-ink/60 hover:bg-brand-50'
            }`}
          >
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Event Summary</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Budget</p><p className="font-bold text-brand-950">ETB {fmtCompact(event.budget)}</p></div>
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Spent</p><p className="font-bold text-brand-950">ETB {fmtCompact(event.spent)}</p></div>
                <div className="rounded-lg bg-brand-50 p-3"><p className="text-[10px] text-ink/50">Invoiced</p><p className="font-bold text-brand-950">ETB {fmtCompact(totalInvoiced)}</p></div>
                <div className="rounded-lg bg-gold-50 p-3"><p className="text-[10px] text-ink/50">Outstanding</p><p className="font-bold text-gold-700">ETB {fmtCompact(outstanding)}</p></div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-ink/50">Overall Progress</span>
                  <span className="font-bold text-brand-700">{event.progress || 0}%</span>
                </div>
                <Progress value={event.progress || 0} />
              </div>
            </div>

            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Checklist Progress</p>
              <div className="space-y-2">
                {eventTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-brand-50 p-3">
                    {t.status === 'done' ? <CheckCircle2 size={16} className="text-brand-600" /> : <Clock size={16} className="text-gold-500" />}
                    <span className="flex-1 text-sm text-ink/70">{t.title}</span>
                    <Badge status={t.status === 'done' ? 'active' : 'pending'} label={t.status} />
                  </div>
                ))}
                {eventTasks.length === 0 && <p className="py-4 text-center text-sm text-ink/40">No tasks.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Project Manager</p>
              {pm ? (
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${pm.color} text-sm font-bold text-white`}>{pm.initials}</div>
                  <div>
                    <p className="text-sm font-bold text-brand-950">{pm.name}</p>
                    <p className="text-xs text-ink/50">{pm.role}</p>
                    <p className="text-xs text-ink/50">{pm.phone}</p>
                  </div>
                </div>
              ) : <p className="text-sm text-ink/40">Unassigned</p>}
            </div>

            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Quick Stats</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink/60">Attendees</span><span className="font-bold text-brand-950">{eventRegistrations.length}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Checked In</span><span className="font-bold text-brand-700">{checkedIn}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Pending</span><span className="font-bold text-gold-700">{pending}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">VIP Guests</span><span className="font-bold text-brand-950">{vipCount}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Speakers</span><span className="font-bold text-brand-950">{eventSpeakers.length}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Expenses</span><span className="font-bold text-brand-950">ETB {fmtCompact(totalExpenses)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="card p-6">
          <p className="mb-6 font-bold text-brand-950">Event Timeline</p>
          <div className="space-y-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const isComplete = (event.progress || 0) >= stage.threshold
              const isCurrent = !isComplete && (i === 0 || (event.progress || 0) >= TIMELINE_STAGES[i - 1].threshold)
              return (
                <div key={stage.key} className="flex gap-4">
                  {/* Line */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                      isComplete ? 'border-brand-600 bg-brand-600 text-white' : isCurrent ? 'border-gold-400 bg-gold-50 text-gold-600' : 'border-brand-100 bg-white text-ink/30'
                    }`}>
                      {isComplete ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    {i < TIMELINE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-12 ${isComplete ? 'bg-brand-500' : 'bg-brand-100'}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <p className={`text-sm font-bold ${isComplete ? 'text-brand-950' : isCurrent ? 'text-gold-700' : 'text-ink/40'}`}>{stage.label}</p>
                    <p className="text-xs text-ink/45">
                      {isComplete ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                    </p>
                    {isComplete && <p className="text-[11px] text-brand-600">{pm?.name || 'Team'} · {event.date || 'TBD'}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Venue */}
      {tab === 'venue' && venue && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Venue Details</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-brand-50 pb-2"><span className="text-ink/60">Name</span><span className="font-bold text-brand-950">{venue.name}</span></div>
              <div className="flex justify-between border-b border-brand-50 pb-2"><span className="text-ink/60">City</span><span className="font-bold text-brand-950">{venue.city}</span></div>
              <div className="flex justify-between border-b border-brand-50 pb-2"><span className="text-ink/60">Halls</span><span className="font-bold text-brand-950">{venue.halls}</span></div>
              <div className="flex justify-between border-b border-brand-50 pb-2"><span className="text-ink/60">Capacity</span><span className="font-bold text-brand-950">{venue.capacity.toLocaleString()}</span></div>
              <div className="flex justify-between border-b border-brand-50 pb-2"><span className="text-ink/60">Contact</span><span className="font-bold text-brand-950">{venue.contact}</span></div>
              <div className="flex justify-between"><span className="text-ink/60">Status</span><Badge status={venue.status} label={venue.status} /></div>
            </div>
          </div>
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Equipment & Facilities</p>
            <div className="flex flex-wrap gap-2">
              {venue.equipment?.map((eq) => (
                <span key={eq} className="chip bg-brand-50 text-brand-700">{eq}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget */}
      {tab === 'budget' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-[11px] text-ink/50">Total Budget</p>
              <p className="text-2xl font-black text-brand-950">{fmt(event.budget)}</p>
            </div>
            <div className="card p-5">
              <p className="text-[11px] text-ink/50">Total Spent</p>
              <p className="text-2xl font-black text-brand-700">{fmt(event.spent)}</p>
              <Progress value={event.budget ? ((event.spent / event.budget) * 100) : 0} />
            </div>
            <div className="card p-5">
              <p className="text-[11px] text-ink/50">Remaining</p>
              <p className="text-2xl font-black text-gold-700">{fmt((event.budget || 0) - (event.spent || 0))}</p>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="p-5 pb-3"><p className="font-bold text-brand-950">Expenses Breakdown</p></div>
            {eventExpenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink/40">No expenses recorded.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-brand-50/50">
                  <tr><Th>Category</Th><Th>Amount</Th><Th>Date</Th><Th>Vendor</Th></tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {eventExpenses.map((ex) => {
                    const vendor = state.vendors.find((v) => v.id === ex.vendorId)
                    return (
                      <tr key={ex.id} className="hover:bg-brand-50/40">
                        <Td className="font-semibold text-brand-950">{ex.category}</Td>
                        <Td className="font-bold text-brand-700">{fmt(ex.amount)}</Td>
                        <Td className="text-ink/60">{ex.date}</Td>
                        <Td className="text-ink/60">{vendor?.name || '—'}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-5 border-b border-brand-50">
            <div><p className="text-[11px] text-ink/50">Total Invoiced</p><p className="text-lg font-black text-brand-950">{fmt(totalInvoiced)}</p></div>
            <div><p className="text-[11px] text-ink/50">Paid</p><p className="text-lg font-black text-brand-700">{fmt(paidAmount)}</p></div>
            <div><p className="text-[11px] text-ink/50">Outstanding</p><p className="text-lg font-black text-gold-700">{fmt(outstanding)}</p></div>
          </div>
          {eventInvoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink/40">No invoices for this event.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-brand-50/50">
                <tr><Th>Invoice #</Th><Th>Amount</Th><Th>Paid</Th><Th>Outstanding</Th><Th>Status</Th><Th>Due Date</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {eventInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-50/40">
                    <Td><span className="font-mono text-sm text-brand-950">{inv.ref}</span></Td>
                    <Td className="font-semibold text-brand-950">{fmt(inv.amount)}</Td>
                    <Td className="text-brand-700">{fmt(inv.paid || 0)}</Td>
                    <Td className="text-gold-700">{fmt(inv.amount - (inv.paid || 0))}</Td>
                    <Td><Badge status={inv.status} label={inv.status} /></Td>
                    <Td className="text-ink/60">{inv.dueDate}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Attendees */}
      {tab === 'attendees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-950">{eventRegistrations.length}</p><p className="text-[11px] text-ink/50">Registered</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-700">{checkedIn}</p><p className="text-[11px] text-ink/50">Checked In</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-gold-700">{pending}</p><p className="text-[11px] text-ink/50">Pending</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-950">{vipCount}</p><p className="text-[11px] text-ink/50">VIP Guests</p></div>
          </div>
          <div className="card overflow-hidden">
            {eventRegistrations.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink/40">No registrations yet.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-brand-50/50">
                  <tr><Th>Attendee</Th><Th>Email</Th><Th>Type</Th><Th>Amount</Th><Th>Checked In</Th></tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {eventRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-50/40">
                      <Td className="font-semibold text-brand-950">{r.name}</Td>
                      <Td className="text-ink/60">{r.email}</Td>
                      <Td className="text-ink/60">{r.type}</Td>
                      <Td className="font-semibold text-brand-700">{fmt(r.amount)}</Td>
                      <Td>{r.checkedIn ? <Badge status="active" label="Checked In" /> : <Badge status="pending" label="Pending" />}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tickets */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-950">{eventRegistrations.length}</p><p className="text-[11px] text-ink/50">Tickets Sold</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-700">{fmtCompact(eventRegistrations.reduce((a, r) => a + (r.amount || 0), 0))}</p><p className="text-[11px] text-ink/50">Revenue (ETB)</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-950">{venue?.capacity ? venue.capacity - eventRegistrations.length : '—'}</p><p className="text-[11px] text-ink/50">Remaining</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-black text-brand-950">{venue?.capacity || '—'}</p><p className="text-[11px] text-ink/50">Capacity</p></div>
          </div>
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Ticket Types</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['VVIP', 'VIP', 'Standard', 'Group'].map((type) => {
                const count = eventRegistrations.filter((r) => r.type === type).length
                const revenue = eventRegistrations.filter((r) => r.type === type).reduce((a, r) => a + (r.amount || 0), 0)
                return (
                  <div key={type} className="rounded-xl border border-brand-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-950">{type}</span>
                      <span className="text-sm font-bold text-brand-700">{count} sold</span>
                    </div>
                    <p className="mt-1 text-xs text-ink/50">Revenue: ETB {fmtCompact(revenue)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      {tab === 'team' && (
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Assigned Team</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pm && (
              <div className="flex items-center gap-3 rounded-xl border border-brand-100 p-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${pm.color} text-sm font-bold text-white`}>{pm.initials}</div>
                <div>
                  <p className="text-sm font-bold text-brand-950">{pm.name}</p>
                  <p className="text-xs text-ink/50">{pm.role} · Project Manager</p>
                  <p className="text-xs text-ink/50">{pm.phone}</p>
                </div>
              </div>
            )}
            {eventSpeakers.map((sp) => (
              <div key={sp.id} className="flex items-center gap-3 rounded-xl border border-brand-100 p-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${sp.color} text-sm font-bold text-white`}>{sp.initials}</div>
                <div>
                  <p className="text-sm font-bold text-brand-950">{sp.name}</p>
                  <p className="text-xs text-ink/50">Speaker · {sp.topic}</p>
                  <p className="text-xs text-ink/50">{sp.company}</p>
                </div>
              </div>
            ))}
            {eventTasks.map((t) => {
              const assignee = state.staff.find((s) => s.id === t.assigneeId)
              if (!assignee) return null
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-brand-100 p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${assignee.color} text-sm font-bold text-white`}>{assignee.initials}</div>
                  <div>
                    <p className="text-sm font-bold text-brand-950">{assignee.name}</p>
                    <p className="text-xs text-ink/50">{assignee.role} · {t.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
