import React, { useState, useRef, useEffect } from 'react'
import { QrCode, ScanLine, Users, CheckCircle2, XCircle, AlertTriangle, RefreshCw, WifiOff, Upload, Image as ImageIcon } from 'lucide-react'
import jsQR from 'jsqr'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast } from '../components/ui'
import { decodeTicket } from '../store/ticket'

export default function CheckIn() {
  const { state, checkIn, intent, clearIntent, logActivity, addNotification } = useData()
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)
  const [entered, setEntered] = useState('')
  const [scanned, setScanned] = useState('')
  const [offline, setOffline] = useState(false)
  const [queue, setQueue] = useState([])
  const inputRef = useRef(null)
  const uploadRef = useRef(null)

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2400) }

  const activeEvent = state.events.find((e) => e.status === 'ongoing') || state.events[0]
  const regs = state.registrations.filter((r) => r.eventId === activeEvent.id)
  const checkedIn = regs.filter((r) => r.checkedIn)
  const pct = regs.length ? Math.round((checkedIn.length / regs.length) * 100) : 0

  const offlineRef = useRef(false)
  const queueRef = useRef([])
  offlineRef.current = offline

  const flushQueue = async () => {
    const items = queueRef.current
    if (!items.length) { show('Nothing to sync', 'warn'); return }
    let ok = 0, dup = 0
    for (const it of items) {
      const res = await checkInRef.current(it.code, activeEvent.id)
      if (res && res.ok) ok++
      else if (res && res.reason === 'duplicate') dup++
    }
    queueRef.current = []
    setQueue([])
    if (ok) { logActivity(`${ok} offline check-ins synced`, 'checkin'); addNotification(`${ok} offline check-in(s) synced to the entry log`, 'checkin') }
    show(ok ? `${ok} offline scan(s) synced${dup ? `, ${dup} duplicate(s) skipped` : ''}` : 'Nothing to sync', ok ? 'success' : 'warn')
  }

  const doCheck = async (value) => {
    if (!value) return
    const parsed = decodeTicket(value)
    const code = parsed ? parsed.code : String(value).trim()
    setScanned(code)
    setEntered('')

    // Ticket from a DIFFERENT event's check-in screen should be clearly rejected,
    // not silently matched against this event.
    if (parsed?.payload?.eventId && parsed.payload.eventId !== activeEvent.id) {
      const p = parsed.payload
      setResult({ ok: false, payload: p, wrongEvent: true })
      show(`This ticket belongs to "${p.event || 'another event'}", not ${activeEvent.name}`, 'error')
      return
    }

    // Match by unique ticket code, attendee id, attendee name, or email — scoped
    // to this event's entry roll, so typing a name or code both work.
    const c = String(code).trim().toLowerCase()
    const reg = regsRef.current.find((r) =>
      (r.qr && r.qr.toLowerCase() === c) || (r.id && r.id.toLowerCase() === c) ||
      (r.name && r.name.toLowerCase() === c) || (r.email && r.email.toLowerCase() === c))
    if (!reg) {
      // A valid QR payload carries the attendee's full details even if not yet in
      // this event's local list — surface them instead of a blank "not found".
      if (parsed && parsed.payload) {
        const p = parsed.payload
        setResult({ ok: false, payload: p })
        show(`Ticket found for ${p.name || 'attendee'} — not on this event's roll`, 'warn')
      } else {
        setResult({ ok: false })
        show('Ticket not found — check the code or attendee name', 'error')
      }
      return
    }
    if (reg.checkedIn) {
      setResult({ ok: false, dup: true, name: reg.name, type: reg.type, email: reg.email })
      show('Already checked in — duplicate detected', 'warn')
      return
    }
    if (offlineRef.current) {
      queueRef.current = [...queueRef.current, { code: reg.qr, eventId: activeEvent.id, name: reg.name, type: reg.type, email: reg.email, phone: reg.phone }]
      setQueue(queueRef.current)
      setResult({ ok: true, queued: true, name: reg.name, type: reg.type, email: reg.email, phone: reg.phone })
      show('Saved offline — will sync when back online', 'success')
      return
    }
    const res = await checkInRef.current(reg.qr, activeEvent.id)
    if (res.ok) {
      setResult({ ok: true, name: res.reg.name, type: res.reg.type, email: res.reg.email, phone: res.reg.phone, amount: res.reg.amount, paid: res.reg.paid })
      show(`Welcome, ${res.reg.name}! Checked in`)
    } else if (res.reason === 'duplicate') {
      setResult({ ok: false, dup: true, name: res.reg.name, type: res.reg.type })
      show('Already checked in — duplicate detected', 'warn')
    } else if (res.reason === 'wrong-event') {
      setResult({ ok: false, payload: { name: res.reg?.name, event: res.reg && regsRef.current.length ? undefined : undefined }, wrongEvent: true })
      show(`This ticket belongs to another event — check-in is for "${activeEvent.name}"`, 'error')
    } else {
      setResult({ ok: false })
      show('Ticket not found — check the code or attendee name', 'error')
    }
  }

  // Simulated scanner — one guest per scan. Entering scan mode does NOT bulk
  // check everyone in; each scan validates exactly one ticket.
  const [scanning, setScanning] = useState(false)
  const scanningRef = useRef(false)
  const checkInRef = useRef(checkIn)
  const regsRef = useRef(regs)
  scanningRef.current = scanning
  checkInRef.current = checkIn
  regsRef.current = regs

  const simulateScan = () => {
    const queued = queueRef.current.map((q) => q.code)
    const pool = regsRef.current.filter((r) => !r.checkedIn && !queued.includes(r.qr))
    if (pool.length === 0) { show('All guests are checked in already', 'warn'); return }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    doCheck(pick.qr)
  }
  const toggleScan = () => {
    const next = !scanningRef.current
    scanningRef.current = next
    setScanning(next)
    if (next) show('Scanner active — scan one ticket at a time', 'success')
  }

  // Demo intent: run a single demo scan (idempotent under StrictMode)
  useEffect(() => {
    if (intent !== 'checkin') return
    clearIntent()
    if (scanningRef.current) return
    scanningRef.current = true
    setScanning(true)
    setTimeout(simulateScan, 300)
  }, [intent])

  const toggleOffline = () => {
    const next = !offline
    setOffline(next)
    offlineRef.current = next
    logActivity(`Offline sync mode ${next ? 'enabled' : 'disabled'}`, 'checkin')
    if (next) {
      addNotification('Offline sync enabled — scans queue locally until reconnection', 'checkin')
      show('Offline mode active — scans saved locally and synced when back online', 'success')
    } else {
      show('Back online — syncing queued scans…', 'success')
      setTimeout(flushQueue, 300)
    }
  }

  // Decode a QR ticket from an uploaded image and check the guest in
  const decodeFromImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const scale = Math.min(1, 700 / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.floor(img.width * scale))
          canvas.height = Math.max(1, Math.floor(img.height * scale))
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' })
          if (code && code.data) {
            doCheck(code.data)
            addNotification(`QR image decoded: ${code.data}`, 'checkin')
          } else {
            setResult({ ok: false, decodeError: true })
            show('No QR code found in image — try a clearer photo', 'error')
          }
        } catch (e) {
          show('Could not read this image', 'error')
        }
      }
      img.onerror = () => show('Could not load image file', 'error')
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <PageHeader
        title="QR Check-in System"
        subtitle={`Live check-in for "${activeEvent?.name}"`}
        icon={QrCode}
        actions={
          <>
            <button className={`btn-outline ${offline ? '!border-gold-500 !bg-gold-50 !text-gold-800' : ''}`} onClick={toggleOffline}><WifiOff size={15} /> {offline ? 'Offline Mode Active' : 'Offline Sync'}</button>
            <button className={`btn-primary ${scanning ? '!bg-red-500 hover:!bg-red-600' : ''}`} onClick={toggleScan}>
              <ScanLine size={15} /> {scanning ? 'Stop Scanner' : 'Start Scanner'}
            </button>
          </>
        }
      />

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Checked In</p>
          <p className="mt-1 text-2xl font-black text-brand-800">{checkedIn.length}</p>
          <p className="text-xs text-ink/40">guests inside</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Expected</p>
          <p className="mt-1 text-2xl font-black text-brand-950">{regs.length}</p>
          <p className="text-xs text-ink/40">registered</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Attendance</p>
          <p className="mt-1 text-2xl font-black text-gold-600">{pct}%</p>
          <p className="text-xs text-ink/40">of capacity</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink/55">Duplicates Blocked</p>
          <p className="mt-1 text-2xl font-black text-red-500">2</p>
          <p className="text-xs text-ink/40">rejected re-entries</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Scanner panel */}
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-brand-950">Scanner</p>
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
                  placeholder="Type ticket code, name, email or Scan QR…"
                  value={entered}
                  onChange={(e) => setEntered(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doCheck(entered)}
                />
              </div>
              <button onClick={() => doCheck(entered)} className="btn-gold !px-3"><RefreshCw size={15} /> Validate</button>
              {scanning && (
                <button onClick={simulateScan} className="btn-outline !bg-white/10 !border-white/25 !text-white hover:!bg-white/20 !px-3" title="Simulate scanning one ticket"><ScanLine size={15} /> Scan One</button>
              )}
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { decodeFromImage(e.target.files?.[0]); e.target.value = '' }}
              />
              <button onClick={() => uploadRef.current?.click()} className="btn-outline !bg-white/10 !border-white/25 !text-white hover:!bg-white/20 !px-3" title="Upload a QR ticket image"><Upload size={15} /> Upload QR</button>
            </div>
          </div>

          {/* Result feedback */}
          <div className="mt-4">
            {result === null ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand-200 p-4 text-sm text-ink/45">
                <ScanLine size={18} className="text-brand-500" /> Waiting for a ticket to scan…
              </div>
            ) : result.ok && result.queued ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-white"><WifiOff size={20} /></span>
                <div>
                  <p className="font-bold text-gold-800">{result.name}</p>
                  <p className="text-xs text-gold-700">{result.type} ticket · Saved offline — {result.email ? `${result.email} · ` : ''}queued for sync</p>
                </div>
              </div>
            ) : result.ok ? (
              <div className="flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={20} /></span>
                <div>
                  <p className="font-bold text-brand-950">{result.name}</p>
                  <p className="text-xs text-brand-700">{result.type} ticket · Access granted{result.email ? ` · ${result.email}` : ''}</p>
                  <p className="text-xs text-brand-700">{result.amount != null ? `ETB ${result.amount.toLocaleString()} · ${result.paid ? 'Paid' : 'Unpaid'}` : 'Instant validation OK'}</p>
                </div>
              </div>
            ) : result.wrongEvent ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white"><XCircle size={20} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-red-700">{result.payload?.name || 'Ticket'} — another event</p>
                  <p className="text-xs text-red-600">This ticket is for a different event. The check-in gate is for "{activeEvent.name}".</p>
                </div>
              </div>
            ) : result.payload ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-white"><AlertTriangle size={20} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-gold-800">{result.payload.name || 'Attendee'}</p>
                  <p className="text-xs text-gold-700">
                    {[result.payload.type, result.payload.event, result.payload.email, result.payload.phone, result.payload.amount != null ? `ETB ${Number(result.payload.amount).toLocaleString()}` : ''].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-[11px] font-semibold text-gold-700">Valid QR — not on this event's entry list</p>
                </div>
              </div>
            ) : result.dup ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-white"><AlertTriangle size={20} /></span>
                <div>
                  <p className="font-bold text-gold-800">{result.name} — duplicate</p>
                  <p className="text-xs text-gold-700">Ticket already used. Re-entry blocked.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white"><XCircle size={20} /></span>
                <div>
                  <p className="font-bold text-red-700">Invalid ticket</p>
                  <p className="text-xs text-red-500">No matching registration found.</p>
                </div>
              </div>
            )}
          </div>

          {queue.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-gold-300 bg-gold-50 px-3 py-2.5 text-xs">
              <span className="font-bold text-gold-800"><WifiOff size={13} className="mr-1 inline" />{queue.length} offline scan{queue.length !== 1 ? 's' : ''} pending sync</span>
              <button onClick={flushQueue} className="btn-outline !py-1 text-xs"><RefreshCw size={12} /> Sync Now</button>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-brand-50/70 p-3 text-xs text-ink/55">
            <p className="mb-1 flex items-center gap-1.5 font-bold text-brand-800"><Users size={13} /> Demo hint</p>
            Tickets embed the attendee's full details in the QR and are unique per event. Scan a QR image (Upload), type the attendee's ticket code, name or email (Enter / Validate), use "Start Scanner" then "Scan One" to simulate live scans, or enable "Offline Sync" to queue scans and sync them later. Tickets for another event are clearly rejected.
          </div>
        </div>

        {/* Entry log */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-100 p-4">
            <p className="font-bold text-brand-950">Entry Log</p>
            <span className="chip bg-brand-100 text-brand-800">{regs.length} entries</span>
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

