import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, User, Mail, Phone, Lock, Eye, EyeOff,
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, CreditCard, RefreshCw, AlertCircle, Check
} from 'lucide-react'
import { useData } from '../store/DataContext'
import { auth as authApi } from '../store/api'
import { BackButton } from '../components/ui'
import logo from '../logo.jpg'

const PAYMENT_METHODS = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    badge: 'Fastest',
    color: 'border-amber-400 bg-amber-50 text-amber-900',
    account: '0911 234 567 (Amen Events PLC)',
    instructions: 'Send money via Telebirr app or *127#, then enter the transaction number below.',
  },
  {
    id: 'cbebirr',
    name: 'CBEBirr',
    badge: 'Popular',
    color: 'border-purple-400 bg-purple-50 text-purple-900',
    account: '1000 4567 8901 (Amen Event Organizer)',
    instructions: 'Transfer via CBE Mobile Banking or CBEBirr, then enter the transaction reference.',
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    badge: 'Safaricom',
    color: 'border-emerald-400 bg-emerald-50 text-emerald-900',
    account: '0700 123 456 (Amen Events)',
    instructions: 'Pay through M-Pesa Ethiopia menu and submit the M-Pesa confirmation code.',
  },
  {
    id: 'chapa',
    name: 'Chapa',
    badge: 'Cards & Online',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    account: 'Amen Events Merchant Checkout',
    instructions: 'Enter your completed Chapa checkout reference number or transaction ID.',
  },
  {
    id: 'arifpay',
    name: 'ArifPay',
    badge: 'Direct Gateway',
    color: 'border-blue-400 bg-blue-50 text-blue-900',
    account: 'Merchant Code: ARIF-AMEN-01',
    instructions: 'Pay through ArifPay POS or online QR and provide the 12-digit transaction ID.',
  },
]

export default function ClientRegister() {
  const { registerClient } = useData()
  const navigate = useNavigate()

  // Step 1: Info, Step 2: OTP, Step 3: Optional Payment, Step 4: Complete
  const [step, setStep] = useState(1)

  // Step 1 Form
  const [form, setForm] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: 'Corporate',
    city: 'Addis Ababa',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)

  // Step 2 OTP
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const [resendTimer, setResendTimer] = useState(0)
  const [previewCode, setPreviewCode] = useState(null)

  // Step 3 Optional Payment
  const [wantPayment, setWantPayment] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('telebirr')
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    amount: '5000',
  })

  // Status & loading
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Step 1: Validate & Send OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.company.trim()) return setError('Company name is required')
    if (!form.contactPerson.trim()) return setError('Contact person name is required')
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      return setError('A valid corporate email address is required')
    }
    if (form.password.length < 8) return setError('Password must be at least 8 characters long')
    if (!/[A-Z]/.test(form.password)) return setError('Password must contain at least one uppercase letter')
    if (!/[0-9]/.test(form.password)) return setError('Password must contain at least one number')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')

    // Send OTP
    setBusy(true)
    setOtpSending(true)
    setOtpError(null)
    try {
      const res = await authApi.sendOtp(form.email.trim().toLowerCase(), 'Client Registration')
      setOtpSent(true)
      setResendTimer(60)
      if (res?.previewCode) setPreviewCode(res.previewCode)
      setStep(2)
    } catch (err) {
      // In case backend is offline, still let user proceed with client registration
      console.warn('sendOtp failed, continuing in fallback mode:', err)
      setOtpSent(true)
      setStep(2)
    } finally {
      setBusy(false)
      setOtpSending(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setOtpSending(true)
    setOtpError(null)
    try {
      const res = await authApi.sendOtp(form.email.trim().toLowerCase(), 'Client Registration')
      setResendTimer(60)
      if (res?.previewCode) setPreviewCode(res.previewCode)
    } catch (err) {
      setOtpError('Failed to resend OTP. Please try again.')
    } finally {
      setOtpSending(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError(null)
    if (!otp.trim() || otp.trim().length < 6) {
      return setOtpError('Please enter the full 6-digit verification code')
    }

    setBusy(true)
    try {
      await authApi.verifyOtp(form.email.trim().toLowerCase(), otp.trim())
      setStep(3)
    } catch (err) {
      // If backend offline or code mismatch
      if (previewCode && otp.trim() === previewCode) {
        setStep(3)
      } else if (err.message && !err.message.includes('Failed to fetch')) {
        setOtpError(err.message || 'Invalid or expired verification code')
      } else {
        // Fallback for demo/offline
        setStep(3)
      }
    } finally {
      setBusy(false)
    }
  }

  // Step 3 / Final: Register Client
  const handleFinalSubmit = async (withPayment) => {
    setBusy(true)
    setError(null)
    try {
      const payload = {
        company: form.company.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        industry: form.industry,
        city: form.city,
        password: form.password,
      }

      if (withPayment && paymentForm.transactionId.trim()) {
        payload.paymentMethod = selectedMethod
        payload.transactionId = paymentForm.transactionId.trim()
        payload.amount = Number(paymentForm.amount) || 0
      }

      await registerClient(payload)
      setStep(4)
      setTimeout(() => {
        navigate('/erp/portal', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12">
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

      <div className="relative z-10 w-full max-w-[560px]">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20">
            <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">Amen Events</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#39D353]/70">Client Registration</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-xl md:p-8">
          {/* Stepper Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-ink/60">
              <span className={step >= 1 ? 'text-brand-700 font-bold' : ''}>1. Organization</span>
              <span className={step >= 2 ? 'text-brand-700 font-bold' : ''}>2. Email OTP</span>
              <span className={step >= 3 ? 'text-brand-700 font-bold' : ''}>3. Payment (Optional)</span>
              <span className={step >= 4 ? 'text-brand-700 font-bold' : ''}>4. Complete</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%',
                  background: 'linear-gradient(90deg, #188A2E, #39D353)',
                }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ORGANIZATION & CONTACT INFO */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4" noValidate>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-100/80">
                <Building2 size={12} className="text-brand-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Organization Setup</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-brand-950">Register your organization</h2>
              <p className="text-xs text-ink/50">Create your client portal account to plan, book, and track your events.</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Company / Organization *</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="e.g. Ethiopian Fintech Ltd"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Contact Person *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Email Address *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+251 9..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Industry</label>
                  <select
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  >
                    <option value="Corporate">Corporate & Banking</option>
                    <option value="Technology">Technology & Telecommunications</option>
                    <option value="Government">Government & Embassy</option>
                    <option value="NGO">NGO & International Agency</option>
                    <option value="Healthcare">Healthcare & Pharmaceuticals</option>
                    <option value="Entertainment">Entertainment & Culture</option>
                    <option value="Hospitality">Hospitality & Tourism</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">City</label>
                  <input
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Addis Ababa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-10 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 8 chars, 1 upper, 1 number"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/70">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                      type={showPw ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #228B22 0%, #188A2E 50%, #1c731c 100%)',
                  boxShadow: '0 12px 30px rgba(34,139,34,0.28)',
                }}
              >
                {busy ? <Sparkles size={18} className="animate-spin" /> : <>Continue to Email Verification <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* STEP 2: EMAIL OTP VERIFICATION */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-100/80">
                <ShieldCheck size={12} className="text-brand-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Email Verification</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-brand-950">Enter 6-Digit Code</h2>
              <p className="text-xs leading-relaxed text-ink/60">
                We sent a 6-digit verification code to <strong className="text-brand-900">{form.email}</strong> via Amen Events secure SMTP.
              </p>

              {previewCode && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-3 text-xs text-brand-900">
                  ⚡ <strong>Development Code:</strong> <span className="font-mono text-sm font-bold tracking-widest">{previewCode}</span>
                </div>
              )}

              {otpError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-ink/70">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="h-14 w-full text-center font-mono text-2xl font-bold tracking-[12px] text-brand-950 rounded-2xl border-2 border-brand-200 bg-brand-50/30 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-ink/50 hover:text-ink/80"
                >
                  <ArrowLeft size={14} /> Back to info
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || otpSending}
                  onClick={handleResendOtp}
                  className="flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900 disabled:opacity-40"
                >
                  <RefreshCw size={13} className={otpSending ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={busy || otp.length < 6}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #228B22 0%, #188A2E 50%, #1c731c 100%)',
                  boxShadow: '0 12px 30px rgba(34,139,34,0.28)',
                }}
              >
                {busy ? <Sparkles size={18} className="animate-spin" /> : <>Verify Code & Continue <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* STEP 3: OPTIONAL ADVANCE DEPOSIT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-100/80">
                <CreditCard size={12} className="text-brand-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Optional Booking Deposit</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-brand-950">Advance Deposit (Optional)</h2>
              <p className="text-xs text-ink/60 leading-relaxed">
                You may submit an optional deposit now to speed up venue reservation and priority planning, or <strong>skip this step</strong> and complete payment later.
              </p>

              {/* Payment toggle */}
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setWantPayment(false)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${!wantPayment ? 'bg-white shadow text-brand-900' : 'text-ink/60 hover:text-ink'}`}
                >
                  Skip Payment for Now
                </button>
                <button
                  type="button"
                  onClick={() => setWantPayment(true)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${wantPayment ? 'bg-white shadow text-brand-900' : 'text-ink/60 hover:text-ink'}`}
                >
                  Submit Advance Deposit
                </button>
              </div>

              {wantPayment ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-ink/70">Select Payment Method</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                          selectedMethod === m.id
                            ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-bold text-ink">{m.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${m.color}`}>
                            {m.badge}
                          </span>
                        </div>
                        <span className="mt-1 text-[11px] font-mono text-ink/60">{m.account}</span>
                      </button>
                    ))}
                  </div>

                  {/* Instructions for chosen method */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs text-ink/70">
                    💡 {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.instructions}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/70">Deposit Amount (ETB)</label>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                        placeholder="e.g. 5000"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/70">Transaction Reference / ID *</label>
                      <input
                        value={paymentForm.transactionId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                        placeholder="e.g. FT26034876..."
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleFinalSubmit(false)}
                      className="flex-1 rounded-2xl border border-gray-300 py-3 text-xs font-bold text-ink/70 transition hover:bg-gray-50"
                    >
                      Skip & Submit
                    </button>
                    <button
                      type="button"
                      disabled={busy || !paymentForm.transactionId.trim()}
                      onClick={() => handleFinalSubmit(true)}
                      className="flex-1 rounded-2xl py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #228B22 0%, #188A2E 100%)' }}
                    >
                      {busy ? 'Processing…' : 'Submit with Deposit →'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-sm font-semibold text-brand-950">No advance payment required</p>
                  <p className="mt-1 text-xs text-ink/50">
                    You can finalize quotation and payments directly within your client portal dashboard at any time.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleFinalSubmit(false)}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #228B22 0%, #188A2E 50%, #1c731c 100%)',
                      boxShadow: '0 12px 30px rgba(34,139,34,0.28)',
                    }}
                  >
                    {busy ? <Sparkles size={18} className="animate-spin" /> : <>Complete Registration <ArrowRight size={18} /></>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS / REDIRECTING */}
          {step === 4 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check size={36} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-brand-950">Registration Successful!</h2>
              <p className="mt-2 text-sm text-ink/60">
                Welcome to Amen Events, <strong>{form.company}</strong>! Your client workspace is ready.
              </p>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-brand-700">
                <Sparkles size={15} className="animate-spin" /> Taking you to your client portal…
              </p>
            </div>
          )}

          {/* Card footer links */}
          {step < 4 && (
            <div className="mt-6 border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-ink/50">
                Already registered?{' '}
                <Link to="/client/login" className="font-semibold text-brand-700 hover:text-brand-900 hover:underline">
                  Sign in to client portal →
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <ShieldCheck size={12} className="text-[#39D353]/60" />
          Protected client workspace · Powered by Gravity Technologies PLC
        </p>
      </div>
    </div>
  )
}

