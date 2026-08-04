import React, { useState, useRef, useEffect } from 'react'
import { QrCode, ScanLine, Users, CheckCircle2, XCircle, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast } from '../components/ui'

export default function CheckIn() {
  const { state, checkIn, intent, clearIntent } = useData()
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)
  const [entered, setEntered] = useState('')
  const [scanned, setScanned] = useState('')
  const inputRef = useRef(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2400) }

  const activeEvent = state.events.find((e) => e.status === 'ongoing') || state.events[0]
  const regs = state.registrations.filter((r) => r.eventId === activeEvent.id)
  const checkedIn = regs.filter((r) => r.checkedIn)
  const pct = regs.length ? Math.round((checkedIn.length / regs.length) * 100) : 0

  const doCheck = (code) => {
    if (!code) return
    const res = checkIn(code.trim())
    if (res.ok) {
      setResult({ ok: true, name: res.reg.name, type: res.reg.type })
      show(`Welcome, ${res.reg.name}! Checked in`)
    } else if (res.reason === 'duplicate') {
      setResult({ ok: false, dup: true, name: res.reg.name })
      show('Already checked in — duplicate detected', 'warn')
    } else {
      setResult({ ok: false })
      show('QR code not found', 'error')
    }
    setScanned(code)
    setEntered('')
  }

  // Simulated scanner loop when "Scan mode" active
  const [scanning, setScanning] = useState(false)
  const simulateScan = () => {
    if (!scanning) return
    const pool = regs.filter((r) => !r.checkedIn)
    if (pool.length === 0) { setScanning(false); show('All guests checked in!', 'success'); return }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    doCheck(pick.qr)
    setTimeout(simulateScan, 1400)
  }
  const toggleScan = () => {
    setScanning((s) => {
      const next = !s
      if (next) setTimeout(simulateScan, 300)
      return next
    })
  }

  // Demo intent: auto-start the live scanner
  useEffect(() => {
    if (intent === 'checkin') {
      if (!scanning) toggleScan()
      clearIntent()
    }
  }, [intent])

  return (
    <div>
      <PageHeader
        title="QR Check-in System"
        subtitle={`Live check-in for "${activeEvent?.name}"`}
        icon={QrCode}
        actions={
          <>
            <button className="btn-outline" onClick={() => show('Offline sync enabled', 'info')}><WifiOff size={15} /> Offline Syncd/button>
            <button className={`btn-primary ${scanning ? '!bg-red-500 hover:!bg-red-600' : ''}`} onClick={toggleScan}>
              <ScanLine size={15} /> {scanning ? 'Stop Scanner' : 'Start Scanner'}
            </button>
          </>
        }
      />

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Checked Ind/p>
          <p className="mt-1 text-2xl font-black text-brand-800">{checkedIn.length}</p>
          <p className="text-xs text-ink/40">guests insided/p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Expectedd/p>
          <p className="mt-1 text-2xl font-black text-brand-950">{regs.length}</p>
          <p className="text-xs text-ink/40">registeredd/p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Attendanced/p>
          <p className="mt-1 text-2xl font-black text-gold-600">{pct}%</p>
          <p className="text-xs text-ink/40">of capacityd/p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Duplicates Blockedd/p>
          <p className="mt-1 text-2xl font-black text-red-500">2d/p>
          <p className="text-xs text-ink/40">rejected re-entriesd/p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Scanner panel */}
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Scannerd/p>
            {scanning && <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700"><span className="relative flex h-2 w-2"><span className="absolute h-2 w-2 animate-ping rounded-full bg-brand-500 opacity-75" /><span className="h-2 w-2 rounded-full bg-brand-600" /></span> Scanning…</span>}
          </div>

          {/* Simulated camera view */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-950">
            <div className="flex h-56 items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <span className="absolute h-full w-full rounded-2xl border-2 border-gold-400/70" />
                <span className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-gold-400" />
                <span className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-gold-400" />
                <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-gold-400" />
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-gold-400" />
                <QrCode size={52} className="text-white/25" />
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-mono text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-gold-400/50"
                  placeholder="Scan QR or type code…"
                  value={entered}
                  onChange={(e) => setEntered(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doCheck(entered)}
                />
              </div>
              <button onClick={() => doCheck(entered)} className="btn-gold !px-3"><RefreshCw size={15} /> Validated/button>
            </div>
          </div>

          {/* Result feedback */}
          <div className="mt-4">
            {result === null ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand-200 p-4 text-sm text-ink/45">
                <ScanLine size={18} className="text-brand-500" /> Waiting for a ticket to scan…
              </div>
            ) : result.ok ? (
              <div className="flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={20} /></span>
                <div>
                  <p className="font-bold text-brand-950">{result.name}</p>
                  <p className="text-xs text-brand-700">{result.type} ticket · Access grantedd/p>
                </div>
              </div>
            ) : result.dup ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-white"><AlertTriangle size={20} /></span>
                <div>
                  <p className="font-bold text-gold-800">{result.name} — duplicated/p>
                  <p className="text-xs text-gold-700">Ticket already used. Re-entry blocked.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white"><XCircle size={20} /></span>
                <div>
                  <p className="font-bold text-red-700">Invalid ticketd/p>
                  <p className="text-xs text-red-500">No matching registration found.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-brand-50/70 p-3 text-xs text-ink/55">
            <p className="mb-1 flex items-center gap-1.5 font-bold text-brand-800"><Users size={13} /> Demo hintd/p>
            Use the "Start Scanner" button to simulate live QR scans — real tickets get checked in automatically.
          </div>
        </div>

        {/* Entry log */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <p className="font-bold text-brand-950">Entry Logd/p>
            <span className="chip bg-brand-100 text-brand-800">{regs.length} entriesd/span>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {[...regs].reverse().map((r) => (
              <div key={r.id} className={`flex items-center gap-3 border-b border-brand-50 p-3.5 ${r.checkedIn ? '' : 'opacity-60'}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${r.checkedIn ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-400'}`}>
                  {r.checkedIn ? <CheckCircle2 size={17} /> : <span className="text-xs font-bold">{r.name[0]}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">{r.name}</p>
                  <p className="text-[11px] text-ink/40">{r.type} · {r.qr}</p>
                </div>
                <Badge status={r.checkedIn ? 'active' : 'todo'} label={r.checkedIn ? 'In' : 'Out'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
