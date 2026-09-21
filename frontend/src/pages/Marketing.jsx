import React, { useState, useEffect } from 'react'
import { Megaphone, Plus, Mail, MessageSquare, Send, Link2, Tag, TrendingUp, Globe, Pencil, CalendarDays, FileText } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, EmptyState, Th, Td, Modal, Field } from '../components/ui'
import { exportPDF } from '../store/exportUtils'
import { textRequired, numberPositive, optional, validate } from '../store/validation'

const social = [
  { id: 'so1', platform: 'LinkedIn', followers: 18400, posts: 6, engagement: '4.2%' },
  { id: 'so2', platform: 'Instagram', followers: 32100, posts: 14, engagement: '5.8%' },
  { id: 'so3', platform: 'Twitter / X', followers: 9800, posts: 11, engagement: '2.9%' },
]

const channelDefaults = {
  'Email Notifications': true,
  'SMS Notifications': true,
  'WhatsApp Notifications': true,
  'Social Media Links': true,
}

export default function Marketing() {
  const { state, patch, addCampaign, updateCampaign, addCoupon, logActivity, intent, clearIntent } = useData()
  const [view, setView] = useState('campaigns')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(null) // 'campaign' | 'coupon'
  const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [channels, setChannels] = useState({ ...channelDefaults, ...(state.channelSettings || {}) })

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const campaignSchema = {
    name: [textRequired('Campaign name', { min: 3, max: 120 })],
    audience: [optional(numberPositive('Audience size', { integer: true }))],
  }
  const couponSchema = {
    code: [textRequired('Coupon code', { min: 4, max: 30 })],
    value: [textRequired('Value', { min: 1, max: 20 })],
    max: [optional(numberPositive('Max uses', { integer: true }))],
  }

  const openCampaign = (c) => {
    setEditId(c ? c.id : null)
    setForm(c ? { name: c.name || '', channel: c.channel || 'Email', audience: c.audience ?? '', status: c.status || 'draft', schedule: c.schedule || '', description: c.description || '' } : {})
    setErrors({}); setOpen('campaign')
  }

  useEffect(() => {
    if (intent === 'new-campaign') {
      if (state.demo.autoplay) {
        const seed = { name: 'Summer Summit Promo', channel: 'Email', audience: '50000', status: 'draft', schedule: '2026-09-01', description: 'Early-bird campaign for the 2026 summit' }
        setView('campaigns'); setForm(seed); openCampaign(); setErrors({})
        setTimeout(() => {
          const rec = addCampaign(seed)
          show(`Campaign "${rec?.name || seed.name}" created automatically`); setOpen(null); setForm({})
        }, 1100)
      } else { setView('campaigns'); openCampaign() }
      clearIntent()
    }
    if (intent === 'new-coupon') {
      if (state.demo.autoplay) {
        const seed = { code: 'SUMMIT20', value: '20% off', max: '500' }
        setView('coupons'); setForm(seed); setErrors({}); setOpen('coupon')
        setTimeout(() => {
          addCoupon(seed)
          show(`Coupon ${seed.code} generated automatically`); setOpen(null); setForm({})
        }, 1100)
      } else { setView('coupons'); setForm({}); setErrors({}); setOpen('coupon') }
      clearIntent()
    }
  }, [intent])

  const submitCampaign = () => {
    const res = validate(form, campaignSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    if (editId) {
      updateCampaign(editId, form)
      show(`Campaign "${form.name}" updated`)
    } else {
      addCampaign(form)
      show(`Campaign "${form.name}" created (${form.channel || 'Email'})`)
    }
    setOpen(null); setForm({}); setErrors({}); setEditId(null)
  }

  const submitCoupon = () => {
    const res = validate(form, couponSchema)
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    addCoupon(form)
    show(`Coupon ${form.code} generated`)
    setOpen(null); setForm({}); setErrors({})
  }

  const viewReport = (c) => {
    exportPDF(`Campaign Report - ${c.name}`, [
      { title: 'Campaign', text: `${c.name} via ${c.channel}` },
      { title: 'Delivery', rows: { headers: ['Metric', 'Value'], rows: [['Audience', c.audience.toLocaleString()], ['Sent', c.sent.toLocaleString()], ['Opens', c.opens || 0], ['Open Rate', c.opens ? Math.round((c.opens / c.sent) * 100) + '%' : '-']] } },
    ])
    logActivity(`Opened report for campaign "${c.name}"`, 'marketing')
    show(`Report opened for ${c.name}`)
  }

  const sent = state.campaigns.filter((c) => c.status === 'sent' || c.status === 'sending')
  const totalSent = sent.reduce((a, c) => a + c.sent, 0)
  const totalOpens = state.campaigns.reduce((a, c) => a + (c.opens || 0), 0)

  return (
    <div>
      <PageHeader
        title="Marketing Module"
        subtitle="Email, SMS and WhatsApp campaigns with coupon management."
        icon={Megaphone}
        actions={<button className="btn-primary" onClick={() => openCampaign(null)}><Plus size={15} /> New Campaign</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total Sent', totalSent, 'messages'], ['Open Rate', Math.round((totalOpens / (totalSent || 1)) * 100) + '%', 'average'], ['Active Coupons', state.coupons.filter((c) => c.status === 'active').length, 'promo codes'], ['Social Reach', '60K+', 'followers']].map(([l, v, s]) => (
          <div key={l} className="card p-4"><p className="text-[13px] font-semibold text-ink/55">{l}</p><p className="mt-1 text-xl font-black text-brand-950">{v}</p><p className="text-xs text-ink/40">{s}</p></div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['campaigns', 'Campaigns', Mail], ['coupons', 'Coupons', Tag], ['social', 'Social Media', Link2], ['channels', 'Notification Channels', Send]].map(([v, l, I]) => (
          <button key={v} onClick={() => setView(v)} className={`tab ${view === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {view === 'campaigns' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {state.campaigns.map((c) => {
            const rate = c.opens ? Math.round((c.opens / c.sent) * 100) : 0
            const channelIcon = c.channel === 'Email' ? <Mail size={14} /> : c.channel === 'SMS' ? <Send size={14} /> : <MessageSquare size={15} />
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">{channelIcon} {c.channel}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge status={c.status} label={c.status} />
                    <button onClick={() => openCampaign(c)} className="btn-ghost !p-1.5 text-ink/40 hover:text-brand-700" title="Edit campaign"><Pencil size={14} /></button>
                  </div>
                </div>
                <h3 className="mt-3 font-bold text-brand-950">{c.name}</h3>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-ink/50">{c.description}</p>}
                {c.schedule && <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink/40"><CalendarDays size={11} /> {c.status === 'draft' ? 'Scheduled' : 'Launched'} {c.schedule}</p>}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-brand-950">{c.sent.toLocaleString()}</p>
                    <p className="text-xs text-ink/40">of {c.audience.toLocaleString()} audience</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-700">{c.opens ? rate + '%' : '-'}</p>
                    <p className="text-xs text-ink/40">open rate</p>
                  </div>
                </div>
                <Progress value={c.audience ? (c.sent / c.audience) * 100 : 0} className="mt-3" />
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={() => viewReport(c)}>View Report</button>
                  <button className="btn-ghost !py-1.5 text-xs" onClick={() => { logActivity(`Campaign "${c.name}" duplicated`, 'marketing'); show(`Campaign "${c.name}" duplicated`) }}><FileText size={13} /> Copy</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'coupons' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-sm text-ink/55">{state.coupons.length} promo codes</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setErrors({}); setOpen('coupon') }}><Plus size={14} /> Generate Coupon</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead className="bg-brand-50/50"><tr><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Usage</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {state.coupons.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <Td><span className="rounded-md bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-800">{c.code}</span></Td>
                  <Td className="text-ink/60">{c.type}</Td>
                  <Td className="font-semibold text-brand-950">{c.value}</Td>
                  <Td className="text-ink/60">{c.usage}/{c.max} uses</Td>
                  <Td><Badge status={c.status} label={c.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {view === 'social' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {social.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-brand-950"><Globe size={16} className="text-brand-600" /> {s.platform}</span>
                <Badge status="active" label="Connected" />
              </div>
              <p className="mt-3 text-2xl font-black text-brand-950">{s.followers.toLocaleString()}</p>
              <p className="text-xs text-ink/40">followers</p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 p-3 text-xs">
                <span className="text-ink/55">{s.posts} posts</span>
                <span className="flex items-center gap-1 font-bold text-brand-700"><TrendingUp size={12} /> {s.engagement}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'channels' && (
        <div className="card p-5">
          <div className="space-y-3">
            {[
              ['Email Notifications', 'Transactional & campaign emails', Mail, 'bg-brand-100 text-brand-700', true],
              ['SMS Notifications', 'Event reminders, check-in alerts', Send, 'bg-gold-100 text-gold-700', true],
              ['WhatsApp Notifications', 'VIP invites & confirmations', MessageSquare, 'bg-sky-100 text-sky-700', true],
              ['Social Media Links', 'Broadcast on social pages', Link2, 'bg-violet-100 text-violet-700', true],
            ].map(([name, desc, I, cls]) => {
              const on = channels[name]
              return (
                <div key={name} className="flex items-center gap-4 rounded-xl border border-brand-100 p-4">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><I size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-950">{name}</p>
                    <p className="text-xs text-ink/45">{desc}</p>
                  </div>
                  <span className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${on ? 'bg-brand-700' : 'bg-brand-100'}`}
                    onClick={() => {
                      const next = { ...channels, [name]: !on }
                      setChannels(next)
                      patch('channelSettings', next)
                      logActivity(`Channel "${name}" ${next[name] ? 'enabled' : 'disabled'}`, 'marketing')
                      show(`${name} ${next[name] ? 'enabled' : 'disabled'}`, next[name] ? 'success' : 'warn')
                    }}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={open === 'campaign'} onClose={() => { setOpen(null); setEditId(null) }} title={editId ? 'Edit Campaign' : 'Create Campaign'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Campaign Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Post-Expo Follow-up" />{errors.name && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.name}</p>}</Field>
          <Field label="Channel"><select className="input" value={form.channel || 'Email'} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option><option>WhatsApp</option><option>Telegram</option><option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>TikTok</option><option>X (Twitter)</option><option>YouTube</option><option>Radio</option><option>TV</option><option>Print</option><option>Outdoor Billboards</option><option>Other</option></select></Field>
          <Field label="Audience Size"><input type="number" className="input" value={form.audience ?? ''} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="5000" />{errors.audience && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.audience}</p>}</Field>
          <Field label="Schedule Date"><input type="date" className="input" value={form.schedule || ''} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="sending">Sending</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="completed">Completed</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="Other">Other</option></select></Field>
          <Field label="Description" className="col-span-2"><textarea className="input min-h-[70px] resize-y" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Goal, audience, message summary…" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => { setOpen(null); setEditId(null) }}>Cancel</button>
          <button className="btn-primary" onClick={submitCampaign}>{editId ? 'Save Changes' : 'Create Campaign'}</button>
        </div>
      </Modal>

      <Modal open={open === 'coupon'} onClose={() => setOpen(null)} title="Generate Coupon">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coupon Code *"><input className="input" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMIT20" />{errors.code && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.code}</p>}</Field>
          <Field label="Value *"><input className="input" value={form.value || '10%'} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="15%" />{errors.value && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.value}</p>}</Field>
          <Field label="Type"><select className="input" value={form.type || 'Discount'} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Discount</option><option>Referral</option><option>Gift Card</option><option>Early Bird</option><option>Group Booking</option><option>VIP Upgrade</option><option>Cashback</option><option>Other</option></select></Field>
          <Field label="Max Uses"><input type="number" className="input" value={form.max || 500} onChange={(e) => setForm({ ...form, max: e.target.value })} />{errors.max && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.max}</p>}</Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitCoupon}>Generate Coupon</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}