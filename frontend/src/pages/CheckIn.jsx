import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QrCode, ScanLine, Users, CheckCircle2, XCircle, AlertTriangle, RefreshCw, WifiOff, Upload, Image as ImageIcon, Download, X, Ticket as TicketIcon } from 'lucide-react'
import jsQR from 'jsqr'
import { QRCodeCanvas } from 'qrcode.react'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, SkeletonPage } from '../components/ui'
import { decodeTicket, ticketPayload, encodeTicket } from '../store/ticket'
import { fmt } from '../store/data'

export default function CheckIn() {
  const { state, checkIn, intent, clearIntent, logActivity, addNotification, loading } = useData()
  if (loading) return <SkeletonPage />
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)
  const [entered, setEntered] = useState('')
  const [scanned, setScanned] = useState('')
  const [offline, setOffline] = useState(false)
  const [queue, setQueue] = useState([])
  const [ticketView, setTicketView] = useState(null)
  const inputRef = useRef(null)
  const uploadRef = useRef(null)
  const qrCanvasRef = useRef(null)

  useEffect(() => {
    if (ticketView) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [ticketView])

  const show = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 2400) }

  const downloadQr = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || !ticketView) return
    const safeName = (ticketView.name || 'attendee').replace(/[^\w\u00C0-\u024F]+/g, '_').slice(0, 40)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${ticketView.qr || 'ticket'}-${safeName}.png`
    a.click()
    show(`Ticket QR saved as ${a.download}`)
  }

  const ongoingEvents = state.events.filter((e) => e.status === 'ongoing')
  const upcomingEvents = state.events.filter((e) => e.status === 'upcoming')
  const activeEvents = ongoingEvents.length > 0 ? ongoingEvents : state.events.filter((e) => e.status !== 'pending_review' && e.status !== 'declined')

  const [selectedEventId, setSelectedEventId] = useState('all')

  const activeEvent = selectedEventId === 'all'
    ? (ongoingEvents[0] || activeEvents[0] || state.events[0])
    : (state.events.find((e) => e.id === selectedEventId) || state.events[0])

  const regs = selectedEventId === 'all'
    ? state.registrations.filter((r) => {
        const ev = state.events.find((e) => e.id === r.eventId)
        return ev && (ev.status === 'ongoing' || ev.status === 'upcoming')
      })
    : state.registrations.filter((r) => r.eventId === activeEvent?.id)

  const checkedIn = regs.filter((r) => r.checkedIn)
  const pct = regs.length ? Math.round((checkedIn.length / regs.length) * 100) : 0

  const [scanning, setScanning] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const scanningRef = useRef(false)
  const checkInRef = useRef(checkIn)
  const regsRef = useRef(regs)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastScanRef = useRef('')
  const cameraOnRef = useRef(false)
  const offlineRef = useRef(false)
  const queueRef = useRef([])

  scanningRef.current = scanning
  checkInRef.current = checkIn
  regsRef.current = regs
  cameraOnRef.current = cameraOn
  offlineRef.current = offline

  const flushQueue = async () => {
    const items = queueRef.current
    if (!items.length) { show('Nothing to sync', 'warn'); return }
    let ok = 0, dup = 0
    for (const it of items) {
      const targetId = it.eventId || activeEvent?.id
      const res = await checkInRef.current(it.code, targetId)
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

    const c = String(code).trim().toLowerCase()

    // 1. Look up attendee across registrations in state
    let reg = state.registrations.find((r) =>
      (r.qr && r.qr.toLowerCase() === c) ||
      (r.id && r.id.toLowerCase() === c) ||
      (r.name && r.name.toLowerCase() === c) ||
      (r.email && r.email.toLowerCase() === c)
    )

    let matchedEv = null
    if (reg) {
      matchedEv = state.events.find((e) => e.id === reg.eventId)
    } else if (parsed?.payload?.eventId) {
      matchedEv = state.events.find((e) => e.id === parsed.payload.eventId)
    } else if (selectedEventId !== 'all') {
      matchedEv = activeEvent
    }

    if (!reg) {
      // Attempt live database check via checkIn
      if (!offlineRef.current) {
        const queryEventId = selectedEventId === 'all' ? undefined : activeEvent?.id
        const res = await checkInRef.current(code, queryEventId)
        if (res?.ok) {
          const full = res.reg
          const ev = state.events.find((e) => e.id === full?.eventId) || activeEvent
          setResult({
            ok: true,
            full,
            name: full?.name,
            type: full?.type,
            email: full?.email,
            phone: full?.phone,
            amount: full?.amount,
            paid: full?.paid,
            paymentMethod: full?.paymentMethod,
            eventName: ev?.name,
          })
          setTicketView({ ...full, event: ev, venue: ev ? state.venues.find((v) => v.id === ev.venueId) : null })
          show(`Welcome, ${full?.name || 'Guest'}! Checked in to "${ev.name}"`)
          return
        } else if (res?.reason === 'duplicate') {
          setResult({ ok: false, dup: true, name: res.reg?.name, type: res.reg?.type })
          show('Already checked in - duplicate detected', 'warn')
          return
        } else if (res?.reason === 'wrong-event') {
          const otherEv = state.events.find((e) => e.id === res.reg?.eventId)
          if (otherEv && (otherEv.status === 'ongoing' || otherEv.status === 'upcoming')) {
            const retryRes = await checkInRef.current(code, otherEv.id)
            if (retryRes?.ok) {
              const full = retryRes.reg
              setResult({
                ok: true,
                full,
                name: full?.name,
                type: full?.type,
                email: full?.email,
                phone: full?.phone,
                amount: full?.amount,
                paid: full?.paid,
                paymentMethod: full?.paymentMethod,
                eventName: otherEv.name,
              })
              setTicketView({ ...full, event: otherEv, venue: state.venues.find((v) => v.id === otherEv.venueId) })
              show(`Welcome, ${full?.name}! Checked in to ongoing event "${otherEv.name}"`)
              return
            }
          }
          setResult({ ok: false, payload: { name: res.reg?.name, event: otherEv?.name }, wrongEvent: true })
          show(`Ticket belongs to event "${otherEv?.name || 'another event'}"`, 'warn')
          return
        }
      }

      if (parsed && parsed.payload) {
        const p = parsed.payload
        setResult({ ok: false, payload: p })
        show(`Ticket found for ${p.name || 'attendee'} - not registered on roll`, 'warn')
      } else {
        setResult({ ok: false })
        show('Ticket not found - check code or name', 'error')
      }
      return
    }

    const effectiveEvent = matchedEv || activeEvent

    if (reg.checkedIn) {
      setResult({ ok: false, dup: true, name: reg.name, type: reg.type, email: reg.email, eventName: effectiveEvent?.name })
      show(`Already checked in for "${effectiveEvent?.name || 'this event'}" - duplicate detected`, 'warn')
      return
    }

    if (offlineRef.current) {
      queueRef.current = [...queueRef.current, { code: reg.qr || reg.id, eventId: effectiveEvent.id, name: reg.name, type: reg.type, email: reg.email, phone: reg.phone }]
      setQueue(queueRef.current)
      setResult({ ok: true, queued: true, full: reg, name: reg.name, type: reg.type, email: reg.email, phone: reg.phone, eventName: effectiveEvent.name })
      show(`Saved offline for "${effectiveEvent.name}" - will sync when back online`, 'success')
      return
    }

    const checkRes = await checkInRef.current(reg.qr || reg.id, effectiveEvent.id)
    if (checkRes.ok) {
      const full = checkRes.reg || reg
      setResult({
        ok: true,
        full,
        name: full.name,
        type: full.type,
        email: full.email,
        phone: full.phone,
        amount: full.amount,
        paid: full.paid,
        paymentMethod: full.paymentMethod,
        eventName: effectiveEvent.name,
      })
      setTicketView({ ...full, event: effectiveEvent, venue: state.venues.find((v) => v.id === effectiveEvent.venueId) })
      show(`Welcome, ${full.name}! Checked in to "${effectiveEvent.name}"`)
    } else if (res.reason === 'duplicate') {
      setResult({ ok: false, dup: true, name: res.reg?.name || reg.name, type: res.reg?.type || reg.type, eventName: effectiveEvent.name })
      show('Already checked in - duplicate detected', 'warn')
    } else {
      setResult({ ok: false })
      show('Validation error - please re-scan', 'error')
    }
  }

  // Continuously decode QR codes from the live camera feed
  const scanLoop = () => {
    const video = videoRef.current
    if (!video || !cameraOnRef.current) return
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Look for jsQR globally
      if (typeof window !== 'undefined' && window.jsQR) {
        const code = window.jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data && code.data !== lastScanRef.current) {
          lastScanRef.current = code.data
          doCheck(code.data)
          // Brief throttle so we don't scan the same frame 60 times a second
          setTimeout(() => { lastScanRef.current = '' }, 2500)
        }
      }
    }
    if (cameraOnRef.current) {
      rafRef.current = requestAnimationFrame(scanLoop)
    }
  }

  const stopCamera = () => {
    cameraOnRef.current = false
    setCameraOn(false)
    scanningRef.current = false
    setScanning(false)
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } })
      streamRef.current = stream
      cameraOnRef.current = true
      setCameraOn(true)
      scanningRef.current = true
      setScanning(true)
      show('Camera active - point at a QR ticket to check in', 'success')
      scanLoop()
    } catch (e) {
      // No camera / permission denied → fall back to simulated manual scanner
      cameraOnRef.current = false
      setCameraOn(false)
      scanningRef.current = true
      setScanning(true)
      show('Camera unavailable - using simulated scanner', 'warn')
    }
  }

  const simulateScan = () => {
    const queued = queueRef.current.map((q) => q.code)
    const pool = regsRef.current.filter((r) => !r.checkedIn && !queued.includes(r.qr))
    if (pool.length === 0) { show('All guests are checked in already', 'warn'); return }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    doCheck(pick.qr)
  }
  const toggleScan = () => {
    if (scanningRef.current) { stopCamera(); show('Scanner stopped', 'warn'); return }
    startCamera()
  }

  // Demo intent: run a single demo scan (idempotent under StrictMode)
  useEffect(() => {
    if (intent !== 'checkin') return
    clearIntent()
    if (scanningRef.current) { setTimeout(simulateScan, 300); return }
    setTimeout(simulateScan, 300)
  }, [intent])

  // Cleanup camera on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
  }, [])

  const toggleOffline = () => {
    const next = !offline
    setOffline(next)
    offlineRef.current = next
    logActivity(`Offline sync mode ${next ? 'enabled' : 'disabled'}`, 'checkin')
    if (next) {
      addNotification('Offline sync enabled - scans queue locally until reconnection', 'checkin')
      show('Offline mode active - scans saved locally and synced when back online', 'success')
    } else {
      show('Back online - syncing queued scans…', 'success')
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
            show('No QR code found in image - try a clearer photo', 'error')
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
        subtitle={
          selectedEventId === 'all'
            ? `Universal check-in active across all ongoing events (${ongoingEvents.length} live)`
            : `Live check-in for "${activeEvent?.name}"`
        }
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

      {/* Event Selector & Mode Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <ScanLine size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-brand-950 text-sm">Event Check-in Gate</h3>
              <span className="chip bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ● Live Gate
              </span>
            </div>
            <p className="text-xs text-ink/50">
              {selectedEventId === 'all'
                ? `Universal Mode: Tickets for any ongoing event are accepted and checked in automatically.`
                : `Focused on: ${activeEvent?.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink/60 shrink-0">Select Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value)
              setResult(null)
            }}
            className="input !py-1.5 text-xs font-bold text-brand-950 pr-8"
          >
            <option value="all">⚡ All Ongoing Events (Universal Check-in)</option>
            {ongoingEvents.map((e) => (
              <option key={e.id} value={e.id}>
                ● [Ongoing] {e.name} ({state.registrations.filter((r) => r.eventId === e.id).length} registered)
              </option>
            ))}
            {upcomingEvents.map((e) => (
              <option key={e.id} value={e.id}>
                ○ [Upcoming] {e.name} ({state.registrations.filter((r) => r.eventId === e.id).length} registered)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ongoing event quick chips */}
      {selectedEventId === 'all' && ongoingEvents.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink/45">Ongoing Events:</span>
          {ongoingEvents.map((ev) => {
            const evRegs = state.registrations.filter((r) => r.eventId === ev.id)
            const evChecked = evRegs.filter((r) => r.checkedIn)
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEventId(ev.id)}
                className="chip bg-white hover:bg-brand-50 text-brand-950 border border-brand-200 text-xs py-1 px-3 flex items-center gap-2 shadow-xs transition"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">{ev.name}:</span>
                <span className="text-brand-700 font-semibold">{evChecked.length}/{evRegs.length} in</span>
              </button>
            )
          })}
        </div>
      )}

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

          {/* Camera / simulated view */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-950">
            <div className="relative flex h-56 items-center justify-center">
              {cameraOn ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-40 w-40 items-center justify-center rounded-2xl">
                      <span className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-2xl border-l-4 border-t-4 border-gold-400" />
                      <span className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-2xl border-r-4 border-t-4 border-gold-400" />
                      <span className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-2xl border-b-4 border-l-4 border-gold-400" />
                      <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-2xl border-b-4 border-r-4 border-gold-400" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-36 w-36 items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    <span className="absolute h-full w-full rounded-2xl border-2 border-gold-400/70" />
                    <span className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-gold-400" />
                    <span className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-gold-400" />
                    <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-gold-400" />
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-gold-400" />
                    <QrCode size={52} className="text-white/25" />
                  </div>
                </div>
              )}
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
              {scanning && !cameraOn && (
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
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gold-800">{result.name}</p>
                  <p className="text-xs text-gold-700">{result.type} ticket · Saved offline - {result.email ? `${result.email} · ` : ''}queued for sync</p>
                  <button onClick={() => setTicketView({ ...result.full, event: activeEvent, venue: activeEvent ? state.venues.find((v) => v.id === activeEvent.venueId) : null })} className="btn-outline !py-1 mt-2 text-xs"><TicketIcon size={12} /> View Full Ticket</button>
                </div>
              </div>
            ) : result.ok ? (
              <div className="flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-950">{result.name}</p>
                  <p className="text-xs text-brand-700">{result.type} ticket · Access granted{result.email ? ` · ${result.email}` : ''}</p>
                  <p className="text-xs text-brand-700">{result.amount != null ? `ETB ${result.amount.toLocaleString()} · ${result.paymentMethod || 'Cash'} · ${result.paid ? 'Paid' : 'Unpaid'}` : 'Instant validation OK'}</p>
                  <button onClick={() => setTicketView(result.full || result)} className="btn-outline !py-1 mt-2 text-xs"><TicketIcon size={12} /> View Full Ticket</button>
                </div>
              </div>
            ) : result.wrongEvent ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white"><XCircle size={20} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-red-700">{result.payload?.name || 'Ticket'} - another event</p>
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
                  <p className="text-[11px] font-semibold text-gold-700">Valid QR - not on this event's entry list</p>
                </div>
              </div>
            ) : result.dup ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-white"><AlertTriangle size={20} /></span>
                <div>
                  <p className="font-bold text-gold-800">{result.name} - duplicate</p>
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
            Tickets embed the attendee's full details in the QR and are unique per event. "Start Scanner" opens your live camera for real QR detection (falls back to a simulated scanner if no camera is available), you can upload a QR image (Upload), or type the attendee's ticket code, name or email (Enter / Validate). Enable "Offline Sync" to queue scans and sync them later. Tickets for another event are clearly rejected.
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
                  <p className="truncate text-[11px] text-ink/40">
                    {r.type} · {r.qr}{state.events.find((e) => e.id === r.eventId) ? ` · ${state.events.find((e) => e.id === r.eventId)?.name}` : ''}{r.paymentMethod ? ` · ${r.paymentMethod}` : ''}
                  </p>
                </div>
                <Badge status={r.checkedIn ? 'active' : 'todo'} label={r.checkedIn ? (r.checkedInAt ? `In ${r.checkedInAt}` : 'In') : 'Out'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full ticket detail modal */}
      {ticketView && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-[2px] transition-opacity" onClick={() => setTicketView(null)} />
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-pop z-10 animate-scale-in">
            <button onClick={() => setTicketView(null)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={15} /></button>
            <div className="bg-brand-900 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-300">Validated Entry Ticket</p>
                  <p className="font-bold">{ticketView.event?.name || activeEvent?.name || 'Event'}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 font-black text-brand-950">
                  {(ticketView.name || 'A').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="border-b border-dashed border-brand-200 px-6 py-5 text-center">
              <div className="mx-auto mb-3 flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-brand-100 bg-white p-3">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={encodeTicket(ticketPayload(ticketView, ticketView.event, ticketView.venue)) || ticketView.qr}
                  size={152}
                  level="M"
                  includeMargin={false}
                  fgColor="#082408"
                  bgColor="#ffffff"
                />
              </div>
              <p className="font-mono text-sm font-bold tracking-widest text-brand-900">{ticketView.qr}</p>
              <p className="mt-1 text-xs text-ink/45">Unique ticket code - cannot be re-used after entry</p>
            </div>
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={16} /></span>
                  <div>
                    <p className="text-sm font-bold text-brand-950">Checked in</p>
                    <p className="text-[11px] text-ink/45">{ticketView.checkedInAt || 'Just now'}</p>
                  </div>
                </div>
                <Badge status={ticketView.type === 'VIP' ? 'pending' : 'done'} label={ticketView.type} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-950">{ticketView.name}</p>
                  {ticketView.email && <p className="text-xs text-ink/45">{ticketView.email}</p>}
                  {ticketView.phone && <p className="text-xs text-ink/45">{ticketView.phone}</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-50/60 p-3 text-sm">
                {[
                  ['Event', ticketView.event?.name || '-'],
                  ['Category', ticketView.event?.category || '-'],
                  ['Date & Time', ticketView.event ? `${ticketView.event.date} · ${ticketView.event.time}` : '-'],
                  ['Venue', ticketView.venue?.name || '-'],
                  ['Ticket Type', ticketView.type || '-'],
                  ['Amount', fmt(ticketView.amount)],
                  ['Payment Method', ticketView.paymentMethod || 'Cash'],
                  ['Payment', ticketView.paid ? 'Paid' : 'Unpaid'],
                  ['Ticket Code', ticketView.qr || '-'],
                  ['Entry Time', ticketView.checkedInAt || '-'],
                ].map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink/45">{k}</span>
                    <span className="truncate text-xs font-bold text-brand-950">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary flex-1" onClick={downloadQr}><Download size={15} /> Download QR</button>
                <button className="btn-outline" onClick={() => setTicketView(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Toast toast={toast} />
    </div>
  )
}

