import React, { useState, useEffect } from 'react'
import { Wallet, Plus, FileText, TrendingUp, TrendingDown, PieChart, Download } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, EmptyState, Th, Td, Segmented, Modal, Field } from '../components/ui'
import { fmt, fmtCompact } from '../store/data'
import { downloadCSV, exportPDF } from '../store/exportUtils'
import { numberPositive, textRequired, required, validate } from '../store/validation'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Finance() {
  const { state, recordExpense, recordPayment, addInvoice, intent, clearIntent, addPurchaseRequest, setPurchaseRequestStatus } = useData()
  const [tab, setTab] = useState('overview')
  const [open, setOpen] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [prForm, setPrForm] = useState({})
  const [errors, setErrors] = useState({})

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  const exportAll = () => {
    const cName = (id) => state.clients.find((c) => c.id === id)?.company || '-'
    const eName = (id) => state.events.find((e) => e.id === id)?.name || '-'
    downloadCSV('finance-invoices.csv',
      ['Ref', 'Client', 'Event', 'Amount', 'Paid', 'Outstanding', 'Status'],
      state.invoices.map((i) => [i.ref, cName(i.clientId), eName(i.eventId), i.amount, i.paid, i.amount - i.paid, i.status]))
    downloadCSV('finance-expenses.csv',
      ['Event', 'Category', 'Date', 'Amount'],
      state.expenses.map((e) => [eName(e.eventId), e.category, e.date, e.amount]))
    show('Invoices & expenses exported to Excel')
  }

  useEffect(() => {
    if (intent === 'finance') {
      const seed = { eventId: state.demo.lastEventId || 'ev1', category: 'Venue Rental', amount: '250000' }
      setTab('overview')
      if (state.demo.autoplay) {
        setForm(seed); setOpen('expense'); setErrors({})
        setTimeout(() => {
          recordExpense({ eventId: seed.eventId, category: seed.category, amount: 250000, date: new Date().toISOString().slice(0, 10) })
          show('Expense recorded automatically'); setOpen(null); setForm({}); setErrors({})
        }, 1100)
      } else {
        setForm({ eventId: state.demo.lastEventId || 'ev1', category: 'Venue Rental' })
        setOpen('expense'); setErrors({})
      }
      clearIntent()
    }
  }, [intent])

  const revenue = state.invoices.reduce((a, i) => a + i.paid, 0)
  const expected = state.invoices.reduce((a, i) => a + i.amount, 0)
  const outstanding = expected - revenue
  const expenses = state.expenses.reduce((a, e) => a + e.amount, 0)
  const profit = revenue - expenses

  // Build monthly revenue vs expenses from real invoice/expense dates
  const monthly = MONTH_LABELS.map((m, idx) => {
    const rev = state.invoices.filter((i) => {
      if (!i.createdAt) return false
      const d = new Date(i.createdAt)
      return d.getMonth() === idx
    }).reduce((a, i) => a + i.paid, 0)
    const exp = state.expenses.filter((e) => {
      if (!e.createdAt) return false
      const d = new Date(e.createdAt)
      return d.getMonth() === idx
    }).reduce((a, e) => a + e.amount, 0)
    return { m, rev: Math.round(rev / 1000), exp: Math.round(exp / 1000) }
  }).filter((d) => d.rev > 0 || d.exp > 0)

  // Purchase requests (real, persisted list)
  const purchaseRequests = state.purchaseRequests || []

  const pnl = [
    { l: 'Total Revenue (collected)', v: revenue, tone: 'text-brand-800' },
    { l: 'Outstanding Receivables', v: outstanding, tone: 'text-red-600' },
    { l: 'Total Expenses', v: expenses, tone: 'text-gold-700' },
    { l: 'Net Profit', v: profit, tone: profit >= 0 ? 'text-brand-700' : 'text-red-600' },
  ]

  const submitExpense = () => {
    const res = validate(form, { amount: [numberPositive('Amount')] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    recordExpense({ eventId: form.eventId || 'ev1', category: form.category || 'General', amount: Number(form.amount), date: new Date().toISOString().slice(0, 10), vendorId: form.vendorId })
    show('Expense recorded')
    setOpen(null); setForm({}); setErrors({})
  }

  const submitPayment = () => {
    const res = validate(form, { amount: [numberPositive('Amount')], invoiceId: [required('Invoice')] })
    if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
    recordPayment(form.invoiceId, Number(form.amount))
    show(`Payment of ${fmt(Number(form.amount))} recorded`)
    setOpen(null); setForm({}); setErrors({})
  }

  return (
    <div>
      <PageHeader
        title="Financial Management"
        subtitle="Budgets, expenses, payments and profitability."
        icon={Wallet}
        actions={
          <>
            <button className="btn-outline" onClick={exportAll}><Download size={15} /> Export</button>
            <button className="btn-primary" onClick={() => { setErrors({}); setOpen('expense') }}><Plus size={15} /> Record Expense</button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[['overview', 'Overview', PieChart], ['invoices', 'Invoices', FileText], ['expenses', 'Expenses', TrendingDown], ['purchase', 'Purchase Requests', Wallet]].map(([v, l, I]) => (
          <button key={v} onClick={() => setTab(v)} className={`tab ${tab === v ? 'tab-active' : 'tab-idle'}`}><I size={15} /> {l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pnl.map((p) => (
              <div key={p.l} className="card p-5">
                <p className="text-[13px] font-semibold text-ink/55">{p.l}</p>
                <p className={`mt-2 text-xl font-black tracking-tight ${p.tone}`}>{fmt(p.v)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Revenue vs Expenses</p>
              {monthly.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-ink/40">No financial data for charts yet.</div>
              ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #cfe0cf', fontSize: 12 }} formatter={(v) => `ETB ${v}K`} />
                  <Bar dataKey="rev" name="Revenue" fill="#228b22" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="exp" name="Expenses" fill="#d1aa4d" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
            <div className="card p-5">
              <p className="mb-3 font-bold text-brand-950">Profitability Trend</p>
              {monthly.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-ink/40">No profitability data yet.</div>
              ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#71aa71" stopOpacity={0.3} /><stop offset="100%" stopColor="#71aa71" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => `ETB ${v}K`} />
                  <Area type="monotone" dataKey="exp" name="Net" stroke="#228b22" strokeWidth={2} fill="url(#pf)" />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-sm text-ink/55">{state.invoices.length} invoices · {fmt(outstanding)} outstanding</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setErrors({}); setOpen('invoice') }}><Plus size={14} /> New Invoice</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-brand-50/50"><tr><Th>Ref</Th><Th>Client</Th><Th>Event</Th><Th className="text-right">Amount</Th><Th className="text-right">Paid</Th><Th>Due</Th><Th>Status</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {state.invoices.map((inv) => {
                  const c = state.clients.find((x) => x.id === inv.clientId)
                  const ev = state.events.find((x) => x.id === inv.eventId)
                  return (
                    <tr key={inv.id} className="hover:bg-brand-50/40">
                      <Td className="font-mono text-xs font-semibold text-brand-800">{inv.ref}</Td>
                      <Td className="font-semibold text-brand-950">{c?.company}</Td>
                      <Td className="text-ink/60">{ev?.name}</Td>
                      <Td className="text-right font-semibold">{fmt(inv.amount)}</Td>
                      <Td className="text-right text-brand-800">{fmt(inv.paid)}</Td>
                      <Td className="text-ink/50">{inv.dueDate}</Td>
                      <Td><Badge status={inv.status} label={inv.status} /></Td>
                      <Td>{inv.status !== 'paid' && <button className="btn-outline !py-1 text-xs" onClick={() => { setErrors({}); setOpen('payment'); setForm({ ...form, invoiceId: inv.id }) }}>Record Payment</button>}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          <div className="border-b border-brand-100 p-4">
            <span className="chip bg-brand-100 text-brand-800">{state.expenses.length} transactions · {fmt(expenses)} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-brand-50/50"><tr><Th>Category</Th><Th>Event</Th><Th>Date</Th><Th className="text-right">Amount</Th></tr></thead>
              <tbody className="divide-y divide-brand-50">
                {state.expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{e.category}</Td>
                    <Td className="text-ink/60">{state.events.find((x) => x.id === e.eventId)?.name}</Td>
                    <Td className="text-ink/50">{e.date}</Td>
                    <Td className="text-right font-semibold text-red-600">-{fmt(e.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'purchase' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <span className="text-xs text-ink/45">{purchaseRequests.filter((p) => p.status === 'pending').length} awaiting approval · {fmt(purchaseRequests.reduce((a, p) => a + (p.status === 'pending' ? p.amount : 0), 0))} pending</span>
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setErrors({}); setOpen('purchase') }}><Plus size={14} /> New Request</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
            <thead className="bg-brand-50/50"><tr><Th>Item</Th><Th>Category</Th><Th>Requested By</Th><Th>Event</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {purchaseRequests.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-ink/40">No purchase requests yet. Create one to route an expense for approval.</td></tr>
              ) : purchaseRequests.map((p) => {
                const m = state.staff.find((x) => x.id === p.requestedBy)
                const ev = state.events.find((x) => x.id === p.eventId)
                return (
                  <tr key={p.id} className="hover:bg-brand-50/40">
                    <Td className="font-semibold text-brand-950">{p.item}</Td>
                    <Td className="text-ink/60">{p.category}</Td>
                    <Td className="text-ink/60">{m?.name || '-'}</Td>
                    <Td className="text-ink/60">{ev?.name || '-'}</Td>
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

      {/* Expense modal */}
      <Modal open={open === 'expense'} onClose={() => setOpen(null)} title="Record Expense">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event"><select className="input" value={form.eventId || ''} onChange={(e) => setForm({ ...form, eventId: e.target.value })}><option value="">Select…</option>{state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}</select></Field>
          <Field label="Category"><select className="input" value={form.category || 'General'} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Venue Rental</option><option>Catering</option><option>Technical</option><option>Decoration</option><option>Transport</option><option>Marketing</option><option>Security</option><option>Staffing</option><option>Printing & Signage</option><option>Entertainment</option><option>Insurance</option><option>Accommodation</option><option>General</option><option>Other</option></select></Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Vendor"><select className="input" value={form.vendorId || ''} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}><option value="">-</option>{state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitExpense}>Save Expense</button>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal open={open === 'payment'} onClose={() => setOpen(null)} title="Record Payment">
        <div className="space-y-3">
          <Field label="Invoice *">
            <select className="input" value={form.invoiceId || ''} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
              <option value="">Select invoice…</option>
              {state.invoices.filter((i) => i.status !== 'paid').map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.ref} - {fmt(inv.amount - inv.paid)} due</option>
              ))}
            </select>
            {errors.invoiceId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.invoiceId}</p>}
          </Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitPayment}>Save Payment</button>
        </div>
      </Modal>

      {/* Invoice modal */}
      <Modal open={open === 'invoice'} onClose={() => setOpen(null)} title="Issue Invoice">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client *"><select className="input" value={form.clientId || ''} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><option value="">Select…</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}</select>{errors.clientId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.clientId}</p>}</Field>
          <Field label="Event"><select className="input" value={form.eventId || ''} onChange={(e) => setForm({ ...form, eventId: e.target.value })}><option value="">Select…</option>{state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}</select></Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />{errors.amount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.amount}</p>}</Field>
          <Field label="Due Date"><input type="date" className="input" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            const res = validate(form, { amount: [numberPositive('Amount')], clientId: [required('Client')] })
            if (!res.ok) { setErrors(res.errors); show(res.first, 'warn'); return }
            addInvoice({ ...form, ref: 'INV-2026-' + String(Math.floor(1000 + Math.random() * 9000)), paid: 0 })
            show('Invoice issued')
            setOpen(null); setForm({}); setErrors({})
          }}>Issue Invoice</button>
        </div>
      </Modal>

      {/* Purchase request modal */}
      <Modal open={open === 'purchase'} onClose={() => setOpen(null)} title="New Purchase Request">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Item / Description *" className="col-span-2"><input className="input" value={prForm.item || ''} onChange={(e) => setPrForm({ ...prForm, item: e.target.value })} placeholder="e.g. Extra moving head lights (12)" />{errors.item && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.item}</p>}</Field>
          <Field label="Category"><select className="input" value={prForm.category || 'Technical'} onChange={(e) => setPrForm({ ...prForm, category: e.target.value })}><option>Technical</option><option>Catering</option><option>Decoration</option><option>Logistics</option><option>Marketing</option><option>Branding</option><option>Security</option><option>Staffing</option><option>Printing & Signage</option><option>Entertainment</option><option>Insurance</option><option>Equipment Rental</option><option>General</option><option>Other</option></select></Field>
          <Field label="Amount (ETB) *"><input type="number" className="input" value={prForm.amount || ''} onChange={(e) => setPrForm({ ...prForm, amount: e.target.value })} />{errors.prAmount && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.prAmount}</p>}</Field>
          <Field label="Event"><select className="input" value={prForm.eventId || ''} onChange={(e) => setPrForm({ ...prForm, eventId: e.target.value })}><option value="">-</option>{state.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}</select></Field>
          <Field label="Requested By"><select className="input" value={prForm.requestedBy || state.currentUserId || 'st2'} onChange={(e) => setPrForm({ ...prForm, requestedBy: e.target.value })}>{state.staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            const res = validate(prForm, { item: [textRequired('Item / description')], amount: [numberPositive('Amount')] })
            if (!res.ok) {
              const mapped = { ...res.errors }
              if (mapped.amount) { mapped.prAmount = mapped.amount; delete mapped.amount }
              setErrors(mapped); show(res.first, 'warn'); return
            }
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

