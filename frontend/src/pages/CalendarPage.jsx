import React, { useState, useEffect, useMemo } from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, Package, KanbanSquare, Ticket,
} from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast } from '../components/ui'

const TYPE_META = {
  event: { icon: CalendarDays, color: 'bg-brand-600', label: 'Event' },
  task: { icon: KanbanSquare, color: 'bg-gold-500', label: 'Task' },
  venue_booking: { icon: MapPin, color: 'bg-gold-600', label: 'Venue' },
  registration: { icon: Ticket, color: 'bg-sky-600', label: 'Registration' },
  meeting: { icon: Clock, color: 'bg-purple-600', label: 'Meeting' },
  resource_allocation: { icon: Package, color: 'bg-emerald-600', label: 'Resource' },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { backendOnline } = useData()
  const [events, setEvents] = useState([])
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { month: d.getMonth(), year: d.getFullYear() } })
  const [selectedDate, setSelectedDate] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', type: 'meeting', date: '', time: '', location: '', notes: '' })
  const [toast, setToast] = useState(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (backendOnline) loadCalendar()
  }, [backendOnline, cursor])

  const loadCalendar = async () => {
    try {
      const { events: evts } = await api.calendar.list(cursor.month, cursor.year)
      setEvents(evts)
    } catch (err) {
      show(err.message || 'Failed to load calendar', 'error')
    }
  }

  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      if (!e.date) return
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const last = new Date(cursor.year, cursor.month + 1, 0)
    const startPad = first.getDay()
    const total = last.getDate()
    const cells = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= total; d++) {
      const dateStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, date: dateStr, events: eventsByDate[dateStr] || [] })
    }
    return cells
  }, [cursor, eventsByDate])

  const today = new Date().toISOString().slice(0, 10)
  const prevMonth = () => setCursor((c) => {
    const m = c.month - 1
    return m < 0 ? { month: 11, year: c.year - 1 } : { month: m, year: c.year }
  })
  const nextMonth = () => setCursor((c) => {
    const m = c.month + 1
    return m > 11 ? { month: 0, year: c.year + 1 } : { month: m, year: c.year }
  })

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) { show('Title and date required', 'error'); return }
    try {
      await api.calendar.create(newEvent)
      show('Calendar event created')
      setShowAdd(false)
      setNewEvent({ title: '', type: 'meeting', date: '', time: '', location: '', notes: '' })
      await loadCalendar()
    } catch (err) {
      show(err.message || 'Failed to create event', 'error')
    }
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  if (!backendOnline) {
    return (
      <div>
        <PageHeader title="Calendar" subtitle="Enterprise calendar — events, tasks, bookings" icon={CalendarDays} />
        <div className="card p-8 text-center text-ink/50">Backend connection required.</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Enterprise Calendar"
        subtitle="Events, tasks, venue bookings, registrations and meetings in one view."
        icon={CalendarDays}
        actions={
          <button className="btn-primary" onClick={() => { setNewEvent((n) => ({ ...n, date: selectedDate || today })); setShowAdd(true) }}>
            <Plus size={15} /> New Event
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        {/* Calendar grid */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="btn-outline !p-2"><ChevronLeft size={16} /></button>
            <p className="text-lg font-black text-brand-950">{MONTHS[cursor.month]} {cursor.year}</p>
            <button onClick={nextMonth} className="btn-outline !p-2"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold uppercase text-ink/40 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, i) => {
              if (!cell) return <div key={i} className="rounded-lg p-1 min-h-[80px]" />
              const isToday = cell.date === today
              const isSelected = cell.date === selectedDate
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`rounded-lg p-1.5 min-h-[80px] text-left transition border ${isToday ? 'border-brand-400 bg-brand-50/60' : 'border-transparent hover:border-brand-200 hover:bg-brand-50/30'} ${isSelected ? 'ring-2 ring-brand-400' : ''}`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-brand-700' : 'text-ink/60'}`}>{cell.day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {cell.events.slice(0, 3).map((e, j) => {
                      const meta = TYPE_META[e.type] || TYPE_META.event
                      return (
                        <div key={j} className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold text-white ${meta.color}`}>
                          <span className="truncate">{e.title}</span>
                        </div>
                      )
                    })}
                    {cell.events.length > 3 && (
                      <p className="text-[9px] text-ink/40 px-1">+{cell.events.length - 3} more</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-brand-50 pt-3">
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-ink/50">
                <span className={`h-2.5 w-2.5 rounded ${meta.color}`} /> {meta.label}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail sidebar */}
        <div className="card p-5">
          <p className="font-bold text-brand-950 mb-3">
            {selectedDate ? new Date(selectedDate + 'T00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
          </p>
          {selectedEvents.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink/40">
              {selectedDate ? 'No events on this day.' : 'Click any day to see events.'}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => {
                const meta = TYPE_META[e.type] || TYPE_META.event
                const Icon = meta.icon
                return (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-brand-100 p-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${meta.color}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-950 truncate">{e.title}</p>
                      <p className="text-[11px] text-ink/45">{meta.label}{e.time ? ` · ${e.time}` : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add event modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-brand-950">New Calendar Event</p>
              <button onClick={() => setShowAdd(false)} className="text-ink/40 hover:text-ink/70"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="lbl">Title</label>
                <input className="input" value={newEvent.title} onChange={(e) => setNewEvent((n) => ({ ...n, title: e.target.value }))} placeholder="Meeting title…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Type</label>
                  <select className="input" value={newEvent.type} onChange={(e) => setNewEvent((n) => ({ ...n, type: e.target.value }))}>
                    <option value="meeting">Meeting</option>
                    <option value="event">Event</option>
                    <option value="task">Task</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Date</label>
                  <input type="date" className="input" value={newEvent.date} onChange={(e) => setNewEvent((n) => ({ ...n, date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Time</label>
                  <input type="time" className="input" value={newEvent.time} onChange={(e) => setNewEvent((n) => ({ ...n, time: e.target.value }))} />
                </div>
                <div>
                  <label className="lbl">Location</label>
                  <input className="input" value={newEvent.location} onChange={(e) => setNewEvent((n) => ({ ...n, location: e.target.value }))} placeholder="Office, Zoom…" />
                </div>
              </div>
              <div>
                <label className="lbl">Notes</label>
                <textarea className="input min-h-[60px]" value={newEvent.notes} onChange={(e) => setNewEvent((n) => ({ ...n, notes: e.target.value }))} placeholder="Optional notes…" />
              </div>
              <button onClick={addEvent} className="btn-primary w-full">Create Event</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
