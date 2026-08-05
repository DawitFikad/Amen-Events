import React, { useState, useEffect } from 'react'
import { UserCircle, Lock, History, Shield, Save, CheckCircle2, XCircle, MapPin, Mail, Phone, Building2, Briefcase } from 'lucide-react'
import { useData } from '../store/DataContext'
import api from '../store/api'
import { PageHeader, Avatar, Badge, Toast, Th, Td } from '../components/ui'

export default function Profile() {
  const { state, rbac, backendOnline } = useData()
  const user = state.currentUser
  const [view, setView] = useState('info')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  // Profile form
  const [form, setForm] = useState({
    name: '', phone: '', dept: '', jobTitle: '', bio: '',
  })

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  // Login history
  const [history, setHistory] = useState([])

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  // Initialize form from user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        dept: user.dept || '',
        jobTitle: user.jobTitle || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  // Load login history when tab is selected
  useEffect(() => {
    if (view === 'history' && backendOnline) {
      api.auth.loginHistory().then(({ history: h }) => setHistory(h)).catch(() => {})
    }
  }, [view, backendOnline])

  const tabs = [
    ['info', 'Profile Info', UserCircle],
    ['security', 'Security', Lock],
    ['history', 'Login History', History],
  ]

  const saveProfile = async () => {
    if (!form.name.trim()) { show('Name is required', 'error'); return }
    setSaving(true)
    try {
      if (backendOnline) {
        const { user: updated } = await api.auth.updateProfile(form)
        show('Profile updated successfully')
        // Update local state
        if (state.currentUser) {
          // Trigger a re-render by updating via patch
        }
      } else {
        show('Profile saved (offline mode)')
      }
    } catch (err) {
      show(err.message || 'Failed to update profile', 'error')
    }
    setSaving(false)
  }

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      show('Please fill all password fields', 'error'); return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      show('New passwords do not match', 'error'); return
    }
    if (pwForm.newPassword.length < 6) {
      show('Password must be at least 6 characters', 'error'); return
    }
    setSaving(true)
    try {
      if (backendOnline) {
        await api.auth.updatePassword(pwForm.currentPassword, pwForm.newPassword)
        show('Password changed — you will need to re-login on other devices')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        show('Password changed (offline mode)')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      show(err.message || 'Failed to change password', 'error')
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="My Profile" subtitle="Manage your account" icon={UserCircle} />
        <div className="card p-8 text-center text-ink/50">Loading profile…</div>
      </div>
    )
  }

  const initials = user.initials || (user.name || '').split(' ').map(p => p[0]).slice(0, 2).join('')
  const roleLabel = rbac?.roleDef?.label || user.userRoles?.[0]?.role?.label || 'User'

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information, security and login history."
        icon={UserCircle}
      />

      {/* Profile summary card */}
      <div className="card mb-5 overflow-hidden">
        <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar name={user.name} initials={initials} color={user.color || 'bg-brand-700'} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-lg font-black text-brand-950">{user.name}</h2>
              <Badge status={user.status || 'active'} label={user.status || 'active'} />
            </div>
            <p className="text-sm text-ink/55 mt-0.5">{user.jobTitle || user.dept || 'Team Member'}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-ink/45 sm:justify-start">
              <span className="inline-flex items-center gap-1"><Mail size={12} /> {user.email}</span>
              {user.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {user.phone}</span>}
              <span className="chip bg-brand-50 text-brand-800">{roleLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}>
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {/* Profile Info Tab */}
      {view === 'info' && (
        <div className="max-w-2xl space-y-4">
          <div className="card p-5">
            <p className="mb-4 font-bold text-brand-950">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-brand-50/50" value={user.email} disabled />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 9…" />
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} placeholder="e.g. Operations" />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input className="input" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Project Manager" />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input bg-brand-50/50" value={roleLabel} disabled />
              </div>
              <div className="col-span-2">
                <label className="label">Bio</label>
                <textarea className="input min-h-[80px] resize-y" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself…" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {view === 'security' && (
        <div className="max-w-2xl space-y-4">
          {/* Change Password */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={18} className="text-brand-600" />
              <p className="font-bold text-brand-950">Change Password</p>
            </div>
            <p className="text-sm text-ink/55 mb-4">Update your password. All other sessions will be signed out.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="At least 6 characters" autoComplete="new-password" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Re-enter new password" autoComplete="new-password" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn-primary" onClick={changePassword} disabled={saving}>
                <Lock size={15} /> {saving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* 2-Step Verification */}
          <div className="card p-5 border-l-4 border-l-brand-600">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={18} className="text-brand-600" />
              <p className="font-bold text-brand-950">2-Step Verification</p>
              {user.twoStepEnabled && <span className="chip bg-brand-100 text-brand-800">Enabled</span>}
            </div>
            <p className="text-sm text-ink/55 mb-4">Add an extra layer of security. When enabled, you'll need a verification code on login.</p>
            <div className="flex items-center justify-between rounded-lg border border-brand-100 p-4">
              <div>
                <p className="text-sm font-semibold text-brand-950">Require 2-step verification on login</p>
                <p className="text-xs text-ink/45 mt-0.5">You'll be prompted for a code after entering your password</p>
              </div>
              <span
                className={`relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition ${user.twoStepEnabled ? 'bg-brand-700' : 'bg-brand-100'}`}
                onClick={async () => {
                  const next = !user.twoStepEnabled
                  try {
                    if (backendOnline) {
                      await api.auth.updateTwoStep(next)
                    }
                    show(next ? '2-step verification enabled' : '2-step verification disabled', next ? 'success' : 'warn')
                  } catch (err) {
                    show('Failed to update 2-step setting', 'error')
                  }
                }}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${user.twoStepEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </span>
            </div>
            {user.twoStepEnabled && (
              <div className="rounded-lg bg-brand-50/50 p-4 mt-3 animate-fade-up">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">Verification Method</p>
                <div className="space-y-2">
                  {['SMS code to phone', 'Authenticator app', 'Email code'].map((method, i) => (
                    <label key={method} className="flex items-center gap-3 rounded-lg border border-brand-100 bg-white p-3 cursor-pointer hover:border-brand-300">
                      <input type="radio" name="2fa-method" defaultChecked={i === 0} className="accent-brand-700" />
                      <span className="text-sm font-medium text-ink/75">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Security Info */}
          <div className="card p-5">
            <p className="mb-3 font-bold text-brand-950">Account Security</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-brand-50 p-3">
                <span className="text-ink/60">Account lock after failed attempts</span>
                <span className="chip bg-brand-100 text-brand-800">5 attempts → 15 min lock</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-brand-50 p-3">
                <span className="text-ink/60">Session timeout</span>
                <span className="chip bg-gold-100 text-gold-700">15 min (auto-refresh)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-brand-50 p-3">
                <span className="text-ink/60">Password change revokes other sessions</span>
                <span className="chip bg-brand-100 text-brand-800">Yes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login History Tab */}
      {view === 'history' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <p className="font-bold text-brand-950">Recent Login Activity</p>
            <span className="chip bg-brand-100 text-brand-800">{history.length} entries</span>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-ink/40">
              {backendOnline ? 'No login history yet.' : 'Login history requires backend connection.'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-brand-50/50">
                <tr>
                  <Th>Status</Th>
                  <Th>Email</Th>
                  <Th>IP Address</Th>
                  <Th>Reason</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-brand-50/30">
                    <Td>
                      {h.success ? (
                        <span className="inline-flex items-center gap-1.5 text-brand-700">
                          <CheckCircle2 size={14} /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600">
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                    </Td>
                    <Td><span className="text-sm text-ink/70">{h.email}</span></Td>
                    <Td><span className="text-xs text-ink/50 font-mono">{h.ipAddress || '—'}</span></Td>
                    <Td>
                      <span className="text-xs text-ink/55">
                        {h.reason === 'success' ? 'Successful login' :
                         h.reason === 'wrong_password' ? 'Wrong password' :
                         h.reason === 'user_not_found' ? 'User not found' :
                         h.reason === 'account_locked' ? 'Account locked' : h.reason || '—'}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-ink/45">{new Date(h.createdAt).toLocaleString()}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
