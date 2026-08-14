import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Ticket, CheckCircle2, XCircle, Loader2, ArrowLeft, Shield } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, authFetch } = useAttendee()
  const [couponCode, setCouponCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Telebirr')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const { eventId, eventName, ticketType, unitPrice, quantity, eventDate, venue } = location.state || {}

  if (!eventId) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-lg font-bold text-gray-900">No checkout session found</p>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-portal-600">← Browse events</Link>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate(`/portal-login?redirect=/checkout`)
    return null
  }

  const subtotal = (unitPrice || 0) * (quantity || 1)
  const tax = Math.round(subtotal * 0.15)
  const total = subtotal + tax

  const handlePay = async () => {
    if (!agreeTerms) { setError('Please agree to the terms to continue'); return }
    setProcessing(true)
    setError(null)
    try {
      const orderData = await authFetch('/portal/orders', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          items: [{ ticketType, quantity, unitPrice }],
          couponCode: couponCode || undefined,
        }),
      })
      if (orderData.error) { setError(orderData.error); setProcessing(false); return }

      const payData = await authFetch(`/portal/orders/${orderData.order.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method: paymentMethod }),
      })
      if (payData.error) { setError(payData.error); setProcessing(false); return }

      if (payData.success) {
        navigate('/payment-success', { state: { orderId: orderData.order.id, eventName, total } })
      } else {
        navigate('/payment-failed', { state: { orderId: orderData.order.id, eventName } })
      }
    } catch {
      setError('Payment processing failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <Link to={`/events/${eventId}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-portal-600">
        <ArrowLeft size={16} /> Back to event
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Checkout</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Ticket Summary */}
        <div className="rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="text-lg font-bold text-gray-900">Ticket Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Event</span><span className="text-right font-semibold text-gray-900">{eventName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-900">{eventDate ? new Date(eventDate).toLocaleDateString() : 'TBA'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Venue</span><span className="font-semibold text-gray-900">{venue || 'TBA'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ticket Type</span><span className="font-semibold text-gray-900">{ticketType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-semibold text-gray-900">{quantity}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unit Price</span><span className="font-semibold text-gray-900">ETB {(unitPrice || 0).toLocaleString()}</span></div>
          </div>

          <div className="mt-5 space-y-2 border-t border-gray-100 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-900">ETB {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">VAT (15%)</span><span className="font-semibold text-gray-900">ETB {tax.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-lg font-bold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">ETB {total.toLocaleString()}</span></div>
          </div>

          {/* Coupon */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Coupon Code</label>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" />
              <button className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50" onClick={() => {}}>Apply</button>
            </div>
          </div>
        </div>

        {/* Right: Personal Info + Payment */}
        <div className="rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
          <div className="mt-5 space-y-4">
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Full Name</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" placeholder="Your name" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" placeholder="you@example.com" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Phone</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" placeholder="+251..." /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Country</label><select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-portal-400"><option>Ethiopia</option><option>Kenya</option><option>Other</option></select></div>
          </div>

          {/* Payment Method */}
          <h3 className="mt-6 text-lg font-bold text-gray-900">Payment Method</h3>
          <div className="mt-4 grid gap-2.5">
            {['Telebirr', 'CBE Birr', 'Card', 'Bank Transfer', 'Cash'].map((m) => (
              <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${paymentMethod === m ? 'border-portal-300 bg-portal-50/60' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-portal-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{m}</p>
                  <p className="text-xs text-gray-400">{m === 'Card' ? 'Visa · Mastercard' : m === 'Telebirr' || m === 'CBE Birr' ? 'Mobile money' : m === 'Bank Transfer' ? 'Direct deposit' : 'Pay at the venue'}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Terms */}
          <label className="mt-5 flex items-start gap-3">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-portal-600" />
            <span className="text-xs text-gray-500">I agree to the Terms of Service and Privacy Policy. I understand that all sales are final unless the event is cancelled.</span>
          </label>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <Shield size={14} className="text-portal-600" /> Secure checkout · Your data is protected
          </div>

          {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <button onClick={handlePay} disabled={processing} className="mt-5 w-full rounded-xl bg-portal-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-portal-600 hover:shadow-md disabled:opacity-50">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing…</span> : <span className="inline-flex items-center gap-2"><Ticket size={16} /> Pay ETB {total.toLocaleString()}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
