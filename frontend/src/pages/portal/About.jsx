import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Ticket, Shield, Zap, Users, ArrowRight } from 'lucide-react'

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-950">About Amen Events</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink/60">
          Amen Events is Ethiopia's premier event management platform, connecting attendees with extraordinary events — from conferences and product launches to retreats and exhibitions.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Ticket, title: 'Instant Tickets', desc: 'Get QR codes immediately after purchase. No waiting, no printing.' },
          { icon: Shield, title: 'Secure Platform', desc: 'Your data and payments are protected with enterprise-grade security.' },
          { icon: Zap, title: 'Seamless Experience', desc: 'Browse, register, and check in — all in seconds, from any device.' },
        ].map((f) => (
          <div key={f.title} className="card p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><f.icon size={22} /></span>
            <h3 className="mt-4 font-bold text-brand-950">{f.title}</h3>
            <p className="mt-2 text-sm text-ink/55">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-8">
        <h2 className="font-bold text-brand-950 text-lg">Our Mission</h2>
        <p className="mt-3 text-sm text-ink/65 leading-relaxed">
          We believe that attending events should be effortless. Our platform bridges the gap between event organizers and attendees, providing a seamless experience from discovery to check-in. Whether you're a professional looking to network at a conference, a student attending a workshop, or an enthusiast exploring exhibitions — Amen Events makes it simple.
        </p>
      </div>

      <div className="mt-10 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to explore?</h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">Discover events happening across Ethiopia today.</p>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-900 shadow-lg transition hover:scale-105">
          Browse Events <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
