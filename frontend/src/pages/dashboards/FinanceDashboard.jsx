import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowRight, Sparkles,
  CheckCircle2, Clock3, FileText, DollarSign,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import { StatCard, Badge, Progress, PageHeader } from '../../components/ui'
import { fmtCompact, fmt, revenueTrend } from '../../store/data'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts'

export default function FinanceDashboard() {
  const { state } = useData()
  const navigate = useNavigate()

  const invoices = state.invoices
  const expenses = state.expenses
  const events = state.events

  const totalRevenue = invoices.reduce((a, i) => a + i.paid, 0)
  const totalInvoiced = invoices.reduce((a, i) => a + i.amount, 0)
  const outstanding = invoices.filter((i) => i.status === 'outstanding').reduce((a, i) => a + (i.amount - i.paid), 0)
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)
  const profit = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

  // Cash flow data - revenue vs expenses by month
  const cashFlowData = revenueTrend.map((r) => ({
    m: r.m,
    revenue: r.v,
    expenses: Math.round(r.v * 0.65 + (Math.random() - 0.5) * 200),
  }))

  // Outstanding invoices list
  const outstandingInvoices = invoices
    .filter((i) => i.status === 'outstanding')
    .sort((a, b) => (b.amount - b.paid) - (a.amount - a.paid))
    .slice(0, 5)

  // Expense breakdown by category
  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})
  const expenseCategories = Object.entries(expenseByCategory)
    .map(([cat, amt]) => ({ cat, amt }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5)

  const stats = [
    { label: 'Total Revenue', value: `ETB ${fmtCompact(totalRevenue)}`, icon: TrendingUp, tone: 'brand', sub: 'collected', delta: '8%' },
    { label: 'Outstanding', value: `ETB ${fmtCompact(outstanding)}`, icon: AlertCircle, tone: 'red', sub: `${outstandingInvoices.length} invoices`, delta: null },
    { label: 'Total Expenses', value: `ETB ${fmtCompact(totalExpenses)}`, icon: TrendingDown, tone: 'gold', sub: 'all events', delta: null },
    { label: 'Net Profit', value: `ETB ${fmtCompact(Math.max(0, profit))}`, icon: Wallet, tone: 'brand', sub: `${margin}% margin`, delta: '5%' },
  ]

  return (
    <div>
      <PageHeader
        title="Financial Overview"
        subtitle="Revenue, expenses, outstanding payments and cash flow."
        icon={Sparkles}
        actions={
          <button className="btn-primary" onClick={() => navigate('/erp/finance')}><Wallet size={15} /> Finance Module</button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Cash flow chart */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-950">Cash Flow</p>
              <p className="text-xs text-ink/45">Revenue vs Expenses (ETB thousands)</p>
            </div>
            <span className="chip bg-brand-50 text-brand-800">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => `ETB ${v}K`} />
              <Bar dataKey="revenue" fill="#228b22" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#c9a227" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown */}
        <div className="card p-5">
          <p className="font-bold text-brand-950 mb-3">Expense Breakdown</p>
          <div className="space-y-3">
            {expenseCategories.length === 0 ? (
              <div className="py-4 text-center text-sm text-ink/40">No expenses recorded.</div>
            ) : (
              expenseCategories.map((c) => {
                const pct = totalExpenses > 0 ? Math.round((c.amt / totalExpenses) * 100) : 0
                return (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-ink/70">{c.cat || 'Uncategorized'}</span>
                      <span className="text-ink/50">{fmtCompact(c.amt)}</span>
                    </div>
                    <Progress value={pct} color="bg-gold-500" />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Outstanding payments + budget approvals */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Outstanding Payments</p>
            <button onClick={() => navigate('/erp/finance')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">All invoices <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {outstandingInvoices.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">All invoices settled.</div>
            ) : (
              outstandingInvoices.map((inv) => {
                const client = state.clients.find((c) => c.id === inv.clientId)
                const event = state.events.find((e) => e.id === inv.eventId)
                const remaining = inv.amount - inv.paid
                return (
                  <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
                      <FileText size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{client?.company || 'Unknown client'}</p>
                      <p className="truncate text-[11px] text-ink/45">{event?.name || 'No event'} · Due {inv.dueDate || 'TBD'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-700">ETB {fmtCompact(remaining)}</p>
                      <Badge status="outstanding" label="Pending" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-brand-950">Recent Expenses</p>
            <button onClick={() => navigate('/erp/finance')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">All expenses <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink/40">No expenses recorded.</div>
            ) : (
              expenses.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5).map((exp) => {
                const event = state.events.find((e) => e.id === exp.eventId)
                const vendor = state.vendors.find((v) => v.id === exp.vendorId)
                return (
                  <div key={exp.id} className="flex items-center gap-3 rounded-lg border border-brand-100 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <DollarSign size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{exp.category || 'Expense'}</p>
                      <p className="truncate text-[11px] text-ink/45">{event?.name || 'No event'} · {vendor?.name || 'No vendor'} · {exp.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-700">-ETB {fmtCompact(exp.amount)}</p>
                      <Badge status={exp.status || 'pending'} label={exp.status || 'pending'} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Revenue by event */}
      <div className="mt-5 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-brand-950">Revenue by Event</p>
          <button onClick={() => navigate('/erp/finance')} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">Full report <ArrowRight size={13} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-50/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Event</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Budget</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Spent</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Invoiced</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Collected</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-ink/60">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {events.slice(0, 6).map((e) => {
                const eventInvoices = invoices.filter((i) => i.eventId === e.id)
                const invoiced = eventInvoices.reduce((a, i) => a + i.amount, 0)
                const collected = eventInvoices.reduce((a, i) => a + i.paid, 0)
                return (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 text-sm font-semibold text-brand-950">{e.name}</td>
                    <td className="px-4 py-3 text-sm text-ink/60">{fmt(e.budget)}</td>
                    <td className="px-4 py-3 text-sm text-ink/60">{fmt(e.spent)}</td>
                    <td className="px-4 py-3 text-sm text-ink/60">{fmt(invoiced)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-700">{fmt(collected)}</td>
                    <td className="px-4 py-3"><Badge status={e.status} label={e.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
