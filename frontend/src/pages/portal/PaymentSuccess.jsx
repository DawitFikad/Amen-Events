import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Ticket, ArrowRight, QrCode, Download, Share2, Home } from 'lucide-react'

export default function PaymentSuccess() {
  const location = useLocation()
  const { orderId, eventName, total } = location.state || {}

  return (
    <div className="mx-auto max-w-lg px-5 py-16 sm:px-8">
      <div className="animate-portal-scale-in rounded-[24px] border border-gray-100 bg-white p-8 text-center" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        {/* Success checkmark */}
        <span className="animate-portal-qr-pop mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-portal-100 text-portal-600">
          <CheckCircle2 size={40} />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Registration Successful!</h1>
        <p className="mt-2 text-sm text-gray-500">Your QR Ticket has been generated and is ready to use.</p>

        {/* QR Code placeholder */}
        <div className="mt-8 rounded-2xl border-2 border-portal-200 bg-portal-50/50 p-8">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-white" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <QrCode size={80} className="text-portal-600" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Your QR Ticket</p>
        </div>

        {/* Order details */}
        {eventName && (
          <div className="mt-6 space-y-2 text-left text-sm">
            <div className="flex justify-between border-b border-gray-50 py-2.5">
              <span className="text-gray-400">Event</span>
              <span className="font-semibold text-gray-900">{eventName}</span>
            </div>
            {total != null && (
              <div className="flex justify-between border-b border-gray-50 py-2.5">
                <span className="text-gray-400">Amount Paid</span>
                <span className="font-semibold text-gray-900">ETB {total.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="text-gray-400">Status</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-portal-100 px-3 py-1 text-xs font-bold text-portal-600">Confirmed</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 space-y-2.5">
          <Link to="/my-tickets" className="flex w-full items-center justify-center gap-2 rounded-xl bg-portal-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-portal-600 hover:shadow-md">
            <Ticket size={16} /> View My Tickets
          </Link>
          <div className="flex gap-2.5">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              <Download size={16} /> PDF
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              <Share2 size={16} /> Share
            </button>
          </div>
          <Link to="/events" className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-portal-600 transition hover:text-portal-700">
            Browse More Events <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
