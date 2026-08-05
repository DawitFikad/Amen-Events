import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Ticket, Users, TrendingUp, ArrowRight, Sparkles,
  Mail, MousePointerClick, Eye, Tag,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress, PageHeader } from '../../components/ui'
import { fmtCompact } from '../../store/data'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

export default function MarketingDashboard() {
  const { state } = useData()
  const navigate = useNavigate()

  const campaigns = state.campaigns
  const coupons = state.coupons
  const registrations = state.registrations
  const clients = state.clients

  // Campaign performance
  const totalSent = campaigns.reduce((a, c) => a + (c.sent || 0), 0)
  const totalOpens = campaigns.reduce((a, c) => a + (c.opens || 0), 0)
  const totalClicks = campaigns.reduce((a, c) => a + (c.clicks || 0), 0)
  const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0

  // Leads — clients in early stages
  const leads = clients.filter((c) => c.stage === 'lead' || c.stage === 'opportunity' || c.stage === 'quotation')
  const leadValue = leads.reduce((a, c) => a + (c.totalValue || 0), 0)

  // Active coupons
  const activeCoupons = coupons.filter((c) => c.status === 'active')
  const expiredCoupons = coupons.filter((c) => c.status === 'expired')

  // Registration trend (mock from existing data)
  const regTrend = [
    { m: 'Feb', v: 120 }, { m: 'Mar', v: 180 }, { m: 'Apr', v: 240 },
    { m: 'May', v: 310 }, { m: 'Jun', v: 420 }, { m: 'Jul', v: 580 }, { m: 'Aug', v: 720 },
  ]

  // Campaign performance chart data
  const campaignData = campaigns.slice(0, 6).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    sent: c.sent || 0,
    opens: c.opens || 0,
    clicks: c.clicks || 0,
  }))

  const stats = [
    { label: 'Campaigns', value: campaigns.length, icon: Megaphone, tone: 'brand', sub: `${campaigns.filter(c => c.status === 'active').length} active`, delta: null },
    { label: 'Open Rate', value: `${openRate}%`, icon: Eye, tone: 'gold', sub: `${totalOpens.toLocaleString()} opens`, delta: '3%' },
    { label: 'Click Rate', value: `${clickRate}%`, icon: MousePointerClick, tone: 'brand', sub: `${totalClicks.toLocaleString()} clicks`, delta: '2%' },
    { label: 'Registrations', value: registrations.length, icon: Ticket, tone: 'brand', sub: 'total attendees', delta: '15%' },
    { label: 'Active Leads', value: leads.length, icon: Users, tone: 'gold', sub: `ETB ${fmtCompact(leadValue)} pipeline`, delta: null },
    { label: 'Active Coupons', value: activeCoupons.length, icon: Tag, tone: 'brand', sub: `${expiredCoupons.length} expired`, delta: null },
  ]

  return (
    <div>
      <PageHeader
        title="Marketing Overview"
        subtitle="Campaign performance, registrations, leads and coupon activity."
        icon={Sparkles}
        actions={
          <button className="btn-primary" onClick={() => navigate('/erp/marketing')}><Megaphone size={15} /> Marketing Module</button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Registration trend + campaign performance */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Registration Trend</p>
              <p className="text-xs text-ink/45">Monthly attendee registrations</p>
            </div>
            <span className="chip bg-brand-50 text-brand-800">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={regTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reg-mkt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a227" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#c9a227" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => [`${v} registrations`, 'Registrations']} />
              <Area type="monotone" dataKey="v" stroke="#c9a227" strokeWidth={2.5} fill="url(#reg-mkt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="font-bold text-brand-950 mb-3">Campaign Performance</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={campaignData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#122c1266' }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#122c1266' }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} />
              <Bar dataKey="opens" fill="#228b22" radius={[0, 4, 4, 0]} name="Opens" />
              <Bar dataKey="clicks" fill="#c9a227" radius={[0, 4, 4, 0]} name="Clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads + coupons */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Active Leads</p>
            <button onClick={() => navigate('/erp/crm')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">CRM <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {leads.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No active leads.</div>
            ) : (
              leads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                    {l.logo || l.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-950">{l.company}</p>
                    <p className="truncate text-[11px] text-ink/45">{l.industry} · {l.contactPerson}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-700">ETB {fmtCompact(l.totalValue || 0)}</p>
                    <Badge status={l.stage} label={l.stage} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Coupon Activity</p>
            <button onClick={() => navigate('/erp/marketing')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">All coupons <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {coupons.slice(0, 5).map((c) => {
              const usagePct = c.max > 0 ? Math.round((c.usage / c.max) * 100) : 0
              return (
                <div key={c.id} className="rounded-lg border border-brand-100 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-brand-600" />
                      <span className="font-mono text-sm font-bold text-brand-950">{c.code}</span>
                    </div>
                    <Badge status={c.status} label={c.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink/50">{c.type}: {c.value}</span>
                    <span className="text-ink/50">{c.usage}/{c.max} used</span>
                  </div>
                  <Progress value={usagePct} color={c.status === 'active' ? 'bg-brand-600' : 'bg-ink/30'} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Social campaign status */}
      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-brand-950">Campaign Status Overview</p>
          <Mail size={16} className="text-ink/35" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.slice(0, 6).map((c) => (
            <div key={c.id} className="rounded-xl border border-brand-100 p-4 hover:border-brand-300 hover:shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="chip bg-brand-50 text-brand-700 text-[10px]">{c.channel}</span>
                <Badge status={c.status} label={c.status} />
              </div>
              <p className="text-sm font-semibold text-brand-950">{c.name}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-black text-brand-950">{fmtCompact(c.sent || 0)}</p>
                  <p className="text-[10px] text-ink/45">Sent</p>
                </div>
                <div>
                  <p className="text-lg font-black text-brand-700">{fmtCompact(c.opens || 0)}</p>
                  <p className="text-[10px] text-ink/45">Opens</p>
                </div>
                <div>
                  <p className="text-lg font-black text-gold-700">{fmtCompact(c.clicks || 0)}</p>
                  <p className="text-[10px] text-ink/45">Clicks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
