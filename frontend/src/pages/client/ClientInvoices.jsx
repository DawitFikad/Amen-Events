import React, { useMemo, useState } from 'react'
import { Wallet, Download, FileText, CheckCircle2, AlertCircle, CreditCard, Shield, X } from 'lucide-react'
import { useData } from '../../store/DataContext'
import { Badge, Th, Td, Toast } from '../../components/ui'
import { fmt, fmtCompact } from '../../store/data'

export default function ClientInvoices() {
  const { state, patchBy } = useData()
  const clientId = state.currentUserId
  const [filter, setFilter] = useState('all')
  const [payInvoice, setPayInvoice] = useState(null)
  const [payAmount, setPayAmount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  const myInvoices = useMemo(() => {
    let invs = state.invoices.filter((inv) => inv.clientId === clientId)
    if (filter !== 'all') invs = invs.filter((inv) => inv.status === filter)
    return invs
  }, [state.invoices, clientId, filter])

  const myEvents = state.events.filter((e) => e.clientId === clientId)
  const totalInvoiced = myInvoices.reduce((a, i) => a + i.amount, 0)
  const totalPaid = myInvoices.reduce((a, i) => a + (i.paid || 0), 0)
  const outstanding = totalInvoiced - totalPaid

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'partial', label: 'Partial' },
  ]

  const handlePay = () => {
    if (!payInvoice) return
    setBusy(true)
    setTimeout(() => {
      const newPaid = (payInvoice.paid || 0) + payAmount
      const newStatus = newPaid >= payInvoice.amount ? 'paid' : 'partial'
      patchBy('invoices', payInvoice.id, (inv) => ({ ...inv, paid: newPaid, status: newStatus }))
      setBusy(false)
      show(`Payment of ETB ${fmtCompact(payAmount)} successful for ${payInvoice.ref}`)
      setPayInvoice(null)
      setPayAmount(0)
    }, 1500)
  }

  const openPayModal = (inv) => {
    setPayInvoice(inv)
    setPayAmount(inv.amount - (inv.paid || 0))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Invoices & Payments</h1>
        <p className="text-sm text-ink/50">Manage your invoices and track payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={18} /></span>
            <div><p className="text-lg font-black text-brand-950">{fmt(totalInvoiced)}</p><p className="text-[11px] text-ink/50">Total Invoiced</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><CheckCircle2 size={18} /></span>
            <div><p className="text-lg font-black text-brand-700">{fmt(totalPaid)}</p><p className="text-[11px] text-ink/50">Total Paid</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><AlertCircle size={18} /></span>
            <div><p className="text-lg font-black text-gold-700">{fmt(outstanding)}</p><p className="text-[11px] text-ink/50">Outstanding Balance</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices table */}
      <div className="card overflow-hidden">
        {myInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/40">No invoices found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-brand-50/50">
              <tr><Th>Invoice #</Th><Th>Event</Th><Th>Amount</Th><Th>Paid</Th><Th>Outstanding</Th><Th>Status</Th><Th>Due Date</Th><Th></Th></tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {myInvoices.map((inv) => {
                const evt = myEvents.find((e) => e.id === inv.eventId)
                const remaining = inv.amount - (inv.paid || 0)
                return (
                  <tr key={inv.id} className="hover:bg-brand-50/40">
                    <Td><span className="font-mono text-sm font-bold text-brand-950">{inv.ref}</span></Td>
                    <Td className="text-ink/60">{evt?.name || '—'}</Td>
                    <Td className="font-semibold text-brand-950">{fmt(inv.amount)}</Td>
                    <Td className="text-brand-700">{fmt(inv.paid || 0)}</Td>
                    <Td className="text-gold-700">{fmt(remaining)}</Td>
                    <Td><Badge status={inv.status} label={inv.status} /></Td>
                    <Td className="text-ink/60">{inv.dueDate}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {remaining > 0 && (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
                          >
                            <CreditCard size={12} className="inline" /> Pay Now
                          </button>
                        )}
                        <button className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900">
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment history */}
      <div className="card p-5">
        <p className="mb-4 font-bold text-brand-950">Payment History</p>
        <div className="space-y-2.5">
          {myInvoices.filter((i) => (i.paid || 0) > 0).map((inv) => {
            const evt = myEvents.find((e) => e.id === inv.eventId)
            return (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-brand-50 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><CheckCircle2 size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-950">Payment for {inv.ref}</p>
                  <p className="text-[11px] text-ink/45">{evt?.name || '—'} · {inv.dueDate}</p>
                </div>
                <span className="font-bold text-brand-700">{fmt(inv.paid || 0)}</span>
              </div>
            )
          })}
          {myInvoices.filter((i) => (i.paid || 0) > 0).length === 0 && (
            <div className="py-4 text-center text-sm text-ink/40">No payments recorded yet.</div>
          )}
        </div>
      </div>

      {/* Pay modal */}
      {payInvoice && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4" onClick={() => setPayInvoice(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-brand-950">Pay Invoice</h3>
              <button onClick={() => setPayInvoice(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 hover:bg-brand-50"><X size={18} /></button>
            </div>

            <div className="mb-4 rounded-xl bg-brand-50 p-4">
              <div className="flex justify-between text-sm"><span className="text-ink/60">Invoice</span><span className="font-mono font-bold text-brand-950">{payInvoice.ref}</span></div>
              <div className="mt-1 flex justify-between text-sm"><span className="text-ink/60">Total Amount</span><span className="font-bold text-brand-950">{fmt(payInvoice.amount)}</span></div>
              <div className="mt-1 flex justify-between text-sm"><span className="text-ink/60">Already Paid</span><span className="font-bold text-brand-700">{fmt(payInvoice.paid || 0)}</span></div>
              <div className="mt-2 flex justify-between border-t border-brand-100 pt-2 text-sm"><span className="font-bold text-ink/70">Outstanding</span><span className="font-bold text-gold-700">{fmt(payInvoice.amount - (payInvoice.paid || 0))}</span></div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-ink/60">Payment Amount (ETB)</label>
              <input type="number" className="input" value={payAmount} onChange={(e) => setPayAmount(Math.min(payInvoice.amount - (payInvoice.paid || 0), Math.max(0, Number(e.target.value))))} />
              <div className="mt-1.5 flex gap-2">
                <button onClick={() => setPayAmount(payInvoice.amount - (payInvoice.paid || 0))} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100">Pay Full Amount</button>
                <button onClick={() => setPayAmount(Math.round((payInvoice.amount - (payInvoice.paid || 0)) / 2))} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100">Pay 50%</button>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-ink/60">Card Number</label><input className="input" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-bold text-ink/60">Expiry</label><input className="input" placeholder="MM/YY" defaultValue="12/28" /></div>
                <div><label className="mb-1 block text-xs font-bold text-ink/60">CVV</label><input className="input" placeholder="123" defaultValue="123" /></div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-xs text-ink/60"><Shield size={14} className="text-brand-600" /> Secured with 256-bit SSL encryption</div>

            <button onClick={handlePay} disabled={busy || payAmount <= 0} className="btn-primary w-full">
              {busy ? (<span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Processing…</span>) : (<><CreditCard size={16} /> Pay ETB {fmtCompact(payAmount)}</>)}
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
