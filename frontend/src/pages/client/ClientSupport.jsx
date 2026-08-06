import React, { useState } from 'react'
import { LifeBuoy, Phone, Mail, Send, ChevronDown, ChevronUp, MessageSquare, Building2 } from 'lucide-react'
import { Toast } from '../../components/ui'
import { textRequired, validate, clearError } from '../../store/validation'

const FAQS = [
  { q: 'How do I track the progress of my event?', a: 'You can track your event progress from the Dashboard or by visiting the My Events page. Each event card shows real-time progress, timeline stages, and upcoming deadlines.' },
  { q: 'How can I download invoices and contracts?', a: 'Navigate to the Documents section to download all your contracts, quotations, invoices, floor plans, and reports. You can also download individual invoices from the Invoices & Payments page.' },
  { q: 'How do I contact my Project Manager?', a: 'You can chat directly with your assigned Project Manager through the Messages page. You can also find their phone and email in the PM info panel.' },
  { q: 'Can I see who has registered for my event?', a: 'Yes! Visit the Attendees page to see all registered attendees, check-in status, VIP guests, and export the attendee list.' },
  { q: 'How are ticket sales tracked?', a: 'The Tickets page provides a comprehensive overview of ticket types, tickets sold, remaining capacity, and total revenue for all your events.' },
  { q: 'What happens after my event is completed?', a: 'Once your event is completed, a post-event report will be uploaded to the Documents section. You will also receive a notification when the report is available.' },
]

export default function ClientSupport() {
  const [openFaq, setOpenFaq] = useState(0)
  const [toast, setToast] = useState(null)
  const [ticket, setTicket] = useState({ subject: '', message: '', priority: 'normal' })
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const submitTicket = () => {
    const res = validate(ticket, {
      subject: [textRequired('Subject', { min: 3, max: 120 })],
      message: [textRequired('Message', { min: 10, max: 2000 })],
    })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'error'); return }
    setErrors({})
    setSending(true)
    setTimeout(() => {
      setSending(false)
      show('Support ticket submitted! We will get back to you within 24 hours.')
      setTicket({ subject: '', message: '', priority: 'normal' })
    }, 800)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Support</h1>
        <p className="text-sm text-ink/50">Get help, browse FAQs, or contact our team</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Phone size={22} /></span>
          <p className="mt-3 font-bold text-brand-950">Call Us</p>
          <p className="text-sm text-ink/60">+251 911 220 445</p>
          <p className="text-[11px] text-ink/40">Mon–Fri, 9am–6pm EAT</p>
        </div>
        <div className="card p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Mail size={22} /></span>
          <p className="mt-3 font-bold text-brand-950">Email Us</p>
          <p className="text-sm text-ink/60">support@amen.et</p>
          <p className="text-[11px] text-ink/40">Response within 24 hours</p>
        </div>
        <div className="card p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Building2 size={22} /></span>
          <p className="mt-3 font-bold text-brand-950">Visit Us</p>
          <p className="text-sm text-ink/60">Bole Road, Addis Ababa</p>
          <p className="text-[11px] text-ink/40">Ethiopia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* FAQ */}
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Frequently Asked Questions</p>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-xl border border-brand-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-bold text-brand-950">{f.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-brand-600" /> : <ChevronDown size={16} className="text-ink/40" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-ink/60">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support ticket */}
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Create Support Ticket</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Subject</label>
              <input className="input" placeholder="Brief description of your issue" value={ticket.subject} onChange={(e) => { setTicket({ ...ticket, subject: e.target.value }); setErrors(clearError(errors, 'subject')) }} />
              {errors.subject && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.subject}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Priority</label>
              <select className="input" value={ticket.priority} onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Message</label>
              <textarea className="input min-h-[120px] resize-y" placeholder="Describe your issue in detail…" value={ticket.message} onChange={(e) => { setTicket({ ...ticket, message: e.target.value }); setErrors(clearError(errors, 'message')) }} />
              {errors.message && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.message}</p>}
            </div>
            <button onClick={submitTicket} disabled={sending} className="btn-primary w-full">
              {sending ? 'Submitting…' : <><Send size={16} /> Submit Ticket</>}
            </button>
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
