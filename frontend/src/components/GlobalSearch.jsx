import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, CalendarCheck2, Users, Package, FileText, Ticket, X } from 'lucide-react'
import api from '../store/api'

const typeIcons = {
  client: Building2,
  event: CalendarCheck2,
  staff: Users,
  vendor: Package,
  resource: Package,
  invoice: FileText,
  registration: Ticket,
  document: FileText,
}

const typeColors = {
  client: 'bg-brand-50 text-brand-700',
  event: 'bg-gold-50 text-gold-700',
  staff: 'bg-sky-50 text-sky-700',
  vendor: 'bg-violet-50 text-violet-700',
  resource: 'bg-emerald-50 text-emerald-700',
  invoice: 'bg-red-50 text-red-600',
  registration: 'bg-indigo-50 text-indigo-700',
  document: 'bg-slate-100 text-slate-600',
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const navigate = useNavigate()
  const ref = useRef(null)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const { results: res } = await api.search.global(q)
      setResults(res)
      setHighlight(0)
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 300)
    } else {
      setResults([])
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, doSearch])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKey = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && results[highlight]) {
      e.preventDefault()
      navigate(results[highlight].to)
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectResult = (r) => {
    navigate(r.to)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onKeyDown={handleKey}
        placeholder="Search clients, events, staff, vendors…"
        className="w-full rounded-lg border border-brand-100 bg-brand-50/40 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
      />
      {query && (
        <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
          <X size={15} />
        </button>
      )}

      {open && (query.trim().length >= 2) && (
        <div className="absolute top-12 z-50 w-full rounded-xl border border-brand-100 bg-white shadow-pop overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-ink/40">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink/40">No results found for "{query}"</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((r, i) => {
                const Icon = typeIcons[r.type] || FileText
                const color = typeColors[r.type] || 'bg-slate-100 text-slate-600'
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => selectResult(r)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${i === highlight ? 'bg-brand-50' : 'hover:bg-brand-50/50'}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-950">{r.title}</p>
                      <p className="truncate text-xs text-ink/45">{r.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-ink/30">{r.type}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
