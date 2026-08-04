import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  staffSeed, clientsSeed, venuesSeed, resourcesSeed, vendorsSeed, eventsSeed,
  tasksSeed, speakersSeed, exhibitorsSeed, sponsorsSeed, invoicesSeed, expensesSeed,
  registrationsSeed, activitiesSeed, notificationsSeed, campaignsSeed,
} from './data'

const DataContext = createContext(null)

const initial = {
  staff: staffSeed,
  clients: clientsSeed,
  venues: venuesSeed,
  resources: resourcesSeed,
  vendors: vendorsSeed,
  events: eventsSeed,
  tasks: tasksSeed,
  speakers: speakersSeed,
  exhibitors: exhibitorsSeed,
  sponsors: sponsorsSeed,
  invoices: invoicesSeed,
  expenses: expensesSeed,
  registrations: registrationsSeed,
  activities: activitiesSeed,
  notifications: notificationsSeed,
  campaigns: campaignsSeed,
  currentUserId: null,
  lastLogin: null,
  intent: null,
  demo: {
    open: false,
    done: [0],
    lastClientId: null,
    lastEventId: null,
    lastRegId: null,
    lastCheckinId: null,
    lastQrId: null,
    financeAction: 0,
    qrViewed: false,
    budgetSet: false,
    allocated: false,
    teamAssigned: false,
    visitedReports: false,
  },
}

const idFor = (prefix) => prefix + '-' + Math.random().toString(36).slice(2, 8)

export function DataProvider({ children }) {
  const [state, setState] = useState(initial)

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
      activities: [{ id: uid(), text, type, at: 'Just now' }, ...s.activities],
    }))
  }, [])

  const addNotification = useCallback((text, type = 'general') => {
    setState((s) => ({
      ...s,
      notifications: [{ id: uid(), text, type, at: 'Just now' }, ...s.notifications],
    }))
  }, [])

  // Authentication
  const login = useCallback((userId) => {
    setState((s) => ({ ...s, currentUserId: userId, lastLogin: new Date().toISOString() }))
    logActivity(`Signed in to the workspace`, 'general')
  }, [logActivity])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null, intent: null }))
  }, [])

  // Demo-mode tracking
  const markDone = useCallback((step) => {
    setState((s) => (s.demo.done.includes(step) ? s : { ...s, demo: { ...s.demo, done: [...s.demo.done, step] } }))
  }, [])

  const setIntent = useCallback((intent) => {
    setState((s) => ({ ...s, intent }))
  }, [])

  const clearIntent = useCallback(() => {
    setState((s) => ({ ...s, intent: null }))
  }, [])

  const setDemoOpen = useCallback((open) => {
    setState((s) => ({ ...s, demo: { ...s.demo, open } }))
  }, [])

  // High-level domain actions powering the demo workflow
  const addClient = useCallback((data) => {
    const id = idFor('cl')
    const rec = {
      id,
      company: data.company, industry: data.industry || 'General',
      city: data.city || 'Addis Ababa', contactPerson: data.contactPerson,
      role: data.role || 'Contact', phone: data.phone, email: data.email,
      status: 'active', stage: data.stage || 'lead', totalValue: 0,
      logo: data.company.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'CO',
    }
    patch('clients', (a) => [rec, ...a])
    patch('demo', (d) => ({ ...d, lastClientId: id }))
    logActivity(`New client profile created: ${data.company}`, 'crm')
    return rec
  }, [patch, logActivity])

  const addEvent = useCallback((data) => {
    const id = idFor('ev')
    const rec = {
      id, name: data.name, clientId: data.clientId, venueId: data.venueId,
      category: data.category, date: data.date, time: data.time || '09:00',
      status: 'upcoming', pmId: data.pmId || 'st2', budget: Number(data.budget) || 0,
      spent: 0, stage: 10, progress: 10,
      team: [data.pmId || 'st2'],
      allocations: [],
    }
    patch('events', (a) => [rec, ...a])
    patch('demo', (d) => ({ ...d, lastEventId: id }))
    logActivity(`Event created: ${data.name}`, 'event')
    return rec
  }, [patch, logActivity])

  const setEventTeam = useCallback((eventId, memberIds) => {
    patchBy('events', eventId, (e) => ({ ...e, team: memberIds }))
    patch('demo', (d) => ({ ...d, teamAssigned: true }))
    logActivity(`Team updated on event (${memberIds.length} members)`, 'event')
  }, [patchBy, patch, logActivity])

  const setEventBudget = useCallback((eventId, budget) => {
    patchBy('events', eventId, (e) => ({ ...e, budget: Number(budget) || 0 }))
    patch('demo', (d) => ({ ...d, budgetSet: true }))
    logActivity(`Budget set to ETB ${Number(budget) || 0}`, 'finance')
  }, [patchBy, logActivity])

  const allocateResource = useCallback((resourceId, eventId, qty) => {
    patchBy('resources', resourceId, (r) => ({ ...r, allocated: (r.allocated || 0) + Number(qty) || 0 }))
    patchBy('events', eventId, (e) => ({ ...e, allocations: [...(e.allocations || []), { resourceId, qty: Number(qty) || 1 }] }))
    patch('demo', (d) => ({ ...d, allocated: true }))
    logActivity(`Resource allocated to event (${qty}x)`, 'inventory')
  }, [patchBy, logActivity])

  const addTask = useCallback((data) => {
    const rec = { id: idFor('tk'), ...data, status: data.status || 'todo', comments: 0 }
    patch('tasks', (a) => [rec, ...a])
    logActivity(`Task created: ${data.title}`, 'task')
  }, [patch, logActivity])

  const updateTask = useCallback((id, updater) => patchBy('tasks', id, updater), [patchBy])

  const registerAttendee = useCallback((data) => {
    const rec = { id: idFor('rg'), qr: 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase(), checkedIn: false, ...data }
    patch('registrations', (a) => [rec, ...a])
    patch('demo', (d) => ({ ...d, lastRegId: rec.id }))
    logActivity(`Registration added: ${data.name} (${data.type})`, 'registration')
    return rec
  }, [patch, logActivity])

  const viewQr = useCallback(() => {
    patch('demo', (d) => ({ ...d, qrViewed: true }))
  }, [])

  const checkIn = useCallback((qr) => {
    const existing = state.registrations.find((r) => r.qr === qr)
    if (!existing) return { ok: false, reason: 'not-found' }
    if (existing.checkedIn) return { ok: false, reason: 'duplicate', reg: existing }
    patchBy('registrations', existing.id, (r) => ({ ...r, checkedIn: true }))
    patch('demo', (d) => ({ ...d, lastCheckinId: existing.id }))
    logActivity(`QR check-in recorded for ${existing.name}`, 'checkin')
    return { ok: true, reg: existing }
  }, [state.registrations, patchBy, logActivity])

  const recordExpense = useCallback((data) => {
    patch('expenses', (a) => [{ id: idFor('ex'), ...data }, ...a])
    patchBy('events', data.eventId, (e) => ({ ...e, spent: (e.spent || 0) + Number(data.amount) || 0 }))
    patch('demo', (d) => ({ ...d, financeAction: (d.financeAction || 0) + 1 }))
    logActivity(`Expense recorded: ${data.category} ${data.amount}`, 'finance')
  }, [patch, patchBy, logActivity])

  const recordPayment = useCallback((invoiceId, amount) => {
    patchBy('invoices', invoiceId, (inv) => {
      const paid = inv.paid + amount
      const status = paid >= inv.amount ? 'paid' : paid > 0 ? 'partial' : 'outstanding'
      return { ...inv, paid, status }
    })
    patch('demo', (d) => ({ ...d, financeAction: (d.financeAction || 0) + 1 }))
    logActivity(`Payment of ${amount} recorded`, 'finance')
  }, [patchBy, logActivity])

  const addInvoice = useCallback((data) => {
    const rec = { id: idFor('inv'), ...data, paid: Number(data.paid) || 0, status: (Number(data.paid) || 0) > 0 ? 'partial' : 'outstanding' }
    patch('invoices', (a) => [rec, ...a])
    logActivity(`Invoice issued for ${data.ref || ''}`, 'finance')
  }, [patch, logActivity])

  // Generic record adders so every "add" form persists real data
  const addVenue = useCallback((data) => {
    const equipment = typeof data.equipment === 'string'
      ? data.equipment.split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(data.equipment) ? data.equipment : []
    const rec = { id: idFor('vn'), abbr: (data.name || 'VN').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'VN', capacity: Number(data.capacity) || 100, price: Number(data.price) || 0, equipment, status: 'available', color: 'bg-brand-600', halls: Number(data.halls) || 1, contact: data.contact || '—' }
    patch('venues', (a) => [rec, ...a])
    logActivity(`Venue added: ${data.name}`, 'venue')
    return rec
  }, [patch, logActivity])

  const addResource = useCallback((data) => {
    const rec = { id: idFor('rc'), qty: Number(data.qty) || 1, allocated: 0, maintenance: 0, status: 'available', location: data.location || 'Main Warehouse', ...data }
    patch('resources', (a) => [rec, ...a])
    logActivity(`Asset added: ${data.name}`, 'inventory')
    return rec
  }, [patch, logActivity])

  const addVendor = useCallback((data) => {
    const rec = { id: idFor('vd'), rating: 4.0, contracts: 0, status: 'active', ...data }
    patch('vendors', (a) => [rec, ...a])
    logActivity(`Vendor added: ${data.name} (${data.type})`, 'vendor')
    return rec
  }, [patch, logActivity])

  const addStaffMember = useCallback((data) => {
    const name = data.name || 'New Member'
    const rec = { id: idFor('st'), name, role: data.role || 'Coordinator', dept: data.dept || 'Operations', phone: data.phone || '—', email: data.email || '', type: data.type || 'Employee', status: data.status || 'active', color: 'bg-brand-500', initials: name.split(' ').map((p) => p[0]).slice(0, 2).join('') }
    patch('staff', (a) => [rec, ...a])
    logActivity(`Team member added: ${name}`, 'staff')
    return rec
  }, [patch, logActivity])

  const addSpeaker = useCallback((data) => {
    const name = data.name || 'Speaker'
    const rec = { id: idFor('sp'), name, initials: name.split(' ').map((p) => p[0]).slice(0, 2).join(''), color: 'bg-gold-500', topic: data.topic || 'TBD', company: data.company || '', eventId: data.eventId || 'ev1', time: data.time || '12:00', status: data.status || 'pending' }
    patch('speakers', (a) => [rec, ...a])
    logActivity(`Speaker added: ${name}`, 'speaker')
    return rec
  }, [patch, logActivity])

  const addExhibitor = useCallback((data) => {
    const rec = { id: idFor('ex'), booth: data.booth || '—', size: data.size || 'Standard', package: data.package || 'Exhibitor', paid: Number(data.paid) || 0, status: data.status || 'registering', ...data }
    patch('exhibitors', (a) => [rec, ...a])
    logActivity(`Exhibitor added: ${data.company} (${data.booth || 'booth TBD'})`, 'exhibition')
    return rec
  }, [patch, logActivity])

  const addSponsor = useCallback((data) => {
    const rec = { id: idFor('spn'), name: data.name || 'Sponsor', package: data.package || 'Silver', amount: Number(data.amount) || 0, status: data.status || 'pending', deliverables: data.deliverables ? [data.deliverables] : [] }
    patch('sponsors', (a) => [rec, ...a])
    logActivity(`Sponsor added: ${rec.name} (${rec.package})`, 'sponsorship')
    return rec
  }, [patch, logActivity])

  const addCampaign = useCallback((data) => {
    const rec = { id: idFor('cm'), name: data.name || 'New Campaign', channel: data.channel || 'Email', audience: Number(data.audience) || 0, sent: 0, opens: 0, clicks: 0, status: data.status || 'draft' }
    patch('campaigns', (a) => [rec, ...a])
    logActivity(`Campaign created: ${rec.name}`, 'marketing')
    return rec
  }, [patch, logActivity])

  const addCoupon = useCallback((data) => {
    patch('campaigns', (a) => a) // no-op kept for API symmetry
    logActivity(`Coupon ${data.code} generated (${data.value})`, 'marketing')
  }, [patch, logActivity])

  const unreadNotifications = useMemo(() => state.notifications.length, [state.notifications])

  const value = {
    state, patch, patchBy, logActivity, addNotification,
    addClient, addEvent, addTask, updateTask, registerAttendee, checkIn,
    recordExpense, recordPayment, addInvoice,
    addVenue, addResource, addVendor, addStaffMember, addSpeaker, addExhibitor, addSponsor, addCampaign, addCoupon,
    setEventTeam, setEventBudget, allocateResource, viewQr,
    markDone, setIntent, clearIntent, setDemoOpen,
    login, logout,
    unreadNotifications,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function uid() {
  return 'n' + Math.random().toString(36).slice(2, 8)
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