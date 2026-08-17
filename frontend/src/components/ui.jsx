import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, AlertTriangle, Info, TrendingUp, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'

// ---- Back navigation ---- 
export function BackButton({ fallback = '/', className = '', label = 'Back' }) {
  const navigate = useNavigate()
  const goBack = () => {
    const idx = window.history.state && typeof window.history.state.idx === 'number' ? window.history.state.idx : 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
  return (
    <button
      onClick={goBack}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 text-brand-700 transition hover:bg-brand-50 hover:text-brand-900 ${className}`}
    >
      <ArrowLeft size={18} />
    </button>
  )
}

// ---- Avatars / initials ---- 
export function Avatar({ name, initials, color = 'bg-brand-700', size = 'md', img }) {
  const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-full ${color} text-white font-bold ${sizes[size]} shrink-0`} title={name}>
      {img ? <img src={img} alt={name} className="h-full w-full object-cover" /> : (initials || (name ? name.split(' ').map((p) => p[0]).slice(0, 2).join('') : '?'))}
    </span>
  )
}

// ---- Status badge ---- 
const statusStyles = {
  completed: 'bg-brand-100 text-brand-800',
  ongoing: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  active: 'bg-brand-100 text-brand-800',
  upcoming: 'bg-gold-100 text-gold-700',
  pending: 'bg-gold-100 text-gold-700',
  todo: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-brand-100 text-brand-700',
  review: 'bg-gold-100 text-gold-700',
  done: 'bg-brand-100 text-brand-800',
  paid: 'bg-brand-100 text-brand-800',
  outstanding: 'bg-red-100 text-red-700',
  partial: 'bg-gold-100 text-gold-700',
  lead: 'bg-slate-100 text-slate-600',
  quotation: 'bg-sky-100 text-sky-700',
  contract: 'bg-brand-100 text-brand-800',
  negotiation: 'bg-violet-100 text-violet-700',
  opportunity: 'bg-indigo-100 text-indigo-700',
  confirmed: 'bg-brand-100 text-brand-800',
  available: 'bg-brand-100 text-brand-800',
  reserved: 'bg-sky-100 text-sky-700',
  booked: 'bg-gold-100 text-gold-700',
  'in-use': 'bg-sky-100 text-sky-700',
  maintenance: 'bg-red-100 text-red-700',
  retired: 'bg-slate-100 text-slate-500',
  'on-leave': 'bg-gold-100 text-gold-700',
  terminated: 'bg-red-100 text-red-700',
  sending: 'bg-sky-100 text-sky-700',
  sent: 'bg-brand-100 text-brand-800',
  draft: 'bg-slate-100 text-slate-500',
  inactive: 'bg-slate-100 text-slate-500',
  registering: 'bg-gold-100 text-gold-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700',
  medium: 'bg-gold-100 text-gold-700',
  low: 'bg-slate-100 text-slate-500',
  signed: 'bg-brand-100 text-brand-800',
  closed: 'bg-slate-100 text-slate-500',
  scheduled: 'bg-sky-100 text-sky-700',
  approved: 'bg-brand-100 text-brand-800',
  rejected: 'bg-red-100 text-red-700',
  invited: 'bg-sky-100 text-sky-700',
  declined: 'bg-red-100 text-red-700',
  canceled: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
  expired: 'bg-red-100 text-red-700',
  paused: 'bg-gold-100 text-gold-700',
  delivered: 'bg-brand-100 text-brand-800',
  postponed: 'bg-gold-100 text-gold-700',
}

export function Badge({ status, label }) {
  const cls = statusStyles[status] || 'bg-slate-100 text-slate-600'
  return <span className={`chip ${cls}`}>{label || status}</span>
}

export function PriorityDot({ level }) {
  const map = { urgent: 'bg-red-600', high: 'bg-red-500', medium: 'bg-gold-500', low: 'bg-slate-300' }
  return <span className={`inline-block h-2 w-2 rounded-full ${map[level] || map.low}`} />
}

// ---- Progress ---- 
export function Progress({ value, color = 'bg-brand-600', className = '' }) {
  const v = Math.min(100, Math.max(0, value || 0))
  return (
    <div className={`h-1.5 w-full rounded-full bg-brand-100 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${v}%` }} />
    </div>
  )
}

// ---- Page header ---- 
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm">
            <Icon size={20} />
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-950">{title}</h1>
          {subtitle && <p className="text-sm text-ink/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---- Stat card ---- 
export function StatCard({ label, value, sub, icon: Icon, tone = 'brand', delta }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-800',
    gold: 'bg-gold-50 text-gold-700',
    red: 'bg-red-50 text-red-600',
    sky: 'bg-sky-50 text-sky-700',
    ink: 'bg-ink/5 text-ink',
  }
  const iconTone = tones[tone]
  return (
    <div className="card p-5 flex flex-col gap-1.5 transition hover:shadow-pop">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink/55">{label}</span>
        {Icon && <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}><Icon size={18} /></span>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-brand-950">{value}</div>
      <div className="flex items-center gap-2 text-xs text-ink/45">
        {delta && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-brand-700">
            <TrendingUp size={12} /> {delta}
          </span>
        )}
        {sub}
      </div>
    </div>
  )
}

// ---- Simple data table shell ---- 
export function Th({ children, className = '' }) {
  return <th className={`px-4 py-2.5 ${className}`}><span className="table-hd">{children}</span></th>
}
export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
}

// ---- Modal ---- 
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} className={`relative w-full ${width} rounded-2xl bg-white shadow-pop max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100">
          <h3 className="font-bold text-brand-950">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink/40 hover:bg-brand-50 hover:text-brand-800">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ---- Field wrapper ---- 
export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

// ---- Toast system (lightweight) ---- 
const toastIcons = {
  success: <Check size={16} />,
  error: <X size={16} />,
  warn: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}
export function Toast({ toast }) {
  if (!toast) return null
  const tones = {
    success: 'border-brand-300 bg-brand-50 text-brand-900',
    error: 'border-red-300 bg-red-50 text-red-900',
    warn: 'border-gold-300 bg-gold-50 text-gold-900',
    info: 'border-sky-300 bg-sky-50 text-sky-900',
  }
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[slideUp_0.25s_ease]">
      <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-pop ${tones[toast.type] || tones.info}`}>
        <span className="flex h-5 w-5 items-center justify-center">{toastIcons[toast.type]}</span>
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>
    </div>
  )
}

// ---- Segmented / tabs ---- 
export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-brand-50 p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`tab ${value === o.value ? 'tab-active' : 'tab-idle'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---- Search input ---- 
export function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input className="input !pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

// ---- Empty state ---- 
export function EmptyState({ icon: Icon = Info, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={22} /></span>
      <p className="font-semibold text-brand-950">{title}</p>
      {subtitle && <p className="text-sm text-ink/45 max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ---- Skeleton loaders ----
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-brand-100/60 ${className}`} />
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="bg-brand-50/50">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-2.5"><Skeleton className="h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
        </tbody>
      </table>
    </div>
  )
}

// ---- Confirmation dialog for destructive actions ----
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Action', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-pop">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-700'}`}>
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-brand-950">{title}</h3>
              <p className="mt-1 text-sm text-ink/55">{message}</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline" onClick={onClose}>{cancelLabel}</button>
            <button className={`btn ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Breadcrumbs ----
export function Breadcrumbs({ items }) {
  return (
    <nav className="mb-4 flex items-center gap-1 text-xs text-ink/45">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={13} className="text-ink/25" />}
          {item.to ? (
            <a href={item.to} className="hover:text-brand-700 transition">{item.label}</a>
          ) : (
            <span className="font-semibold text-brand-800">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ---- Spinner ----
export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

// ---- Pagination ----
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return (
    <div className="flex items-center justify-between border-t border-brand-50 px-4 py-3">
      <span className="text-xs text-ink/45">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button className="btn-ghost !px-2 !py-1 text-xs" disabled={page === 1} onClick={() => onChange(page - 1)}>Prev</button>
        {pages.map((p) => (
          <button key={p} onClick={() => onChange(p)} className={`!px-2.5 !py-1 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-brand-600 text-white' : 'text-ink/55 hover:bg-brand-50'}`}>{p}</button>
        ))}
        <button className="btn-ghost !px-2 !py-1 text-xs" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  )
}