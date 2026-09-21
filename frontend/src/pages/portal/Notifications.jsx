import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Ticket, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'

export default function Notifications() {
  const { authFetch, isAuthenticated } = useAttendee()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    authFetch('/portal/notifications').then((data) => {
      setNotifications(data.notifications || [])
      setLoading(false)
    })
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-bold text-brand-950 text-lg">Please login to view notifications</p>
        <Link to="/login?redirect=/notifications" className="btn-primary mt-4">Login</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-950">Notifications</h1>
      <p className="mt-1 text-sm text-ink/55">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="mt-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse p-4 h-16" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card mt-6 py-16 text-center">
          <Bell size={40} className="mx-auto text-ink/30" />
          <p className="mt-4 font-bold text-brand-950">No notifications</p>
          <p className="mt-1 text-sm text-ink/50">You'll see updates about your events and tickets here</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="card flex items-start gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                n.type === 'order' ? 'bg-brand-100 text-brand-700' : 'bg-gold-100 text-gold-700'
              }`}>
                {n.type === 'order' ? <Ticket size={18} /> : <Calendar size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-950 text-sm">{n.title}</p>
                <p className="text-sm text-ink/55">{n.message}</p>
                <p className="mt-1 text-xs text-ink/40">{new Date(n.date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
