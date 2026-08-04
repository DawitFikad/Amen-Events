import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, CalendarCheck2, BarChart3, QrCode, Users, Wallet,
  Megaphone, Building2, ArrowRight, Lock, Mail, Sparkles, LogIn, Eye, EyeOff,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import logo from '../logo.jpg'
import { Toast } from '../components/ui'

const roles = [
  { key: 'admin', label: 'Admin', userId: 'st1', name: 'Hana Tadesse', title: 'Workspace Director', icon: ShieldCheck, desc: 'Full system access & settings' },
  { key: 'manager', label: 'Event Manager', userId: 'st2', name: 'Dawit Mengistu', title: 'Project Manager', icon: CalendarCheck2, desc: 'Plan, assign & run events' },
  { key: 'operations', label: 'Operations', userId: 'st5', name: 'Sara Ahmed', title: 'Logistics Lead', icon: Building2, desc: 'Venue, resources & vendors' },
  { key: 'finance', label: 'Finance', userId: 'st4', name: 'Yonas Girma', title: 'Finance Officer', icon: Wallet, desc: 'Budgets, expenses & payments' },
  { key: 'marketing', label: 'Marketing', userId: 'st7', name: 'Liya Kebede', title: 'Marketing Lead', icon: Megaphone, desc: 'Campaigns, sponsors & tickets' },
]

const features = [
  { icon: CalendarCheck2, title: 'End-to-end event workflows', text: 'From brief to post-event reports in one place.' },
  { icon: QrCode, title: 'QR check-in & digital tickets', text: 'Real-time entry with tamper-proof ticketing.' },
  { icon: BarChart3, title: 'Executive analytics', text: 'Profitability, attendance and capacity dashboards.' },
  { icon: Users, title: 'Collaborative CRM & teams', text: 'Assign crews, track clients and manage pipelines.' },
]

export default function Login() {
  const { state, login } = useData()
  const staff = state.staff
  const navigate = useNavigate()
  const [role, setRole] = useState('manager')
  const [email, setEmail] = useState(() => staff.find((s) => s.id === roles[1].userId)?.email || '')
  const [password, setPassword] = useState('demo@amen')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const show = (m, t = 'error') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2000) }

  const selectRole = (r) => {
    setRole(r.key)
    const member = staff.find((s) => s.id === r.userId)
    setEmail(member?.email || '')
    setPassword('demo@amen')
  }

  const submit = (e) => {
    e.preventDefault()
    const member = staff.find((s) => s.id === roles.find((r) => r.key === role)?.userId)
    if (!member) { show('Invalid role selection'); return }
    if (email.trim().toLowerCase() !== member.email.toLowerCase()) { show('Email does not match this role'); return }
    setBusy(true)
    setTimeout(() => {
      login(member.id)
      navigate('/', { replace: true })
    }, 650)
  }

  return (
    <div className="flex min-h-screen bg-[#f3f7f3]">
      {/* Left brand panel */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-brand-700 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20">
            <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Amen Events</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300">Enterprise Event OS</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">
            Plan. Execute.
            <br />
            <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">Deliver flawless</span>
            <br />
            events.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-brand-100/70">
            A unified workspace for your entire event operation — pipelines, planning, ticketing, check-in and finance.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/20 text-gold-300"><f.icon size={16} /></span>
                <p className="mt-2.5 text-[13px] font-bold text-white">{f.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-brand-100/55">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-100/40">
          Powered by <span className="font-semibold text-brand-100/70">Gravity Technologies PLC</span>
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 lg:w-[48%]">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-600 ring-1 ring-brand-100">
              <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-brand-950">Amen Events</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-500">Enterprise Event OS</p>
            </div>
          </div>

          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-800">
            <ShieldCheck size={12} /> Secure workspace sign-in
          </p>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-brand-950">Welcome back</h2>
          <p className="mt-1 text-sm text-ink/55">Select your role to enter the workspace with an experience tailored to you.</p>

          {/* Role selector */}
          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => selectRole(r)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition ${
                  role === r.key
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                    : 'border-brand-100 bg-white hover:border-brand-300'
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${role === r.key ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  <r.icon size={14} />
                </span>
                <span className="text-[12px] font-bold text-brand-950">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Login form */}
          <form onSubmit={submit} className="mt-6">
            <div className="space-y-3.5">
              <div>
                <label className="label">Work email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className="input !pl-9"
                    type="email"
                    placeholder="you@amen.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    className="input !pl-9 !pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/70">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary mt-5 w-full !py-3 text-sm">
              {busy ? <Sparkles size={16} className="animate-spin" /> : <LogIn size={16} />}
              {busy ? 'Signing you in…' : 'Sign in to workspace'}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Signed-in-as preview */}
          {(() => {
            const member = staff.find((s) => s.id === roles.find((r) => r.key === role)?.userId)
            return (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${member?.color || 'bg-brand-700'} text-[11px] font-black text-white`}>{member?.initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-brand-950">{member?.name}</p>
                  <p className="truncate text-[11px] text-ink/45">{member?.role} · {member?.dept}</p>
                </div>
                <span className="chip bg-brand-50 text-brand-800">{roles.find((r) => r.key === role)?.label}</span>
              </div>
            )
          })()}

          <p className="mt-5 text-center text-[11px] leading-relaxed text-ink/40">
            Demo environment — use any role to explore. Credentials are auto-filled for each role.
          </p>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}