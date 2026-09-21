import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2, Camera } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'
import { nameOnly, emailValid, phoneValid, validate, clearError } from '../../store/validation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function PortalRegister() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAttendee()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', avatar: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const redirect = searchParams.get('redirect') || '/'

  const onAvatar = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => { setForm((f) => ({ ...f, avatar: reader.result })); setError(null) }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = validate(form, {
      firstName: [nameOnly('First name')],
      lastName: [nameOnly('Last name')],
      email: [emailValid('Email')],
      phone: [phoneValid('Phone')],
      password: [(v) => (String(v || '').length < 6 ? 'Password must be at least 6 characters' : '')],
    })
    if (res.ok && form.password !== form.confirm) { res.errors.confirm = 'Passwords do not match'; res.ok = false; res.first = 'Passwords do not match' }
    if (!res.ok) { setErrors(res.errors); setError(res.first); return }
    setErrors({})
    setError(null)

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone, password: form.password,
          avatar: form.avatar,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        login(data.token, data.attendee)
        navigate(redirect)
      }
    } catch {
      setError('Registration failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-brand-950">Create Account</h1>
        <p className="mt-1 text-sm text-ink/55">Join Amen Events to discover and attend events</p>

        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-portal-100 text-base font-bold text-portal-700">
              {form.avatar ? <img src={form.avatar} alt="avatar" className="h-full w-full object-cover" /> : (form.firstName?.[0] || 'U') + (form.lastName?.[0] || '')}
            </span>
            <div className="flex items-center gap-2">
              <label className="btn-outline cursor-pointer !py-2 text-xs"><Camera size={14} /> Upload photo<input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} /></label>
              {form.avatar && <button type="button" className="btn-ghost text-xs !text-red-600" onClick={() => setForm((f) => ({ ...f, avatar: '' }))}>Remove</button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors(clearError(errors, 'firstName')) }} placeholder="First name" required />
              {errors.firstName && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors(clearError(errors, 'lastName')) }} placeholder="Last name" required />
              {errors.lastName && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(clearError(errors, 'email')) }} placeholder="you@example.com" required />
            {errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors(clearError(errors, 'phone')) }} placeholder="+251 9XX XXX XXX" />
            {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors(clearError(errors, 'password')) }} placeholder="Min 6 characters" required />
            {errors.password && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" value={form.confirm} onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setErrors(clearError(errors, 'confirm')) }} placeholder="Re-enter password" required />
            {errors.confirm && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating…' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/55">
          Already have an account? <Link to={`/login?redirect=${redirect}`} className="font-bold text-brand-700 hover:text-brand-900">Login</Link>
        </p>
      </div>
    </div>
  )
}
