import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, CalendarCheck2, BarChart3, QrCode, Users, Wallet,
  Megaphone, Building2, ArrowRight, Lock, Mail, Sparkles, Eye, EyeOff, KeyRound,
  Check, Database, Zap,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import api from '../store/api'
import logo from '../logo.jpg'
import { Toast, Modal, Field } from '../components/ui'

const roles = [
  { key: 'admin', label: 'Admin', userId: 'st1', name: 'Hana Tadesse', title: 'Workspace Director', icon: ShieldCheck, desc: 'Full system access & settings' },
  { key: 'manager', label: 'Event Manager', userId: 'st2', name: 'Dawit Mengistu', title: 'Project Manager', icon: CalendarCheck2, desc: 'Plan, assign & run events' },
  { key: 'operations', label: 'Operations', userId: 'st5', name: 'Sara Ahmed', title: 'Logistics Lead', icon: Building2, desc: 'Venue, resources & vendors' },
  { key: 'finance', label: 'Finance', userId: 'st4', name: 'Yonas Girma', title: 'Finance Officer', icon: Wallet, desc: 'Budgets, expenses & payments' },
  { key: 'marketing', label: 'Marketing', userId: 'st7', name: 'Liya Kebede', title: 'Marketing Lead', icon: Megaphone, desc: 'Campaigns, sponsors & tickets' },
]

const roleEmails = {
  admin: 'hana@amen.et',
  manager: 'dawit@amen.et',
  operations: 'sara@amen.et',
  finance: 'yonas@amen.et',
  marketing: 'liya@amen.et',
}

const bottomFeatures = [
  { icon: CalendarCheck2, title: 'Smart Workflows', text: 'Automated event planning pipelines.' },
  { icon: QrCode, title: 'QR Check-in', text: 'Real-time entry validation.' },
  { icon: BarChart3, title: 'Analytics & Reports', text: 'Executive dashboards & insights.' },
  { icon: Users, title: 'Teams & Collaboration', text: 'Crew management & task tracking.' },
]

const securityBadges = [
  { icon: ShieldCheck, title: 'Enterprise Grade', subtitle: 'JWT + bcrypt' },
  { icon: Database, title: 'Data Protected', subtitle: 'Encrypted at rest' },
  { icon: Zap, title: '99.9% Uptime', subtitle: 'Production SLA' },
]

export default function Login() {
  const { login, backendOnline, state } = useData()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotBusy, setForgotBusy] = useState(false)

  const show = (m, t = 'error') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2000) }

  const selectRole = (r) => {
    setRole(r.key)
    setEmail(roleEmails[r.key] || '')
    setPassword('demo@amen')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { show('Please enter your work email'); return }
    if (!password) { show('Please enter your password'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { show('Please enter a valid email address'); return }
    if (password.length < 6) { show('Password must be at least 6 characters'); return }
    setBusy(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/erp', { replace: true })
    } catch (err) {
      show(err.message || 'Login failed - check your credentials')
      setBusy(false)
    }
  }

  // Native Enter-to-submit on the login form (works with autofill overlays).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return
      const t = e.target
      if (!t || t.tagName !== 'INPUT') return
      if (forgotOpen) return
      e.preventDefault()
      submit(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const submitForgot = async () => {
    if (!forgotEmail.trim()) { show('Please enter your email', 'error'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(forgotEmail.trim())) { show('Please enter a valid email address', 'error'); return }
    setForgotBusy(true)
    try {
      const res = await api.auth.forgotPassword(forgotEmail.trim().toLowerCase())
      if (res.resetToken) {
        setResetToken(res.resetToken)
        show('Reset link generated (demo mode - token shown below)', 'success')
      } else {
        setForgotSent(true)
        show('If the email exists, a reset link has been sent', 'success')
      }
    } catch (err) {
      show('Failed to process request', 'error')
    }
    setForgotBusy(false)
  }

  const submitReset = async () => {
    if (!resetToken || !newPassword) { show('Token and new password are required', 'error'); return }
    if (newPassword.length < 6) { show('Password must be at least 6 characters', 'error'); return }
    setForgotBusy(true)
    try {
      await api.auth.resetPassword(resetToken, newPassword)
      show('Password reset successful - you can now sign in', 'success')
      setForgotOpen(false)
      setForgotSent(false)
      setResetToken('')
      setNewPassword('')
      setForgotEmail('')
      setPassword(newPassword)
    } catch (err) {
      show(err.message || 'Failed to reset password', 'error')
    }
    setForgotBusy(false)
  }

  const selectedRole = roles.find((rr) => rr.key === role)
  const selectedStaff = state.staff?.find((m) => m.id === selectedRole?.userId)

  return (
    <div className="relative flex min-h-screen w-full overflow-y-auto bg-white lg:h-screen lg:overflow-hidden">
      {/* ==================== LEFT PANEL - HERO ==================== */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, rgba(57,211,83,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 70% 80%, rgba(24,138,46,0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(11,59,22,0.5) 0%, transparent 70%),
            linear-gradient(160deg, #041C0B 0%, #0B3B16 40%, #115B22 70%, #041C0B 100%)
          `,
        }}
      >
        {/* Mesh gradient noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Light rays */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-light-ray absolute -left-20 top-0 h-full w-32 origin-top" style={{ background: 'linear-gradient(180deg, rgba(57,211,83,0.12) 0%, transparent 100%)', transform: 'rotate(15deg)' }} />
          <div className="animate-light-ray absolute left-1/3 top-0 h-full w-24 origin-top" style={{ background: 'linear-gradient(180deg, rgba(57,211,83,0.08) 0%, transparent 100%)', transform: 'rotate(8deg)', animationDelay: '2s' }} />
          <div className="animate-light-ray absolute right-10 top-0 h-full w-20 origin-top" style={{ background: 'linear-gradient(180deg, rgba(57,211,83,0.06) 0%, transparent 100%)', transform: 'rotate(-12deg)', animationDelay: '4s' }} />
        </div>

        {/* Spotlight glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-[600px] w-[600px] rounded-full bg-[#188A2E]/12 blur-[140px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-[#39D353]/6 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-[#188A2E]/8 blur-[100px]" />
        </div>

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(4,28,11,0.7) 100%)' }}
        />

        {/* Particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="animate-particle-drift absolute rounded-full bg-white"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: i % 4 === 0 ? '4px' : i % 2 === 0 ? '3px' : '2px',
                height: i % 4 === 0 ? '4px' : i % 2 === 0 ? '3px' : '2px',
                opacity: 0.1 + (i % 5) * 0.06,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${8 + (i % 4) * 2}s`,
                boxShadow: i % 3 === 0 ? '0 0 6px rgba(57,211,83,0.4)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Top: Logo + Badge */}
        <div className="relative z-10 p-10">
          <div className="animate-slide-in-left flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight text-white">Amen Events</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#39D353]/70">Organizing Excellence</p>
            </div>
          </div>

          <div
            className="animate-fade-in animate-glow-pulse mt-6 inline-flex items-center gap-2 rounded-full border border-[#39D353]/20 bg-[#39D353]/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#39D353] animate-pulse-glow" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#39D353]">Enterprise Event Platform</span>
          </div>
        </div>

        {/* Center: Massive 3D Ticket Hero */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10" style={{ perspective: '1200px' }}>
          {/* Headline */}
          <div className="animate-slide-in-left mb-8 w-full">
            <h1 className="font-extrabold leading-[1.1] tracking-tight text-white" style={{ fontSize: '2.5rem' }}>
              Plan with purpose.<br />
              <span style={{ background: 'linear-gradient(90deg, #39D353, #188A2E, #39D353)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Deliver unforgettable experiences.
              </span>
            </h1>
          </div>

          {/* Massive 3D Floating VIP Ticket */}
          <div className="relative w-full" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
            {/* Floor reflection glow */}
            <div
              className="absolute left-1/2 top-[calc(100%-20px)] h-32 w-[420px] -translate-x-1/2 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(57,211,83,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }}
            />
            {/* Pedestal shadow */}
            <div
              className="absolute left-1/2 top-[calc(100%-10px)] h-2 w-[380px] -translate-x-1/2 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)', filter: 'blur(8px)' }}
            />

            {/* Ticket */}
            <div
              className="animate-float-ticket-3d relative mx-auto rounded-[24px]"
              style={{
                width: '440px',
                maxWidth: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 50%, rgba(57,211,83,0.06) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(57,211,83,0.25)',
                boxShadow: `
                  0 30px 80px rgba(0,0,0,0.5),
                  0 10px 40px rgba(0,0,0,0.3),
                  0 0 60px rgba(57,211,83,0.12),
                  inset 0 1px 0 rgba(255,255,255,0.15),
                  inset 0 -1px 0 rgba(0,0,0,0.2)
                `,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Glass shimmer sweep */}
              <div className="animate-glass-shimmer pointer-events-none absolute inset-0 rounded-[24px]" />

              {/* Neon edge top */}
              <div
                className="absolute inset-x-0 top-0 h-px rounded-t-[24px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(57,211,83,0.6), transparent)' }}
              />

              {/* Ticket header */}
              <div className="relative p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                      <img src={logo} alt="Amen" className="h-full w-full object-cover" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Amen Events</p>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#39D353]/70">VIP Access Pass</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full border border-[#39D353]/40 bg-[#39D353]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#39D353] backdrop-blur-sm"
                    style={{ boxShadow: '0 0 12px rgba(57,211,83,0.2)' }}
                  >
                    VIP
                  </span>
                </div>
              </div>

              {/* Perforated divider */}
              <div className="relative flex items-center px-7">
                <div className="flex-1 border-t border-dashed border-white/15" />
                <div className="absolute -left-3 h-6 w-6 rounded-full" style={{ background: '#041C0B', boxShadow: 'inset 0 0 0 1px rgba(57,211,83,0.2)' }} />
                <div className="absolute -right-3 h-6 w-6 rounded-full" style={{ background: '#041C0B', boxShadow: 'inset 0 0 0 1px rgba(57,211,83,0.2)' }} />
              </div>

              {/* Ticket body - QR + info */}
              <div className="relative p-7">
                <div className="flex items-center gap-5">
                  {/* QR Code */}
                  <div
                    className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white"
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(57,211,83,0.15)' }}
                  >
                    <div className="grid grid-cols-7 gap-0.5 p-2">
                      {[...Array(49)].map((_, i) => (
                        <div
                          key={i}
                          className="h-3 w-3 rounded-[1px]"
                          style={{
                            background: (i * 7 + 3) % 3 === 0 || i === 0 || i === 6 || i === 42 || i === 48 || (i % 5 === 0 && i % 3 !== 0) ? '#041C0B' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#39D353]">Scan at Check-in</p>
                    <p className="mt-2 text-[10px] leading-relaxed text-white/50">
                      Present this QR code at the entrance for instant validation and VIP access to the event.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#39D353] to-[#188A2E]" />
                      <div className="h-1.5 w-6 rounded-full bg-white/15" />
                      <span className="text-[8px] font-bold text-white/40">AE-2026-VIP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom shine */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 rounded-b-[24px] opacity-20"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(57,211,83,0.2))' }}
              />
              {/* Neon edge bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-px rounded-b-[24px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(57,211,83,0.3), transparent)' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Feature icons + Footer */}
        <div className="relative z-10 p-10">
          <div className="animate-fade-in grid grid-cols-4 gap-3">
            {bottomFeatures.map((f) => (
              <div key={f.title} className="group flex flex-col items-center text-center">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#39D353]/20 bg-[#39D353]/8 text-[#39D353] backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#39D353]/40 group-hover:bg-[#39D353]/12 group-hover:shadow-[0_0_20px_rgba(57,211,83,0.3)]"
                >
                  <f.icon size={18} />
                </span>
                <p className="mt-2 text-[10px] font-bold text-white/75">{f.title}</p>
                <p className="mt-0.5 text-[8px] leading-snug text-white/30">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="animate-fade-in mt-6 flex items-center gap-2 border-t border-white/5 pt-4">
            <ShieldCheck size={14} className="text-[#39D353]/50" />
            <p className="text-[10px] text-white/30">Trusted by professional event organizers across Ethiopia.</p>
          </div>
        </div>
      </div>

      {/* ==================== WATER WAVE DIVIDER ==================== */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-full w-48 -translate-x-1/2 lg:block">
        <svg viewBox="0 0 192 1080" preserveAspectRatio="none" className="h-full w-full" fill="none">
          <defs>
            <linearGradient id="waveFill1" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
              <stop stopColor="#39D353" stopOpacity="0" />
              <stop offset="0.15" stopColor="#39D353" stopOpacity="0.06" />
              <stop offset="0.5" stopColor="#39D353" stopOpacity="0.1" />
              <stop offset="0.85" stopColor="#188A2E" stopOpacity="0.06" />
              <stop offset="1" stopColor="#188A2E" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveStroke1" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
              <stop stopColor="#39D353" stopOpacity="0" />
              <stop offset="0.2" stopColor="#39D353" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="#39D353" stopOpacity="0.8" />
              <stop offset="0.8" stopColor="#188A2E" stopOpacity="0.5" />
              <stop offset="1" stopColor="#188A2E" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveStroke2" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
              <stop stopColor="#39D353" stopOpacity="0" />
              <stop offset="0.3" stopColor="#39D353" stopOpacity="0.25" />
              <stop offset="0.6" stopColor="#39D353" stopOpacity="0.4" />
              <stop offset="1" stopColor="#39D353" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveStroke3" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Filled water body - left side (dark green) */}
          <path
            d="M96 0 C 50 60, 142 120, 96 180 C 50 240, 142 300, 96 360 C 50 420, 142 480, 96 540 C 50 600, 142 660, 96 720 C 50 780, 142 840, 96 900 C 50 960, 142 1020, 96 1080 L 0 1080 L 0 0 Z"
            fill="url(#waveFill1)"
          />

          {/* Filled water body - right side (lighter) */}
          <path
            d="M96 0 C 50 60, 142 120, 96 180 C 50 240, 142 300, 96 360 C 50 420, 142 480, 96 540 C 50 600, 142 660, 96 720 C 50 780, 142 840, 96 900 C 50 960, 142 1020, 96 1080 L 192 1080 L 192 0 Z"
            fill="url(#waveFill1)"
            opacity="0.5"
          />

          {/* Outer glow wave - wide amplitude */}
          <path
            d="M96 0 C 40 60, 152 120, 96 180 C 40 240, 152 300, 96 360 C 40 420, 152 480, 96 540 C 40 600, 152 660, 96 720 C 40 780, 152 840, 96 900 C 40 960, 152 1020, 96 1080"
            stroke="url(#waveStroke1)"
            strokeWidth="3"
            filter="url(#glow2)"
          />

          {/* Main wave - medium amplitude */}
          <path
            d="M96 0 C 56 70, 136 140, 96 210 C 56 280, 136 350, 96 420 C 56 490, 136 560, 96 630 C 56 700, 136 770, 96 840 C 56 910, 136 980, 96 1080"
            stroke="url(#waveStroke2)"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* Inner wave - smaller amplitude, offset phase */}
          <path
            d="M96 0 C 72 90, 120 180, 96 270 C 72 360, 120 450, 96 540 C 72 630, 120 720, 96 810 C 72 900, 120 990, 96 1080"
            stroke="url(#waveStroke3)"
            strokeWidth="1.5"
          />

          {/* Center ripple */}
          <path
            d="M96 0 C 88 130, 104 260, 96 390 C 88 520, 104 650, 96 780 C 88 910, 104 1040, 96 1080"
            stroke="url(#waveStroke3)"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Floating bubbles */}
          <circle cx="78" cy="200" r="3" fill="#39D353" fillOpacity="0.15" />
          <circle cx="110" cy="450" r="2" fill="#39D353" fillOpacity="0.2" />
          <circle cx="72" cy="680" r="2.5" fill="#39D353" fillOpacity="0.12" />
          <circle cx="118" cy="850" r="2" fill="#39D353" fillOpacity="0.15" />
          <circle cx="84" cy="320" r="1.5" fill="#ffffff" fillOpacity="0.1" />
          <circle cx="106" cy="590" r="1.5" fill="#ffffff" fillOpacity="0.08" />
        </svg>
      </div>

      {/* ==================== RIGHT PANEL - AUTH ==================== */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-y-auto px-6 pt-6 pb-6 lg:h-full lg:w-1/2" style={{ background: 'linear-gradient(180deg, #F8FAF8 0%, #FFFFFF 100%)' }}>
        {/* Ambient glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-brand-50/40 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-brand-50/30 blur-[80px]" />

        {/* Floating glass auth card */}
        <div
          className="animate-slide-in-right relative z-10 w-full max-w-[440px] shrink-0 rounded-[36px] border border-white/60 bg-white/80 p-7 backdrop-blur-xl sm:p-8"
          style={{ boxShadow: '0 30px 80px rgba(4,28,11,0.08), 0 10px 30px rgba(4,28,11,0.04), 0 1px 3px rgba(4,28,11,0.03)' }}
        >
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-700 ring-1 ring-brand-100">
              <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-brand-950">Amen Events</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-500">Organizing Excellence</p>
            </div>
          </div>

          {/* Top badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 ring-1 ring-brand-100/80">
            <ShieldCheck size={12} className="text-brand-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Secure Workspace Sign-In</span>
          </div>

          {/* Title - premium typography */}
          <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight text-brand-950">Welcome back</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink/50">
            Sign in to access your enterprise workspace and manage your events efficiently.
          </p>

          {/* Role selection cards - premium */}
          <p className="mt-5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/40">Select your role</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => selectRole(r)}
                className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-1 ${
                  role === r.key
                    ? 'border-brand-600/60 bg-brand-50/40 shadow-[0_8px_24px_rgba(24,138,46,0.12)]'
                    : 'border-gray-100/80 bg-white/50 hover:border-brand-200/60 hover:shadow-[0_8px_24px_rgba(4,28,11,0.06)]'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                    role === r.key
                      ? 'bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-[0_4px_12px_rgba(24,138,46,0.3)]'
                      : 'bg-gray-50/80 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600'
                  }`}
                >
                  <r.icon size={16} />
                </span>
                <span className={`text-[11px] font-bold transition ${
                  role === r.key ? 'text-brand-950' : 'text-gray-600 group-hover:text-brand-900'
                }`}>{r.label}</span>
                {role === r.key && (
                  <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_2px_8px_rgba(24,138,46,0.4)]">
                    <Check size={10} />
                  </span>
                )}
              </button>
            ))}
          </div>
          {!role && (
            <p className="mt-2.5 rounded-xl bg-gold-50 px-3 py-2 text-[11px] font-medium text-gold-800 ring-1 ring-gold-200">
              Pick your role to auto-fill its demo account - or type any staff email below.
            </p>
          )}

          {/* Login form */}
          <form onSubmit={submit} className="mt-5" noValidate>
            <div className="space-y-3">
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-ink/70">Work Email</label>
                <div className="group relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25 transition group-focus-within:text-brand-600" />
                  <input
                    className="h-12 w-full rounded-2xl border border-gray-200/80 bg-white/60 pl-12 pr-4 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white"
                    type="email"
                    placeholder="you@amen.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-ink/70">Password</label>
                <div className="group relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25 transition group-focus-within:text-brand-600" />
                  <input
                    className="h-12 w-full rounded-2xl border border-gray-200/80 bg-white/60 pl-12 pr-12 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink/30 transition hover:bg-gray-50 hover:text-ink/60">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot password */}
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => { setForgotOpen(true); setForgotEmail(email) }} className="text-xs font-medium text-brand-600 transition hover:text-brand-800 hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Sign in button - luxury */}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #228B22 0%, #188A2E 50%, #1c731c 100%)',
                boxShadow: '0 12px 30px rgba(34,139,34,0.28), 0 4px 12px rgba(34,139,34,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {busy ? (
                <><Sparkles size={18} className="animate-spin" /> Signing you in…</>
              ) : (
                <>Sign in to workspace <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Client portal link - separate surface from staff ERP */}
          <p className="mt-3 text-center text-xs text-ink/45">
            Looking for the client dashboard?{' '}
            <Link to="/client-login" className="font-semibold text-brand-700 hover:text-brand-900 hover:underline">Client Portal sign-in →</Link>
          </p>

          {/* User preview card */}
          {selectedRole && (
          <div key={role} className="animate-fade-in mt-4 flex items-center gap-3 rounded-2xl border border-gray-100/80 bg-gray-50/40 p-3 backdrop-blur-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-[11px] font-black text-white shadow-sm">
              {selectedStaff?.avatar ? <img src={selectedStaff.avatar} alt={selectedRole?.name} className="h-full w-full object-cover" /> : (selectedRole?.name?.split(' ').map(p => p[0]).slice(0, 2).join('') || '?')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-brand-950">{selectedRole?.name}</p>
              <p className="truncate text-[11px] text-ink/45">{selectedRole?.title}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100/80 px-2.5 py-1 text-[10px] font-bold text-brand-800">
              {selectedRole?.label}
            </span>
          </div>
          )}

          {/* Security badges */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {securityBadges.map((b) => (
              <div key={b.title} className="flex flex-col items-center rounded-xl border border-gray-50/80 bg-white/50 p-2.5 text-center backdrop-blur-sm">
                <b.icon size={16} className="text-brand-600" />
                <p className="mt-1.5 text-[10px] font-bold text-brand-950">{b.title}</p>
                <p className="text-[9px] text-ink/35">{b.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Backend status */}
          <p className="mt-3 text-center text-[10px] leading-relaxed text-ink/35">
            {backendOnline ? 'Secure backend authentication - JWT + bcrypt.' : 'Demo mode - backend offline, using local data. Password: demo@amen'}
          </p>

          {/* Footer */}
          <div className="mt-3 border-t border-gray-50 pt-3 text-center">
            <p className="text-[10px] text-ink/30">
              © 2025 Amen Events · Powered by <span className="font-semibold text-ink/40">Gravity Technologies PLC</span>
            </p>
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      {/* Forgot Password Modal */}
      <Modal open={forgotOpen} onClose={() => { setForgotOpen(false); setForgotSent(false); setResetToken('') }} title="Reset Password">
        {!forgotSent && !resetToken && (
          <div className="space-y-4">
            <p className="text-sm text-ink/55">Enter your work email and we'll send you a link to reset your password.</p>
            <Field label="Work Email">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input !pl-9" type="email" placeholder="you@amen.et" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitForgot() } }} />
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setForgotOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitForgot} disabled={forgotBusy}>
                {forgotBusy ? <Sparkles size={15} className="animate-spin" /> : <Mail size={15} />}
                {forgotBusy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        )}

        {forgotSent && !resetToken && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Mail size={24} /></span>
            </div>
            <p className="font-bold text-brand-950">Check your email</p>
            <p className="text-sm text-ink/55">If an account exists for {forgotEmail}, a password reset link has been sent.</p>
            <button className="btn-outline w-full" onClick={() => { setForgotOpen(false); setForgotSent(false) }}>Back to login</button>
          </div>
        )}

        {resetToken && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gold-50 border border-gold-200 p-3">
              <p className="text-xs font-bold text-gold-800 mb-1">Demo Mode - Reset Token</p>
              <p className="text-xs text-gold-700 break-all font-mono">{resetToken}</p>
              <p className="text-[11px] text-gold-600 mt-1">In production, this would be sent via email as a link.</p>
            </div>
            <Field label="New Password">
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input !pl-9" type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitReset() } }} />
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => { setResetToken(''); setForgotOpen(false) }}>Cancel</button>
              <button className="btn-primary" onClick={submitReset} disabled={forgotBusy}>
                {forgotBusy ? <Sparkles size={15} className="animate-spin" /> : <KeyRound size={15} />}
                {forgotBusy ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}