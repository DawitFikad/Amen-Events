import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {}

export const SUPABASE_URL =
  (env.VITE_SUPABASE_URL || '').trim() || 'https://hwvhqeduqsktxmvqutzx.supabase.co'
export const SUPABASE_ANON_KEY =
  (env.VITE_SUPABASE_ANON_KEY || '').trim() || 'sb_publishable_vWHeulvtmydjpeP-2Hy7FA_VIogqjM4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Unique ID generator compatible with Prisma schema text IDs
export function generateId(prefix = '') {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 10)
  return prefix ? `${prefix}_${ts}${rand}` : `c${ts}${rand}`
}


// Quick health check against Supabase PostgreSQL
export async function checkSupabaseHealth() {
  try {
    const { count, error } = await supabase.from('User').select('*', { count: 'exact', head: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, userCount: count ?? 0 }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// Fetch complete dataset for the ERP application from Supabase
export async function fetchAllSupabaseData() {
  const [
    eventsRes, clientsRes, tasksRes, venuesRes, resourcesRes,
    vendorsRes, invoicesRes, expensesRes, registrationsRes,
    staffRes, speakersRes, exhibitorsRes, sponsorsRes,
    campaignsRes, couponsRes, activitiesRes, notificationsRes, documentsRes,
    messagesRes, approvalsRes, allocationsRes, calendarEventsRes,
  ] = await Promise.all([
    supabase.from('Event').select('*, client:Client(*), venue:Venue(*)').order('createdAt', { ascending: false }),
    supabase.from('Client').select('*').order('createdAt', { ascending: false }),
    supabase.from('Task').select('*').order('createdAt', { ascending: false }),
    supabase.from('Venue').select('*').order('createdAt', { ascending: false }),
    supabase.from('Resource').select('*').order('createdAt', { ascending: false }),
    supabase.from('Vendor').select('*').order('createdAt', { ascending: false }),
    supabase.from('Invoice').select('*, client:Client(*), event:Event(*)').order('createdAt', { ascending: false }),
    supabase.from('Expense').select('*, vendor:Vendor(*), event:Event(*)').order('createdAt', { ascending: false }),
    supabase.from('Registration').select('*, event:Event(*)').order('createdAt', { ascending: false }),
    supabase.from('User').select('id, name, initials, color, dept, jobTitle, email, phone, type, status, avatar'),
    supabase.from('Speaker').select('*, event:Event(*)').order('createdAt', { ascending: false }),
    supabase.from('Exhibitor').select('*').order('createdAt', { ascending: false }),
    supabase.from('Sponsor').select('*').order('createdAt', { ascending: false }),
    supabase.from('Campaign').select('*').order('createdAt', { ascending: false }),
    supabase.from('Coupon').select('*'),
    supabase.from('ActivityLog').select('*').order('createdAt', { ascending: false }).limit(30),
    supabase.from('Notification').select('*').order('createdAt', { ascending: false }).limit(50),
    supabase.from('Document').select('*').order('createdAt', { ascending: false }),
    supabase.from('Message').select('*').order('createdAt', { ascending: true }),
    supabase.from('ApprovalRequest').select('*').order('createdAt', { ascending: false }),
    supabase.from('Allocation').select('*'),
    supabase.from('CalendarEvent').select('*').order('date', { ascending: true }),
  ])

  return {
    events: eventsRes.data || [],
    clients: clientsRes.data || [],
    tasks: tasksRes.data || [],
    venues: venuesRes.data || [],
    resources: resourcesRes.data || [],
    vendors: vendorsRes.data || [],
    invoices: invoicesRes.data || [],
    expenses: expensesRes.data || [],
    registrations: registrationsRes.data || [],
    staff: staffRes.data || [],
    speakers: speakersRes.data || [],
    exhibitors: exhibitorsRes.data || [],
    sponsors: sponsorsRes.data || [],
    campaigns: campaignsRes.data || [],
    coupons: couponsRes.data || [],
    activities: activitiesRes.data || [],
    notifications: notificationsRes.data || [],
    documents: documentsRes.data || [],
    messages: messagesRes.data || [],
    approvals: approvalsRes.data || [],
    allocations: allocationsRes.data || [],
    calendarEvents: calendarEventsRes.data || [],
  }
}

// ─── EVENTS ────────────────────────────────────────────────────────
export async function supabaseAddEvent(data) {
  const id = generateId('ev')
  const now = new Date().toISOString()
  const pmId = data.pmId || 'st2'
  const team = Array.isArray(data.team) && data.team.length ? data.team : [pmId]
  const tags = Array.isArray(data.tags)
    ? data.tags
    : String(data.tags || '').split(',').map((t) => t.trim()).filter(Boolean)

  let venueId = data.venueId && String(data.venueId).trim() ? String(data.venueId).trim() : null
  if (venueId) {
    const { data: vCheck } = await supabase.from('Venue').select('id').eq('id', venueId).maybeSingle()
    if (!vCheck) venueId = null
  }
  let clientId = data.clientId && String(data.clientId).trim() ? String(data.clientId).trim() : null
  if (clientId) {
    const { data: cCheck } = await supabase.from('Client').select('id').eq('id', clientId).maybeSingle()
    if (!cCheck) clientId = null
  }

  const record = {
    id,
    name: data.name,
    clientId,
    venueId,
    category: data.category || 'General',
    date: data.date || '',
    time: data.time || '09:00',
    status: data.status || 'upcoming',
    pmId,
    budget: Number(data.budget) || 0,
    spent: Number(data.spent) || 0,
    stage: Number(data.stage) || 4,
    progress: Number(data.progress) || 36,
    team,
    image: data.image || '',
    description: data.description || '',
    endDate: data.endDate || '',
    endTime: data.endTime || '',
    deadline: data.deadline || '',
    capacity: Number(data.capacity) || 0,
    price: Number(data.price) || 0,
    published: data.published !== undefined ? !!data.published : true,
    tags,
    contactName: data.contactName || '',
    contactPhone: data.contactPhone || '',
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Event')
    .insert([record])
    .select('*, client:Client(*), venue:Venue(*)')
    .single()

  if (error) {
    console.error('Supabase Event insert failed:', error)
    throw error
  }
  await supabaseLogActivity(`Event created: ${record.name}`, 'event')
  return inserted || record
}

export async function supabaseUpdateEvent(id, updates) {
  const allowed = [
    'name', 'clientId', 'venueId', 'category', 'date', 'time', 'status', 'pmId',
    'budget', 'spent', 'stage', 'attendees', 'progress', 'team', 'image',
    'description', 'endDate', 'endTime', 'deadline', 'capacity', 'price',
    'published', 'tags', 'contactName', 'contactPhone'
  ]
  const cleanData = { updatedAt: new Date().toISOString() }
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      cleanData[k] = updates[k]
    }
  }
  if (cleanData.budget !== undefined) cleanData.budget = Number(cleanData.budget) || 0
  if (cleanData.spent !== undefined) cleanData.spent = Number(cleanData.spent) || 0
  if (cleanData.capacity !== undefined) cleanData.capacity = Number(cleanData.capacity) || 0
  if (cleanData.price !== undefined) cleanData.price = Number(cleanData.price) || 0
  if (cleanData.progress !== undefined) cleanData.progress = Number(cleanData.progress) || 0
  if (cleanData.stage !== undefined) cleanData.stage = Number(cleanData.stage) || 0
  if (cleanData.tags !== undefined && !Array.isArray(cleanData.tags)) {
    cleanData.tags = String(cleanData.tags).split(',').map((t) => t.trim()).filter(Boolean)
  }
  if (cleanData.venueId) {
    const { data: vCheck } = await supabase.from('Venue').select('id').eq('id', cleanData.venueId).maybeSingle()
    if (!vCheck) cleanData.venueId = null
  }
  if (cleanData.clientId) {
    const { data: cCheck } = await supabase.from('Client').select('id').eq('id', cleanData.clientId).maybeSingle()
    if (!cCheck) cleanData.clientId = null
  }

  const { data: updated, error } = await supabase
    .from('Event')
    .update(cleanData)
    .eq('id', id)
    .select('*, client:Client(*), venue:Venue(*)')
    .single()

  if (error) {
    console.error('Supabase Event update failed:', error)
    throw error
  }
  return updated
}

export async function supabaseDeleteEvent(id) {
  const { error } = await supabase.from('Event').delete().eq('id', id)
  if (error) throw error
}

// ─── CLIENTS ───────────────────────────────────────────────────────
export async function supabaseAddClient(data) {
  const id = generateId('cl')
  const now = new Date().toISOString()
  const logo =
    data.logo ||
    (data.company || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() ||
    'CO'

  const record = {
    id,
    company: data.company,
    industry: data.industry || 'General',
    city: data.city || 'Addis Ababa',
    contactPerson: data.contactPerson || '',
    contactRole: data.contactRole || data.role || 'Contact',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    taxId: data.taxId || '',
    address: data.address || '',
    notes: data.notes || '',
    photo: data.photo || '',
    status: data.status || 'active',
    stage: data.stage || 'lead',
    totalValue: Number(data.totalValue) || 0,
    logo,
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Client')
    .insert([record])
    .select('*')
    .single()

  if (error) throw error
  await supabaseLogActivity(`New client profile created: ${record.company}`, 'crm')
  return inserted || record
}

export async function supabaseUpdateClient(id, updates) {
  const data = { ...updates, updatedAt: new Date().toISOString() }
  const { data: updated, error } = await supabase
    .from('Client')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return updated
}

export async function supabaseDeleteClient(id) {
  const { error } = await supabase.from('Client').delete().eq('id', id)
  if (error) throw error
}

// ─── TASKS ─────────────────────────────────────────────────────────
export async function supabaseAddTask(data) {
  const id = generateId('tk')
  const now = new Date().toISOString()
  
  let eventId = data.eventId && String(data.eventId).trim() ? String(data.eventId).trim() : null
  if (eventId) {
    const { data: evCheck } = await supabase.from('Event').select('id').eq('id', eventId).maybeSingle()
    if (!evCheck) {
      console.warn(`Supabase Task: eventId "${eventId}" not in Postgres Event table. Nullifying eventId to satisfy FK constraint.`)
      eventId = null
    }
  }

  const record = {
    id,
    title: data.title,
    eventId,
    assigneeId: data.assigneeId && String(data.assigneeId).trim() ? String(data.assigneeId).trim() : null,
    priority: data.priority || 'medium',
    status: data.status || 'todo',
    due: data.due || '',
    comments: Number(data.comments) || 0,
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Task')
    .insert([record])
    .select('*')
    .single()

  if (error) {
    console.error('Supabase Task insert error:', error)
    throw error
  }
  await supabaseLogActivity(`Task created: ${record.title}`, 'task')
  return { ...record, ...inserted, eventId: data.eventId || inserted.eventId }
}

export async function supabaseUpdateTask(id, updates) {
  const allowed = ['title', 'eventId', 'assigneeId', 'priority', 'status', 'due', 'comments']
  const cleanData = { updatedAt: new Date().toISOString() }

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      cleanData[key] = updates[key]
    }
  }

  if (cleanData.eventId) {
    const { data: evCheck } = await supabase.from('Event').select('id').eq('id', cleanData.eventId).maybeSingle()
    if (!evCheck) {
      cleanData.eventId = null
    }
  }

  const { data: updated, error } = await supabase
    .from('Task')
    .update(cleanData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Supabase Task update error:', error)
    throw error
  }
  return updated
}

export async function supabaseDeleteTask(id) {
  const { error } = await supabase.from('Task').delete().eq('id', id)
  if (error) {
    console.error('Supabase Task delete error:', error)
    throw error
  }
}

// ─── REGISTRATIONS ─────────────────────────────────────────────────
export async function supabaseRegisterAttendee(data) {
  const id = generateId('rg')
  const now = new Date().toISOString()
  const record = {
    id,
    eventId: data.eventId,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    company: data.company || '',
    jobTitle: data.jobTitle || '',
    type: data.type || 'Standard',
    paid: !!data.paid,
    amount: Number(data.amount ?? data.price) || 0,
    paymentMethod: data.paymentMethod || 'Cash',
    qr: data.qr || `AE-${id.slice(-6).toUpperCase()}`,
    checkedIn: !!data.checkedIn,
    checkedInAt: data.checkedIn ? now : '',
    createdAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Registration')
    .insert([record])
    .select('*, event:Event(*)')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Registration added: ${record.name} (${record.type})`, 'registration')
  return inserted || record
}

export async function supabaseCheckInAttendee(identifier) {
  const now = new Date().toISOString()
  const clean = String(identifier || '').trim()

  // Try by ID first
  let res = await supabase
    .from('Registration')
    .update({ checkedIn: true, checkedInAt: now })
    .eq('id', clean)
    .select('*, event:Event(*)')
    .maybeSingle()

  // If not found by ID, try by QR code
  if (!res.data) {
    res = await supabase
      .from('Registration')
      .update({ checkedIn: true, checkedInAt: now })
      .ilike('qr', clean)
      .select('*, event:Event(*)')
      .maybeSingle()
  }

  if (res.error) throw res.error
  const updated = res.data
  if (updated) {
    await supabaseLogActivity(`Attendee checked in: ${updated.name || clean} (${updated.type || 'Standard'})`, 'checkin')
  }
  return updated
}


// ─── VENUES ────────────────────────────────────────────────────────
export async function supabaseAddVenue(data) {
  const id = generateId('vn')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name,
    city: data.city || 'Addis Ababa',
    halls: Number(data.halls) || 1,
    capacity: Number(data.capacity) || 100,
    price: Number(data.price) || 0,
    contact: data.contact || '',
    equipment: Array.isArray(data.equipment) ? data.equipment : [],
    status: data.status || 'available',
    color: data.color || 'bg-brand-600',
    abbr: data.abbr || (data.name || '').slice(0, 2).toUpperCase(),
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Venue')
    .insert([record])
    .select('*')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Venue added: ${record.name}`, 'venue')
  return inserted || record
}

// ─── RESOURCES ─────────────────────────────────────────────────────
export async function supabaseAddResource(data) {
  const id = generateId('rs')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name,
    category: data.category || 'General',
    qty: Number(data.qty) || 1,
    allocated: 0,
    maintenance: 0,
    status: data.status || 'available',
    location: data.location || 'Main Warehouse',
    code: data.code || `RES-${id.slice(-4).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Resource')
    .insert([record])
    .select('*')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Resource added: ${record.name}`, 'inventory')
  return inserted || record
}

// ─── VENDORS ───────────────────────────────────────────────────────
export async function supabaseAddVendor(data) {
  const id = generateId('vd')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name,
    type: data.type || 'Services',
    contact: data.contact || '',
    phone: data.phone || '',
    rating: Number(data.rating) || 4.0,
    contracts: Number(data.contracts) || 0,
    status: data.status || 'active',
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Vendor')
    .insert([record])
    .select('*')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Vendor added: ${record.name}`, 'vendor')
  return inserted || record
}

// ─── INVOICES & EXPENSES ───────────────────────────────────────────
export async function supabaseAddInvoice(data) {
  const id = generateId('inv')
  const now = new Date().toISOString()
  const ref = data.ref || data.number || `INV-${Date.now().toString().slice(-5)}`
  const record = {
    id,
    ref,
    clientId: data.clientId && data.clientId.trim() ? data.clientId.trim() : null,
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    amount: Number(data.amount) || 0,
    paid: Number(data.paid) || 0,
    status: data.status || 'outstanding',
    dueDate: data.dueDate || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Invoice')
    .insert([record])
    .select('*, client:Client(*), event:Event(*)')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Invoice created: ${record.ref}`, 'finance')
  return inserted || record
}

export async function supabaseUpdateInvoice(id, updates) {
  const data = { ...updates, updatedAt: new Date().toISOString() }
  const { data: updated, error } = await supabase
    .from('Invoice')
    .update(data)
    .eq('id', id)
    .select('*, client:Client(*), event:Event(*)')
    .single()

  if (error) throw error
  return updated
}

export async function supabaseAddExpense(data) {
  const id = generateId('exp')
  const now = new Date().toISOString()
  const record = {
    id,
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    vendorId: data.vendorId && data.vendorId.trim() ? data.vendorId.trim() : null,
    amount: Number(data.amount) || 0,
    category: data.category || 'General',
    date: data.date || now.split('T')[0],
    createdAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Expense')
    .insert([record])
    .select('*, vendor:Vendor(*), event:Event(*)')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Expense recorded: ${data.category || data.title || 'Expense'} (ETB ${record.amount})`, 'finance')
  return inserted || record
}

// ─── ACTIVITY & NOTIFICATIONS ──────────────────────────────────────
export async function supabaseLogActivity(text, type = 'general', userId = null) {
  try {
    const id = generateId('act')
    await supabase.from('ActivityLog').insert([{
      id,
      text,
      type,
      userId,
      at: 'Just now',
      createdAt: new Date().toISOString(),
    }])
  } catch (e) {
    // Non-blocking for activity logs
  }
}

export async function supabaseAddNotification(text, type = 'general', userId = null) {
  try {
    const id = generateId('notif')
    await supabase.from('Notification').insert([{
      id,
      text,
      type,
      userId,
      read: false,
      at: 'Just now',
      createdAt: new Date().toISOString(),
    }])
  } catch (e) {
    // Non-blocking for notifications
  }
}

// ─── SPEAKERS, EXHIBITORS, SPONSORS, MARKETING ──────────────────────
export async function supabaseAddSpeaker(data) {
  const id = generateId('sp')
  const now = new Date().toISOString()
  const name = data.name || 'Speaker'
  const record = {
    id,
    name,
    initials: name.split(' ').map((p) => p[0]).slice(0, 2).join(''),
    color: 'bg-gold-500',
    topic: data.topic || 'TBD',
    company: data.company || '',
    email: data.email || '',
    phone: data.phone || '',
    bio: data.bio || '',
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    time: data.time || '12:00',
    status: data.status || 'pending',
    createdAt: now,
  }
  const { data: inserted, error } = await supabase.from('Speaker').insert([record]).select('*, event:Event(*)').single()
  if (error) throw error
  await supabaseLogActivity(`Speaker added: ${name}`, 'speaker')
  return inserted || record
}

export async function supabaseAddExhibitor(data) {
  const id = generateId('ex')
  const now = new Date().toISOString()
  const record = {
    id,
    company: data.company || 'Exhibitor',
    contact: data.contact || data.contactPerson || '',
    email: data.email || '',
    phone: data.phone || '',
    booth: data.booth || '-',
    size: data.size || 'Standard',
    package: data.package || 'Exhibitor',
    paid: Number(data.paid) || 0,
    status: data.status || 'registering',
    createdAt: now,
  }
  const { data: inserted, error } = await supabase.from('Exhibitor').insert([record]).select('*').single()
  if (error) throw error
  await supabaseLogActivity(`Exhibitor added: ${record.company}`, 'exhibition')
  return inserted || record
}

export async function supabaseAddSponsor(data) {
  const id = generateId('spn')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name || 'Sponsor',
    package: data.package || 'Silver',
    amount: Number(data.amount) || 0,
    status: data.status || 'pending',
    deliverables: typeof data.deliverables === 'string' ? data.deliverables.split(',').map((x) => x.trim()).filter(Boolean) : Array.isArray(data.deliverables) ? data.deliverables : [],
    contact: data.contact || '',
    email: data.email || '',
    phone: data.phone || '',
    date: data.date || '',
    createdAt: now,
  }
  const { data: inserted, error } = await supabase.from('Sponsor').insert([record]).select('*').single()
  if (error) throw error
  await supabaseLogActivity(`Sponsor added: ${record.name}`, 'sponsorship')
  return inserted || record
}

export async function supabaseAddCampaign(data) {
  const id = generateId('cm')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name || 'New Campaign',
    channel: data.channel || 'Email',
    audience: Number(data.audience) || 0,
    sent: 0,
    opens: 0,
    clicks: 0,
    status: data.status || 'draft',
    schedule: data.schedule || '',
    description: data.description || '',
    createdAt: now,
    updatedAt: now,
  }
  const { data: inserted, error } = await supabase.from('Campaign').insert([record]).select('*').single()
  if (error) throw error
  await supabaseLogActivity(`Campaign created: ${record.name}`, 'marketing')
  return inserted || record
}

export async function supabaseAddCoupon(data) {
  const id = generateId('cp')
  const now = new Date().toISOString()
  const record = {
    id,
    code: data.code || `PROMO${Date.now().toString().slice(-4)}`,
    discount: Number(data.discount) || 10,
    type: data.type || 'percentage',
    usage: 0,
    max: Number(data.max) || 500,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  const { data: inserted, error } = await supabase.from('Coupon').insert([record]).select('*').single()
  if (error) throw error
  await supabaseLogActivity(`Coupon created: ${record.code}`, 'marketing')
  return inserted || record
}

// ─── MESSAGES ──────────────────────────────────────────────────────
export async function supabaseFetchMessages(filter = {}) {
  let query = supabase.from('Message').select('*').order('createdAt', { ascending: true })
  if (filter.recipientRole && filter.recipientRole !== 'all') {
    query = query.or(`recipientRole.eq.${filter.recipientRole},recipientRole.eq.all,senderRole.eq.${filter.recipientRole}`)
  }
  if (filter.eventId) {
    query = query.eq('eventId', filter.eventId)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function supabaseSendMessage(data) {
  const id = generateId('msg')
  const now = new Date().toISOString()
  const record = {
    id,
    senderId: data.senderId || null,
    senderName: data.senderName || 'Anonymous',
    senderRole: data.senderRole || 'client',
    recipientRole: data.recipientRole || 'all',
    recipientId: data.recipientId || null,
    eventId: data.eventId || null,
    text: data.text,
    attachmentUrl: data.attachmentUrl || '',
    attachmentName: data.attachmentName || '',
    createdAt: now,
  }

  const { data: inserted, error } = await supabase.from('Message').insert([record]).select('*').single()
  if (error) throw error

  // Notify the recipient role in real time
  await supabaseAddNotification(
    `New message from ${record.senderName} (${record.senderRole}): "${record.text.slice(0, 45)}${record.text.length > 45 ? '...' : ''}"`,
    'message',
    record.recipientId
  )

  return inserted || record
}

// ─── APPROVALS ─────────────────────────────────────────────────────
export async function supabaseFetchApprovals() {
  const { data, error } = await supabase.from('ApprovalRequest').select('*').order('createdAt', { ascending: false })
  if (error) throw error
  return data || []
}

export async function supabaseAddApprovalRequest(data) {
  const id = generateId('appr')
  const now = new Date().toISOString()
  const record = {
    id,
    type: data.type || 'registration',
    entityId: data.entityId || generateId('ent'),
    entityName: data.entityName || 'General Request',
    amount: Number(data.amount) || 0,
    status: 'pending',
    submittedBy: data.submittedBy || null,
    note: data.note || '',
    reviewNote: '',
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase.from('ApprovalRequest').insert([record]).select('*').single()
  if (error) throw error

  await supabaseAddNotification(
    `Approval requested: ${record.entityName} (${record.type.replace(/_/g, ' ')})`,
    'approval'
  )

  return inserted || record
}

export async function supabaseUpdateApprovalStatus(id, status, reviewNote = '', reviewedBy = null) {
  const updates = {
    status,
    reviewNote: reviewNote || '',
    reviewedBy: reviewedBy || null,
    updatedAt: new Date().toISOString(),
  }

  const { data: updated, error } = await supabase.from('ApprovalRequest').update(updates).eq('id', id).select('*').single()
  if (error) throw error

  await supabaseAddNotification(
    `Approval request for ${updated?.entityName || id} marked ${status}`,
    'approval'
  )

  return updated
}

// ─── DOCUMENTS ─────────────────────────────────────────────────────
export async function supabaseUploadDocument(data) {
  const id = generateId('doc')
  const now = new Date().toISOString()
  const record = {
    id,
    name: data.name || 'Document',
    type: data.type || 'file',
    module: data.module || 'general',
    entityId: data.entityId || null,
    mimeType: data.mimeType || 'application/pdf',
    size: Number(data.size) || 0,
    url: data.url || '',
    uploadedBy: data.uploadedBy || null,
    createdAt: now,
  }

  const { data: inserted, error } = await supabase.from('Document').insert([record]).select('*').single()
  if (error) throw error
  return inserted || record
}

// ─── STAFF / USERS ─────────────────────────────────────────────────
export async function supabaseAddStaffMember(data) {
  const id = generateId('st')
  const now = new Date().toISOString()
  const name = data.name || 'Team Member'
  const initials = data.initials || name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'TM'
  const record = {
    id,
    name,
    email: data.email || `${id}@amenevents.com`,
    passwordHash: '$2a$10$defaultHashForDemoUsersOnlyXXXXXXXXXXXXXX',
    phone: data.phone || '',
    dept: data.dept || 'Operations',
    jobTitle: data.jobTitle || data.role || 'Coordinator',
    type: data.type || 'Employee',
    status: data.status || 'active',
    color: data.color || 'bg-brand-600',
    initials,
    avatar: data.avatar || '',
    bio: data.bio || '',
    createdAt: now,
    updatedAt: now,
  }
  const { data: inserted, error } = await supabase.from('User').insert([record]).select('id, name, initials, color, dept, jobTitle, email, phone, type, status, avatar').single()
  if (error) throw error
  await supabaseLogActivity(`Team member added: ${name}`, 'staff')
  return inserted || record
}

export async function supabaseUpdateStaffMember(id, updates) {
  const data = { ...updates, updatedAt: new Date().toISOString() }
  const { data: updated, error } = await supabase.from('User').update(data).eq('id', id).select('id, name, initials, color, dept, jobTitle, email, phone, type, status, avatar').single()
  if (error) throw error
  return updated
}

// ─── ALLOCATIONS & CALENDAR ────────────────────────────────────────
export async function supabaseAddAllocation(resourceId, eventId, qty = 1) {
  const id = generateId('alc')
  const record = {
    id,
    resourceId,
    eventId,
    qty: Number(qty) || 1,
    createdAt: new Date().toISOString(),
  }
  const { data: inserted, error } = await supabase.from('Allocation').insert([record]).select('*').single()
  if (error) throw error
  return inserted || record
}

export async function supabaseAddCalendarEvent(data) {
  const id = generateId('ce')
  const record = {
    id,
    title: data.title,
    type: data.type || 'event',
    date: data.date || new Date().toISOString().split('T')[0],
    endDate: data.endDate || null,
    time: data.time || '',
    endTime: data.endTime || '',
    location: data.location || '',
    entityId: data.entityId || null,
    userId: data.userId || null,
    color: data.color || 'bg-brand-600',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  }
  const { data: inserted, error } = await supabase.from('CalendarEvent').insert([record]).select('*').single()
  if (error) throw error
  return inserted || record
}

// ─── REALTIME SUBSCRIPTION ─────────────────────────────────────────
export function subscribeToSupabaseChanges(onChange) {
  const channel = supabase
    .channel('amen-events-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Event' }, () => onChange('Event'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Client' }, () => onChange('Client'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Task' }, () => onChange('Task'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Venue' }, () => onChange('Venue'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Resource' }, () => onChange('Resource'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Vendor' }, () => onChange('Vendor'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => onChange('User'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Registration' }, () => onChange('Registration'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Invoice' }, () => onChange('Invoice'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Expense' }, () => onChange('Expense'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Speaker' }, () => onChange('Speaker'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Exhibitor' }, () => onChange('Exhibitor'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Sponsor' }, () => onChange('Sponsor'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Campaign' }, () => onChange('Campaign'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Coupon' }, () => onChange('Coupon'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => onChange('Message'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, () => onChange('Notification'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ApprovalRequest' }, () => onChange('ApprovalRequest'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Document' }, () => onChange('Document'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Allocation' }, () => onChange('Allocation'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'CalendarEvent' }, () => onChange('CalendarEvent'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ActivityLog' }, () => onChange('ActivityLog'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, () => onChange('Order'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Payment' }, () => onChange('Payment'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Review' }, () => onChange('Review'))
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ─── PUBLIC PORTAL & ATTENDEES ─────────────────────────────────────
export async function supabaseFetchPublicEvents(opts = {}) {
  let query = supabase
    .from('Event')
    .select('*, venue:Venue(*), client:Client(*)')

  if (opts.category && opts.category !== 'all') {
    query = query.ilike('category', `%${opts.category}%`)
  }
  if (opts.search) {
    query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%,category.ilike.%${opts.search}%`)
  }

  if (opts.sort === 'newest') {
    query = query.order('createdAt', { ascending: false })
  } else if (opts.sort === 'price-low') {
    query = query.order('price', { ascending: true })
  } else if (opts.sort === 'price-high') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('date', { ascending: true })
  }

  if (opts.limit) {
    query = query.limit(opts.limit)
  }

  const { data, error } = await query
  if (error) throw error
  let results = data || []
  if (opts.city && opts.city !== 'all') {
    results = results.filter((e) => e.venue?.city?.toLowerCase().includes(opts.city.toLowerCase()))
  }
  return results
}

export async function supabaseFetchEventById(id) {
  const { data, error } = await supabase
    .from('Event')
    .select('*, venue:Venue(*), client:Client(*), reviews:Review(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function supabaseSubmitReview(data) {
  const id = generateId('rev')
  const record = {
    id,
    eventId: data.eventId,
    attendeeId: data.attendeeId || null,
    rating: Number(data.rating) || 5,
    comment: data.comment || '',
    createdAt: new Date().toISOString(),
  }
  const { data: inserted, error } = await supabase
    .from('Review')
    .insert([record])
    .select('*')
    .single()

  if (error) throw error
  return inserted || record
}

export async function supabaseCreateOrderAndPayment(data) {
  const now = new Date().toISOString()
  const ordId = generateId('ord')

  // 1. Insert Order
  const orderRecord = {
    id: ordId,
    attendeeId: data.attendeeId,
    eventId: data.eventId,
    status: 'paid',
    subtotal: Number(data.subtotal) || 0,
    tax: Number(data.tax) || 0,
    discount: Number(data.discount) || 0,
    total: Number(data.total) || 0,
    couponCode: data.couponCode || '',
    createdAt: now,
    updatedAt: now,
  }
  const { data: order, error: ordErr } = await supabase
    .from('Order')
    .insert([orderRecord])
    .select('*')
    .single()
  if (ordErr) throw ordErr

  // 2. Insert Order Items
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      await supabase.from('OrderItem').insert([{
        id: generateId('item'),
        orderId: ordId,
        ticketType: it.ticketType || 'Standard',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        lineTotal: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
        createdAt: now,
      }])
    }
  }

  // 3. Insert Payment
  await supabase.from('Payment').insert([{
    id: generateId('pay'),
    orderId: ordId,
    amount: Number(data.total) || 0,
    method: data.method || 'Telebirr',
    status: 'success',
    reference: `TXN-${Date.now().toString().slice(-6)}`,
    createdAt: now,
  }])

  // 4. Insert Registration
  const firstItem = data.items?.[0] || {}
  const regId = generateId('rg')
  const qr = `AE-${(data.eventId || 'EV').slice(-4).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`
  const regRecord = {
    id: regId,
    eventId: data.eventId,
    name: data.buyer?.name || 'Attendee',
    email: data.buyer?.email || '',
    phone: data.buyer?.phone || '',
    type: firstItem.ticketType || 'Standard',
    amount: Number(data.total) || 0,
    paid: true,
    paymentMethod: data.method || 'Telebirr',
    checkedIn: false,
    checkedInAt: '',
    qr,
    createdAt: now,
  }
  await supabase.from('Registration').insert([regRecord])

  await supabaseLogActivity(`Ticket purchase: ${regRecord.name} for event`, 'registration')

  // Notify client and PM in Supabase
  try {
    const { data: ev } = await supabase.from('Event').select('name, clientId, pmId').eq('id', data.eventId).single()
    if (ev?.clientId) {
      await supabaseAddNotification(
        `Ticket booked: ${regRecord.name} registered for "${ev.name}" (${firstItem.ticketType || 'Standard'}).`,
        'registration',
        ev.clientId
      )
    }
    if (ev?.pmId) {
      await supabaseAddNotification(
        `Ticket booked: ${regRecord.name} registered for "${ev.name}" (${firstItem.ticketType || 'Standard'}).`,
        'registration',
        ev.pmId
      )
    }
  } catch (e) {}

  return { order, registration: regRecord }
}

export async function supabaseAttendeeRegister(data) {
  const id = generateId('att')
  const now = new Date().toISOString()
  const record = {
    id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email.toLowerCase().trim(),
    phone: data.phone || '',
    passwordHash: data.password || 'secure_hash',
    avatar: data.avatar || '',
    status: 'active',
    notifications: [],
    createdAt: now,
    updatedAt: now,
  }
  const { data: inserted, error } = await supabase
    .from('Attendee')
    .insert([record])
    .select('*')
    .single()
  if (error) throw error
  return inserted
}

export async function supabaseAttendeeLogin(email, password) {
  const { data, error } = await supabase
    .from('Attendee')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()
  if (error || !data) throw new Error('Invalid email or password')
  if (data.passwordHash && data.passwordHash !== password && !data.passwordHash.includes('hash')) {
    throw new Error('Invalid email or password')
  }
  return data
}

export async function supabaseFetchAttendeeTickets(email) {
  let query = supabase
    .from('Registration')
    .select('*, event:Event(*, venue:Venue(*))')
    .order('createdAt', { ascending: false })

  if (email) {
    query = query.ilike('email', email.trim())
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function supabaseFetchAttendeeEvents(email) {
  if (!email) return []
  const cleanEmail = email.trim().toLowerCase()
  const { data: regs, error } = await supabase
    .from('Registration')
    .select('*, event:Event(*, venue:Venue(*), client:Client(*))')
    .ilike('email', cleanEmail)
    .order('createdAt', { ascending: false })

  if (error || !regs) return []
  return regs.map((r) => {
    const e = r.event || {}
    return {
      ...e,
      id: e.id || r.eventId,
      name: e.name || 'Registered Event',
      date: e.date,
      time: e.time,
      status: e.status || 'upcoming',
      category: e.category || 'General',
      venue: e.venue || { name: 'TBA' },
      client: e.client,
      registration: {
        id: r.id,
        name: r.name,
        email: r.email,
        type: r.type,
        amount: r.amount,
        checkedIn: r.checkedIn,
        checkedInAt: r.checkedInAt,
        qr: r.qr,
        createdAt: r.createdAt,
      },
    }
  })
}

