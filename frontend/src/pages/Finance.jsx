import React, { useState, useMemo, useEffect } from 'react'
import {
  Wallet, Plus, FileText, TrendingUp, TrendingDown, Download,
  DollarSign, Users, BarChart3, ClipboardList, CheckCircle2,
  XCircle, Clock, AlertTriangle, Pencil, Eye, ChevronDown,
  ChevronRight, RefreshCw, CreditCard, Receipt, Building2,
  UserCheck, CalendarDays, ArrowUpRight, ArrowDownRight,
  Layers, PieChart, ShieldCheck, Send, BriefcaseBusiness,
} from 'lucide-react'
import { useData } from '../store/DataContext'
import {
  PageHeader, Badge, Toast, Modal, Field, EmptyState,
  Th, Td, Progress, SkeletonPage,
} from '../components/ui'
import { fmt, todayISO } from '../store/data'
import { exportTableToPDF } from '../store/exportUtils'
import { numberPositive, textRequired, required, dateRequired, validate } from '../store/validation'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area, LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SALARY_GRADES = ['Grade 1 – Entry', 'Grade 2 – Junior', 'Grade 3 – Mid-Level', 'Grade 4 – Senior', 'Grade 5 – Lead', 'Grade 6 – Manager', 'Grade 7 – Director', 'Grade 8 – Executive']
const PIE_COLORS = ['#188A2E', '#39D353', '#D4AF37', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899']

function StatCard({ label, value, icon: Icon, tone = 'brand', sub }) {
  const toneMap = {
    brand: 'bg-brand-100 text-brand-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">{label}</p>
          <p className={`mt-2 text-2xl font-black tracking-tight ${tone === 'red' ? 'text-red-700' : tone === 'amber' ? 'text-amber-700' : tone === 'emerald' ? 'text-emerald-700' : tone === 'purple' ? 'text-purple-700' : 'text-brand-900'}`}>{value}</p>
          {sub && <p className="mt-1 text-[11px] text-ink/40">{sub}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneMap[tone] || toneMap.brand}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ title, count, onAdd, addLabel, onExport }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-100 p-4">
      <span className="text-sm font-semibold text-ink/60">{count !== undefined ? `${count} records` : title}</span>
      <div className="flex gap-2">
        {onExport && <button className="btn-outline !py-1.5 text-xs" onClick={onExport}><Download size={13} /> Export PDF</button>}
        {onAdd && <button className="btn-primary !py-1.5 text-xs" onClick={onAdd}><Plus size={14} /> {addLabel || 'Add'}</button>}
      </div>
    </div>
  )
}

export default function Finance() {
  const {
    state, recordExpense, recordPayment, addInvoice,
    intent, clearIntent, addPurchaseRequest, setPurchaseRequestStatus,
    logActivity, loading,
  } = useData()
  if (loading) return <SkeletonPage />

  const [tab, setTab] = useState('overview')
  const [open, setOpen] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [salaryForm, setSalaryForm] = useState({})
  const [prForm, setPrForm] = useState({})
  const [errors, setErrors] = useState({})
  // Local salary records (per session, attached to staff from state)
  const [salaryRecords, setSalaryRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('amen_salary_records') || '[]') } catch { return [] }
  })

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2800) }

  const saveSalary = (records) => {
    setSalaryRecords(records)
    try { localStorage.setItem('amen_salary_records', JSON.stringify(records)) } catch {}
  }

  useEffect(() => {
    if (intent === 'finance') {
      setTab('overview')
      clearIntent()
    }
  }, [intent])

  // ── Computed Totals ──────────────────────────────────────────────
  const revenue = state.invoices.reduce((a, i) => a + (i.paid || 0), 0)
  const expected = state.invoices.reduce((a, i) => a + (i.amount || 0), 0)
  const outstanding = expected - revenue
  const expenses = state.expenses.reduce((a, e) => a + (e.amount || 0), 0)
  const totalSalaries = salaryRecords.filter(s => s.status === 'paid').reduce((a, s) => a + (Number(s.net) || 0), 0)
  const pendingSalaries = salaryRecords.filter(s => s.status === 'pending').reduce((a, s) => a + (Number(s.net) || 0), 0)
  const profit = revenue - expenses - totalSalaries
  const purchaseRequests = state.purchaseRequests || []

  // ── Monthly Chart Data ──────────────────────────────────────────
  const monthly = MONTH_LABELS.map((m, idx) => {
    const rev = state.invoices.filter(i => i.createdAt && new Date(i.createdAt).getMonth() === idx).reduce((a, i) => a + i.paid, 0)
    const exp = state.expenses.filter(e => e.createdAt && new Date(e.createdAt).getMonth() === idx).reduce((a, e) => a + e.amount, 0)
    return { m, rev: Math.round(rev / 1000), exp: Math.round(exp / 1000) }
  }).filter(d => d.rev > 0 || d.exp > 0)

  // ── Expense Category Pie ─────────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const map = {}
    state.expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [state.expenses])

  // ── Per-Event Budget ─────────────────────────────────────────────
  const eventBudgets = useMemo(() => {
    return state.events.map(ev => {
      const eventExpenses = state.expenses.filter(e => e.eventId === ev.id).reduce((a, e) => a + e.amount, 0)
      const eventRevenue = state.invoices.filter(i => i.eventId === ev.id).reduce((a, i) => a + i.paid, 0)
      const budget = Number(ev.budget) || 0
      const utilization = budget > 0 ? Math.min(100, Math.round((eventExpenses / budget) * 100)) : 0
      const client = state.clients.find(c => c.id === ev.clientId)
      return { ...ev, eventExpenses, eventRevenue, utilization, clientName: client?.company || '—' }
    }).sort((a, b) => b.budget - a.budget)
  }, [state.events, state.expenses, state.invoices, state.clients])

  // ── Handlers ────────────────────────────────────────────────────
  const submitExpense = () => {
    const res = validate(form, {
      amount: [numberPositive('Amount')],
      eventId: [required('Event')],
      category: [required('Category')],
      date: [dateRequired('Date')],
    })
    if (!res.ok) { setErrors(res.errors); show(res.first || 'Please fill out this field', 'warn'); return }
    recordExpense({ ...form, amount: Number(form.amount), date: form.date || todayISO() })
    logActivity(`Expense recorded: ETB ${fmt(Number(form.amount))} – ${form.category}`, 'finance')
    show('Expense recorded')
    setOpen(null); setForm({}); setErrors({})
  }

  const submitPayment = () => {
    const res = validate(form, { amount: [numberPositive('Amount')], invoiceId: [required('Invoice')] })
    if (!res.ok) { setErrors(res.errors); show(res.first || 'Please fill out this field', 'warn'); return }
    recordPayment(form.invoiceId, Number(form.amount))
    logActivity(`Payment of ETB ${fmt(Number(form.amount))} recorded for invoice ${form.invoiceId}`, 'finance')
    show(`Payment of ${fmt(Number(form.amount))} recorded`)
    setOpen(null); setForm({}); setErrors({})
  }

  const submitInvoice = () => {
    const res = validate(form, {
      amount: [numberPositive('Amount')],
      clientId: [required('Client')],
      eventId: [required('Event')],
      dueDate: [dateRequired('Due date')],
    })
    if (!res.ok) { setErrors(res.errors); show(res.first || 'Please fill out this field', 'warn'); return }
    addInvoice({ ...form, ref: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)), paid: 0 })
    logActivity(`Invoice issued for client ${state.clients.find(c => c.id === form.clientId)?.company || form.clientId}`, 'finance')
    show('Invoice issued')
    setOpen(null); setForm({}); setErrors({})
  }

  const submitSalary = () => {
    if (!salaryForm.staffId) { show('Please select a staff member', 'warn'); return }
    if (!salaryForm.month) { show('Please fill out this field: Month', 'warn'); return }
    if (!salaryForm.gross || Number(salaryForm.gross) <= 0) { show('Please fill out this field: Gross Salary', 'warn'); return }
    const gross = Number(salaryForm.gross)
    const tax = Math.round(gross * 0.30)
    const pension = Math.round(gross * 0.07)
    const net = gross - tax - pension - (Number(salaryForm.deductions) || 0) + (Number(salaryForm.bonus) || 0)
    const rec = {
      id: 'sal-' + Date.now(),
      staffId: salaryForm.staffId,
      month: salaryForm.month,
      grade: salaryForm.grade || 'Grade 3 – Mid-Level',
      gross,
      tax,
      pension,
      bonus: Number(salaryForm.bonus) || 0,
      deductions: Number(salaryForm.deductions) || 0,
      net: Math.max(0, net),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    const updated = [rec, ...salaryRecords]
    saveSalary(updated)
    logActivity(`Salary record created for ${state.staff.find(s => s.id === salaryForm.staffId)?.name || salaryForm.staffId} – ${salaryForm.month}`, 'finance')
    show('Salary record created — pending approval')
    setOpen(null); setSalaryForm({}); setErrors({})
  }

  const approveSalary = (id) => {
    const updated = salaryRecords.map(s => s.id === id ? { ...s, status: 'paid', paidAt: new Date().toISOString() } : s)
    saveSalary(updated)
    show('Salary approved and marked as paid')
  }

  const rejectSalary = (id) => {
    const updated = salaryRecords.map(s => s.id === id ? { ...s, status: 'rejected' } : s)
    saveSalary(updated)
    show('Salary record rejected')
  }

  const exportAll = () => {
    const cName = id => state.clients.find(c => c.id === id)?.company || '—'
    const eName = id => state.events.find(e => e.id === id)?.name || '—'
    exportTableToPDF('financial-invoices', 'Financial Report: Invoices',
      ['Ref', 'Client', 'Event', 'Amount (ETB)', 'Paid (ETB)', 'Outstanding (ETB)', 'Status'],
      state.invoices.map(i => [i.ref, cName(i.clientId), eName(i.eventId), i.amount, i.paid, i.amount - i.paid, i.status]),
      { rightAlignCols: [3, 4, 5] })
    exportTableToPDF('financial-expenses', 'Financial Report: Expenses',
      ['Event', 'Category', 'Date', 'Amount (ETB)'],
      state.expenses.map(e => [eName(e.eventId), e.category, e.date, e.amount]),
      { rightAlignCols: [3] })
    show('Reports exported to PDF')
  }

  const exportSalary = () => {
    exportTableToPDF('hr-payroll-report', 'HR Payroll Report',
      ['Staff', 'Month', 'Grade', 'Gross (ETB)', 'Tax (ETB)', 'Pension (ETB)', 'Bonus (ETB)', 'Net Pay (ETB)', 'Status'],
      salaryRecords.map(s => [
        state.staff.find(x => x.id === s.staffId)?.name || s.staffId,
        s.month, s.grade, s.gross, s.tax, s.pension, s.bonus, s.net, s.status,
      ]),
      { rightAlignCols: [3, 4, 5, 6, 7] })
    show('Payroll report exported to PDF')
  }

  // ── Finance activity feed from state ─────────────────────────────
  const financeActivities = useMemo(() => {
    return (state.activities || []).filter(a => {
      const txt = (a.text || '').toLowerCase()
      return txt.includes('invoice') || txt.includes('expense') || txt.includes('payment') || txt.includes('salary') || a.type === 'finance'
    }).slice(0, 40)
  }, [state.activities])

  const tabs = [
    ['overview', 'Overview', PieChart],
    ['invoices', 'Invoices', FileText],
    ['expenses', 'Expenses', TrendingDown],
    ['budget', 'Event Budgets', BarChart3],
    ['salary', 'HR Payroll', Users],
    ['purchase', 'Purchase Requests', ClipboardList],
    ['activity', 'Activity Log', Clock],
  ]

  return (
    <div>
      <PageHeader
        title="Financial Control Center"
        subtitle="Comprehensive financial oversight — invoices, expenses, payroll, event budgets, and full activity audit."
        icon={Wallet}
        actions={
          <>
            <button className="btn-outline" onClick={exportAll}><Download size={14} /> Export PDF</button>
            <button className="btn-primary" onClick={() => { setErrors({}); setOpen('expense') }}><Plus size={14} /> Record Expense</button>
          </>
        }
      />

      {/* Tab Bar */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map(([v, l, I]) => (
          <button key={v} onClick={() => setTab(v)} className={`tab ${tab === v ? 'tab-active' : 'tab-idle'}`}>
            <I size={14} /> {l}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-5">
            <StatCard label="Total Revenue" value={fmt(revenue)} icon={TrendingUp} tone="brand" sub={`from ${state.invoices.length} invoices`} />
            <StatCard label="Outstanding" value={fmt(outstanding)} icon={AlertTriangle} tone="amber" sub="receivables due" />
            <StatCard label="Total Expenses" value={fmt(expenses)} icon={TrendingDown} tone="red" sub={`${state.expenses.length} transactions`} />
            <StatCard label="Payroll Paid" value={fmt(totalSalaries)} icon={Users} tone="purple" sub={`${salaryRecords.filter(s => s.status === 'paid').length} staff payments`} />
            <StatCard label="Pending Payroll" value={fmt(pendingSalaries)} icon={UserCheck} tone="amber" sub="awaiting approval" />
            <StatCard label="Net Profit" value={fmt(profit)} icon={DollarSign} tone={profit >= 0 ? 'emerald' : 'red'} sub="revenue – expenses – payroll" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="card p-5">
              <p className="mb-4 font-bold text-brand-950">Revenue vs Expenses (ETB thousands)</p>
              {monthly.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-ink/40">No financial data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #cfe0cf', fontSize: 12 }} formatter={v => `ETB ${v}K`} />
                    <Bar dataKey="rev" name="Revenue" fill="#188A2E" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="exp" name="Expenses" fill="#D4AF37" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <p className="mb-4 font-bold text-brand-950">Expense Breakdown by Category</p>
              {expenseByCategory.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-ink/40">No expense data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <RePieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* P&L Summary */}
          <div className="card mt-5 overflow-hidden">
            <div className="border-b border-brand-100 p-4 font-bold text-brand-950">Profit & Loss Summary</div>
            <table className="w-full">
              <tbody className="divide-y divide-brand-50">
                {[
                  { label: 'Total Revenue Collected', value: revenue, tone: 'text-brand-800', sign: '+' },
                  { label: 'Outstanding Receivables', value: outstanding, tone: 'text-amber-700', sign: '' },
                  { label: 'Total Operating Expenses', value: expenses, tone: 'text-red-600', sign: '-' },
                  { label: 'HR Payroll Paid', value: totalSalaries, tone: 'text-purple-700', sign: '-' },
                  { label: 'Net Profit / Loss', value: profit, tone: profit >= 0 ? 'text-emerald-700 font-black' : 'text-red-700 font-black', sign: profit >= 0 ? '+' : '' },
                ].map(r => (
                  <tr key={r.label} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-ink/70">{r.label}</Td>
                    <Td className={`text-right text-base ${r.tone}`}>{r.sign}{fmt(r.value)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── INVOICES ──────────────────────────────────────────────── */}
      {tab === 'invoices' && (
        <div className="card overflow-hidden">
          <SectionHeader
            count={state.invoices.length}
            onExport={() => {
              const cName = id => state.clients.find(c => c.id === id)?.company || '—'
              const eName = id => state.events.find(e => e.id === id)?.name || '—'
              exportTableToPDF('invoices', 'Invoice Registry',
                ['Ref', 'Client', 'Event', 'Amount (ETB)', 'Paid (ETB)', 'Outstanding', 'Due Date', 'Status'],
                state.invoices.map(i => [i.ref, cName(i.clientId), eName(i.eventId), i.amount, i.paid, i.amount - i.paid, i.dueDate, i.status]),
                { rightAlignCols: [3, 4, 5] })
              show('Invoices exported')
            }}
            onAdd={() => { setErrors({}); setForm({}); setOpen('invoice') }}
            addLabel="New Invoice"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-brand-50/50">
                <tr>
                  <Th>Ref</Th><Th>Client</Th><Th>Event</Th>
                  <Th className="text-right">Amount</Th><Th className="text-right">Paid</Th>
                  <Th className="text-right">Outstanding</Th><Th>Due Date</Th>
                  <Th>Status</Th><Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {state.invoices.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-sm text-ink/40">No invoices yet. Create one to start tracking client payments.</td></tr>
                )}
                {state.invoices.map(inv => {
                  const c = state.clients.find(x => x.id === inv.clientId)
                  const ev = state.events.find(x => x.id === inv.eventId)
                  const owed = inv.amount - inv.paid
                  return (
                    <tr key={inv.id} className="hover:bg-brand-50/40">
                      <Td className="font-mono text-xs font-bold text-brand-800">{inv.ref}</Td>
                      <Td className="font-semibold text-brand-950">{c?.company || '—'}</Td>
                      <Td className="text-ink/60">{ev?.name || '—'}</Td>
                      <Td className="text-right font-semibold">{fmt(inv.amount)}</Td>
                      <Td className="text-right text-brand-700 font-semibold">{fmt(inv.paid)}</Td>
                      <Td className={`text-right font-semibold ${owed > 0 ? 'text-red-600' : 'text-ink/40'}`}>{fmt(owed)}</Td>
                      <Td className="text-ink/50">{inv.dueDate}</Td>
                      <Td><Badge status={inv.status} label={inv.status} /></Td>
                      <Td>
                        {inv.status !== 'paid' && (
                          <button className="btn-outline !py-1 text-xs" onClick={() => { setErrors({}); setOpen('payment'); setForm({ invoiceId: inv.id }) }}>
                            Record Payment
                          </button>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXPENSES ──────────────────────────────────────────────── */}
      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          <SectionHeader
            count={state.expenses.length}
            onExport={() => {
              const eName = id => state.events.find(e => e.id === id)?.name || '—'
              exportTableToPDF('expenses', 'Expense Register',
                ['Category', 'Event', 'Vendor', 'Date', 'Amount (ETB)'],
                state.expenses.map(e => [e.category, eName(e.eventId), state.vendors.find(v => v.id === e.vendorId)?.name || '—', e.date, e.amount]),
                { rightAlignCols: [4] })
              show('Expenses exported')
            }}
            onAdd={() => { setErrors({}); setForm({}); setOpen('expense') }}
            addLabel="Record Expense"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-brand-50/50">
                <tr><Th>Category</Th><Th>Event</Th><Th>Vendor</Th><Th>Date</Th><Th className="text-right">Amount (ETB)</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {state.expenses.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sm text-ink/40">No expenses recorded yet.</td></tr>
                )}
                {state.expenses.map(e => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{e.category}</Td>
                    <Td className="text-ink/60">{state.events.find(x => x.id === e.eventId)?.name || '—'}</Td>
                    <Td className="text-ink/50">{state.vendors.find(v => v.id === e.vendorId)?.name || '—'}</Td>
                    <Td className="text-ink/50">{e.date}</Td>
                    <Td className="text-right font-semibold text-red-600">–{fmt(e.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EVENT BUDGETS ────────────────────────────────────────── */}
      {tab === 'budget' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <SectionHeader
              count={eventBudgets.length}
              onExport={() => {
                exportTableToPDF('event-budgets', 'Event Budget Utilization Report',
                  ['Event', 'Client', 'Budget (ETB)', 'Expenses (ETB)', 'Revenue (ETB)', 'Utilization %'],
                  eventBudgets.map(ev => [ev.name, ev.clientName, ev.budget, ev.eventExpenses, ev.eventRevenue, `${ev.utilization}%`]),
                  { rightAlignCols: [2, 3, 4] })
                show('Budget report exported')
              }}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-brand-50/50">
                  <tr>
                    <Th>Event</Th><Th>Client</Th><Th>Status</Th>
                    <Th className="text-right">Budget (ETB)</Th>
                    <Th className="text-right">Spent (ETB)</Th>
                    <Th className="text-right">Revenue (ETB)</Th>
                    <Th>Utilization</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {eventBudgets.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-sm text-ink/40">No events with budget data yet.</td></tr>
                  )}
                  {eventBudgets.map(ev => (
                    <tr key={ev.id} className="hover:bg-brand-50/40">
                      <Td className="font-semibold text-brand-950">{ev.name}</Td>
                      <Td className="text-ink/60">{ev.clientName}</Td>
                      <Td><Badge status={ev.status} label={ev.status} /></Td>
                      <Td className="text-right font-semibold">{fmt(ev.budget)}</Td>
                      <Td className={`text-right font-semibold ${ev.utilization >= 90 ? 'text-red-600' : ev.utilization >= 70 ? 'text-amber-600' : 'text-ink/70'}`}>{fmt(ev.eventExpenses)}</Td>
                      <Td className="text-right text-brand-700 font-semibold">{fmt(ev.eventRevenue)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Progress value={ev.utilization} className="h-2 w-24" />
                          <span className={`text-xs font-bold ${ev.utilization >= 90 ? 'text-red-600' : ev.utilization >= 70 ? 'text-amber-600' : 'text-brand-700'}`}>{ev.utilization}%</span>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── HR PAYROLL / SALARY ───────────────────────────────────── */}
      {tab === 'salary' && (
        <div className="space-y-5">
          {/* Payroll Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Paid This Period" value={fmt(totalSalaries)} icon={CheckCircle2} tone="emerald" sub={`${salaryRecords.filter(s => s.status === 'paid').length} payments`} />
            <StatCard label="Pending Approval" value={fmt(pendingSalaries)} icon={Clock} tone="amber" sub={`${salaryRecords.filter(s => s.status === 'pending').length} records`} />
            <StatCard label="Total Staff" value={state.staff.length} icon={Users} tone="brand" sub="active team members" />
            <StatCard label="Avg Salary" value={salaryRecords.length > 0 ? fmt(Math.round(salaryRecords.reduce((a, s) => a + s.gross, 0) / salaryRecords.length)) : 'ETB 0'} icon={BriefcaseBusiness} tone="purple" sub="gross average" />
          </div>

          <div className="card overflow-hidden">
            <SectionHeader
              count={salaryRecords.length}
              onExport={exportSalary}
              onAdd={() => { setSalaryForm({}); setErrors({}); setOpen('salary') }}
              addLabel="Add Salary Record"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-brand-50/50">
                  <tr>
                    <Th>Staff Member</Th><Th>Dept</Th><Th>Grade</Th><Th>Month</Th>
                    <Th className="text-right">Gross (ETB)</Th>
                    <Th className="text-right">Tax (30%)</Th>
                    <Th className="text-right">Pension (7%)</Th>
                    <Th className="text-right">Bonus</Th>
                    <Th className="text-right">Deductions</Th>
                    <Th className="text-right">Net Pay</Th>
                    <Th>Status</Th><Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {salaryRecords.length === 0 && (
                    <tr><td colSpan={12} className="py-10 text-center text-sm text-ink/40">No salary records yet. Add a payroll record to track HR compensation.</td></tr>
                  )}
                  {salaryRecords.map(s => {
                    const staff = state.staff.find(x => x.id === s.staffId)
                    return (
                      <tr key={s.id} className="hover:bg-brand-50/40">
                        <Td>
                          <div className="font-semibold text-brand-950">{staff?.name || s.staffId}</div>
                          <div className="text-[11px] text-ink/40">{staff?.jobTitle || staff?.dept}</div>
                        </Td>
                        <Td className="text-ink/60">{staff?.dept || '—'}</Td>
                        <Td className="text-ink/60 text-xs">{s.grade}</Td>
                        <Td className="text-ink/60">{s.month}</Td>
                        <Td className="text-right font-semibold">{fmt(s.gross)}</Td>
                        <Td className="text-right text-red-500">–{fmt(s.tax)}</Td>
                        <Td className="text-right text-orange-500">–{fmt(s.pension)}</Td>
                        <Td className="text-right text-emerald-600">+{fmt(s.bonus)}</Td>
                        <Td className="text-right text-red-400">{s.deductions ? `–${fmt(s.deductions)}` : '—'}</Td>
                        <Td className="text-right font-black text-brand-800">{fmt(s.net)}</Td>
                        <Td>
                          <Badge
                            status={s.status}
                            label={s.status === 'paid' ? 'Paid' : s.status === 'rejected' ? 'Rejected' : 'Pending'}
                          />
                        </Td>
                        <Td>
                          {s.status === 'pending' && (
                            <div className="flex gap-1">
                              <button className="btn-outline !px-2 !py-0.5 text-[11px] !text-brand-700" onClick={() => approveSalary(s.id)}>Approve</button>
                              <button className="btn-outline !px-2 !py-0.5 text-[11px] !text-red-600" onClick={() => rejectSalary(s.id)}>Reject</button>
                            </div>
                          )}
                          {s.status === 'paid' && <span className="text-[11px] text-emerald-600 font-semibold">✓ Paid</span>}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PURCHASE REQUESTS ─────────────────────────────────────── */}
      {tab === 'purchase' && (
        <div className="card overflow-hidden">
          <SectionHeader
            count={purchaseRequests.length}
            onAdd={() => { setPrForm({}); setErrors({}); setOpen('purchase') }}
            addLabel="New Request"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-brand-50/50">
                <tr><Th>Item</Th><Th>Category</Th><Th>Requested By</Th><Th>Event</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {purchaseRequests.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-ink/40">No purchase requests yet.</td></tr>
                )}
                {purchaseRequests.map(p => {
                  const m = state.staff.find(x => x.id === p.requestedBy)
                  const ev = state.events.find(x => x.id === p.eventId)
                  return (
                    <tr key={p.id} className="hover:bg-brand-50/40">
                      <Td className="font-semibold text-brand-950">{p.item}</Td>
                      <Td className="text-ink/60">{p.category}</Td>
                      <Td className="text-ink/60">{m?.name || '—'}</Td>
                      <Td className="text-ink/60">{ev?.name || '—'}</Td>
                      <Td className="text-ink/50">{p.date}</Td>
                      <Td className="text-right font-semibold">{fmt(p.amount)}</Td>
                      <Td><Badge status={p.status} label={p.status} /></Td>
                      <Td>
                        {p.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button className="btn-outline !px-2 !py-0.5 text-[11px] !text-brand-700" onClick={() => { setPurchaseRequestStatus(p.id, 'approved'); show(`${p.item} approved`) }}>Approve</button>
                            <button className="btn-outline !px-2 !py-0.5 text-[11px] !text-red-600" onClick={() => { setPurchaseRequestStatus(p.id, 'rejected'); show(`${p.item} rejected`) }}>Reject</button>
                          </div>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG ──────────────────────────────────────────── */}
      {tab === 'activity' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-sm font-semibold text-ink/60">{financeActivities.length} financial events</span>
          </div>
          {financeActivities.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink/40">No financial activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-brand-50">
              {financeActivities.map((a, i) => (
                <div key={a.id || i} className="flex items-start gap-3 p-4 hover:bg-brand-50/30">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Receipt size={14} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-950">{a.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink/40">{a.at || new Date(a.createdAt || Date.now()).toLocaleString()}</p>
                  </div>
                  <Badge status={a.type || 'finance'} label={a.type || 'finance'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────── MODALS ──────────────────────────────────────── */}

      {/* Expense */}
      <Modal open={open === 'expense'} onClose={() => setOpen(null)} title="Record Expense">
        {Object.keys(errors).length > 0 && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">⚠️ Please fill out all required fields.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Event *">
            <select className={`input ${errors.eventId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.eventId || ''} onChange={e => setForm({ ...form, eventId: e.target.value })}>
              <option value="">Select event…</option>
              {state.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            {errors.eventId && <p className="mt-1 text-[11px] text-red-600">{errors.eventId}</p>}
          </Field>
          <Field label="Category *">
            <select className="input" value={form.category || 'Venue Rental'} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Venue Rental', 'Catering', 'Technical / AV', 'Decoration', 'Transport', 'Marketing', 'Security', 'Staffing', 'Printing & Signage', 'Entertainment', 'Insurance', 'Accommodation', 'Photography', 'Communication', 'General', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (ETB) *">
            <input type="number" className={`input ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" />
            {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
          </Field>
          <Field label="Date *">
            <input type="date" className={`input ${errors.date ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
            {errors.date && <p className="mt-1 text-[11px] text-red-600">{errors.date}</p>}
          </Field>
          <Field label="Vendor" className="sm:col-span-2">
            <select className="input" value={form.vendorId || ''} onChange={e => setForm({ ...form, vendorId: e.target.value })}>
              <option value="">Select vendor (optional)…</option>
              {state.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <input className="input" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional description or reference" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitExpense}>Save Expense</button>
        </div>
      </Modal>

      {/* Payment */}
      <Modal open={open === 'payment'} onClose={() => setOpen(null)} title="Record Client Payment">
        {Object.keys(errors).length > 0 && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">⚠️ Please fill out all required fields.</div>}
        <div className="space-y-3">
          <Field label="Invoice *">
            <select className={`input ${errors.invoiceId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.invoiceId || ''} onChange={e => setForm({ ...form, invoiceId: e.target.value })}>
              <option value="">Select invoice…</option>
              {state.invoices.filter(i => i.status !== 'paid').map(inv => (
                <option key={inv.id} value={inv.id}>{inv.ref} — {fmt(inv.amount - inv.paid)} outstanding</option>
              ))}
            </select>
            {errors.invoiceId && <p className="mt-1 text-[11px] text-red-600">{errors.invoiceId}</p>}
          </Field>
          <Field label="Amount Received (ETB) *">
            <input type="number" className={`input ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Payment amount" />
            {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
          </Field>
          <Field label="Payment Method">
            <select className="input" value={form.method || 'Bank Transfer'} onChange={e => setForm({ ...form, method: e.target.value })}>
              {['Bank Transfer', 'Telebirr', 'CBE Birr', 'Cash', 'Chapa', 'ArifPay', 'Cheque'].map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Transaction Reference">
            <input className="input" value={form.ref || ''} onChange={e => setForm({ ...form, ref: e.target.value })} placeholder="Bank ref, transaction ID, etc." />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitPayment}>Record Payment</button>
        </div>
      </Modal>

      {/* Invoice */}
      <Modal open={open === 'invoice'} onClose={() => setOpen(null)} title="Issue Invoice to Client">
        {Object.keys(errors).length > 0 && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">⚠️ Please fill out all required fields.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Client *">
            <select className={`input ${errors.clientId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Select client…</option>
              {state.clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
            {errors.clientId && <p className="mt-1 text-[11px] text-red-600">{errors.clientId}</p>}
          </Field>
          <Field label="Event *">
            <select className={`input ${errors.eventId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.eventId || ''} onChange={e => setForm({ ...form, eventId: e.target.value })}>
              <option value="">Select event…</option>
              {state.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            {errors.eventId && <p className="mt-1 text-[11px] text-red-600">{errors.eventId}</p>}
          </Field>
          <Field label="Invoice Amount (ETB) *">
            <input type="number" className={`input ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Total invoice value" />
            {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
          </Field>
          <Field label="Due Date *">
            <input type="date" className={`input ${errors.dueDate ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            {errors.dueDate && <p className="mt-1 text-[11px] text-red-600">{errors.dueDate}</p>}
          </Field>
          <Field label="Payment Terms" className="sm:col-span-2">
            <select className="input" value={form.terms || 'Net 30'} onChange={e => setForm({ ...form, terms: e.target.value })}>
              {['Immediate', 'Net 7', 'Net 14', 'Net 30', 'Net 45', 'Net 60', '50% Advance + 50% on Completion'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Invoice notes or terms description" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitInvoice}>Issue Invoice</button>
        </div>
      </Modal>

      {/* HR Salary */}
      <Modal open={open === 'salary'} onClose={() => setOpen(null)} title="Add Salary / Payroll Record">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Staff Member *">
            <select className="input" value={salaryForm.staffId || ''} onChange={e => setSalaryForm({ ...salaryForm, staffId: e.target.value })}>
              <option value="">Select staff member…</option>
              {state.staff.map(s => <option key={s.id} value={s.id}>{s.name} – {s.dept || s.jobTitle}</option>)}
            </select>
          </Field>
          <Field label="Pay Period (Month) *">
            <input type="month" className="input" value={salaryForm.month || ''} onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })} />
          </Field>
          <Field label="Salary Grade">
            <select className="input" value={salaryForm.grade || 'Grade 3 – Mid-Level'} onChange={e => setSalaryForm({ ...salaryForm, grade: e.target.value })}>
              {SALARY_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Gross Salary (ETB) *">
            <input type="number" className="input" value={salaryForm.gross || ''} onChange={e => setSalaryForm({ ...salaryForm, gross: e.target.value })} placeholder="e.g. 25000" />
          </Field>
          <Field label="Bonus / Allowance (ETB)">
            <input type="number" className="input" value={salaryForm.bonus || ''} onChange={e => setSalaryForm({ ...salaryForm, bonus: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Extra Deductions (ETB)">
            <input type="number" className="input" value={salaryForm.deductions || ''} onChange={e => setSalaryForm({ ...salaryForm, deductions: e.target.value })} placeholder="0" />
          </Field>
        </div>
        {salaryForm.gross > 0 && (
          <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs">
            <p className="font-semibold text-brand-900 mb-1">Auto-calculated (Ethiopia Tax & Pension)</p>
            <div className="grid grid-cols-3 gap-2 text-ink/70">
              <span>Income Tax (30%): <b className="text-red-600">–{fmt(Math.round(Number(salaryForm.gross) * 0.30))}</b></span>
              <span>Pension (7%): <b className="text-orange-500">–{fmt(Math.round(Number(salaryForm.gross) * 0.07))}</b></span>
              <span>Est. Net: <b className="text-brand-800">{fmt(Math.max(0, Number(salaryForm.gross) - Math.round(Number(salaryForm.gross) * 0.37) + (Number(salaryForm.bonus) || 0) - (Number(salaryForm.deductions) || 0)))}</b></span>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitSalary}>Create Payroll Record</button>
        </div>
      </Modal>

      {/* Purchase Request */}
      <Modal open={open === 'purchase'} onClose={() => setOpen(null)} title="New Purchase Request">
        {Object.keys(errors).length > 0 && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">⚠️ Please fill out all required fields.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Item / Description *" className="sm:col-span-2">
            <input className={`input ${errors.item ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={prForm.item || ''} onChange={e => setPrForm({ ...prForm, item: e.target.value })} placeholder="e.g. Extra moving head lights (12)" />
            {errors.item && <p className="mt-1 text-[11px] text-red-600">{errors.item}</p>}
          </Field>
          <Field label="Category *">
            <select className="input" value={prForm.category || 'Technical'} onChange={e => setPrForm({ ...prForm, category: e.target.value })}>
              {['Technical / AV', 'Catering', 'Decoration', 'Logistics', 'Marketing', 'Branding', 'Security', 'Staffing', 'Printing & Signage', 'Entertainment', 'Insurance', 'Equipment Rental', 'General', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (ETB) *">
            <input type="number" className={`input ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={prForm.amount || ''} onChange={e => setPrForm({ ...prForm, amount: e.target.value })} placeholder="Request amount" />
            {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
          </Field>
          <Field label="Event *">
            <select className={`input ${errors.eventId ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={prForm.eventId || ''} onChange={e => setPrForm({ ...prForm, eventId: e.target.value })}>
              <option value="">Select event…</option>
              {state.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            {errors.eventId && <p className="mt-1 text-[11px] text-red-600">{errors.eventId}</p>}
          </Field>
          <Field label="Requested By">
            <select className="input" value={prForm.requestedBy || state.currentUserId || ''} onChange={e => setPrForm({ ...prForm, requestedBy: e.target.value })}>
              {state.staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Urgency">
            <select className="input" value={prForm.urgency || 'Normal'} onChange={e => setPrForm({ ...prForm, urgency: e.target.value })}>
              {['Low', 'Normal', 'High', 'Urgent'].map(u => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Justification" className="sm:col-span-2">
            <textarea className="input" rows={2} value={prForm.justification || ''} onChange={e => setPrForm({ ...prForm, justification: e.target.value })} placeholder="Reason for this purchase request…" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            const res = validate(prForm, {
              item: [textRequired('Item / description')],
              amount: [numberPositive('Amount')],
              eventId: [required('Event')],
            })
            if (!res.ok) { setErrors(res.errors); show(res.first || 'Please fill out this field', 'warn'); return }
            addPurchaseRequest(prForm)
            show('Purchase request submitted for approval')
            setOpen(null); setPrForm({}); setErrors({})
          }}>Submit Request</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
