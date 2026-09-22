import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'amen_attendee_token'
const ATTENDEE_KEY = 'amen_attendee_data'

const AttendeeContext = createContext(null)

export function AttendeeProvider({ children }) {
  const [attendee, setAttendee] = useState(() => {
    try {
      const stored = localStorage.getItem(ATTENDEE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (tk) => {
    // Fast path: Supabase attendee sessions are validated directly from stored state
    if (String(tk).startsWith('sb_')) {
      const stored = localStorage.getItem(ATTENDEE_KEY)
      if (stored) {
        try {
          setAttendee(JSON.parse(stored))
          return true
        } catch {}
      }
    }
    try {
      const controller = new AbortController()
      const tId = setTimeout(() => controller.abort(), 1200)
      const res = await fetch(`${API_URL}/portal/auth/me`, {
        headers: { Authorization: `Bearer ${tk}` },
        signal: controller.signal,
      })
      clearTimeout(tId)
      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          setAttendee(data.attendee)
          localStorage.setItem(ATTENDEE_KEY, JSON.stringify(data.attendee))
          return true
        }
      }
      return false
    } catch {
      // Backend offline: keep existing localStorage attendee session
      const stored = localStorage.getItem(ATTENDEE_KEY)
      if (stored) {
        try {
          setAttendee(JSON.parse(stored))
          return true
        } catch {}
      }
      return false
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchMe(token).then((ok) => {
        if (!ok && !localStorage.getItem(ATTENDEE_KEY)) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [token, fetchMe])

  const login = (tk, att) => {
    localStorage.setItem(TOKEN_KEY, tk)
    localStorage.setItem(ATTENDEE_KEY, JSON.stringify(att))
    setToken(tk)
    setAttendee(att)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ATTENDEE_KEY)
    setToken(null)
    setAttendee(null)
  }

  const authFetch = async (path, options = {}) => {
    const headers = { ...options.headers }
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    try {
      const res = await fetch(`${API_URL}${path}`, { ...options, headers })
      return await res.json()
    } catch (e) {
      return { error: 'Network unavailable' }
    }
  }

  const value = {
    attendee,
    token,
    loading,
    login,
    logout,
    authFetch,
    isAuthenticated: !!attendee,
  }

  return <AttendeeContext.Provider value={value}>{children}</AttendeeContext.Provider>
}

export function useAttendee() {
  const ctx = useContext(AttendeeContext)
  if (!ctx) throw new Error('useAttendee must be used within AttendeeProvider')
  return ctx
}
