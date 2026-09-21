import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import api, { API_URL, auth as authApi, documents as documentsApi, setTokens, clearTokens, loadRefreshToken } from './api'
import {
  getRoleKey, getRoleDef, can as canFn, canAccess,
  ROLE_DEFINITIONS, STAFF_ROLES, MODULES, PERMISSIONS,
} from './permissions'
import {
  staffSeed, clientsSeed, venuesSeed, resourcesSeed, vendorsSeed, eventsSeed,
  tasksSeed, speakersSeed, exhibitorsSeed, sponsorsSeed, invoicesSeed, expensesSeed,
  registrationsSeed, activitiesSeed, notificationsSeed, campaignsSeed, couponsSeed,
  contractsSeed, clientDocsSeed, maintenanceSeed, purchaseRequestsSeed,
  eventSuppliersSeed, eventChecklistsSeed, eventDocsSeed,
  sessionsSeed, sessionAttendanceSeed, certificateHoldersSeed,
  exhibitionBoothsSeed, visitorsSeed, brandingLocationsSeed, sponsorDeliverablesSeed,
  approvalsSeed, calendarEventsSeed,
  fmt, todayISO,
} from './data'
import { decodeTicket, eventTicketCode, buildTicketCode } from './ticket'
import {
  checkSupabaseHealth,
  fetchAllSupabaseData,
  supabaseAddEvent,
  supabaseUpdateEvent,
  supabaseDeleteEvent,
  supabaseAddClient,
  supabaseUpdateClient,
  supabaseDeleteClient,
  supabaseAddTask,
  supabaseUpdateTask,
  supabaseDeleteTask,
  supabaseRegisterAttendee,
  supabaseCheckInAttendee,
  supabaseAddVenue,
  supabaseAddResource,
  supabaseAddVendor,
  supabaseAddInvoice,
  supabaseUpdateInvoice,
  supabaseAddExpense,
  supabaseAddSpeaker,
  supabaseAddExhibitor,
  supabaseAddSponsor,
  supabaseAddCampaign,
  supabaseAddCoupon,
  supabaseLogActivity,
  supabaseAddNotification,
  supabaseSendMessage,
  supabaseFetchMessages,
  supabaseAddApprovalRequest,
  supabaseUpdateApprovalStatus,
  supabaseUploadDocument,
  supabaseAddStaffMember,
  supabaseUpdateStaffMember,
  supabaseAddAllocation,
  supabaseAddCalendarEvent,
  subscribeToSupabaseChanges,
} from './supabase'

const DataContext = createContext(null)

const emptyState = {
  staff: [], clients: [], venues: [], resources: [], vendors: [],
  events: [], tasks: [], speakers: [], exhibitors: [], sponsors: [],
  invoices: [], expenses: [], registrations: [], activities: [],
  notifications: [], campaigns: [], coupons: [],
  contracts: [], clientDocs: [], eventDocs: [], maintenance: [], purchaseRequests: [],
  eventSuppliers: [], eventChecklists: [],
  sessions: [], sessionAttendance: [], certificateHolders: [],
  exhibitionBooths: [], visitors: [], brandingLocations: [], sponsorDeliverables: [],
  approvals: [], calendarEvents: [], messages: [], documents: [],
  currentUserId: null, currentUser: null,
  lastLogin: null, intent: null,
  demo: {
    open: false, autoplay: false, done: [0],
    lastClientId: null, lastEventId: null, lastRegId: null,
    lastCheckinId: null, lastQrId: null,
    financeAction: 0, qrViewed: false, budgetSet: false,
    allocated: false, teamAssigned: false, visitedReports: false,
    quoteCreated: false, contractCreated: false, venueAdded: false,
    resourceAdded: false, vendorAdded: false, staffAdded: false,
    taskCreated: false, speakerAdded: false, exhibitorAdded: false,
    sponsorAdded: false, campaignCreated: false, couponCreated: false,
    adminAction: false,
  },
}

const getFallbackSeed = () => ({
  staff: staffSeed, clients: clientsSeed, venues: venuesSeed,
  resources: resourcesSeed, vendors: vendorsSeed, events: eventsSeed,
  tasks: tasksSeed, speakers: speakersSeed, exhibitors: exhibitorsSeed,
  sponsors: sponsorsSeed, invoices: invoicesSeed, expenses: expensesSeed,
  registrations: registrationsSeed, activities: activitiesSeed,
  notifications: notificationsSeed, campaigns: campaignsSeed, coupons: couponsSeed,
  contracts: contractsSeed, clientDocs: clientDocsSeed, eventDocs: eventDocsSeed, maintenance: maintenanceSeed,
  purchaseRequests: purchaseRequestsSeed,
  eventSuppliers: eventSuppliersSeed, eventChecklists: eventChecklistsSeed,
  sessions: sessionsSeed, sessionAttendance: sessionAttendanceSeed,
  certificateHolders: certificateHoldersSeed,
  exhibitionBooths: exhibitionBoothsSeed, visitors: visitorsSeed,
  brandingLocations: brandingLocationsSeed, sponsorDeliverables: sponsorDeliverablesSeed,
  approvals: approvalsSeed, calendarEvents: calendarEventsSeed(),
})

export function DataProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)

  // On mount: try to restore session or connect directly to Supabase
  useEffect(() => {
    let mounted = true
    let unsubscribeRealtime = null

    async function init() {
      // 1. Direct Supabase initialization (works everywhere: Vercel, localhost, mobile)
      try {
        const sbHealth = await checkSupabaseHealth()
        if (sbHealth.ok) {
          const sbData = await fetchAllSupabaseData()
          if (mounted) {
            setBackendOnline(true)
            setState((s) => {
              const defaultUser = s.currentUser || (sbData.staff?.[0] ? {
                id: sbData.staff[0].id,
                name: sbData.staff[0].name,
                email: sbData.staff[0].email,
                userRoles: [{ role: { key: 'admin' } }],
              } : null)
              return {
                ...s,
                ...sbData,
                calendarEvents: sbData.calendarEvents?.length ? sbData.calendarEvents : calendarEventsSeed(),
                currentUserId: s.currentUserId || defaultUser?.id || 'st1',
                currentUser: defaultUser,
                lastLogin: s.lastLogin || new Date().toISOString(),
              }
            })
            setLoading(false)
          }

          // Subscribe to live database changes from any connected device
          unsubscribeRealtime = subscribeToSupabaseChanges(async () => {
            try {
              const fresh = await fetchAllSupabaseData()
              if (mounted) {
                setState((s) => ({ ...s, ...fresh }))
              }
            } catch (e) {}
          })
          return
        }
      } catch (err) {
        console.warn('Supabase direct connection attempt:', err)
      }

      // 2. Fallback to Express backend if Supabase direct fails
      const storedRefresh = loadRefreshToken()
      if (storedRefresh) {
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
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
        const healthRes = await fetch(`${API_URL}/health`)
        if (healthRes.ok) {
          const data = await healthRes.json().catch(() => ({}))
          if (data.database === 'connected' || data.status === 'ok') {
            setBackendOnline(true)
          }
        }
      } catch (e) { /* backend offline */ }
      if (mounted) setLoading(false)
    }
    init()
    return () => {
      mounted = false
      if (unsubscribeRealtime) unsubscribeRealtime()
    }
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
        contracts: data.contracts || [], clientDocs: data.clientDocs || [],
        eventDocs: data.eventDocs || [],
        maintenance: data.maintenance || [], purchaseRequests: data.purchaseRequests || [],
        eventSuppliers: data.eventSuppliers || [], eventChecklists: data.eventChecklists || [],
        sessions: data.sessions || [], sessionAttendance: data.sessionAttendance || [],
        certificateHolders: data.certificateHolders || [],
        exhibitionBooths: data.exhibitionBooths || [], visitors: data.visitors || [],
        brandingLocations: data.brandingLocations || [], sponsorDeliverables: data.sponsorDeliverables || [],
        approvals: data.approvals || [], calendarEvents: data.calendarEvents || [],
        currentUserId: user.id, currentUser: user,
        lastLogin: new Date().toISOString(),
      }))
    } catch (e) {
      setState((s) => ({ ...s, ...getFallbackSeed(), currentUserId: user.id, currentUser: user }))
    }
    setLoading(false)
  }, [])

  // ─── AUTH ────────────────────────────────────────────────────

  // True when a backend auth error is a genuine credentials/lock rejection
  // (as opposed to a rate-limit, network, or server error we can retry offline).
  const isRealAuthFailure = (err) => {
    const m = String(err?.message || '').toLowerCase()
    return /credential|invalid|locked|for [a-z ]* minutes|sign in through|client portal|not found|staff accounts/i.test(m)
  }

  // Local (seed) staff login - used offline or as a fallback
  const loginOffline = useCallback(async (email) => {
    const member = staffSeed.find((s) => s.email === email)
    if (!member) throw new Error('User not found')
    setState((s) => ({
      ...s, ...getFallbackSeed(),
      currentUserId: member.id,
      currentUser: { id: member.id, name: member.name, email: member.email, userRoles: [{ role: { key: STAFF_ROLES[member.id] || 'manager' } }] },
      lastLogin: new Date().toISOString(),
    }))
    setLoading(false)
    return member
  }, [])

  const clientLoginOffline = useCallback(async (email) => {
    const client = clientsSeed.find((c) => c.email === email)
    if (!client) throw new Error('No client portal account found for this email')
    setState((s) => ({
      ...s, ...getFallbackSeed(),
      currentUserId: client.id,
      currentUser: { id: client.id, name: client.contactPerson, email: client.email, userRoles: [{ role: { key: 'client' } }] },
      lastLogin: new Date().toISOString(),
    }))
    setLoading(false)
    return client
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await authApi.login(email, password)
      if (data.user?.userRoles?.[0]?.role?.key === 'client') {
        throw new Error('Client accounts sign in through the Client Portal')
      }
      setTokens(data.accessToken, data.refreshToken)
      await loadDashboardData(data.user)
      return data.user
    } catch (err) {
      if (isRealAuthFailure(err) && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    try {
      const sbData = await fetchAllSupabaseData()
      const member = (sbData.staff || []).find((s) => s.email?.toLowerCase() === email?.toLowerCase())
        || staffSeed.find((s) => s.email?.toLowerCase() === email?.toLowerCase())

      if (!member) throw new Error('User not found')

      const roleKey = STAFF_ROLES[member.id] || (member.email?.includes('dawit') ? 'admin' : 'manager')
      const userObj = {
        id: member.id,
        name: member.name,
        email: member.email,
        userRoles: [{ role: { key: roleKey } }],
      }
      setState((s) => ({
        ...s,
        ...sbData,
        currentUserId: member.id,
        currentUser: userObj,
        lastLogin: new Date().toISOString(),
      }))
      setBackendOnline(true)
      setLoading(false)
      return userObj
    } catch (e) {
      return loginOffline(email)
    }
  }, [loadDashboardData, loginOffline])

  const loginClient = useCallback(async (email, password) => {
    try {
      const data = await authApi.login(email, password)
      const isClient = data.user?.userRoles?.some?.((ur) => ur.role?.key === 'client')
      if (!isClient) throw new Error('Staff accounts sign in through the ERP sign-in')
      setTokens(data.accessToken, data.refreshToken)
      await loadDashboardData(data.user)
      return data.user
    } catch (err) {
      if (isRealAuthFailure(err) && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    try {
      const sbData = await fetchAllSupabaseData()
      const client = (sbData.clients || []).find((c) => c.email?.toLowerCase() === email?.toLowerCase())
        || clientsSeed.find((c) => c.email?.toLowerCase() === email?.toLowerCase())
      if (!client) throw new Error('No client portal account found for this email')

      const userObj = {
        id: client.id,
        name: client.contactPerson || client.company,
        email: client.email,
        userRoles: [{ role: { key: 'client' } }],
      }
      setState((s) => ({
        ...s,
        ...sbData,
        currentUserId: client.id,
        currentUser: userObj,
        lastLogin: new Date().toISOString(),
      }))
      setBackendOnline(true)
      setLoading(false)
      return userObj
    } catch (e) {
      return clientLoginOffline(email)
    }
  }, [loadDashboardData, clientLoginOffline])

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
      [key]: s[key].map((it) => (it.id === id ? (typeof updater === 'function' ? updater(it) : { ...it, ...updater }) : it)),
    }))
  }, [])

  const logActivity = useCallback((text, type = 'general') => {
    setState((s) => ({
      ...s,
      activities: [{ id: 'tmp-' + Math.random().toString(36).slice(2, 8), text, type, at: 'Just now' }, ...s.activities],
    }))
  }, [])

  const addNotification = useCallback((text, type = 'general', opts = {}) => {
    const payload = typeof text === 'object' && text !== null ? text : { text, type }
    setState((s) => ({
      ...s,
      notifications: [{ id: 'tmp-' + Math.random().toString(36).slice(2, 8), text: payload.text, type: payload.type || 'general', userId: payload.userId, read: !!payload.read, at: 'Just now' }, ...s.notifications],
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
        contracts: data.contracts || [], clientDocs: data.clientDocs || [],
        eventDocs: data.eventDocs || [],
        maintenance: data.maintenance || [], purchaseRequests: data.purchaseRequests || [],
        eventSuppliers: data.eventSuppliers || [], eventChecklists: data.eventChecklists || [],
        sessions: data.sessions || [], sessionAttendance: data.sessionAttendance || [],
        certificateHolders: data.certificateHolders || [],
        exhibitionBooths: data.exhibitionBooths || [], visitors: data.visitors || [],
        brandingLocations: data.brandingLocations || [], sponsorDeliverables: data.sponsorDeliverables || [],
        approvals: data.approvals || [], calendarEvents: data.calendarEvents || [],
      }))
    } catch (e) { /* ignore */ }
  }, [backendOnline])

  // ─── DEMO MODE ───────────────────────────────────────────────

  const markDone = useCallback((step) => {
    setState((s) => (s.demo.done.includes(step) ? s : { ...s, demo: { ...s.demo, done: [...s.demo.done, step] } }))
  }, [])

  const setDemoFlag = useCallback((flag, value = true) => {
    setState((s) => ({ ...s, demo: { ...s.demo, [flag]: typeof value === 'function' ? value(s.demo[flag]) : value } }))
  }, [])

  const setIntent = useCallback((intent) => setState((s) => ({ ...s, intent })), [])
  const clearIntent = useCallback(() => setState((s) => ({ ...s, intent: null })), [])
  const setDemoOpen = useCallback((open) => setState((s) => ({ ...s, demo: { ...s.demo, open } })), [])
  const markVisitedReports = useCallback(() => {
    setState((s) => (s.demo.visitedReports ? s : { ...s, demo: { ...s.demo, visitedReports: true } }))
  }, [])

  // ─── DOMAIN ACTIONS ──────────────────────────────────────────

  const addClient = useCallback(async (data) => {
    try {
      const client = await supabaseAddClient(data)
      setState((s) => ({ ...s, clients: [client, ...s.clients] }))
      setDemoFlag('lastClientId', client.id)
      logActivity(`New client profile created: ${data.company}`, 'crm')
      return client
    } catch (sbErr) {
      console.warn('Supabase addClient error, falling back to API:', sbErr)
      if (backendOnline) {
        try {
          const { client } = await api.clients.create(data)
          setState((s) => ({ ...s, clients: [client, ...s.clients] }))
          setDemoFlag('lastClientId', client.id)
          return client
        } catch (e) {
          console.error('Failed to save client to database:', e)
          throw e
        }
      }
      throw sbErr
    }
  }, [backendOnline, logActivity, setDemoFlag])

  const updateClient = useCallback(async (id, data) => {
    try {
      const updated = await supabaseUpdateClient(id, data)
      patchBy('clients', id, (c) => ({ ...c, ...updated }))
      logActivity(`Client profile updated: ${data.company || 'contact details'}`, 'crm')
      return updated
    } catch (sbErr) {
      if (backendOnline && id && !String(id).startsWith('cl-')) {
        await api.clients.update(id, data).catch(() => {})
      }
      patchBy('clients', id, (c) => ({ ...c, ...data }))
      logActivity(`Client profile updated: ${data.company || 'contact details'}`, 'crm')
      return data
    }
  }, [backendOnline, patchBy, logActivity])

  const deleteClient = useCallback(async (id) => {
    try {
      await supabaseDeleteClient(id)
    } catch (e) {
      if (backendOnline) await api.clients.delete(id).catch(() => {})
    }
    patch('clients', (list) => list.filter((c) => c.id !== id))
    logActivity('Client profile removed', 'crm')
  }, [backendOnline, patch, logActivity])

  const addEvent = useCallback(async (data) => {
    try {
      const event = await supabaseAddEvent(data)
      setState((s) => ({ ...s, events: [event, ...s.events] }))
      setDemoFlag('lastEventId', event.id)
      logActivity(`Event created: ${data.name}`, 'event')
      return event
    } catch (sbErr) {
      console.warn('Supabase addEvent error, falling back to API:', sbErr)
      if (backendOnline) {
        try {
          const { event } = await api.events.create(data)
          setState((s) => ({ ...s, events: [event, ...s.events] }))
          setDemoFlag('lastEventId', event.id)
          return event
        } catch (e) {
          console.error('Failed to save event to database:', e)
          throw e
        }
      }
      throw sbErr
    }
  }, [backendOnline, logActivity, setDemoFlag])

  const updateEvent = useCallback(async (id, data) => {
    try {
      const updated = await supabaseUpdateEvent(id, data)
      patchBy('events', id, (e) => ({ ...e, ...updated }))
      return updated
    } catch (sbErr) {
      if (backendOnline && id && !String(id).startsWith('ev-')) {
        await api.events.update(id, data).catch(() => {})
      }
      patchBy('events', id, (e) => ({ ...e, ...data }))
      return data
    }
  }, [backendOnline, patchBy])

  const deleteEvent = useCallback(async (id) => {
    try {
      await supabaseDeleteEvent(id)
    } catch (e) {
      if (backendOnline) await api.events.delete(id).catch(() => {})
    }
    patch('events', (list) => list.filter((e) => e.id !== id))
    logActivity('Event removed', 'event')
  }, [backendOnline, patch, logActivity])

  const setEventTeam = useCallback(async (eventId, memberIds) => {
    const team = Array.isArray(memberIds) ? memberIds : []
    try {
      await supabaseUpdateEvent(eventId, { team })
    } catch (e) {
      if (backendOnline) await api.events.setTeam(eventId, team).catch(() => {})
    }
    patchBy('events', eventId, (e) => ({ ...e, team }))
    setDemoFlag('teamAssigned', true)
    const eventName = state.events.find((e) => e.id === eventId)?.name || 'this event'
    team.forEach((id) => addNotification({ text: `You were assigned to the team for "${eventName}"`, type: 'task', userId: id }))
    logActivity(`Team updated on event (${team.length} members)`, 'event')
  }, [backendOnline, patchBy, logActivity, setDemoFlag, state.events, addNotification])

  const setEventBudget = useCallback(async (eventId, budget) => {
    const b = Number(budget) || 0
    try {
      await supabaseUpdateEvent(eventId, { budget: b })
    } catch (e) {
      if (backendOnline) await api.events.setBudget(eventId, b).catch(() => {})
    }
    patchBy('events', eventId, (e) => ({ ...e, budget: b }))
    setDemoFlag('budgetSet', true)
    addNotification({ text: `Budget updated on "${state.events.find((x) => x.id === eventId)?.name || 'event'}" to ETB ${fmt(b)}`, type: 'budget' })
    logActivity(`Budget set to ETB ${b}`, 'finance')
  }, [backendOnline, patchBy, logActivity, setDemoFlag, state.events, addNotification])

  const allocateResources = useCallback(async (eventId, items) => {
    for (const it of items) {
      try {
        await supabaseAddAllocation(it.resourceId, eventId, it.qty)
      } catch (e) {}
    }
    if (backendOnline) {
      try { for (const it of items) await api.resources.allocate(it.resourceId, eventId, it.qty) } catch (e) { /* fall through */ }
    }
    const map = {}
    items.forEach((it) => { map[it.resourceId] = (map[it.resourceId] || 0) + (Number(it.qty) || 0) })
    Object.entries(map).forEach(([resourceId, qty]) => {
      patchBy('resources', resourceId, (r) => ({ ...r, allocated: (r.allocated || 0) + qty }))
      patchBy('events', eventId, (e) => {
        const existing = (e.allocations || []).find((a) => a.resourceId === resourceId)
        const allocations = existing
          ? e.allocations.map((a) => (a.resourceId === resourceId ? { ...a, qty: a.qty + qty } : a))
          : [...(e.allocations || []), { resourceId, qty }]
        return { ...e, allocations }
      })
    })
    setDemoFlag('allocated', true)
    logActivity(`Resources allocated to event (${items.length} items)`, 'inventory')
  }, [backendOnline, patchBy, logActivity, setDemoFlag])

  const allocateResource = useCallback(async (resourceId, eventId, qty) => {
    await allocateResources(eventId, [{ resourceId, qty: Number(qty) || 1 }])
  }, [allocateResources])

  const addTask = useCallback(async (data) => {
    try {
      const task = await supabaseAddTask(data)
      setState((s) => ({ ...s, tasks: [task, ...s.tasks] }))
      setDemoFlag('taskCreated', true)
      logActivity(`Task created: ${data.title}`, 'task')
      return task
    } catch (sbErr) {
      if (backendOnline) {
        try {
          const { task } = await api.tasks.create(data)
          setState((s) => ({ ...s, tasks: [task, ...s.tasks] }))
          setDemoFlag('taskCreated', true)
          return task
        } catch (e) {}
      }
      throw sbErr
    }
  }, [backendOnline, logActivity, setDemoFlag])

  const updateTask = useCallback(async (id, updater) => {
    const target = state.tasks.find((t) => t.id === id)
    const next = typeof updater === 'function' ? updater(target) : { ...target, ...updater }
    patchBy('tasks', id, next)
    try {
      await supabaseUpdateTask(id, next)
    } catch (e) {
      if (backendOnline && id && !String(id).startsWith('tk-')) {
        api.tasks.update(id, next).catch(() => {})
      }
    }
    return next
  }, [backendOnline, state.tasks, patchBy])

  const deleteTask = useCallback(async (id) => {
    try {
      await supabaseDeleteTask(id)
    } catch (e) {
      if (backendOnline) await api.tasks.delete(id).catch(() => {})
    }
    patch('tasks', (list) => list.filter((t) => t.id !== id))
  }, [backendOnline, patch])

  const registerAttendee = useCallback(async (data) => {
    const payload = { ...data, phone: data.phone || '', paymentMethod: data.paymentMethod || 'Cash', paid: !!data.paid }
    try {
      const registration = await supabaseRegisterAttendee(payload)
      setState((s) => ({ ...s, registrations: [registration, ...s.registrations] }))
      setDemoFlag('lastRegId', registration.id)
      logActivity(`Registration added: ${data.name} (${data.type})`, 'registration')

      // If document attached, upload to Document table
      let docUrl = data.documentUrl || ''
      if (data.documentUrl || data.documentName) {
        try {
          const doc = await supabaseUploadDocument({
            name: data.documentName || `Proof-${data.name}`,
            type: 'receipt',
            module: 'events',
            entityId: registration.id,
            url: data.documentUrl || '',
            size: data.documentSize || 0,
            mimeType: data.documentMime || '',
          })
          docUrl = doc.url || docUrl
        } catch (docErr) {}
      }

      // If submitted from public portal or flagged for approval
      if (data.requireApproval || data.documentUrl || data.documentName) {
        try {
          const appr = await supabaseAddApprovalRequest({
            type: 'registration',
            entityId: registration.id,
            entityName: `${data.name} - ${data.eventName || 'Event Registration'}`,
            amount: Number(data.amount) || 0,
            note: `Registration submission with attached proof: ${data.documentName || 'Document'}`,
            submittedBy: null,
          })
          setState((s) => ({ ...s, approvals: [appr, ...s.approvals] }))
        } catch (apprErr) {}
      }

      return registration
    } catch (sbErr) {
      if (backendOnline) {
        try {
          const { registration } = await api.registrations.create(payload)
          setState((s) => ({ ...s, registrations: [registration, ...s.registrations] }))
          setDemoFlag('lastRegId', registration.id)
          return registration
        } catch (e) {
          console.error('Failed to save registration to database:', e)
          throw e
        }
      }
      throw sbErr
    }
  }, [backendOnline, logActivity, setDemoFlag])

  const viewQr = useCallback(() => { setState((s) => ({ ...s, demo: { ...s.demo, qrViewed: true } })) }, [])

  const checkIn = useCallback(async (value, eventId) => {
    const parsed = decodeTicket(value)
    const code = parsed ? parsed.code : String(value || '').trim()
    const ci = (s) => String(s || '').trim().toLowerCase()
    const matchIn = (list, v) => {
      const c = ci(v)
      return list.find((r) => (r.qr && ci(r.qr) === c) || (r.id && ci(r.id) === c) || (r.name && ci(r.name) === c) || (r.email && ci(r.email) === c))
    }
    const eventRegs = eventId ? state.registrations.filter((r) => r.eventId === eventId) : state.registrations
    const existing = matchIn(eventRegs, code)
    if (!existing) {
      const other = eventId ? matchIn(state.registrations.filter((r) => r.eventId !== eventId), code) : null
      if (other) return { ok: false, reason: 'wrong-event', reg: other }
      return { ok: false, reason: 'not-found' }
    }
    if (existing.checkedIn) return { ok: false, reason: 'duplicate', reg: existing }
    try {
      const updated = await supabaseCheckInAttendee(existing.id)
      patchBy('registrations', existing.id, (r) => ({ ...r, checkedIn: true, checkedInAt: updated.checkedInAt || new Date().toLocaleString() }))
      setDemoFlag('lastCheckinId', existing.id)
      logActivity(`QR check-in recorded for ${existing.name}`, 'checkin')
      return { ok: true, reg: { ...existing, checkedIn: true, checkedInAt: new Date().toLocaleString() } }
    } catch (e) {
      if (backendOnline) {
        try {
          const { registration } = await api.registrations.checkIn(code)
          patchBy('registrations', registration.id, (r) => ({ ...r, checkedIn: true, checkedInAt: registration.checkedInAt || new Date().toLocaleString() }))
          setDemoFlag('lastCheckinId', registration.id)
          logActivity(`QR check-in recorded for ${registration.name}`, 'checkin')
          return { ok: true, reg: registration }
        } catch (err) {}
      }
      patchBy('registrations', existing.id, (r) => ({ ...r, checkedIn: true, checkedInAt: new Date().toLocaleString() }))
      setDemoFlag('lastCheckinId', existing.id)
      logActivity(`QR check-in recorded for ${existing.name}`, 'checkin')
      return { ok: true, reg: { ...existing, checkedIn: true, checkedInAt: new Date().toLocaleString() } }
    }
  }, [backendOnline, state.registrations, patchBy, logActivity, setDemoFlag])

  const recordExpense = useCallback(async (data) => {
    try {
      const expense = await supabaseAddExpense(data)
      setState((s) => ({ ...s, expenses: [expense, ...s.expenses] }))
      if (data.eventId) patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + (Number(data.amount) || 0) }))
      setDemoFlag('financeAction', (n) => (n || 0) + 1)
      logActivity(`Expense recorded: ${data.category || data.title} ${data.amount}`, 'finance')
      return expense
    } catch (e) {
      if (backendOnline) {
        try {
          const { expense } = await api.finance.recordExpense(data)
          setState((s) => ({ ...s, expenses: [expense, ...s.expenses] }))
          if (data.eventId) patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + (Number(data.amount) || 0) }))
          setDemoFlag('financeAction', (n) => (n || 0) + 1)
          return expense
        } catch (err) {}
      }
      patch('expenses', (a) => [{ id: 'ex-' + Math.random().toString(36).slice(2, 8), ...data }, ...a])
      if (data.eventId) patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + (Number(data.amount) || 0) }))
      setDemoFlag('financeAction', (n) => (n || 0) + 1)
      logActivity(`Expense recorded: ${data.category || data.title} ${data.amount}`, 'finance')
    }
  }, [backendOnline, patch, patchBy, logActivity, setDemoFlag])

  const recordPayment = useCallback(async (invoiceId, amount) => {
    const target = state.invoices.find((i) => i.id === invoiceId)
    const paid = (target?.paid || 0) + Number(amount)
    const status = paid >= (target?.amount || 0) ? 'paid' : paid > 0 ? 'partial' : 'outstanding'
    try {
      await supabaseUpdateInvoice(invoiceId, { paid, status })
    } catch (e) {
      console.warn('Supabase invoice update error:', e)
    }
    if (backendOnline) { try { await api.finance.recordPayment(invoiceId, amount) } catch (e) {} }
    patchBy('invoices', invoiceId, (inv) => {
      const p = (inv.paid || 0) + Number(amount)
      const s = p >= inv.amount ? 'paid' : p > 0 ? 'partial' : 'outstanding'
      return { ...inv, paid: p, status: s }
    })
    setDemoFlag('financeAction', (n) => (n || 0) + 1)
    logActivity(`Payment of ${amount} recorded`, 'finance')
  }, [backendOnline, patchBy, logActivity, setDemoFlag, state.invoices])

  const addInvoice = useCallback(async (data) => {
    try {
      const invoice = await supabaseAddInvoice(data)
      setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] }))
      logActivity(`Invoice issued for ${data.number || data.ref || ''}`, 'finance')
      return invoice
    } catch (e) {
      if (backendOnline) {
        try {
          const { invoice } = await api.finance.createInvoice(data)
          setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] }))
          return invoice
        } catch (err) {}
      }
      const rec = { id: 'inv-' + Math.random().toString(36).slice(2, 8), ...data, paid: Number(data.paid) || 0, status: (Number(data.paid) || 0) > 0 ? 'partial' : 'outstanding' }
      patch('invoices', (a) => [rec, ...a])
      logActivity(`Invoice issued for ${data.ref || ''}`, 'finance')
      return rec
    }
  }, [backendOnline, patch, logActivity])

  const addVenue = useCallback(async (data) => {
    try {
      const venue = await supabaseAddVenue(data)
      setState((s) => ({ ...s, venues: [venue, ...s.venues] }))
      setDemoFlag('venueAdded', true)
      logActivity(`Venue added: ${data.name}`, 'venue')
      return venue
    } catch (e) {
      if (backendOnline) {
        try {
          const { venue } = await api.venues.create(data)
          setState((s) => ({ ...s, venues: [venue, ...s.venues] }))
          setDemoFlag('venueAdded', true)
          return venue
        } catch (err) {}
      }
      const equipment = typeof data.equipment === 'string' ? data.equipment.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(data.equipment) ? data.equipment : []
      const rec = { id: 'vn-' + Math.random().toString(36).slice(2, 8), abbr: (data.name || 'VN').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'VN', capacity: Number(data.capacity) || 100, price: Number(data.price) || 0, equipment, status: 'available', color: 'bg-brand-600', halls: Number(data.halls) || 1, contact: data.contact || '-', image: data.image || '', address: data.address || '', description: data.description || '', contactPhone: data.contactPhone || '', contactEmail: data.contactEmail || '' }
      patch('venues', (a) => [rec, ...a])
      setDemoFlag('venueAdded', true)
      logActivity(`Venue added: ${data.name}`, 'venue')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateVenue = useCallback(async (id, data) => {
    const equipment = typeof data.equipment === 'string' ? data.equipment.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(data.equipment) ? data.equipment : []
    const payload = { ...data, equipment, capacity: Number(data.capacity) || 1, price: Number(data.price) || 0, halls: Number(data.halls) || 1 }
    if (backendOnline && id && !String(id).startsWith('vn-')) { try { await api.venues.update(id, payload) } catch (e) { /* keep local */ } }
    patchBy('venues', id, (v) => ({ ...v, ...payload }))
    logActivity(`Venue updated: ${data.name}`, 'venue')
    return payload
  }, [backendOnline, patchBy, logActivity])

  const addResource = useCallback(async (data) => {
    try {
      const resource = await supabaseAddResource(data)
      setState((s) => ({ ...s, resources: [resource, ...s.resources] }))
      setDemoFlag('resourceAdded', true)
      logActivity(`Asset added: ${data.name}`, 'inventory')
      return resource
    } catch (e) {
      if (backendOnline) {
        try {
          const { resource } = await api.resources.create(data)
          setState((s) => ({ ...s, resources: [resource, ...s.resources] }))
          setDemoFlag('resourceAdded', true)
          return resource
        } catch (err) {}
      }
      const rec = { id: 'rc-' + Math.random().toString(36).slice(2, 8), qty: Number(data.qty) || 1, allocated: 0, maintenance: 0, status: 'available', location: data.location || 'Main Warehouse', ...data }
      patch('resources', (a) => [rec, ...a])
      setDemoFlag('resourceAdded', true)
      logActivity(`Asset added: ${data.name}`, 'inventory')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateResource = useCallback(async (id, data) => {
    const payload = { ...data, qty: Number(data.qty) || 1, unitCost: Number(data.unitCost) || 0, allocated: Number(data.allocated) || 0, maintenance: Number(data.maintenance) || 0 }
    if (backendOnline && id && !String(id).startsWith('rc-')) { try { await api.resources.update(id, payload) } catch (e) { /* keep local */ } }
    patchBy('resources', id, (r) => ({ ...r, ...payload }))
    logActivity(`Asset updated: ${data.name}`, 'inventory')
    return payload
  }, [backendOnline, patchBy, logActivity])

  const addVendor = useCallback(async (data) => {
    try {
      const vendor = await supabaseAddVendor(data)
      setState((s) => ({ ...s, vendors: [vendor, ...s.vendors] }))
      setDemoFlag('vendorAdded', true)
      logActivity(`Vendor added: ${data.name} (${data.type})`, 'vendor')
      return vendor
    } catch (e) {
      if (backendOnline) {
        try {
          const { vendor } = await api.vendors.create(data)
          setState((s) => ({ ...s, vendors: [vendor, ...s.vendors] }))
          setDemoFlag('vendorAdded', true)
          return vendor
        } catch (err) {}
      }
      const rec = { id: 'vd-' + Math.random().toString(36).slice(2, 8), rating: 4.0, contracts: 0, status: 'active', ...data }
      patch('vendors', (a) => [rec, ...a])
      setDemoFlag('vendorAdded', true)
      logActivity(`Vendor added: ${data.name} (${data.type})`, 'vendor')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const addStaffMember = useCallback(async (data) => {
    try {
      const user = await supabaseAddStaffMember(data)
      setState((s) => ({ ...s, staff: [user, ...s.staff] }))
      setDemoFlag('staffAdded', true)
      logActivity(`Team member added: ${user.name}`, 'staff')
      return user
    } catch (e) {
      if (backendOnline) { try { const { user } = await api.users.create(data); setState((s) => ({ ...s, staff: [user, ...s.staff] })); setDemoFlag('staffAdded', true); return user } catch (err) {} }
      const name = data.name || 'New Member'
      const rec = { id: 'st-' + Math.random().toString(36).slice(2, 8), name, role: data.role || data.jobTitle || 'Coordinator', dept: data.dept || 'Operations', phone: data.phone || '-', email: data.email || '', type: data.type || 'Employee', status: 'active', color: 'bg-brand-500', initials: name.split(' ').map((p) => p[0]).slice(0, 2).join(''), avatar: data.avatar || '', salary: Number(data.salary) || 0, joinedDate: data.joinedDate || '', contractEnd: data.contractEnd || '', address: data.address || '', bio: data.bio || '' }
      patch('staff', (a) => [rec, ...a])
      setDemoFlag('staffAdded', true)
      logActivity(`Team member added: ${name}`, 'staff')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateStaffMember = useCallback(async (id, data) => {
    const payload = { ...data, role: data.role || data.jobTitle || data.role || '', initials: data.initials || (data.name || '').split(' ').map((p) => p[0]).slice(0, 2).join('') }
    try {
      await supabaseUpdateStaffMember(id, payload)
    } catch (e) {
      if (backendOnline && id && !String(id).startsWith('st-')) { try { await api.users.update(id, payload) } catch (err) { /* keep local */ } }
    }
    patchBy('staff', id, (m) => ({ ...m, ...payload }))
    logActivity(`Team member updated: ${data.name}`, 'staff')
    return payload
  }, [backendOnline, patchBy, logActivity])

  const addSpeaker = useCallback(async (data) => {
    try {
      const speaker = await supabaseAddSpeaker(data)
      setState((s) => ({ ...s, speakers: [speaker, ...s.speakers] }))
      setDemoFlag('speakerAdded', true)
      logActivity(`Speaker added: ${speaker.name}`, 'speaker')
      return speaker
    } catch (e) {
      if (backendOnline) { try { const { speaker } = await api.modules.createSpeaker(data); setState((s) => ({ ...s, speakers: [speaker, ...s.speakers] })); setDemoFlag('speakerAdded', true); return speaker } catch (err) {} }
      const name = data.name || 'Speaker'
      const rec = { id: 'sp-' + Math.random().toString(36).slice(2, 8), name, initials: name.split(' ').map((p) => p[0]).slice(0, 2).join(''), color: 'bg-gold-500', topic: data.topic || 'TBD', company: data.company || '', email: data.email || '', phone: data.phone || '', bio: data.bio || '', eventId: data.eventId || 'ev1', time: data.time || '12:00', status: data.status || 'pending' }
      patch('speakers', (a) => [rec, ...a])
      setDemoFlag('speakerAdded', true)
      logActivity(`Speaker added: ${name}`, 'speaker')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateSpeaker = useCallback(async (id, data) => {
    if (backendOnline && id && !String(id).startsWith('sp-')) { try { await api.modules.updateSpeaker(id, data) } catch (e) { /* keep local */ } }
    patchBy('speakers', id, (s) => ({ ...s, ...data }))
    logActivity(`Speaker updated: ${data.name}`, 'speaker')
    return data
  }, [backendOnline, patchBy, logActivity])

  const addExhibitor = useCallback(async (data) => {
    try {
      const exhibitor = await supabaseAddExhibitor(data)
      setState((s) => ({ ...s, exhibitors: [exhibitor, ...s.exhibitors] }))
      setDemoFlag('exhibitorAdded', true)
      logActivity(`Exhibitor added: ${exhibitor.company}`, 'exhibition')
      return exhibitor
    } catch (e) {
      if (backendOnline) { try { const { exhibitor } = await api.modules.createExhibitor(data); setState((s) => ({ ...s, exhibitors: [exhibitor, ...s.exhibitors] })); setDemoFlag('exhibitorAdded', true); return exhibitor } catch (err) {} }
      const rec = { id: 'ex-' + Math.random().toString(36).slice(2, 8), booth: data.booth || '-', size: data.size || 'Standard', package: data.package || 'Exhibitor', paid: Number(data.paid) || 0, status: data.status || 'registering', ...data }
      patch('exhibitors', (a) => [rec, ...a])
      setDemoFlag('exhibitorAdded', true)
      logActivity(`Exhibitor added: ${data.company} (${data.booth || 'booth TBD'})`, 'exhibition')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateExhibitor = useCallback(async (id, data) => {
    const payload = { ...data, paid: Number(data.paid) || 0 }
    if (backendOnline && id && !String(id).startsWith('ex-')) { try { await api.modules.updateExhibitor(id, payload) } catch (e) { /* keep local */ } }
    patchBy('exhibitors', id, (e) => ({ ...e, ...payload }))
    logActivity(`Exhibitor updated: ${data.company}`, 'exhibition')
    return payload
  }, [backendOnline, patchBy, logActivity])

  const addSponsor = useCallback(async (data) => {
    try {
      const sponsor = await supabaseAddSponsor(data)
      setState((s) => ({ ...s, sponsors: [sponsor, ...s.sponsors] }))
      setDemoFlag('sponsorAdded', true)
      logActivity(`Sponsor added: ${sponsor.name} (${sponsor.package})`, 'sponsorship')
      return sponsor
    } catch (e) {
      if (backendOnline) { try { const { sponsor } = await api.modules.createSponsor(data); setState((s) => ({ ...s, sponsors: [sponsor, ...s.sponsors] })); setDemoFlag('sponsorAdded', true); return sponsor } catch (err) {} }
      const rec = { id: 'spn-' + Math.random().toString(36).slice(2, 8), name: data.name || 'Sponsor', package: data.package || 'Silver', amount: Number(data.amount) || 0, status: data.status || 'pending', deliverables: typeof data.deliverables === 'string' ? data.deliverables.split(',').map((x) => x.trim()).filter(Boolean) : Array.isArray(data.deliverables) ? data.deliverables : data.deliverables ? [data.deliverables] : [], contact: data.contact || '', email: data.email || '', phone: data.phone || '', date: data.date || '' }
      patch('sponsors', (a) => [rec, ...a])
      setDemoFlag('sponsorAdded', true)
      logActivity(`Sponsor added: ${rec.name} (${rec.package})`, 'sponsorship')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateSponsor = useCallback(async (id, data) => {
    const payload = { ...data, amount: Number(data.amount) || 0, deliverables: typeof data.deliverables === 'string' ? data.deliverables.split(',').map((x) => x.trim()).filter(Boolean) : Array.isArray(data.deliverables) ? data.deliverables : data.deliverables ? [data.deliverables] : [] }
    if (backendOnline && id && !String(id).startsWith('spn-')) { try { await api.modules.updateSponsor(id, payload) } catch (e) { /* keep local */ } }
    patchBy('sponsors', id, (s) => ({ ...s, ...payload }))
    logActivity(`Sponsor updated: ${data.name}`, 'sponsorship')
    return payload
  }, [backendOnline, patchBy, logActivity])

  const addCampaign = useCallback(async (data) => {
    try {
      const campaign = await supabaseAddCampaign(data)
      setState((s) => ({ ...s, campaigns: [campaign, ...s.campaigns] }))
      setDemoFlag('campaignCreated', true)
      logActivity(`Campaign created: ${campaign.name}`, 'marketing')
      return campaign
    } catch (e) {
      if (backendOnline) { try { const { campaign } = await api.modules.createCampaign(data); setState((s) => ({ ...s, campaigns: [campaign, ...s.campaigns] })); setDemoFlag('campaignCreated', true); return campaign } catch (err) {} }
      const rec = { id: 'cm-' + Math.random().toString(36).slice(2, 8), name: data.name || 'New Campaign', channel: data.channel || 'Email', audience: Number(data.audience) || 0, sent: 0, opens: 0, clicks: 0, status: data.status || 'draft', schedule: data.schedule || '', description: data.description || '' }
      patch('campaigns', (a) => [rec, ...a])
      setDemoFlag('campaignCreated', true)
      logActivity(`Campaign created: ${rec.name}`, 'marketing')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  const updateCampaign = useCallback(async (id, data) => {
    if (backendOnline && id && !String(id).startsWith('cm-')) { try { await api.modules.updateCampaign(id, data) } catch (e) { /* keep local */ } }
    patchBy('campaigns', id, (c) => ({ ...c, ...data }))
    logActivity(`Campaign updated: ${data.name}`, 'marketing')
    return data
  }, [backendOnline, patchBy, logActivity])

  const addCoupon = useCallback(async (data) => {
    try {
      const coupon = await supabaseAddCoupon(data)
      setState((s) => ({ ...s, coupons: [coupon, ...s.coupons] }))
      setDemoFlag('couponCreated', true)
      logActivity(`Coupon ${coupon.code} generated (${coupon.discount}%)`, 'marketing')
      return coupon
    } catch (e) {
      if (backendOnline) { try { const { coupon } = await api.modules.createCoupon(data); setState((s) => ({ ...s, coupons: [coupon, ...s.coupons] })); setDemoFlag('couponCreated', true); return coupon } catch (err) {} }
      const rec = { id: 'cp-' + Math.random().toString(36).slice(2, 8), usage: 0, status: 'active', max: Number(data.max) || 500, ...data }
      patch('coupons', (a) => [rec, ...a])
      setDemoFlag('couponCreated', true)
      logActivity(`Coupon ${data.code} generated (${data.value})`, 'marketing')
      return rec
    }
  }, [backendOnline, patch, logActivity, setDemoFlag])

  // ─── EVENT SUPPLIERS & CHECKLISTS ──────────────────────────

  const setEventSuppliers = useCallback(async (eventId, vendorIds) => {
    if (backendOnline) { try { await api.modules.setEventSuppliers?.(eventId, vendorIds) } catch (e) {} }
    setState((s) => ({
      ...s,
      eventSuppliers: [
        ...s.eventSuppliers.filter((x) => x.eventId !== eventId),
        ...vendorIds.map((vendorId) => ({ eventId, vendorId })),
      ],
    }))
    logActivity(`Suppliers updated on event (${vendorIds.length} vendors)`, 'vendor')
  }, [backendOnline, logActivity])

  const toggleChecklist = useCallback(async (eventId, itemId) => {
    if (backendOnline) { try { await api.modules.toggleChecklist?.(eventId, itemId) } catch (e) {} }
    patchBy('eventChecklists', itemId, (c) => ({ ...c, done: !c.done }))
    logActivity('Checklist item updated', 'event')
  }, [backendOnline, patchBy, logActivity])

  const addChecklistItem = useCallback(async (eventId, label) => {
    const id = 'ec-' + Math.random().toString(36).slice(2, 8)
    if (backendOnline) { try { await api.modules.addChecklist?.(eventId, label) } catch (e) {} }
    patch('eventChecklists', (a) => [{ id, eventId, label, done: false }, ...a])
    logActivity(`Checklist item added: ${label}`, 'event')
    return id
  }, [backendOnline, patch, logActivity])

  // ─── CRM CONTRACTS & DOCUMENTS ─────────────────────────────

  const addContract = useCallback(async (data) => {
    const rec = { id: 'ct-' + Math.random().toString(36).slice(2, 8), ref: 'CTR-2026-' + String(1000 + Math.floor(Math.random() * 9000)), status: 'draft', ...data, value: Number(data.value) || 0 }
    if (backendOnline) { try { const { contract } = await api.modules.createContract?.(data); setDemoFlag('contractCreated', true); return contract } catch (e) {} }
    patch('contracts', (a) => [rec, ...a])
    setDemoFlag('contractCreated', true)
    const clientName = state.clients.find((c) => c.id === rec.clientId)?.company || 'client'
    logActivity(`Contract ${rec.ref} drafted for ${clientName}`, 'crm')
    return rec
  }, [backendOnline, patch, logActivity, setDemoFlag, state.clients])

  const updateContractStatus = useCallback((id, status) => {
    patchBy('contracts', id, { status })
    logActivity(`Contract moved to ${status}`, 'crm')
  }, [patchBy, logActivity])

  const addClientDoc = useCallback(async (clientId, name, ext = 'PDF', size = '-', opts = {}) => {
    const rec = { id: 'cd-' + Math.random().toString(36).slice(2, 8), clientId, name, ext, size }
    patch('clientDocs', (a) => [rec, ...a])
    const clientName = state.clients.find((c) => c.id === clientId)?.company || 'client'
    logActivity(`Document attached to ${clientName}: ${name}`, 'crm')
    try {
      await supabaseUploadDocument({
        name,
        type: opts.type || 'company_doc',
        module: 'clients',
        entityId: clientId,
        mimeType: opts.mimeType || '',
        size: Number(opts.sizeBytes) || 0,
        url: opts.url || '',
        uploadedBy: state.currentUserId,
      })
    } catch (e) {}
    if (backendOnline && clientId && !String(clientId).startsWith('cl-')) {
      try {
        await documentsApi.upload({
          name,
          type: opts.type || 'company_doc',
          module: 'clients',
          entityId: clientId,
          mimeType: opts.mimeType || '',
          size: Number(opts.sizeBytes) || 0,
          url: opts.url || '',
        })
      } catch (e) { /* local record already added as fallback */ }
    }
    return rec
  }, [backendOnline, patch, logActivity, state.clients, state.currentUserId])

  const addEventDoc = useCallback(async (eventId, name, ext = 'PDF', size = '-', opts = {}) => {
    const rec = { id: 'ed-' + Math.random().toString(36).slice(2, 8), eventId, name, ext, size }
    patch('eventDocs', (a) => [rec, ...a])
    const eventName = state.events.find((e) => e.id === eventId)?.name || 'event'
    logActivity(`Document attached to "${eventName}": ${name}`, 'event')
    try {
      await supabaseUploadDocument({
        name,
        type: opts.type || 'file',
        module: 'events',
        entityId: eventId,
        mimeType: opts.mimeType || '',
        size: Number(opts.sizeBytes) || 0,
        url: opts.url || '',
        uploadedBy: state.currentUserId,
      })
    } catch (e) {}
    if (backendOnline && eventId && !String(eventId).startsWith('ev-')) {
      try {
        await documentsApi.upload({
          name,
          type: opts.type || 'file',
          module: 'events',
          entityId: eventId,
          mimeType: opts.mimeType || '',
          size: Number(opts.sizeBytes) || 0,
          url: opts.url || '',
        })
      } catch (e) { /* local record already added as fallback */ }
    }
    return rec
  }, [backendOnline, patch, logActivity, state.events, state.currentUserId])

  // ─── FINANCE PURCHASE REQUESTS ─────────────────────────────

  const addPurchaseRequest = useCallback(async (data) => {
    const rec = { id: 'pr-' + Math.random().toString(36).slice(2, 8), date: todayISO(), status: 'pending', ...data, amount: Number(data.amount) || 0 }
    try {
      const appr = await supabaseAddApprovalRequest({
        type: 'purchase_request',
        entityId: rec.id,
        entityName: data.item || 'Purchase Request',
        amount: Number(data.amount) || 0,
        note: `Purchase request for ${data.item} (${data.category || 'General'})`,
      })
      setState((s) => ({ ...s, approvals: [appr, ...s.approvals] }))
    } catch (e) {}
    if (backendOnline) { try { const { pr } = await api.finance.createPurchaseRequest?.(data); return pr } catch (e) {} }
    patch('purchaseRequests', (a) => [rec, ...a])
    logActivity(`Purchase request submitted: ${data.item}`, 'finance')
    return rec
  }, [backendOnline, patch, logActivity])

  const setPurchaseRequestStatus = useCallback((id, status) => {
    patchBy('purchaseRequests', id, { status })
    logActivity(`Purchase request ${status}`, 'finance')
  }, [patchBy, logActivity])

  // ─── RESOURCE MAINTENANCE ──────────────────────────────────

  const scheduleMaintenance = useCallback(async (resourceId, date, task) => {
    const rec = { id: 'mt-' + Math.random().toString(36).slice(2, 8), resourceId, date, task, status: 'scheduled' }
    if (backendOnline) { try { await api.resources.scheduleMaintenance?.(resourceId, date, task) } catch (e) {} }
    patch('maintenance', (a) => [rec, ...a])
    patchBy('resources', resourceId, (r) => ({ ...r, status: 'maintenance', maintenance: (r.maintenance || 0) + 1 }))
    const name = state.resources.find((r) => r.id === resourceId)?.name || 'asset'
    logActivity(`Maintenance scheduled: ${name}`, 'inventory')
    return rec
  }, [backendOnline, patch, patchBy, logActivity, state.resources])

  const completeMaintenance = useCallback((id) => {
    patchBy('maintenance', id, { status: 'done' })
    logActivity('Maintenance completed', 'inventory')
  }, [patchBy, logActivity])

  const unreadNotifications = useMemo(() => state.notifications.length, [state.notifications])

  // ─── APPROVALS, MESSAGING & DOCUMENTS ────────────────────────

  const setApprovalStatus = useCallback(async (id, status, note = '') => {
    try {
      await supabaseUpdateApprovalStatus(id, status, note, state.currentUserId || 'st1')
      patchBy('approvals', id, (a) => ({ ...a, status, reviewNote: note || a.reviewNote, reviewedBy: state.currentUserId || 'st1' }))
    } catch (e) {
      patchBy('approvals', id, (a) => ({ ...a, status, reviewNote: note || a.reviewNote, reviewedBy: state.currentUserId || 'st1' }))
    }
    const existing = state.approvals.find((a) => a.id === id)
    logActivity(`Approval "${existing?.entityName || 'request'}" ${status}`, 'approvals')
  }, [patchBy, logActivity, state.approvals, state.currentUserId])

  const addApprovalRequest = useCallback(async (data) => {
    try {
      const rec = await supabaseAddApprovalRequest({ ...data, submittedBy: state.currentUserId || 'st1' })
      setState((s) => ({ ...s, approvals: [rec, ...s.approvals.filter((a) => a.id !== rec.id)] }))
      logActivity(`Approval request submitted: ${rec.entityName}`, 'approvals')
      return rec
    } catch (e) {
      const rec = { id: 'ap-' + Math.random().toString(36).slice(2, 8), status: 'pending', createdAt: todayISO(), ...data, amount: Number(data.amount) || 0, submittedBy: state.currentUserId || 'st1' }
      patch('approvals', (a) => [rec, ...a])
      logActivity(`Approval request submitted: ${rec.entityName}`, 'approvals')
      return rec
    }
  }, [patch, logActivity, state.currentUserId])

  const sendMessage = useCallback(async (data) => {
    try {
      const msg = await supabaseSendMessage(data)
      setState((s) => ({ ...s, messages: [...s.messages.filter((m) => m.id !== msg.id), msg] }))
      return msg
    } catch (e) {
      const local = { id: 'msg_' + Date.now(), ...data, createdAt: new Date().toISOString() }
      setState((s) => ({ ...s, messages: [...s.messages, local] }))
      return local
    }
  }, [])

  const uploadDocument = useCallback(async (data) => {
    try {
      const doc = await supabaseUploadDocument(data)
      setState((s) => ({ ...s, documents: [doc, ...s.documents.filter((d) => d.id !== doc.id)] }))
      return doc
    } catch (e) {
      const local = { id: 'doc_' + Date.now(), ...data, createdAt: new Date().toISOString() }
      setState((s) => ({ ...s, documents: [local, ...s.documents] }))
      return local
    }
  }, [])

  const addCalendarEvent = useCallback(async (data) => {
    const rec = { id: 'ce-' + Math.random().toString(36).slice(2, 8), ...data }
    try {
      const saved = await supabaseAddCalendarEvent(data)
      patch('calendarEvents', (a) => [saved, ...a])
      logActivity(`Calendar event created: ${saved.title}`, 'workflow')
      return saved
    } catch (e) {
      patch('calendarEvents', (a) => [rec, ...a])
      logActivity(`Calendar event created: ${rec.title}`, 'workflow')
      return rec
    }
  }, [patch, logActivity])

  // ─── RBAC ────────────────────────────────────────────────────

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
    updateClient,
    addVenue, addResource, addVendor, addStaffMember, addSpeaker, addExhibitor, addSponsor, addCampaign, addCoupon,
    updateVenue, updateResource, updateStaffMember, updateExhibitor, updateSpeaker, updateSponsor, updateCampaign,
    setEventTeam, setEventBudget, allocateResource, allocateResources, viewQr,
    setEventSuppliers, toggleChecklist, addChecklistItem,
    addContract, updateContractStatus, addClientDoc,
    addEventDoc,
    addPurchaseRequest, setPurchaseRequestStatus,
    scheduleMaintenance, completeMaintenance,
    setApprovalStatus, addApprovalRequest, addCalendarEvent,
    sendMessage, uploadDocument,
    markDone, setIntent, clearIntent, setDemoOpen, markVisitedReports,
    intent: state.intent,
    login, loginClient, logout, refreshData,
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
  clientName: (s, id) => s.clients.find((c) => c.id === id)?.company || '-',
  eventName: (s, id) => s.events.find((e) => e.id === id)?.name || '-',
  venueName: (s, id) => s.venues.find((v) => v.id === id)?.name || '-',
  staffName: (s, id) => s.staff.find((m) => m.id === id)?.name || '-',
  vendorName: (s, id) => s.vendors.find((v) => v.id === id)?.name || '-',
}