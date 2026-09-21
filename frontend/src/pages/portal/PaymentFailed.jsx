import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react'

export default function PaymentFailed() {
  const location = useLocation()
  const { eventName } = location.state || {}

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="card p-8 text-center animate-page-enter">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <XCircle size={32} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-brand-950">Payment Failed</h1>
        <p className="mt-2 text-sm text-ink/55">
          {eventName ? `Your payment for ${eventName} could not be processed.` : 'Your payment could not be processed.'}
          Please try again.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/events" className="btn-primary w-full">
            <RotateCcw size={16} /> Try Again
          </Link>
          <Link to="/" className="btn-outline w-full">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
