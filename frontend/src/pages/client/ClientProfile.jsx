import React, { useState } from 'react'
import { Building2, User, Phone, Mail, MapPin, Globe, Lock, Bell, Shield, CheckCircle2 } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Toast } from '../../components/ui'
import { textRequired, nameOnly, phoneValid, emailValid, optional, validate, clearError } from '../../store/validation'

export default function ClientProfile() {
  const { state, patch, patchBy, logActivity } = useData()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)
  const [tab, setTab] = useState('company')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company: client?.company || '',
    contactPerson: client?.contactPerson || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.city || '',
    industry: client?.industry || '',
    website: client?.website || '',
    taxId: client?.taxId || '',
  })
  const [notifPrefs, setNotifPrefs] = useState({
    budget: true, invoices: true, documents: true, timeline: true, reminders: true,
  })
  const [security, setSecurity] = useState({ twoFactor: false, currentPassword: '', newPassword: '' })
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const saveCompany = () => {
    const res = validate(form, {
      company: [textRequired('Company name', { max: 120 })],
      contactPerson: [nameOnly('Contact person')],
      phone: [phoneValid('Phone')],
      email: [emailValid('Email')],
      address: [optional(textRequired('Address', { max: 150 }))],
      industry: [optional(textRequired('Industry', { max: 120 }))],
      website: [optional((v) => {
        const s = String(v || '').trim()
        if (!s) return ''
        const ok = /^https?:\/\/[^\s]+\.[^\s]+/.test(s) || /^(www\.)?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(\/(\S)*)?$/.test(s)
        return ok ? '' : 'Enter a valid website (e.g. https://company.com)'
      })],
      taxId: [optional(textRequired('Tax ID', { max: 60 }))],
    })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'error'); return }
    setErrors({})
    setSaving(true)
    setTimeout(() => {
      patchBy('clients', clientId, { company: form.company, contactPerson: form.contactPerson, phone: form.phone, email: form.email, city: form.address, industry: form.industry, website: form.website, taxId: form.taxId })
      logActivity('Client updated company profile', 'crm')
      setSaving(false); show('Company profile updated successfully')
    }, 800)
  }

  const tabs = [
    ['company', 'Company Info', Building2],
    ['notifications', 'Notifications', Bell],
    ['security', 'Security', Shield],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Profile & Settings</h1>
        <p className="text-sm text-ink/50">Manage your company information and account settings</p>
      </div>

      {/* Company header card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-black">
              {client?.logo || client?.company?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black">{client?.company}</h2>
              <p className="text-sm text-brand-100">{client?.industry} · {client?.city}</p>
              <p className="text-xs text-brand-200 mt-0.5">{client?.contactPerson} · {client?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-brand-100 pb-2">
        {tabs.map(([v, l, I]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold transition ${
              tab === v ? 'bg-brand-600 text-white' : 'text-ink/60 hover:bg-brand-50'
            }`}
          >
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {/* Company info */}
      {tab === 'company' && (
        <div className="card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.company} onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors(clearError(errors, 'company')) }} />
              </div>
              {errors.company && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.company}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Industry</label>
              <input className="input" value={form.industry} onChange={(e) => { setForm({ ...form, industry: e.target.value }); setErrors(clearError(errors, 'industry')) }} />
              {errors.industry && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.industry}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Contact Person</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.contactPerson} onChange={(e) => { setForm({ ...form, contactPerson: e.target.value }); setErrors(clearError(errors, 'contactPerson')) }} />
              </div>
              {errors.contactPerson && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.contactPerson}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Phone *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors(clearError(errors, 'phone')) }} />
              </div>
              {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(clearError(errors, 'email')) }} />
              </div>
              {errors.email && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors(clearError(errors, 'address')) }} />
              </div>
              {errors.address && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.address}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Website</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="input pl-10" value={form.website} onChange={(e) => { setForm({ ...form, website: e.target.value }); setErrors(clearError(errors, 'website')) }} placeholder="https://company.com" />
              </div>
              {errors.website && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.website}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Tax ID (TIN)</label>
              <input className="input" value={form.taxId} onChange={(e) => { setForm({ ...form, taxId: e.target.value }); setErrors(clearError(errors, 'taxId')) }} placeholder="e.g. ET-ABC-2020-12345" />
              {errors.taxId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.taxId}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={saveCompany} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : <><CheckCircle2 size={16} /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Notification preferences */}
      {tab === 'notifications' && (
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Notification Preferences</p>
          <div className="space-y-3">
            {[
              ['budget', 'Budget Alerts', 'Get notified when budget thresholds are reached'],
              ['invoices', 'Invoice Notifications', 'Receive alerts when invoices are generated or paid'],
              ['documents', 'Document Uploads', 'Get notified when new documents are uploaded'],
              ['timeline', 'Timeline Updates', 'Receive alerts when event timeline stages are completed'],
              ['reminders', 'Event Reminders', 'Get reminders about upcoming event dates and deadlines'],
            ].map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-brand-100 p-4">
                <div>
                  <p className="text-sm font-bold text-brand-950">{title}</p>
                  <p className="text-xs text-ink/50">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })}
                  className={`relative h-6 w-11 rounded-full transition ${notifPrefs[key] ? 'bg-brand-600' : 'bg-ink/20'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notifPrefs[key] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => { patch('clientNotifPrefs', notifPrefs); logActivity('Client updated notification preferences', 'crm'); show('Notification preferences saved') }} className="btn-primary">
              <CheckCircle2 size={16} /> Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="space-y-5">
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Change Password</p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/60">Current Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="password" className="input pl-10" placeholder="••••••••" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/60">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input type="password" className="input pl-10" placeholder="••••••••" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} />
                </div>
              </div>
              <button onClick={() => { if (security.currentPassword) { patch('clientPasswordUpdated', true); logActivity('Client changed password', 'crm') } else { show('Enter your current password', 'warn'); return } setSecurity({ ...security, currentPassword: '', newPassword: '' }); show('Password changed successfully') }} className="btn-primary">
                <Lock size={16} /> Update Password
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-brand-950">Two-Factor Authentication</p>
                <p className="text-xs text-ink/50">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => { setSecurity({ ...security, twoFactor: !security.twoFactor }); patch('clientTwoFactor', !security.twoFactor); logActivity(`Client ${security.twoFactor ? 'disabled' : 'enabled'} two-factor auth`, 'crm'); show(security.twoFactor ? '2FA disabled' : '2FA enabled') }}
                className={`relative h-6 w-11 rounded-full transition ${security.twoFactor ? 'bg-brand-600' : 'bg-ink/20'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${security.twoFactor ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
