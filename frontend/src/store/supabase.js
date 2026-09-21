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

  const record = {
    id,
    name: data.name,
    clientId: data.clientId && data.clientId.trim() ? data.clientId.trim() : null,
    venueId: data.venueId && data.venueId.trim() ? data.venueId.trim() : null,
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

  if (error) throw error
  await supabaseLogActivity(`Event created: ${record.name}`, 'event')
  return inserted || record
}

export async function supabaseUpdateEvent(id, updates) {
  const data = { ...updates, updatedAt: new Date().toISOString() }
  if (data.budget !== undefined) data.budget = Number(data.budget) || 0
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    data.tags = String(data.tags).split(',').map((t) => t.trim()).filter(Boolean)
  }
  const { data: updated, error } = await supabase
    .from('Event')
    .update(data)
    .eq('id', id)
    .select('*, client:Client(*), venue:Venue(*)')
    .single()

  if (error) throw error
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
  const record = {
    id,
    title: data.title,
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    assigneeId: data.assigneeId && data.assigneeId.trim() ? data.assigneeId.trim() : null,
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

  if (error) throw error
  await supabaseLogActivity(`Task created: ${record.title}`, 'task')
  return inserted || record
}

export async function supabaseUpdateTask(id, updates) {
  const data = { ...updates, updatedAt: new Date().toISOString() }
  const { data: updated, error } = await supabase
    .from('Task')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return updated
}

export async function supabaseDeleteTask(id) {
  const { error } = await supabase.from('Task').delete().eq('id', id)
  if (error) throw error
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
    price: Number(data.price) || 0,
    paymentMethod: data.paymentMethod || 'Cash',
    qr: data.qr || `AE-${id.slice(-6).toUpperCase()}`,
    checkedIn: !!data.checkedIn,
    checkedInAt: data.checkedIn ? now : null,
    createdAt: now,
    updatedAt: now,
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

export async function supabaseCheckInAttendee(id) {
  const now = new Date().toISOString()
  const { data: updated, error } = await supabase
    .from('Registration')
    .update({ checkedIn: true, checkedInAt: now, updatedAt: now })
    .eq('id', id)
    .select('*, event:Event(*)')
    .single()

  if (error) throw error
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
  const record = {
    id,
    number: data.number || `INV-${Date.now().toString().slice(-5)}`,
    clientId: data.clientId && data.clientId.trim() ? data.clientId.trim() : null,
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    amount: Number(data.amount) || 0,
    status: data.status || 'pending',
    issueDate: data.issueDate || now.split('T')[0],
    dueDate: data.dueDate || now.split('T')[0],
    items: data.items || [],
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Invoice')
    .insert([record])
    .select('*, client:Client(*), event:Event(*)')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Invoice created: ${record.number}`, 'finance')
  return inserted || record
}

export async function supabaseAddExpense(data) {
  const id = generateId('exp')
  const now = new Date().toISOString()
  const record = {
    id,
    title: data.title,
    eventId: data.eventId && data.eventId.trim() ? data.eventId.trim() : null,
    vendorId: data.vendorId && data.vendorId.trim() ? data.vendorId.trim() : null,
    amount: Number(data.amount) || 0,
    category: data.category || 'General',
    status: data.status || 'approved',
    date: data.date || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
  }

  const { data: inserted, error } = await supabase
    .from('Expense')
    .insert([record])
    .select('*, vendor:Vendor(*), event:Event(*)')
    .single()

  if (error) throw error
  await supabaseLogActivity(`Expense recorded: ${record.title}`, 'finance')
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
    updatedAt: now,
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
    contactPerson: data.contactPerson || '',
    email: data.email || '',
    phone: data.phone || '',
    booth: data.booth || '-',
    size: data.size || 'Standard',
    package: data.package || 'Exhibitor',
    paid: Number(data.paid) || 0,
    status: data.status || 'registering',
    createdAt: now,
    updatedAt: now,
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
    updatedAt: now,
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
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
