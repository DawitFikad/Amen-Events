import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Ticket, Heart, Bell, Lock, Trash2, Check, ArrowRight, Settings, Calendar } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'

export default function Profile() {
  const { attendee, isAuthenticated, authFetch, logout } = useAttendee()
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    firstName: attendee?.firstName || '',
    lastName: attendee?.lastName || '',
    email: attendee?.email || '',
    phone: attendee?.phone || '',
    city: attendee?.city || '',
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [prefs, setPrefs] = useState({ emailNotif: true, smsNotif: false, eventReminders: true, newsletter: true })
  const [error, setError] = useState(null)

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-lg font-bold text-gray-900">Please login to view your profile</p>
        <Link to="/portal-login?redirect=/profile" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-portal-600">Login</Link>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const data = await authFetch('/portal/me', { method: 'PATCH', body: JSON.stringify(form) })
    setSaving(false)
    if (data.error) setError(data.error)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const handlePwdChange = async () => {
    if (pwd.next !== pwd.confirm) { setError('Passwords do not match'); return }
    if (pwd.next.length < 6) { setError('Password must be at least 6 characters'); return }
    setSaving(true)
    const data = await authFetch('/portal/me/password', { method: 'POST', body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }) })
    setSaving(false)
    if (data.error) setError(data.error)
    else { setPwd({ current: '', next: '', confirm: '' }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    await authFetch('/portal/me', { method: 'DELETE' })
    logout()
    navigate('/')
  }

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Account', icon: Settings },
  ]

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-portal-600 text-xl font-bold text-white">
          {attendee?.firstName?.[0] || 'U'}{attendee?.lastName?.[0] || ''}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{attendee?.firstName} {attendee?.lastName}</h1>
          <p className="text-sm text-gray-500">{attendee?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <Ticket size={20} className="mx-auto text-portal-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{attendee?._count?.tickets || 0}</p>
          <p className="text-xs text-gray-400">Tickets</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <Calendar size={20} className="mx-auto text-portal-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{attendee?._count?.events || 0}</p>
          <p className="text-xs text-gray-400">Events</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <Heart size={20} className="mx-auto text-portal-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{attendee?._count?.wishlist || 0}</p>
          <p className="text-xs text-gray-400">Wishlist</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null) }}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${tab === t.id ? 'border-portal-500 text-portal-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 rounded-[20px] border border-gray-100 bg-white p-7" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {saved && <div className="mb-4 rounded-xl bg-portal-50 px-4 py-3 text-sm font-semibold text-portal-600">✓ Saved successfully</div>}

        {tab === 'info' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">First Name</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Last Name</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Phone</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">City</label><input className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Addis Ababa" /></div>
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-portal-600 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-4">
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Current Password</label><input type="password" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">New Password</label><input type="password" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-600">Confirm New Password</label><input type="password" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-portal-400 focus:ring-2 focus:ring-portal-500/15" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
            <button onClick={handlePwdChange} disabled={saving} className="rounded-xl bg-portal-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-portal-600 disabled:opacity-50">
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-3">
            {[
              { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive emails about your tickets and events' },
              { key: 'smsNotif', label: 'SMS Notifications', desc: 'Get text alerts for event reminders' },
              { key: 'eventReminders', label: 'Event Reminders', desc: 'Get notified 24h before your events' },
              { key: 'newsletter', label: 'Newsletter', desc: 'Weekly digest of new events' },
            ].map((p) => (
              <label key={p.key} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
                <div><p className="text-sm font-bold text-gray-900">{p.label}</p><p className="text-xs text-gray-400">{p.desc}</p></div>
                <button
                  onClick={() => setPrefs({ ...prefs, [p.key]: !prefs[p.key] })}
                  className={`relative h-7 w-12 rounded-full transition ${prefs[p.key] ? 'bg-portal-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${prefs[p.key] ? 'left-6' : 'left-1'}`} />
                </button>
              </label>
            ))}
          </div>
        )}

        {tab === 'danger' && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-red-100 bg-red-50/30 p-5">
              <h3 className="font-bold text-red-700">Delete Account</h3>
              <p className="mt-1 text-sm text-red-600/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={handleDelete} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">
                <Trash2 size={16} /> Delete My Account
              </button>
            </div>
            <button onClick={() => { logout(); navigate('/') }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
