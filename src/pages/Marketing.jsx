import React, { useState } from 'react'
import { Megaphone, Plus, Mail, MessageSquare, Send, Link2, Tag, TrendingUp, Globe } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, EmptyState, Th, Td, Modal, Field } from '../components/ui'

const coupons = [
  { id: 'cp1', code: 'SUMMIT20', type: 'Discount', value: '20%', usage: 142, max: 500, status: 'active' },
  { id: 'cp2', code: 'VIPFRIEND', type: 'Referral', value: '10%', usage: 38, max: 200, status: 'active' },
  { id: 'cp3', code: 'EARLYBIRD', type: 'Discount', value: '15%', usage: 500, max: 500, status: 'expired' },
]

const social = [
  { id: 'so1', platform: 'LinkedIn', followers: 18400, posts: 6, engagement: '4.2%' },
  { id: 'so2', platform: 'Instagram', followers: 32100, posts: 14, engagement: '5.8%' },
  { id: 'so3', platform: 'Twitter / X', followers: 9800, posts: 11, engagement: '2.9%' },
]

export default function Marketing() {
  const { state, addCampaign, addCoupon } = useData()
  const [view, setView] = useState('campaigns')
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(null) // 'campaign' | 'coupon'
  const [form, setForm] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const submitCampaign = () => {
    if (!form.name) { show('Campaign name is required', 'warn'); return }
    addCampaign(form)
    show(`Campaign "${form.name}" created (${form.channel || 'Email'})`)
    setOpen(null); setForm({})
  }

  const submitCoupon = () => {
    if (!form.code) { show('Coupon code is required', 'warn'); return }
    addCoupon(form)
    show(`Coupon ${form.code} generated`)
    setOpen(null); setForm({})
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
        actions={<button className="btn-primary" onClick={() => setOpen('campaign')}><Plus size={15} /> New Campaign</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total Sent', totalSent, 'messages'], ['Open Rate', Math.round((totalOpens / (totalSent || 1)) * 100) + '%', 'average'], ['Active Coupons', coupons.filter((c) => c.status === 'active').length, 'promo codes'], ['Social Reach', '60K+', 'followers']].map(([l, v, s]) => (
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
            const channelIcon = c.channel === 'Email' ? <Mail size={14} /> : c.channel === 'SMS' ? <Send size={14} /> : <MessageSquare size={14} />
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">{channelIcon} {c.channel}</span>
                  <Badge status={c.status} label={c.status} />
                </div>
                <h3 className="mt-3 font-bold text-brand-950">{c.name}</h3>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-brand-950">{c.sent.toLocaleString()}</p>
                    <p className="text-xs text-ink/40">of {c.audience.toLocaleString()} audience</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-700">{c.opens ? rate + '%' : '—'}</p>
                    <p className="text-xs text-ink/40">open rate</p>
                  </div>
                </div>
                <Progress value={c.audience ? (c.sent / c.audience) * 100 : 0} className="mt-3" />
                <button className="btn-outline w-full !py-1.5 text-xs mt-3" onClick={() => show(`Opened ${c.name} report`)}>View Report</button>
              </div>
            )
          })}
        </div>
      )}

      {view === 'coupons' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-sm text-ink/55">{coupons.length} promo codes</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => setOpen('coupon')}><Plus size={14} /> Generate Coupon</button>
          </div>
          <table className="w-full">
            <thead className="bg-brand-50/50"><tr><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Usage</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {coupons.map((c) => (
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
            ].map(([name, desc, I, cls, on]) => (
              <div key={name} className="flex items-center gap-4 rounded-xl border border-brand-100 p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><I size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-950">{name}</p>
                  <p className="text-xs text-ink/45">{desc}</p>
                </div>
                <span className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${on ? 'bg-brand-700' : 'bg-brand-100'}`}
                  onClick={() => show(`${name} ${on ? 'disabled' : 'enabled'}`, 'info')}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={open === 'campaign'} onClose={() => setOpen(null)} title="New Campaign">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Campaign Name *" className="col-span-2"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Post-Expo Follow-up" /></Field>
          <Field label="Channel"><select className="input" value={form.channel || 'Email'} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option><option>WhatsApp</option></select></Field>
          <Field label="Audience Size"><input type="number" className="input" value={form.audience || ''} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="5000" /></Field>
          <Field label="Status"><select className="input" value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="sending">Sending</option><option value="sent">Sent</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitCampaign}>Create Campaign</button>
        </div>
      </Modal>

      <Modal open={open === 'coupon'} onClose={() => setOpen(null)} title="Generate Coupon">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coupon Code *"><input className="input" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMIT20" /></Field>
          <Field label="Value"><input className="input" value={form.value || '10%'} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="15%" /></Field>
          <Field label="Type"><select className="input" value={form.type || 'Discount'} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Discount</option><option>Referral</option></select></Field>
          <Field label="Max Uses"><input type="number" className="input" value={form.max || 500} onChange={(e) => setForm({ ...form, max: e.target.value })} /></Field>
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