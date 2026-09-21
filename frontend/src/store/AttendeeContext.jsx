import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'amen_attendee_token'

const AttendeeContext = createContext(null)

export function AttendeeProvider({ children }) {
  const [attendee, setAttendee] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (tk) => {
    try {
      const res = await fetch(`${API_URL}/portal/auth/me`, {
        headers: { Authorization: `Bearer ${tk}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAttendee(data.attendee)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchMe(token).then((ok) => {
        if (!ok) {
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
    setToken(tk)
    setAttendee(att)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setAttendee(null)
  }

  const authFetch = async (path, options = {}) => {
    const headers = { ...options.headers }
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })
    return res.json()
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
