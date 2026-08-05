import React, { useState, useEffect } from 'react'
import { BarChart3, FileSpreadsheet, FileText, Download, TrendingUp, TrendingDown, Users, Ticket, Wallet, Building2 } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Progress, Toast, Th, Td, Segmented } from '../components/ui'
import { fmt, fmtCompact } from '../store/data'
import { downloadCSV, exportPDF } from '../store/exportUtils'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

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

  // Build attendance vs registration chart from real event data
  const attendanceData = state.events.map((e) => {
    const regs = state.registrations.filter((r) => r.eventId === e.id)
    return { m: e.name?.slice(0, 12) || 'Event', reg: regs.length, att: regs.filter((r) => r.checkedIn).length }
  }).filter((d) => d.reg > 0).slice(0, 6)

  // Staff performance from real data
  const staffPerformance = state.staff.map((m) => {
    const mine = state.tasks.filter((t) => t.assigneeId === m.id)
    const done = mine.filter((t) => t.status === 'done').length
    const myEvents = state.events.filter((e) => e.pmId === m.id || e.team?.includes(m.id)).length
    return { id: m.id, name: m.name, role: m.role || m.jobTitle || '—', events: myEvents, tasks: mine.length, done, rating: m.rating || 4.0 }
  }).filter((s) => s.tasks > 0 || s.events > 0)

  const clientName = (id) => state.clients.find((c) => c.id === id)?.company || '—'
  const eventName = (id) => state.events.find((e) => e.id === id)?.name || '—'

  const reportRows = {
    'Events Report': state.events.map((e) => [e.name, e.category, clientName(e.clientId), e.date, e.status, e.budget, e.spent, e.attendees || '']),
    'Revenue Report': state.invoices.map((i) => [i.ref, clientName(i.clientId), eventName(i.eventId), i.amount, i.paid, i.amount - i.paid, i.status]),
    'Expense Report': state.expenses.map((e) => [eventName(e.eventId), e.category, e.date, e.amount]),
    'Client Report': state.clients.map((c) => [c.company, c.industry, c.city, c.contactPerson, c.stage, c.status, c.totalValue]),
    'Attendance Report': state.registrations.map((r) => [eventName(r.eventId), r.name, r.type, r.paid ? 'Paid' : 'Unpaid', r.checkedIn ? 'Checked in' : 'Pending']),
    'Ticket Sales Report': state.registrations.map((r) => [eventName(r.eventId), r.name, r.type, r.amount, r.paid ? 'Paid' : 'Unpaid']),
    'Vendor Report': state.vendors.map((v) => [v.name, v.type, v.contact, v.rating, v.contracts, v.status]),
    'Staff Performance': state.staff.map((m) => {
      const mine = state.tasks.filter((t) => t.assigneeId === m.id)
      const done = mine.filter((t) => t.status === 'done').length
      return [m.name, m.role, m.dept, mine.length, done, mine.length ? Math.round((done / mine.length) * 100) + '%' : '—']
    }),
    'Profitability Report': state.events.map((e) => {
      const rev = state.invoices.filter((i) => i.eventId === e.id).reduce((a, i) => a + i.paid, 0)
      return [e.name, e.budget, e.spent, rev, rev - e.spent]
    }),
  }

  const exportExcel = (name) => {
    if (name === 'Financial Overview') {
      downloadCSV('financial-overview.csv',
        ['Reference', 'Client', 'Event', 'Amount', 'Paid', 'Outstanding', 'Status'],
        state.invoices.map((i) => [i.ref, clientName(i.clientId), eventName(i.eventId), i.amount, i.paid, i.amount - i.paid, i.status]))
    } else if (reportRows[name]) {
      const headers = {
        'Events Report': ['Event', 'Category', 'Client', 'Date', 'Status', 'Budget', 'Spent', 'Attendees'],
        'Revenue Report': ['Ref', 'Client', 'Event', 'Amount', 'Paid', 'Outstanding', 'Status'],
        'Expense Report': ['Event', 'Category', 'Date', 'Amount'],
        'Client Report': ['Company', 'Industry', 'City', 'Contact', 'Stage', 'Status', 'Value'],
        'Attendance Report': ['Event', 'Attendee', 'Type', 'Payment', 'Check-in'],
        'Ticket Sales Report': ['Event', 'Attendee', 'Type', 'Amount', 'Payment'],
        'Vendor Report': ['Vendor', 'Type', 'Contact', 'Rating', 'Contracts', 'Status'],
        'Staff Performance': ['Name', 'Role', 'Dept', 'Tasks', 'Done', 'Completion'],
        'Profitability Report': ['Event', 'Budget', 'Spent', 'Revenue', 'Net'],
      }[name]
      downloadCSV(name.toLowerCase().replace(/\s+/g, '-') + '.csv', headers, reportRows[name])
    } else {
      downloadCSV('events-report.csv',
        ['Event', 'Category', 'Client', 'Date', 'Status', 'Budget', 'Spent', 'Attendees'],
        state.events.map((e) => [e.name, e.category, clientName(e.clientId), e.date, e.status, e.budget, e.spent, e.attendees || '']))
    }
    show(`${name} exported to Excel`, 'success')
  }

  const exportPdf = (name) => {
    const make = (title, headers, rows) => ({ title, headers, rows })
    const sections = name === 'Financial Overview'
      ? [
          make('Summary', ['Revenue', 'Expenses', 'Ticket Sales', 'Attendance'], [[fmt(revenue), fmt(expenses), fmt(ticketRevenue), `${attended}/${state.registrations.length}`]]),
          make('Invoices', ['Ref', 'Client', 'Event', 'Amount', 'Paid', 'Status'], state.invoices.map((i) => [i.ref, clientName(i.clientId), eventName(i.eventId), i.amount, i.paid, i.status])),
          make('Expenses', ['Event', 'Category', 'Date', 'Amount'], state.expenses.map((e) => [eventName(e.eventId), e.category, e.date, e.amount])),
        ]
      : [
          make(name, {
            'Events Report': ['Event', 'Category', 'Client', 'Date', 'Status', 'Budget', 'Spent', 'Attendees'],
            'Revenue Report': ['Ref', 'Client', 'Event', 'Amount', 'Paid', 'Outstanding', 'Status'],
            'Expense Report': ['Event', 'Category', 'Date', 'Amount'],
            'Client Report': ['Company', 'Industry', 'City', 'Contact', 'Stage', 'Status', 'Value'],
            'Attendance Report': ['Event', 'Attendee', 'Type', 'Payment', 'Check-in'],
            'Ticket Sales Report': ['Event', 'Attendee', 'Type', 'Amount', 'Payment'],
            'Vendor Report': ['Vendor', 'Type', 'Contact', 'Rating', 'Contracts', 'Status'],
            'Staff Performance': ['Name', 'Role', 'Dept', 'Tasks', 'Done', 'Completion'],
            'Profitability Report': ['Event', 'Budget', 'Spent', 'Revenue', 'Net'],
          }[name], reportRows[name]),
          make('Overall Summary', ['Revenue', 'Expenses', 'Net'], [[fmt(revenue), fmt(expenses), fmt(revenue - expenses)]]),
        ]
    if (exportPDF(`${name} — ${new Date().toLocaleDateString()}`, sections)) {
      show(`${name} opened for PDF export`, 'success')
    } else {
      show('Popup blocked — allow popups to export PDF', 'warn')
    }
  }

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
            <button className="btn-outline" onClick={() => exportExcel('Financial Overview')}><FileSpreadsheet size={15} /> Excel</button>
            <button className="btn-primary" onClick={() => exportPdf('Financial Overview')}><Download size={15} /> PDF</button>
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
            <LineChart data={attendanceData.length > 0 ? attendanceData : [{ m: 'No data', reg: 0, att: 0 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
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
                <button className="btn-ghost !px-2 !py-1" title="Export Excel" onClick={() => exportExcel(name)}><FileSpreadsheet size={15} /></button>
                <button className="btn-ghost !px-2 !py-1" title="Export PDF" onClick={() => exportPdf(name)}><FileText size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff performance table */}
      <div className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <p className="font-bold text-brand-950">Staff Performance</p>
          <button className="btn-outline !py-1 text-xs" onClick={() => exportExcel('Staff Performance')}>Export</button>
        </div>
        <table className="w-full">
          <thead className="bg-brand-50/50"><tr><Th>Team Member</Th><Th>Role</Th><Th>Events</Th><Th>Tasks</Th><Th className="text-right">Completion</Th><Th>Rating</Th></tr></thead>
          <tbody className="divide-y divide-brand-50">
            {staffPerformance.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-ink/40">No staff performance data yet.</td></tr>
            ) : staffPerformance.map((s) => {
              const pct = s.tasks > 0 ? Math.round((s.done / s.tasks) * 100) : 0
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
