import React, { useState, useEffect } from 'react'
import { BarChart3, FileSpreadsheet, FileText, Download, TrendingUp, TrendingDown, Users, Ticket, Wallet, Building2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, Th, Td, Segmented } from '../components/ui'
import { fmt, fmtCompact } from '../store/data'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const staffPerformance = [
  { id: 'spf1', name: 'Dawit Mengistu', role: 'PM', events: 3, tasks: 8, done: 6, rating: 4.8 },
  { id: 'spf2', name: 'Selam Bekele', role: 'Coordinator', events: 2, tasks: 6, done: 4, rating: 4.5 },
  { id: 'spf3', name: 'Sara Ahmed', role: 'Logistics', events: 2, tasks: 7, done: 5, rating: 4.7 },
  { id: 'spf4', name: 'Liya Kebede', role: 'Marketing', events: 1, tasks: 5, done: 3, rating: 4.2 },
]

const PIE = ['#228b22', '#c9a227', '#9cc69c', '#175917', '#d1aa4d']

export default function Reports() {
  const { state, markVisitedReports, intent, clearIntent } = useData()
  const [range, setRange] = useState('Q3')
  const [toast, setToast] = useState(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    markVisitedReports()
    if (intent === 'reports') {
      clearIntent()
    }
  }, [intent])

  const revenue = state.invoices.reduce((a, i) => a + i.paid, 0)
  const expenses = state.expenses.reduce((a, e) => a + e.amount, 0)
  const ticketRevenue = state.registrations.filter((r) => r.paid).reduce((a, r) => a + r.amount, 0)
  const attended = state.registrations.filter((r) => r.checkedIn).length

  const vendorSpend = {}
  state.expenses.forEach((e) => { vendorSpend[e.category] = (vendorSpend[e.category] || 0) + e.amount })
  const vendorData = Object.entries(vendorSpend).map(([name, v]) => ({ name, v }))

  const reports = [
    ['Events Report', 'All events with status, budget & attendance', FileText],
    ['Revenue Report', 'Invoices, collections & outstanding', TrendingUp],
    ['Expense Report', 'Spend by category & event', TrendingDown],
    ['Client Report', 'Pipeline, value & win-rate', Building2],
    ['Attendance Report', 'Registrations vs check-ins', Users],
    ['Ticket Sales Report', 'Ticket types, sales & revenue', Ticket],
    ['Vendor Report', 'Contracts, payments & ratings', Building2],
    ['Staff Performance', 'Tasks, delivery & ratings', Users],
    ['Profitability Report', 'P&L per event & overall', Wallet],
  ]

  return (
    <div>
      <PageHeader
        title="Reporting & Analytics"
        subtitle="Generate, preview and export reports across the platform."
        icon={BarChart3}
        actions={
          <>
            <Segmented value={range} onChange={setRange} options={[{ value: 'Q2', label: 'Q2' }, { value: 'Q3', label: 'Q3' }, { value: 'YTD', label: 'YTD' }]} />
            <button className="btn-outline" onClick={() => show('Report exported to Excel', 'success')}><FileSpreadsheet size={15} /> Excel</button>
            <button className="btn-primary" onClick={() => show('Report exported to PDF', 'success')}><Download size={15} /> PDF</button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[['Revenue', fmt(revenue), 'text-brand-800', TrendingUp], ['Expenses', fmt(expenses), 'text-gold-700', TrendingDown], ['Ticket Sales', fmt(ticketRevenue), 'text-brand-800', Ticket], ['Attendance', `${attended}/${state.registrations.length}`, 'text-brand-800', Users]].map(([l, v, cls, I]) => (
          <div key={l} className="card p-4">
            <div className="flex items-center justify-between"><p className="text-[13px] font-semibold text-ink/55">{l}</p><I size={16} className="text-brand-600" /></div>
            <p className={`mt-1 text-xl font-black ${cls}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Expense by category */}
        <div className="card p-5">
          <p className="mb-3 font-bold text-brand-950">Expenses by Category</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vendorData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} tickFormatter={(v) => fmtCompact(v)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} formatter={(v) => fmt(v)} />
              <Bar dataKey="v" fill="#228b22" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance vs registered */}
        <div className="card p-5">
          <p className="mb-3 font-bold text-brand-950">Attendance vs Registrations</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[{ m: 'Summit', reg: 640, att: 590 }, { m: 'Retreat', reg: 146, att: 140 }, { m: 'Gala', reg: 690, att: 645 }, { m: 'Expo', reg: 320, att: 270 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8efe8" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#122c1266' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d6e7d6', fontSize: 12 }} />
              <Line type="monotone" dataKey="reg" stroke="#9cc69c" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="att" stroke="#228b22" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-1 flex justify-center gap-5 text-xs text-ink/55">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-brand-600" /> Attended</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-brand-200" /> Registered</span>
          </div>
        </div>
      </div>

      {/* Report library */}
      <div className="card p-5">
        <p className="mb-4 font-bold text-brand-950">Report Library</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map(([name, desc, I]) => (
            <div key={name} className="flex items-center gap-3 rounded-xl border border-brand-100 p-4 transition hover:border-brand-300 hover:bg-brand-50/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><I size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-950">{name}</p>
                <p className="truncate text-xs text-ink/45">{desc}</p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost !px-2 !py-1" title="Export Excel" onClick={() => show(`${name} → Excel`, 'success')}><FileSpreadsheet size={15} /></button>
                <button className="btn-ghost !px-2 !py-1" title="Export PDF" onClick={() => show(`${name} → PDF`, 'success')}><FileText size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff performance table */}
      <div className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <p className="font-bold text-brand-950">Staff Performance</p>
          <button className="btn-outline !py-1 text-xs" onClick={() => show('Staff report exported', 'success')}>Export</button>
        </div>
        <table className="w-full">
          <thead className="bg-brand-50/50"><tr><Th>Team Member</Th><Th>Role</Th><Th>Events</Th><Th>Tasks</Th><Th className="text-right">Completion</Th><Th>Rating</Th></tr></thead>
          <tbody className="divide-y divide-brand-50">
            {staffPerformance.map((s) => {
              const pct = Math.round((s.done / s.tasks) * 100)
              return (
                <tr key={s.id} className="hover:bg-brand-50/40">
                  <Td className="font-semibold text-brand-950">{s.name}</Td>
                  <Td className="text-ink/60">{s.role}</Td>
                  <Td className="font-bold">{s.events}</Td>
                  <Td className="text-ink/60">{s.tasks}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-28"><Progress value={pct} color={pct >= 70 ? 'bg-brand-600' : 'bg-gold-500'} /></div>
                      <span className="text-xs font-bold">{pct}%</span>
                    </div>
                  </Td>
                  <Td><span className="rounded-md bg-gold-50 px-2 py-1 text-xs font-bold text-gold-700">★ {s.rating}</span></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
