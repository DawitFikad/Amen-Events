import React, { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'
import { nameOnly, emailValid, textRequired, validate, clearError } from '../../store/validation'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const res = validate(form, {
      name: [nameOnly('Your name')],
      email: [emailValid('Email')],
      message: [textRequired('Message', { min: 10, max: 2000 })],
    })
    if (!res.ok) { setErrors(res.errors); return }
    setErrors({})
    setSent(true)
    setForm({ name: '', email: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-950">Get in Touch</h1>
        <p className="mt-3 text-ink/60">Have questions? We're here to help.</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Mail, label: 'Email', value: 'support@amenevents.et' },
          { icon: Phone, label: 'Phone', value: '+251 911 234 567' },
          { icon: MapPin, label: 'Address', value: 'Addis Ababa, Ethiopia' },
        ].map((c) => (
          <div key={c.label} className="card p-5 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><c.icon size={20} /></span>
            <p className="mt-3 text-xs font-semibold text-ink/45">{c.label}</p>
            <p className="mt-1 text-sm font-bold text-brand-950">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="font-bold text-brand-950">Send a Message</h2>
        {sent && (
          <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-800 flex items-center gap-2">
            <CheckCircle2 size={16} /> Message sent! We'll get back to you soon.
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div><label className="label">Your Name</label><input className="input" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors(clearError(errors, 'name')) }} required />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(clearError(errors, 'email')) }} required />{errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}</div>
          <div><label className="label">Message</label><textarea className="input min-h-[120px]" value={form.message} onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors(clearError(errors, 'message')) }} required />{errors.message && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.message}</p>}</div>
          <button type="submit" className="btn-primary"><Send size={16} /> Send Message</button>
        </form>
      </div>
    </div>
  )
}
