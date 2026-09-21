import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Ticket, User, Calendar, CreditCard, CheckCircle2, QrCode, Download,
  Sparkles, ArrowRight, ArrowLeft, AlertCircle, Building, Mail, Phone,
  MapPin, Shield, Utensils, Accessibility, Check
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { Modal, Field, Badge } from './ui'
import { useData } from '../store/DataContext'
import { fmt } from '../store/data'
import { ticketPayload, encodeTicket, eventTicketCode } from '../store/ticket'
import { nameOnly, emailValid, phoneValid, validate, textRequired } from '../store/validation'

const TICKET_TYPES = [
  { id: 'standard', name: 'Standard', defaultPrice: 6000, desc: 'Full event access & general seating' },
  { id: 'vip', name: 'VIP', defaultPrice: 12000, desc: 'VIP seating, lounge access & refreshments' },
  { id: 'vvip', name: 'VVIP', defaultPrice: 24000, desc: 'Front-row, VIP dinner & exclusive networking' },
  { id: 'early_bird', name: 'Early Bird', defaultPrice: 4500, desc: 'Discounted advance registration' },
  { id: 'delegate', name: 'Delegate', defaultPrice: 8500, desc: 'Official delegate pass with conference kit' },
  { id: 'student', name: 'Student / Group', defaultPrice: 3000, desc: 'Valid student ID or group booking' },
]

const PAYMENT_METHODS = [
  { id: 'telebirr', name: 'Telebirr', icon: '📱' },
  { id: 'cbebirr', name: 'CBE Birr', icon: '🏦' },
  { id: 'mpesa', name: 'M-Pesa', icon: '📲' },
  { id: 'cash', name: 'Cash at Gate', icon: '💵' },
  { id: 'card', name: 'Debit / Credit Card', icon: '💳' },
  { id: 'bank_transfer', name: 'Bank Transfer (CBE / Awash / Dashen)', icon: '🏛️' },
  { id: 'chapa', name: 'Chapa Pay', icon: '⚡' },
  { id: 'arifpay', name: 'ArifPay', icon: '🔹' },
]

const DIETARY_OPTIONS = [
  'Standard / No Restrictions',
  'Fasting / Ethiopian Orthodox (Vegan)',
  'Halal',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Diabetic / Low Sugar',
  'Nut Allergy',
  'Other',
]

const SEATING_ZONES = [
  'Main Auditorium (General)',
  'VIP Lounge / Front Rows',
  'Balcony / Upper Tier',
  'Workshop Room A',
  'Workshop Room B',
  'Exhibition Floor',
  'Open Seating',
]

export default function RegisterAttendeeModal({
  open,
  onClose,
  defaultEventId,
  onSuccess,
}) {
  const { state, registerAttendee } = useData()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const qrCanvasRef = useRef(null)

  const initialEventId = defaultEventId || (state.events.find((e) => e.status === 'ongoing') || state.events[0])?.id || ''

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    city: 'Addis Ababa',
    dietary: 'Standard / No Restrictions',
    accessibility: '',
    eventId: initialEventId,
    type: 'Standard',
    price: 6000,
    qty: 1,
    seating: 'Main Auditorium (General)',
    checkinType: 'Standard QR',
    paymentMethod: 'Telebirr',
    paymentStatus: 'paid',
    transactionId: '',
    taxInvoice: false,
    tinNumber: '',
  })

  // Sync defaultEventId if passed dynamically
  useEffect(() => {
    if (defaultEventId) {
      setForm((prev) => ({ ...prev, eventId: defaultEventId }))
    }
  }, [defaultEventId])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setErrors({})
      setSubmitting(false)
      setTermsAccepted(false)
    }
  }, [open])

  // Check if form is dirty (has user input)
  const isDirty = Boolean(
    form.name.trim() ||
    form.email.trim() ||
    form.phone.trim() ||
    form.company.trim() ||
    form.transactionId.trim() ||
    step > 1
  )

  const selectedEvent = state.events.find((e) => e.id === form.eventId) || state.events[0]
  const selectedVenue = selectedEvent ? state.venues.find((v) => v.id === selectedEvent.venueId) : null
  const totalPrice = (Number(form.price) || 0) * (Number(form.qty) || 1)

  // Step 1 Validation: Profile
  const validateStep1 = () => {
    const res = validate(form, {
      name: [nameOnly('Full name')],
      email: [emailValid('Email address')],
      phone: [phoneValid('Phone number')],
    })
    if (!res.ok) {
      setErrors(res.errors)
      return false
    }
    setErrors({})
    return true
  }

  // Step 2 Validation: Event & Ticket
  const validateStep2 = () => {
    if (!form.eventId) {
      setErrors({ eventId: 'Please fill out this field' })
      return false
    }
    if (!form.type) {
      setErrors({ type: 'Please fill out this field' })
      return false
    }
    setErrors({})
    return true
  }

  // Step 3 Validation: Payment
  const validateStep3 = () => {
    if (!form.paymentMethod) {
      setErrors({ paymentMethod: 'Please fill out this field' })
      return false
    }
    setErrors({})
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleTicketTypeChange = (typeName) => {
    const found = TICKET_TYPES.find((t) => t.name === typeName)
    const price = found ? found.defaultPrice : (selectedEvent?.price || 6000)
    setForm((prev) => ({ ...prev, type: typeName, price }))
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        role: form.role.trim(),
        city: form.city.trim(),
        dietary: form.dietary,
        accessibility: form.accessibility.trim(),
        eventId: form.eventId,
        type: form.type,
        amount: totalPrice,
        price: Number(form.price) || 0,
        qty: Number(form.qty) || 1,
        seating: form.seating,
        checkinType: form.checkinType,
        paymentMethod: form.paymentMethod,
        paid: form.paymentStatus === 'paid',
        transactionId: form.transactionId.trim() || undefined,
        tinNumber: form.taxInvoice ? form.tinNumber.trim() : undefined,
      }

      const rec = await registerAttendee(payload)
      setSubmitting(false)
      if (rec) {
        setCreatedTicket(rec)
        if (onSuccess) onSuccess(rec)
      }
      onClose()
    } catch (err) {
      setSubmitting(false)
      setErrors({ submit: 'Failed to complete registration. Please try again.' })
    }
  }

  const downloadQr = () => {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const safeEvent = (selectedEvent?.name || 'event').replace(/[^\w\u00C0-\u024F]+/g, '_').slice(0, 30)
    const safeName = (createdTicket?.name || 'attendee').replace(/[^\w\u00C0-\u024F]+/g, '_').slice(0, 40)
    const code = createdTicket?.qr || `AE-${eventTicketCode(selectedEvent?.id)}-XXXX`
    const fname = `Ticket_${safeEvent}_${safeName}_${code}.png`
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = fname
    a.click()
  }

  const qrPayload = createdTicket
    ? encodeTicket(ticketPayload(createdTicket, selectedEvent, selectedVenue))
    : null

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Register Attendee"
        width="max-w-2xl"
        dirty={isDirty}
      >
        {/* Percentage Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/60">
            <span className={step >= 1 ? 'text-brand-700' : ''}>1. Attendee Profile (25%)</span>
            <span className={step >= 2 ? 'text-brand-700' : ''}>2. Event & Ticket (50%)</span>
            <span className={step >= 3 ? 'text-brand-700' : ''}>3. Payment & Billing (75%)</span>
            <span className={step >= 4 ? 'text-brand-700' : ''}>4. Review & Confirm (100%)</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%',
                background: 'linear-gradient(90deg, #188A2E, #39D353)',
              }}
            />
          </div>
        </div>

        {errors.submit && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {errors.submit}
          </div>
        )}

        {/* STEP 1: ATTENDEE PROFILE */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <User size={20} />
              </span>
              <div>
                <p className="text-xs font-bold text-brand-950">Personal & Contact Details</p>
                <p className="text-[11px] text-ink/55">Provide accurate details for badge printing and digital ticket issuance.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name *" className="sm:col-span-2">
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className={`input pl-9 ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    placeholder="e.g. Mahlet Bekele"
                  />
                </div>
                {errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}
              </Field>

              <Field label="Email Address *">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    type="email"
                    className={`input pl-9 ${errors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    placeholder="mahlet@example.et"
                  />
                </div>
                {errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}
              </Field>

              <Field label="Phone Number *">
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className={`input pl-9 ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value })
                      if (errors.phone) setErrors({ ...errors, phone: undefined })
                    }}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}
              </Field>

              <Field label="Organization / Company">
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className="input pl-9"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Commercial Bank of Ethiopia"
                  />
                </div>
              </Field>

              <Field label="Job Title / Role">
                <input
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Senior Marketing Director"
                />
              </Field>

              <Field label="City / Region">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className="input pl-9"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Addis Ababa"
                  />
                </div>
              </Field>

              <Field label="Dietary Requirements">
                <div className="relative">
                  <Utensils size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <select
                    className="input pl-9"
                    value={form.dietary}
                    onChange={(e) => setForm({ ...form, dietary: e.target.value })}
                  >
                    {DIETARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Accessibility / Special Needs" className="sm:col-span-2">
                <div className="relative">
                  <Accessibility size={15} className="absolute left-3 top-3 text-ink/30" />
                  <textarea
                    className="input pl-9 min-h-[60px] resize-y"
                    value={form.accessibility}
                    onChange={(e) => setForm({ ...form, accessibility: e.target.value })}
                    placeholder="e.g. Wheelchair access required, hearing assistance, translation headset…"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-6 flex justify-between pt-3 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleNext}>
                Next: Event & Ticket →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EVENT & TICKET DETAILS */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Ticket size={20} />
              </span>
              <div>
                <p className="text-xs font-bold text-brand-950">Target Event & Admission Tier</p>
                <p className="text-[11px] text-ink/55">Select the event, pass tier, seating preference, and quantity.</p>
              </div>
            </div>

            <Field label="Select Event *">
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <select
                  className={`input pl-9 ${errors.eventId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  value={form.eventId}
                  onChange={(e) => {
                    const evId = e.target.value
                    const ev = state.events.find((x) => x.id === evId)
                    setForm({
                      ...form,
                      eventId: evId,
                      price: ev?.price || form.price || 6000,
                    })
                    if (errors.eventId) setErrors({ ...errors, eventId: undefined })
                  }}
                >
                  <option value="">Choose an event…</option>
                  {state.events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.date} · {e.category} · {e.status})
                    </option>
                  ))}
                </select>
              </div>
              {errors.eventId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.eventId}</p>}
            </Field>

            {/* Selected Event Card Preview */}
            {selectedEvent && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-ink/75">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-brand-950 text-sm">{selectedEvent.name}</p>
                  <span className={`chip ${selectedEvent.status === 'ongoing' ? 'bg-brand-100 text-brand-800' : 'bg-gold-100 text-gold-700'}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <p><strong>Date:</strong> {selectedEvent.date} · {selectedEvent.time || '09:00'}</p>
                  <p><strong>Venue:</strong> {selectedVenue?.name || 'Addis Ababa'}</p>
                  <p><strong>Category:</strong> {selectedEvent.category}</p>
                  <p><strong>Capacity:</strong> {selectedEvent.capacity ? `${selectedEvent.capacity} seats` : 'Open'}</p>
                  <p><strong>Standard Price:</strong> {fmt(selectedEvent.price || 6000)}</p>
                </div>
              </div>
            )}

            {/* Ticket Type Picker */}
            <div>
              <label className="label mb-2">Ticket Type / Pass *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TICKET_TYPES.map((t) => {
                  const isSel = form.type === t.name
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTicketTypeChange(t.name)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        isSel
                          ? 'border-brand-600 bg-brand-50/80 ring-1 ring-brand-500'
                          : 'border-brand-100 bg-white hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-950">{t.name}</span>
                        <span className="text-xs font-black text-brand-800">{fmt(t.defaultPrice)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink/50 leading-tight">{t.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Ticket Price (ETB)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                />
              </Field>

              <Field label="Quantity">
                <select
                  className="input"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 1 })}
                >
                  {[1, 2, 3, 4, 5, 10].map((n) => (
                    <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </Field>

              <Field label="Total Amount">
                <div className="flex h-10 items-center rounded-xl bg-brand-100/70 px-3 font-black text-brand-950 text-sm">
                  {fmt(totalPrice)}
                </div>
              </Field>

              <Field label="Seating / Zone Preference" className="sm:col-span-2">
                <select
                  className="input"
                  value={form.seating}
                  onChange={(e) => setForm({ ...form, seating: e.target.value })}
                >
                  {SEATING_ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </Field>

              <Field label="Check-in Format">
                <select
                  className="input"
                  value={form.checkinType}
                  onChange={(e) => setForm({ ...form, checkinType: e.target.value })}
                >
                  <option value="Standard QR">Standard QR</option>
                  <option value="Fast-Track VIP">Fast-Track VIP</option>
                  <option value="Self-Service Kiosk">Self-Service Kiosk</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-between pt-3 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn-primary" onClick={handleNext}>
                Next: Payment & Billing →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT & BILLING */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <CreditCard size={20} />
              </span>
              <div>
                <p className="text-xs font-bold text-brand-950">Payment Collection</p>
                <p className="text-[11px] text-ink/55">Select payment channel (Telebirr, CBE Birr, M-Pesa, Cash, etc.) and record transaction info.</p>
              </div>
            </div>

            {/* Total summary banner */}
            <div className="rounded-2xl bg-gradient-to-r from-brand-900 to-brand-950 p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-200">Total Admission Due</p>
                <p className="text-2xl font-black">{fmt(totalPrice)}</p>
                <p className="text-[11px] text-brand-300 mt-0.5">{form.qty}x {form.type} pass ({fmt(form.price)} each)</p>
              </div>
              <div className="text-right">
                <span className="chip bg-white/10 text-brand-100 text-xs font-bold">
                  {form.paymentStatus === 'paid' ? 'Paid / Settled' : 'Payment at Gate'}
                </span>
              </div>
            </div>

            <div>
              <label className="label mb-2">Payment Method *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const isSel = form.paymentMethod === pm.name
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setForm({ ...form, paymentMethod: pm.name })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        isSel
                          ? 'border-brand-600 bg-brand-50 text-brand-950 font-bold ring-2 ring-brand-500/20'
                          : 'border-brand-100 bg-white text-ink/75 hover:border-brand-300'
                      }`}
                    >
                      <span className="text-xl mb-1">{pm.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{pm.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Payment Status">
                <select
                  className="input"
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                >
                  <option value="paid">Paid & Confirmed (Issue QR Ticket)</option>
                  <option value="pending">Pending / Collect at Gate</option>
                  <option value="complimentary">Complimentary / VIP Guest (0 ETB)</option>
                </select>
              </Field>

              <Field label="Transaction Reference / ID (Optional)">
                <input
                  className="input"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  placeholder="e.g. TXN-TB-982341"
                />
              </Field>
            </div>

            {/* Tax Invoice Toggle */}
            <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3.5">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-950">Official Tax Invoice / Receipt Required?</p>
                  <p className="text-[11px] text-ink/50">Generates ERCA compliant tax invoice with corporate TIN</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.taxInvoice}
                  onChange={(e) => setForm({ ...form, taxInvoice: e.target.checked })}
                  className="h-5 w-5 accent-brand-700 rounded cursor-pointer"
                />
              </label>

              {form.taxInvoice && (
                <div className="mt-3 pt-3 border-t border-brand-100">
                  <Field label="Taxpayer Identification Number (TIN) *">
                    <input
                      className="input font-mono text-sm"
                      value={form.tinNumber}
                      onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                      placeholder="e.g. 0012345678"
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between pt-3 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn-primary" onClick={handleNext}>
                Next: Review & Confirm →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Shield size={20} />
              </span>
              <div>
                <p className="text-xs font-bold text-brand-950">Review Registration Summary</p>
                <p className="text-[11px] text-ink/55">Verify all attendee and ticket information before final confirmation.</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Attendee Card */}
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2 flex items-center gap-1.5">
                  <User size={13} /> Attendee Details
                </p>
                <div className="space-y-1 text-xs text-ink/75">
                  <p><strong className="text-brand-950 font-bold">{form.name}</strong></p>
                  <p>{form.email}</p>
                  <p>{form.phone}</p>
                  {form.company && <p>{form.company} {form.role ? `· ${form.role}` : ''}</p>}
                  <p className="text-[11px] text-ink/50 mt-1">Diet: {form.dietary}</p>
                  {form.accessibility && <p className="text-[11px] text-gold-700">Needs: {form.accessibility}</p>}
                </div>
              </div>

              {/* Event & Pass Card */}
              <div className="rounded-xl border border-brand-100 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-2 flex items-center gap-1.5">
                  <Ticket size={13} /> Event & Pass
                </p>
                <div className="space-y-1 text-xs text-ink/75">
                  <p><strong className="text-brand-950 font-bold">{selectedEvent?.name}</strong></p>
                  <p>{selectedEvent?.date} · {selectedEvent?.time || '09:00'}</p>
                  <p>{selectedVenue?.name || 'Venue TBD'}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="chip bg-brand-100 text-brand-800 font-bold">{form.type} Pass</span>
                    <span className="text-xs font-bold">Qty: {form.qty}</span>
                  </div>
                  <p className="text-[11px] text-ink/50 mt-1">Zone: {form.seating}</p>
                </div>
              </div>

              {/* Payment Card */}
              <div className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
                    <CreditCard size={13} /> Payment & Billing
                  </p>
                  <span className="text-base font-black text-brand-950">{fmt(totalPrice)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-ink/45 block">Method</span>
                    <span className="font-semibold text-brand-950">{form.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink/45 block">Status</span>
                    <Badge status={form.paymentStatus === 'paid' ? 'paid' : 'pending'} label={form.paymentStatus} />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink/45 block">Transaction Ref</span>
                    <span className="font-mono text-xs">{form.transactionId || 'Auto-generated'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink/45 block">Tax Invoice</span>
                    <span className="text-xs">{form.taxInvoice ? `TIN: ${form.tinNumber || '-'}` : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 rounded-xl border border-brand-100 p-3 text-xs text-ink/75 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-700 rounded"
              />
              <span>
                I confirm the accuracy of this registration. The attendee will receive an official digital QR admission pass via email and SMS.
              </span>
            </label>

            <div className="mt-6 flex justify-between pt-3 border-t border-gray-100">
              <button type="button" className="btn-outline" onClick={handleBack}>
                ← Back
              </button>
              <button
                type="button"
                disabled={submitting}
                className="btn-primary !px-6"
                onClick={handleSubmit}
              >
                {submitting ? (
                  'Processing Registration…'
                ) : (
                  <>
                    <Sparkles size={16} /> Complete Registration & Issue Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Celebration & Ticket View Modal */}
      {createdTicket && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-[2px] transition-opacity" onClick={() => setCreatedTicket(null)} />
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-pop z-10 animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-900 to-brand-950 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold-400">
                    <Sparkles size={12} /> Registration Confirmed
                  </span>
                  <p className="text-base font-bold truncate">{selectedEvent?.name}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400 text-brand-950 font-black text-lg">
                  A
                </span>
              </div>
            </div>

            {/* QR Code section */}
            <div className="border-b border-dashed border-brand-200 px-6 py-5 text-center">
              <div
                className="mx-auto mb-3 flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-brand-100 bg-white p-3 shadow-sm"
                data-payload={qrPayload || ''}
              >
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={qrPayload || createdTicket.qr || 'AE-REG-0012'}
                  size={152}
                  level="M"
                  includeMargin={false}
                  fgColor="#082408"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-mono text-sm font-bold tracking-widest text-brand-900">
                {createdTicket.qr || 'AE-REG-0012'}
              </p>
              <p className="mt-1 text-xs text-ink/45">
                Official Amen Event Pass. Scan at the entrance for instant check-in.
              </p>
            </div>

            {/* Attendee Details */}
            <div className="px-6 py-4 max-h-[45vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-950">{createdTicket.name}</p>
                  <p className="text-xs text-ink/45">{createdTicket.email}</p>
                  {createdTicket.phone && <p className="text-xs text-ink/45">{createdTicket.phone}</p>}
                </div>
                <Badge status={createdTicket.type === 'VIP' ? 'pending' : 'done'} label={createdTicket.type || 'Standard'} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-50/60 p-3 text-sm">
                {[
                  ['Event', selectedEvent?.name || '-'],
                  ['Date', selectedEvent ? `${selectedEvent.date} · ${selectedEvent.time || '09:00'}` : '-'],
                  ['Venue', selectedVenue?.name || '-'],
                  ['Ticket Type', createdTicket.type || 'Standard'],
                  ['Amount', fmt(createdTicket.amount || totalPrice)],
                  ['Payment Method', createdTicket.paymentMethod || form.paymentMethod || 'Telebirr'],
                  ['Payment Status', createdTicket.paid ? 'Paid' : 'Unpaid'],
                  ['Ticket Code', createdTicket.qr || '-'],
                ].map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink/45">{k}</span>
                    <span className="truncate text-xs font-bold text-brand-950">{val}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn-primary flex-1" onClick={downloadQr}>
                  <Download size={15} /> Download PNG Ticket
                </button>
                <button className="btn-outline" onClick={() => setCreatedTicket(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

