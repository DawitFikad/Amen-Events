import React, { useState } from 'react'
import {
  CalendarDays, Clock, MapPin, Users, Wallet, Tag, Info,
  Sparkles, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import { Modal, Field } from './ui'
import { useData } from '../store/DataContext'

const EVENT_CATEGORIES = [
  'Conference', 'Concert', 'Exhibition', 'Product Launch',
  'Retreat', 'Gala', 'Ceremony', 'Wedding', 'Summit',
  'Workshop', 'Seminar', 'Networking Mixer', 'Festival', 'Other',
]

export default function ClientAddEventModal({ open, onClose, onSuccess }) {
  const { state, submitClientEvent } = useData()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)

  const [form, setForm] = useState({
    name: '',
    category: 'Conference',
    venueId: '',
    date: '',
    time: '09:00',
    endDate: '',
    endTime: '17:00',
    budget: '',
    capacity: '',
    price: '0',
    description: '',
    contactName: client?.contactPerson || '',
    contactPhone: client?.phone || '',
    tags: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Event name is required'
    if (!form.date) errs.date = 'Event start date is required'
    if (!form.time) errs.time = 'Start time is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const created = await submitClientEvent({
        ...form,
        budget: Number(form.budget) || 0,
        capacity: Number(form.capacity) || 0,
        price: Number(form.price) || 0,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      })

      if (onSuccess) onSuccess(created)
      onClose()
      setForm({
        name: '',
        category: 'Conference',
        venueId: '',
        date: '',
        time: '09:00',
        endDate: '',
        endTime: '17:00',
        budget: '',
        capacity: '',
        price: '0',
        description: '',
        contactName: client?.contactPerson || '',
        contactPhone: client?.phone || '',
        tags: '',
        notes: '',
      })
    } catch (err) {
      console.error('Failed to submit event:', err)
      setErrors({ form: err.message || 'Failed to submit event. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title="Add New Event"
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Review notice header */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
          <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-950">Event Manager Review Process: </span>
            Your submitted event will be placed in the review queue. The Event Manager will review your requirements, coordinate resources, adjust details if needed, and accept the event before publishing it live on the platform.
          </div>
        </div>

        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <Field label="Event Name *">
              <input
                className={`input ${errors.name ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
                placeholder="e.g. Annual Fintech Innovators Summit 2026"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={submitting}
              />
              {errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}
            </Field>
          </div>

          {/* Category */}
          <Field label="Category">
            <select
              className="input"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={submitting}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Field>

          {/* Preferred Venue */}
          <Field label="Preferred Venue">
            <select
              className="input"
              value={form.venueId}
              onChange={(e) => handleChange('venueId', e.target.value)}
              disabled={submitting}
            >
              <option value="">To be recommended by Event Manager</option>
              {(state.venues || []).map((v) => {
                const conflict = form.date
                  ? (state.events || []).find(
                      (e) => e.venueId === v.id && e.date === form.date && e.status !== 'completed' && e.status !== 'declined'
                    )
                  : null
                return (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city || 'Addis Ababa'} - cap. {v.capacity || 'N/A'})
                    {form.date
                      ? conflict
                        ? ` — ⚠️ [Booked on ${form.date}: ${conflict.name}]`
                        : ' — ✓ Available'
                      : ''}
                  </option>
                )
              })}
            </select>
            {form.venueId && (
              <div className="mt-1.5 text-xs font-semibold">
                {!form.date ? (
                  <span className="text-[11px] text-ink/50">📅 Select start date below to check venue availability</span>
                ) : (() => {
                  const conflict = (state.events || []).find(
                    (e) => e.venueId === form.venueId && e.date === form.date && e.status !== 'completed' && e.status !== 'declined'
                  )
                  if (conflict) {
                    return (
                      <span className="inline-block rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                        ⚠️ Already booked on {form.date} for "{conflict.name}". Event manager may recommend an alternative.
                      </span>
                    )
                  }
                  return (
                    <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                      ✓ Selected as booked for this event on {form.date}
                    </span>
                  )
                })()}
              </div>
            )}
          </Field>

          {/* Start Date */}
          <Field label="Start Date *">
            <input
              type="date"
              className={`input ${errors.date ? '!border-red-500 ring-1 ring-red-500/20' : ''}`}
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={submitting}
            />
            {errors.date && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.date}</p>}
          </Field>

          {/* Start Time */}
          <Field label="Start Time *">
            <input
              type="time"
              className="input"
              value={form.time}
              onChange={(e) => handleChange('time', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* End Date */}
          <Field label="End Date (Optional)">
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* End Time */}
          <Field label="End Time (Optional)">
            <input
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Estimated Budget */}
          <Field label="Estimated Budget (ETB)">
            <input
              type="number"
              min="0"
              className="input"
              placeholder="e.g. 500000"
              value={form.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Expected Capacity */}
          <Field label="Expected Attendees / Capacity">
            <input
              type="number"
              min="0"
              className="input"
              placeholder="e.g. 350"
              value={form.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Ticket Price */}
          <Field label="Attendee Ticket Price (ETB)">
            <input
              type="number"
              min="0"
              className="input"
              placeholder="0 for free entry"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Tags */}
          <Field label="Keywords / Tags">
            <input
              className="input"
              placeholder="Fintech, Summit, AI, Networking"
              value={form.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Contact Person */}
          <Field label="Contact Person">
            <input
              className="input"
              placeholder="Full Name"
              value={form.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Contact Phone */}
          <Field label="Contact Phone">
            <input
              className="input"
              placeholder="+251 911 000 000"
              value={form.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              disabled={submitting}
            />
          </Field>

          {/* Description */}
          <div className="sm:col-span-2">
            <Field label="Event Description & Objectives">
              <textarea
                className="input min-h-[75px] resize-y"
                placeholder="Describe your event purpose, target audience, agenda highlights, and specific expectations..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>

          {/* Special Notes for Manager */}
          <div className="sm:col-span-2">
            <Field label="Special Requirements / Note for Event Manager">
              <textarea
                className="input min-h-[60px] resize-y"
                placeholder="Any special AV equipment, catering needs, VIP protocols, or specific dates/deadlines..."
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-brand-50 pt-4">
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting for Review…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Submit Event for Review
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
