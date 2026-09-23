function resolveApiUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim()
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isLocal && envUrl.includes('localhost')) {
      return `${window.location.origin}/api`
    }
  }
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '')
    return clean.endsWith('/api') ? clean : `${clean}/api`
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return '/api'
}

export const API_URL = resolveApiUrl()

// Token storage with localStorage persistence across refreshes
let accessToken = typeof window !== 'undefined' ? localStorage.getItem('amen_access_token') : null
let refreshToken = typeof window !== 'undefined' ? localStorage.getItem('amen_refresh_token') : null

export function setTokens(access, refresh) {
  accessToken = access
  refreshToken = refresh
  if (access) localStorage.setItem('amen_access_token', access)
  else localStorage.removeItem('amen_access_token')
  if (refresh) localStorage.setItem('amen_refresh_token', refresh)
  else localStorage.removeItem('amen_refresh_token')
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('amen_access_token')
  localStorage.removeItem('amen_refresh_token')
}

export function getAccessToken() {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('amen_access_token')
  }
  return accessToken
}

export function loadRefreshToken() {
  if (!refreshToken && typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('amen_refresh_token')
  }
  return refreshToken
}

// Core fetch wrapper with auto-refresh and timeout protection
async function apiFetch(path, options = {}) {
  const token = getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Fast timeout to prevent blocking the UI when backend is unreachable or on serverless cold starts
  const timeoutMs = options.timeout || 2000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    throw new Error(err.name === 'AbortError' ? 'Backend API request timed out' : (err.message || 'Network request failed'))
  }
  clearTimeout(timeoutId)

  // Ensure response is actually JSON and not an HTML SPA fallback (e.g. Vercel index.html)
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Backend API unavailable (non-JSON response)')
  }

  // Auto-refresh on 401
  const currentRefresh = loadRefreshToken()
  if (res.status === 401 && currentRefresh && !options._retried) {
    let refreshRes = null
    try {
      refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      })
    } catch (e) {}

    if (refreshRes && refreshRes.ok) {
      const { accessToken: newToken } = await refreshRes.json().catch(() => ({}))
      if (newToken) {
        setTokens(newToken, currentRefresh)
        headers.Authorization = `Bearer ${newToken}`
        res = await fetch(`${API_URL}${path}`, { ...options, headers, _retried: true })
      }
    } else {
      clearTokens()
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || error.message || 'Request failed')
  }

  return res.json()
}

// ─── AUTH ──────────────────────────────────────────────────────

export const auth = {
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: () => apiFetch('/auth/me'),

  updateProfile: (data) =>
    apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  updatePassword: (currentPassword, newPassword) =>
    apiFetch('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  updateTwoStep: (enabled) =>
    apiFetch('/auth/two-step', { method: 'PUT', body: JSON.stringify({ enabled }) }),

  loginHistory: () => apiFetch('/auth/login-history'),

  forgotPassword: (email) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token, newPassword) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  sendOtp: (email, purpose) =>
    apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),

  verifyOtp: (email, otp) =>
    apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  clientRegister: (data) =>
    apiFetch('/auth/client-register', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── CLIENT PORTAL ─────────────────────────────────────────────

export const portal = {
  getDashboard: () => apiFetch('/portal/dashboard'),
  getEvents: () => apiFetch('/portal/events'),
  createEvent: (data) => apiFetch('/portal/events', { method: 'POST', body: JSON.stringify(data) }),
  getInvoices: () => apiFetch('/portal/invoices'),
  getRegistrations: () => apiFetch('/portal/registrations'),
}

// ─── WORKFLOW ───────────────────────────────────────────────────

export const workflow = {
  getStages: () => apiFetch('/workflow/stages').catch(() => ({ stages: [] })),
  getAll: () => apiFetch('/workflow').catch(() => ({ events: [] })),
  getEvent: (eventId) => apiFetch(`/workflow/${eventId}`).catch(() => null),
  advance: (eventId, note) => apiFetch(`/workflow/${eventId}/advance`, { method: 'POST', body: JSON.stringify({ note }) }).catch(() => null),
  revert: (eventId, note) => apiFetch(`/workflow/${eventId}/revert`, { method: 'POST', body: JSON.stringify({ note }) }).catch(() => null),
  setStage: (eventId, stageId, note) => apiFetch(`/workflow/${eventId}/set-stage`, { method: 'POST', body: JSON.stringify({ stageId, note }) }).catch(() => null),
  getLogs: (eventId) => apiFetch(`/workflow/${eventId}/logs`).catch(() => ({ logs: [] })),
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────

export const notifications = {
  list: () => apiFetch('/notifications'),
  markRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiFetch('/notifications/read-all', { method: 'POST' }),
}

// ─── APPROVALS ──────────────────────────────────────────────────

export const approvals = {
  list: () => apiFetch('/approvals'),
  pending: () => apiFetch('/approvals/pending'),
  submit: (data) => apiFetch('/approvals', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, reviewNote) => apiFetch(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),
  reject: (id, reviewNote) => apiFetch(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),
  revision: (id, reviewNote) => apiFetch(`/approvals/${id}/revision`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),
}

// ─── DOCUMENTS ──────────────────────────────────────────────────

export const documents = {
  list: (module, entityId) => apiFetch(`/documents${module ? `?module=${module}${entityId ? `&entityId=${entityId}` : ''}` : ''}`),
  upload: (data) => apiFetch('/documents', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
}

// ─── CALENDAR ───────────────────────────────────────────────────

export const calendar = {
  list: (month, year) => apiFetch(`/calendar${month != null ? `?month=${month}&year=${year}` : ''}`),
  create: (data) => apiFetch('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/calendar/${id}`, { method: 'DELETE' }),
}

// ─── DASHBOARD (bulk fetch) ────────────────────────────────────

export const dashboard = {
  getAll: () => apiFetch('/dashboard'),
}

// ─── CLIENTS ───────────────────────────────────────────────────

export const clients = {
  list: () => apiFetch('/clients'),
  create: (data) => apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/clients/${id}`, { method: 'DELETE' }),
}

// ─── EVENTS ────────────────────────────────────────────────────

export const events = {
  list: () => apiFetch('/events'),
  create: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  review: (id, data) => apiFetch(`/events/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  setTeam: (id, memberIds) => apiFetch(`/events/${id}/team`, { method: 'PUT', body: JSON.stringify({ memberIds }) }),
  setBudget: (id, budget) => apiFetch(`/events/${id}/budget`, { method: 'PUT', body: JSON.stringify({ budget }) }),
}

// ─── TASKS ─────────────────────────────────────────────────────

export const tasks = {
  list: () => apiFetch('/tasks'),
  create: (data) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
}

// ─── VENUES ────────────────────────────────────────────────────

export const venues = {
  list: () => apiFetch('/venues'),
  create: (data) => apiFetch('/venues', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/venues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/venues/${id}`, { method: 'DELETE' }),
}

// ─── RESOURCES ─────────────────────────────────────────────────

export const resources = {
  list: () => apiFetch('/resources'),
  create: (data) => apiFetch('/resources', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/resources/${id}`, { method: 'DELETE' }),
  allocate: (id, eventId, qty) => apiFetch(`/resources/${id}/allocate`, { method: 'POST', body: JSON.stringify({ eventId, qty }) }),
}

// ─── VENDORS ───────────────────────────────────────────────────

export const vendors = {
  list: () => apiFetch('/vendors'),
  create: (data) => apiFetch('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/vendors/${id}`, { method: 'DELETE' }),
}

// ─── USERS / STAFF ─────────────────────────────────────────────

export const users = {
  list: () => apiFetch('/users'),
  create: (data) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
  roles: () => apiFetch('/users/roles'),
  permissions: () => apiFetch('/users/permissions'),
}

// ─── FINANCE ───────────────────────────────────────────────────

export const finance = {
  list: () => apiFetch('/finance'),
  createInvoice: (data) => apiFetch('/finance/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (invoiceId, amount) => apiFetch(`/finance/invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify({ amount }) }),
  recordExpense: (data) => apiFetch('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── REGISTRATIONS ─────────────────────────────────────────────

export const registrations = {
  list: () => apiFetch('/registrations'),
  create: (data) => apiFetch('/registrations', { method: 'POST', body: JSON.stringify(data) }),
  checkIn: (qr) => apiFetch('/registrations/checkin', { method: 'POST', body: JSON.stringify({ qr }) }),
}

// ─── MODULES (speakers, exhibitors, sponsors, campaigns, coupons) ──

export const modules = {
  speakers: () => apiFetch('/modules/speakers'),
  createSpeaker: (data) => apiFetch('/modules/speakers', { method: 'POST', body: JSON.stringify(data) }),
  updateSpeaker: (id, data) => apiFetch(`/modules/speakers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  exhibitors: () => apiFetch('/modules/exhibitors'),
  createExhibitor: (data) => apiFetch('/modules/exhibitors', { method: 'POST', body: JSON.stringify(data) }),
  updateExhibitor: (id, data) => apiFetch(`/modules/exhibitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sponsors: () => apiFetch('/modules/sponsors'),
  createSponsor: (data) => apiFetch('/modules/sponsors', { method: 'POST', body: JSON.stringify(data) }),
  updateSponsor: (id, data) => apiFetch(`/modules/sponsors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  campaigns: () => apiFetch('/modules/campaigns'),
  createCampaign: (data) => apiFetch('/modules/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id, data) => apiFetch(`/modules/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  coupons: () => apiFetch('/modules/coupons'),
  createCoupon: (data) => apiFetch('/modules/coupons', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── SEARCH ─────────────────────────────────────────────────────

export const search = {
  global: (q) => apiFetch(`/search?q=${encodeURIComponent(q)}`),
}

// ─── PUBLIC (no auth) ────────────────────────────────────────────

export const publicApi = {
  events: () => fetch(`${API_URL}/public/events`).then((r) => r.json()),
  event: (id) => fetch(`${API_URL}/public/events/${id}`).then((r) => r.json()),
  register: (data) => fetch(`${API_URL}/public/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json()),
}

export default {
  auth, dashboard, clients, events, tasks, venues, resources,
  vendors, users, finance, registrations, modules, search, portal,
  workflow, notifications, approvals, documents, calendar, publicApi,
  setTokens, clearTokens, getAccessToken, loadRefreshToken,
}
