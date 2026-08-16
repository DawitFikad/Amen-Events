import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Sparkles, ShieldCheck, Building2, Eye, EyeOff } from 'lucide-react'
import { useData } from '../store/DataContext'
import { BackButton } from '../components/ui'
import logo from '../logo.jpg'

export default function ClientLogin() {
  const { loginClient, backendOnline } = useData()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'meron@ethfintech.com', password: 'demo@amen' })
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.email.trim() || !form.password) { setError('Please enter your email and password'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) { setError('Please enter a valid email address'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setBusy(true)
    try {
      await loginClient(form.email.trim().toLowerCase(), form.password)
      navigate('/erp/portal', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed - check your credentials')
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10">
      {/* Back to website */}
      <div className="absolute left-5 top-5 z-20">
        <BackButton fallback="/" />
      </div>
      {/* Forest-green ambient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 15% 15%, rgba(57,211,83,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 60% 70% at 85% 85%, rgba(24,138,46,0.14) 0%, transparent 55%),
            linear-gradient(160deg, #041C0B 0%, #0B3B16 45%, #115B22 75%, #041C0B 100%)
          `,
        }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div className="absolute -left-32 top-10 h-[500px] w-[500px] rounded-full bg-[#188A2E]/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#39D353]/8 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20">
            <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">Amen Events</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#39D353]/70">Client Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 ring-1 ring-brand-100/80">
            <Building2 size={12} className="text-brand-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Client Workspace</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-950">Welcome back</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/50">
            Sign in to view your events, attendees, invoices and more.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">{error}</div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-ink/70">Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                <input
                  className="h-12 w-full rounded-2xl border border-gray-200/80 bg-white/60 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e) } }}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-ink/70">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                <input
                  className="h-12 w-full rounded-2xl border border-gray-200/80 bg-white/60 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e) } }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink/30 transition hover:bg-gray-50 hover:text-ink/60">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #228B22 0%, #188A2E 50%, #1c731c 100%)',
                boxShadow: '0 12px 30px rgba(34,139,34,0.28), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {busy ? <><Sparkles size={18} className="animate-spin" /> Signing you in…</> : <>Sign in to client portal <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-ink/35">
            {backendOnline ? 'Secure client authentication.' : 'Demo mode - Client: meron@ethfintech.com · Password: demo@amen'}
          </p>

          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-center">
            <p className="text-xs text-ink/45">
              Staff member? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900 hover:underline">ERP sign-in →</Link>
            </p>
            <p className="text-xs text-ink/45">
              <Link to="/" className="font-medium text-brand-700 hover:text-brand-900 hover:underline">Back to website</Link>
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <ShieldCheck size={12} className="text-[#39D353]/60" />
          Protected client workspace · Powered by Gravity Technologies PLC
        </p>
      </div>
    </div>
  )
}
