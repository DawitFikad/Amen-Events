import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAttendee()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get('redirect') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.email || !form.password) { setError('Email and password are required'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/portal/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        login(data.token, data.attendee)
        navigate(redirect)
      }
    } catch {
      setError('Login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-brand-950">Welcome Back</h1>
        <p className="mt-1 text-sm text-ink/55">Login to access your tickets and events</p>

        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in…' : 'Login'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/55">
          Don't have an account? <Link to={`/register?redirect=${redirect}`} className="font-bold text-brand-700 hover:text-brand-900">Register</Link>
        </p>
        <p className="mt-3 text-center text-xs text-ink/40">
          Staff? <Link to="/login" className="font-semibold text-brand-700">ERP Login →</Link>
        </p>
      </div>
    </div>
  )
}
