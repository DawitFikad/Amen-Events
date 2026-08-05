import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import api, { auth as authApi, setTokens, clearTokens, loadRefreshToken } from './api'
import {
  getRoleKey, getRoleDef, can as canFn, canAccess,
  ROLE_DEFINITIONS, STAFF_ROLES, MODULES, PERMISSIONS,
} from './permissions'
import {
  staffSeed, clientsSeed, venuesSeed, resourcesSeed, vendorsSeed, eventsSeed,
  tasksSeed, speakersSeed, exhibitorsSeed, sponsorsSeed, invoicesSeed, expensesSeed,
  registrationsSeed, activitiesSeed, notificationsSeed, campaignsSeed, couponsSeed,
} from './data'

const DataContext = createContext(null)

const emptyState = {
  staff: [], clients: [], venues: [], resources: [], vendors: [],
  events: [], tasks: [], speakers: [], exhibitors: [], sponsors: [],
  invoices: [], expenses: [], registrations: [], activities: [],
  notifications: [], campaigns: [], coupons: [],
  currentUserId: null, currentUser: null,
  lastLogin: null, intent: null,
  demo: {
    open: false, done: [0],
    lastClientId: null, lastEventId: null, lastRegId: null,
    lastCheckinId: null, lastQrId: null,
    financeAction: 0, qrViewed: false, budgetSet: false,
    allocated: false, teamAssigned: false, visitedReports: false,
  },
}

const getFallbackSeed = () => ({
  staff: staffSeed, clients: clientsSeed, venues: venuesSeed,
  resources: resourcesSeed, vendors: vendorsSeed, events: eventsSeed,
  tasks: tasksSeed, speakers: speakersSeed, exhibitors: exhibitorsSeed,
  sponsors: sponsorsSeed, invoices: invoicesSeed, expenses: expensesSeed,
  registrations: registrationsSeed, activities: activitiesSeed,
  notifications: notificationsSeed, campaigns: campaignsSeed, coupons: couponsSeed,
})

export function DataProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)

  // On mount: try to restore session from refresh token
  useEffect(() => {
    let mounted = true
    async function init() {
      const storedRefresh = loadRefreshToken()
      if (storedRefresh) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefresh }),
          })
          if (res.ok) {
            const { accessToken: newToken } = await res.json()
            setTokens(newToken, storedRefresh)
            const meRes = await authApi.me()
            if (mounted) {
              setBackendOnline(true)
              await loadDashboardData(meRes.user)
              return
            }
          }
        } catch (e) {
          clearTokens()
        }
      }
      try {
        const healthRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/health`)
        if (healthRes.ok) setBackendOnline(true)
      } catch (e) { /* backend offline */ }
      if (mounted) setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [])

  const loadDashboardData = useCallback(async (user) => {
    try {
      const data = await api.dashboard.getAll()
      setState((s) => ({
        ...s,
        staff: data.staff || [], clients: data.clients || [],
        venues: data.venues || [], resources: data.resources || [],
        vendors: data.vendors || [], events: data.events || [],
        tasks: data.tasks || [], speakers: data.speakers || [],
        exhibitors: data.exhibitors || [], sponsors: data.sponsors || [],
        invoices: data.invoices || [], expenses: data.expenses || [],
        registrations: data.registrations || [], activities: data.activities || [],
        notifications: data.notifications || [], campaigns: data.campaigns || [],
        coupons: data.coupons || [],
        currentUserId: user.id, currentUser: user,
        lastLogin: new Date().toISOString(),
      }))
    } catch (e) {
      setState((s) => ({ ...s, ...getFallbackSeed(), currentUserId: user.id, currentUser: user }))
    }
    setLoading(false)
  }, [])

  // ─── AUTH ────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    if (backendOnline) {
      const data = await authApi.login(email, password)
      setTokens(data.accessToken, data.refreshToken)
      await loadDashboardData(data.user)
      return data.user
    } else {
      const member = staffSeed.find((s) => s.email === email)
      if (member) {
        setState((s) => ({
          ...s, ...getFallbackSeed(),
          currentUserId: member.id,
          currentUser: { id: member.id, name: member.name, email: member.email, userRoles: [{ role: { key: STAFF_ROLES[member.id] || 'manager' } }] },
          lastLogin: new Date().toISOString(),
        }))
        setLoading(false)
        return member
      }
      const client = clientsSeed.find((c) => c.email === email)
      if (client) {
        setState((s) => ({
          ...s, ...getFallbackSeed(),
          currentUserId: client.id,
          currentUser: { id: client.id, name: client.contactPerson, email: client.email, userRoles: [{ role: { key: 'client' } }] },
          lastLogin: new Date().toISOString(),
        }))
        setLoading(false)
        return client
      }
      throw new Error('User not found')
    }
  }, [backendOnline, loadDashboardData])

  const logout = useCallback(async () => {
    if (backendOnline) {
      try { await authApi.logout() } catch (e) { /* ignore */ }
    }
    clearTokens()
    setState({ ...emptyState })
    setLoading(false)
  }, [backendOnline])

  // ─── STATE HELPERS ───────────────────────────────────────────

  const patch = useCallback((key, updater) => {
    setState((s) => ({ ...s, [key]: typeof updater === 'function' ? updater(s[key]) : updater }))
  }, [])

  const patchBy = useCallback((key, id, updater) => {
    setState((s) => ({
      ...s,
      [key]: s[key].map((it) => (it.id === id ? (typeof updater === 'function' ? updater(it) : updater) : it)),
    }))
  }, [])

  const logActivity = useCallback((text, type = 'general') => {
    setState((s) => ({
      ...s,
      activities: [{ id: 'tmp-' + Math.random().toString(36).slice(2, 8), text, type, at: 'Just now' }, ...s.activities],
    }))
  }, [])

  const addNotification = useCallback((text, type = 'general') => {
    setState((s) => ({
      ...s,
      notifications: [{ id: 'tmp-' + Math.random().toString(36).slice(2, 8), text, type, at: 'Just now' }, ...s.notifications],
    }))
  }, [])

  // Refresh all dashboard data from API (call after mutations to keep KPIs in sync)
  const refreshData = useCallback(async () => {
    if (!backendOnline) return
    try {
      const data = await api.dashboard.getAll()
      setState((s) => ({
        ...s,
        staff: data.staff || [], clients: data.clients || [],
        venues: data.venues || [], resources: data.resources || [],
        vendors: data.vendors || [], events: data.events || [],
        tasks: data.tasks || [], speakers: data.speakers || [],
        exhibitors: data.exhibitors || [], sponsors: data.sponsors || [],
        invoices: data.invoices || [], expenses: data.expenses || [],
        registrations: data.registrations || [], activities: data.activities || [],
        notifications: data.notifications || [], campaigns: data.campaigns || [],
        coupons: data.coupons || [],
      }))
    } catch (e) { /* ignore */ }
  }, [backendOnline])

  // ─── DEMO MODE ───────────────────────────────────────────────

  const markDone = useCallback((step) => {
    setState((s) => (s.demo.done.includes(step) ? s : { ...s, demo: { ...s.demo, done: [...s.demo.done, step] } }))
  }, [])

  const setIntent = useCallback((intent) => setState((s) => ({ ...s, intent })), [])
  const clearIntent = useCallback(() => setState((s) => ({ ...s, intent: null })), [])
  const setDemoOpen = useCallback((open) => setState((s) => ({ ...s, demo: { ...s.demo, open } })), [])
  const markVisitedReports = useCallback(() => {
    setState((s) => (s.demo.visitedReports ? s : { ...s, demo: { ...s.demo, visitedReports: true } }))
  }, [])

  // ─── DOMAIN ACTIONS ──────────────────────────────────────────

  const addClient = useCallback(async (data) => {
    if (backendOnline) {
      try {
        const { client } = await api.clients.create(data)
        setState((s) => ({ ...s, clients: [client, ...s.clients] }))
        return client
      } catch (e) { /* fall through */ }
    }
    const id = 'cl-' + Math.random().toString(36).slice(2, 8)
    const rec = { id, company: data.company, industry: data.industry || 'General', city: data.city || 'Addis Ababa', contactPerson: data.contactPerson, contactRole: data.role || 'Contact', phone: data.phone, email: data.email, status: 'active', stage: data.stage || 'lead', totalValue: 0, logo: (data.company || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'CO' }
    patch('clients', (a) => [rec, ...a])
    logActivity(`New client profile created: ${data.company}`, 'crm')
    return rec
  }, [backendOnline, patch, logActivity])

  const addEvent = useCallback(async (data) => {
    if (backendOnline) {
      try {
        const { event } = await api.events.create(data)
        setState((s) => ({ ...s, events: [event, ...s.events] }))
        return event
      } catch (e) { /* fall through */ }
    }
    const id = 'ev-' + Math.random().toString(36).slice(2, 8)
    const rec = { id, name: data.name, clientId: data.clientId, venueId: data.venueId, category: data.category, date: data.date, time: data.time || '09:00', status: 'upcoming', pmId: data.pmId || 'st2', budget: Number(data.budget) || 0, spent: 0, stage: 4, progress: 36, team: [data.pmId || 'st2'], allocations: [] }
    patch('events', (a) => [rec, ...a])
    logActivity(`Event created: ${data.name}`, 'event')
    return rec
  }, [backendOnline, patch, logActivity])

  const setEventTeam = useCallback(async (eventId, memberIds) => {
    if (backendOnline) { try { await api.events.setTeam(eventId, memberIds) } catch (e) {} }
    patchBy('events', eventId, (e) => ({ ...e, team: memberIds }))
    logActivity(`Team updated on event (${memberIds.length} members)`, 'event')
  }, [backendOnline, patchBy, logActivity])

  const setEventBudget = useCallback(async (eventId, budget) => {
    if (backendOnline) { try { await api.events.setBudget(eventId, budget) } catch (e) {} }
    patchBy('events', eventId, (e) => ({ ...e, budget: Number(budget) || 0 }))
    logActivity(`Budget set to ETB ${Number(budget) || 0}`, 'finance')
  }, [backendOnline, patchBy, logActivity])

  const allocateResource = useCallback(async (resourceId, eventId, qty) => {
    if (backendOnline) { try { await api.resources.allocate(resourceId, eventId, qty) } catch (e) {} }
    patchBy('resources', resourceId, (r) => ({ ...r, allocated: (r.allocated || 0) + Number(qty) || 0 }))
    patchBy('events', eventId, (e) => ({ ...e, allocations: [...(e.allocations || []), { resourceId, qty: Number(qty) || 1 }] }))
    logActivity(`Resource allocated to event (${qty}x)`, 'inventory')
  }, [backendOnline, patchBy, logActivity])

  const addTask = useCallback(async (data) => {
    if (backendOnline) {
      try { const { task } = await api.tasks.create(data); setState((s) => ({ ...s, tasks: [task, ...s.tasks] })); return } catch (e) {}
    }
    const rec = { id: 'tk-' + Math.random().toString(36).slice(2, 8), ...data, status: data.status || 'todo', comments: 0 }
    patch('tasks', (a) => [rec, ...a])
    logActivity(`Task created: ${data.title}`, 'task')
  }, [backendOnline, patch, logActivity])

  const updateTask = useCallback((id, updater) => patchBy('tasks', id, updater), [patchBy])

  const registerAttendee = useCallback(async (data) => {
    if (backendOnline) {
      try { const { registration } = await api.registrations.create(data); setState((s) => ({ ...s, registrations: [registration, ...s.registrations] })); return registration } catch (e) {}
    }
    const rec = { id: 'rg-' + Math.random().toString(36).slice(2, 8), qr: 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase(), checkedIn: false, ...data }
    patch('registrations', (a) => [rec, ...a])
    logActivity(`Registration added: ${data.name} (${data.type})`, 'registration')
    return rec
  }, [backendOnline, patch, logActivity])

  const viewQr = useCallback(() => { setState((s) => ({ ...s, demo: { ...s.demo, qrViewed: true } })) }, [])

  const checkIn = useCallback(async (qr) => {
    if (backendOnline) {
      try {
        const { registration } = await api.registrations.checkIn(qr)
        patchBy('registrations', registration.id, (r) => ({ ...r, checkedIn: true }))
        logActivity(`QR check-in recorded for ${registration.name}`, 'checkin')
        return { ok: true, reg: registration }
      } catch (e) {
        if (e.message.includes('not-found')) return { ok: false, reason: 'not-found' }
        if (e.message.includes('duplicate')) return { ok: false, reason: 'duplicate' }
      }
    }
    const existing = state.registrations.find((r) => r.qr === qr)
    if (!existing) return { ok: false, reason: 'not-found' }
    if (existing.checkedIn) return { ok: false, reason: 'duplicate', reg: existing }
    patchBy('registrations', existing.id, (r) => ({ ...r, checkedIn: true }))
    logActivity(`QR check-in recorded for ${existing.name}`, 'checkin')
    return { ok: true, reg: existing }
  }, [backendOnline, state.registrations, patchBy, logActivity])

  const recordExpense = useCallback(async (data) => {
    if (backendOnline) {
      try { const { expense } = await api.finance.recordExpense(data); setState((s) => ({ ...s, expenses: [expense, ...s.expenses] })); if (data.eventId) patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + Number(data.amount) || 0 })); return } catch (e) {}
    }
    patch('expenses', (a) => [{ id: 'ex-' + Math.random().toString(36).slice(2, 8), ...data }, ...a])
    if (data.eventId) patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + Number(data.amount) || 0 }))
    logActivity(`Expense recorded: ${data.category} ${data.amount}`, 'finance')
  }, [backendOnline, patch, patchBy, logActivity])

  const recordPayment = useCallback(async (invoiceId, amount) => {
    if (backendOnline) { try { await api.finance.recordPayment(invoiceId, amount) } catch (e) {} }
    patchBy('invoices', invoiceId, (inv) => {
      const paid = inv.paid + amount
      const status = paid >= inv.amount ? 'paid' : paid > 0 ? 'partial' : 'outstanding'
      return { ...inv, paid, status }
    })
    logActivity(`Payment of ${amount} recorded`, 'finance')
  }, [backendOnline, patchBy, logActivity])

  const addInvoice = useCallback(async (data) => {
    if (backendOnline) {
      try { const { invoice } = await api.finance.createInvoice(data); setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] })); return } catch (e) {}
    }
    const rec = { id: 'inv-' + Math.random().toString(36).slice(2, 8), ...data, paid: Number(data.paid) || 0, status: (Number(data.paid) || 0) > 0 ? 'partial' : 'outstanding' }
    patch('invoices', (a) => [rec, ...a])
    logActivity(`Invoice issued for ${data.ref || ''}`, 'finance')
  }, [backendOnline, patch, logActivity])

  const addVenue = useCallback(async (data) => {
    if (backendOnline) { try { const { venue } = await api.venues.create(data); setState((s) => ({ ...s, venues: [venue, ...s.venues] })); return venue } catch (e) {} }
    const equipment = typeof data.equipment === 'string' ? data.equipment.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(data.equipment) ? data.equipment : []
    const rec = { id: 'vn-' + Math.random().toString(36).slice(2, 8), abbr: (data.name || 'VN').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'VN', capacity: Number(data.capacity) || 100, price: Number(data.price) || 0, equipment, status: 'available', color: 'bg-brand-600', halls: Number(data.halls) || 1, contact: data.contact || '—' }
    patch('venues', (a) => [rec, ...a])
    logActivity(`Venue added: ${data.name}`, 'venue')
    return rec
  }, [backendOnline, patch, logActivity])

  const addResource = useCallback(async (data) => {
    if (backendOnline) { try { const { resource } = await api.resources.create(data); setState((s) => ({ ...s, resources: [resource, ...s.resources] })); return resource } catch (e) {} }
    const rec = { id: 'rc-' + Math.random().toString(36).slice(2, 8), qty: Number(data.qty) || 1, allocated: 0, maintenance: 0, status: 'available', location: data.location || 'Main Warehouse', ...data }
    patch('resources', (a) => [rec, ...a])
    logActivity(`Asset added: ${data.name}`, 'inventory')
    return rec
  }, [backendOnline, patch, logActivity])

  const addVendor = useCallback(async (data) => {
    if (backendOnline) { try { const { vendor } = await api.vendors.create(data); setState((s) => ({ ...s, vendors: [vendor, ...s.vendors] })); return vendor } catch (e) {} }
    const rec = { id: 'vd-' + Math.random().toString(36).slice(2, 8), rating: 4.0, contracts: 0, status: 'active', ...data }
    patch('vendors', (a) => [rec, ...a])
    logActivity(`Vendor added: ${data.name} (${data.type})`, 'vendor')
    return rec
  }, [backendOnline, patch, logActivity])

  const addStaffMember = useCallback(async (data) => {
    if (backendOnline) { try { const { user } = await api.users.create(data); setState((s) => ({ ...s, staff: [user, ...s.staff] })); return user } catch (e) {} }
    const name = data.name || 'New Member'
    const rec = { id: 'st-' + Math.random().toString(36).slice(2, 8), name, role: data.role || 'Coordinator', dept: data.dept || 'Operations', phone: data.phone || '—', email: data.email || '', type: data.type || 'Employee', status: 'active', color: 'bg-brand-500', initials: name.split(' ').map((p) => p[0]).slice(0, 2).join('') }
    patch('staff', (a) => [rec, ...a])
    logActivity(`Team member added: ${name}`, 'staff')
    return rec
  }, [backendOnline, patch, logActivity])

  const addSpeaker = useCallback(async (data) => {
    if (backendOnline) { try { const { speaker } = await api.modules.createSpeaker(data); setState((s) => ({ ...s, speakers: [speaker, ...s.speakers] })); return speaker } catch (e) {} }
    const name = data.name || 'Speaker'
    const rec = { id: 'sp-' + Math.random().toString(36).slice(2, 8), name, initials: name.split(' ').map((p) => p[0]).slice(0, 2).join(''), color: 'bg-gold-500', topic: data.topic || 'TBD', company: data.company || '', eventId: data.eventId || 'ev1', time: data.time || '12:00', status: data.status || 'pending' }
    patch('speakers', (a) => [rec, ...a])
    logActivity(`Speaker added: ${name}`, 'speaker')
    return rec
  }, [backendOnline, patch, logActivity])

  const addExhibitor = useCallback(async (data) => {
    if (backendOnline) { try { const { exhibitor } = await api.modules.createExhibitor(data); setState((s) => ({ ...s, exhibitors: [exhibitor, ...s.exhibitors] })); return exhibitor } catch (e) {} }
    const rec = { id: 'ex-' + Math.random().toString(36).slice(2, 8), booth: data.booth || '—', size: data.size || 'Standard', package: data.package || 'Exhibitor', paid: Number(data.paid) || 0, status: data.status || 'registering', ...data }
    patch('exhibitors', (a) => [rec, ...a])
    logActivity(`Exhibitor added: ${data.company} (${data.booth || 'booth TBD'})`, 'exhibition')
    return rec
  }, [backendOnline, patch, logActivity])

  const addSponsor = useCallback(async (data) => {
    if (backendOnline) { try { const { sponsor } = await api.modules.createSponsor(data); setState((s) => ({ ...s, sponsors: [sponsor, ...s.sponsors] })); return sponsor } catch (e) {} }
    const rec = { id: 'spn-' + Math.random().toString(36).slice(2, 8), name: data.name || 'Sponsor', package: data.package || 'Silver', amount: Number(data.amount) || 0, status: data.status || 'pending', deliverables: data.deliverables ? [data.deliverables] : [] }
    patch('sponsors', (a) => [rec, ...a])
    logActivity(`Sponsor added: ${rec.name} (${rec.package})`, 'sponsorship')
    return rec
  }, [backendOnline, patch, logActivity])

  const addCampaign = useCallback(async (data) => {
    if (backendOnline) { try { const { campaign } = await api.modules.createCampaign(data); setState((s) => ({ ...s, campaigns: [campaign, ...s.campaigns] })); return campaign } catch (e) {} }
    const rec = { id: 'cm-' + Math.random().toString(36).slice(2, 8), name: data.name || 'New Campaign', channel: data.channel || 'Email', audience: Number(data.audience) || 0, sent: 0, opens: 0, clicks: 0, status: data.status || 'draft' }
    patch('campaigns', (a) => [rec, ...a])
    logActivity(`Campaign created: ${rec.name}`, 'marketing')
    return rec
  }, [backendOnline, patch, logActivity])

  const addCoupon = useCallback(async (data) => {
    if (backendOnline) { try { const { coupon } = await api.modules.createCoupon(data); setState((s) => ({ ...s, coupons: [coupon, ...s.coupons] })); return coupon } catch (e) {} }
    const rec = { id: 'cp-' + Math.random().toString(36).slice(2, 8), usage: 0, status: 'active', max: Number(data.max) || 500, ...data }
    patch('coupons', (a) => [rec, ...a])
    logActivity(`Coupon ${data.code} generated (${data.value})`, 'marketing')
    return rec
  }, [backendOnline, patch, logActivity])

  // ─── RBAC ────────────────────────────────────────────────────

  const unreadNotifications = useMemo(() => state.notifications.length, [state.notifications])

  const rbac = useMemo(() => {
    if (state.currentUser?.userRoles) {
      const roleKey = state.currentUser.userRoles[0]?.role?.key || null
      const roleDef = roleKey ? ROLE_DEFINITIONS[roleKey] : null
      return {
        roleKey, roleDef,
        can: (mod, perm = 'view') => {
          if (roleKey === 'admin') return true
          if (!roleDef) return false
          const modPerms = roleDef.modules[mod]
          return !!modPerms?.[perm]
        },
        canAccess: (mod) => {
          if (roleKey === 'admin') return true
          if (!roleDef) return false
          return !!roleDef.modules[mod]?.view
        },
        roleDefinitions: ROLE_DEFINITIONS, staffRoles: STAFF_ROLES, modules: MODULES, permissionsList: PERMISSIONS,
      }
    }
    const uid = state.currentUserId
    const staff = state.staff
    return {
      roleKey: uid ? getRoleKey(uid, staff) : null,
      roleDef: uid ? getRoleDef(uid, staff) : null,
      can: (mod, perm = 'view') => canFn(uid, staff, mod, perm),
      canAccess: (mod) => canAccess(uid, staff, mod),
      roleDefinitions: ROLE_DEFINITIONS, staffRoles: STAFF_ROLES, modules: MODULES, permissionsList: PERMISSIONS,
    }
  }, [state.currentUser, state.currentUserId, state.staff])

  const value = {
    state, patch, patchBy, logActivity, addNotification,
    addClient, addEvent, addTask, updateTask, registerAttendee, checkIn,
    recordExpense, recordPayment, addInvoice,
    addVenue, addResource, addVendor, addStaffMember, addSpeaker, addExhibitor, addSponsor, addCampaign, addCoupon,
    setEventTeam, setEventBudget, allocateResource, viewQr,
    markDone, setIntent, clearIntent, setDemoOpen, markVisitedReports,
    login, logout, refreshData,
    unreadNotifications, rbac,
    loading, backendOnline,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export const LOOKUP_HELPERS = {
  clientName: (s, id) => s.clients.find((c) => c.id === id)?.company || '—',
  eventName: (s, id) => s.events.find((e) => e.id === id)?.name || '—',
  venueName: (s, id) => s.venues.find((v) => v.id === id)?.name || '—',
  staffName: (s, id) => s.staff.find((m) => m.id === id)?.name || '—',
  vendorName: (s, id) => s.vendors.find((v) => v.id === id)?.name || '—',
}