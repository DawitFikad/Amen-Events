import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, CheckCircle2, Clock, Crown, Download, ArrowRight } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Th, Td } from '../../components/ui'
import { fmt } from '../../store/data'
import { downloadCSV } from '../../store/exportUtils'

export default function ClientAttendees() {
  const { state } = useData()
  const navigate = useNavigate()
  const clientId = state.currentUserId
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('all')

  const myEvents = useMemo(() => state.events.filter((e) => e.clientId === clientId), [state.events, clientId])
  const myEventIds = useMemo(() => new Set(myEvents.map((e) => e.id)), [myEvents])

  const allRegistrations = useMemo(() => {
    let regs = state.registrations.filter((r) => myEventIds.has(r.eventId))
    if (selectedEvent !== 'all') regs = regs.filter((r) => r.eventId === selectedEvent)
    if (search) {
      const q = search.toLowerCase()
      regs = regs.filter((r) => r.name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
    }
    return regs
  }, [state.registrations, myEventIds, selectedEvent, search])

  const stats = useMemo(() => ({
    total: allRegistrations.length,
    checkedIn: allRegistrations.filter((r) => r.checkedIn).length,
    pending: allRegistrations.filter((r) => !r.checkedIn).length,
    vip: allRegistrations.filter((r) => r.type?.toLowerCase().includes('vip')).length,
  }), [allRegistrations])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Attendees</h1>
        <p className="text-sm text-ink/50">View and manage event attendees</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Users size={18} /></span>
          <div><p className="text-xl font-black text-brand-950">{stats.total}</p><p className="text-[11px] text-ink/50">Registered</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><CheckCircle2 size={18} /></span>
          <div><p className="text-xl font-black text-brand-700">{stats.checkedIn}</p><p className="text-[11px] text-ink/50">Checked In</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><Clock size={18} /></span>
          <div><p className="text-xl font-black text-gold-700">{stats.pending}</p><p className="text-[11px] text-ink/50">Pending</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Crown size={18} /></span>
          <div><p className="text-xl font-black text-brand-950">{stats.vip}</p><p className="text-[11px] text-ink/50">VIP Guests</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input className="input pl-10" placeholder="Search attendees…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[200px]" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="all">All Events</option>
          {myEvents.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <button className="btn-outline text-xs" onClick={() => {
          downloadCSV('client-attendees.csv', ['Attendee', 'Email', 'Event', 'Type', 'Amount', 'Checked In'], allRegistrations.map((r) => [r.name, r.email, myEvents.find((e) => e.id === r.eventId)?.name, r.type, r.amount, r.checkedIn ? 'Yes' : 'No']))
        }}><Download size={14} /> Export</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {allRegistrations.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/40">No attendees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead className="bg-brand-50/50">
              <tr><Th>Attendee</Th><Th>Email</Th><Th>Event</Th><Th>Type</Th><Th>Amount</Th><Th>Checked In</Th></tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {allRegistrations.map((r) => {
                const evt = myEvents.find((e) => e.id === r.eventId)
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{r.name}</Td>
                    <Td className="text-ink/60">{r.email}</Td>
                    <Td className="text-ink/60">{evt?.name || '-'}</Td>
                    <Td className="text-ink/60">{r.type}</Td>
                    <Td className="font-semibold text-brand-700">{fmt(r.amount)}</Td>
                    <Td>{r.checkedIn ? <Badge status="active" label="Checked In" /> : <Badge status="pending" label="Pending" />}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

