import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// Permission matrix — mirrors frontend permissions.js
const MODULES = [
  'dashboard', 'reports', 'crm', 'events', 'projects',
  'venues', 'resources', 'vendors', 'staff', 'finance',
  'ticketing', 'checkin', 'speakers', 'exhibition', 'sponsorship',
  'marketing', 'admin',
]

const PERMISSIONS = ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'export', 'print', 'manage']

const ROLE_MATRIX = {
  admin: MODULES.reduce((acc, m) => { acc[m] = PERMISSIONS; return acc }, {}),
  manager: {
    dashboard: ['view'],
    events: ['view', 'create', 'edit', 'delete', 'assign'],
    projects: ['view', 'create', 'edit', 'delete', 'assign'],
    ticketing: ['view', 'create', 'edit', 'manage'],
    checkin: ['view', 'create'],
    speakers: ['view', 'create', 'edit', 'assign', 'manage'],
    exhibition: ['view', 'create', 'edit', 'manage'],
  },
  operations: {
    dashboard: ['view'],
    reports: ['view', 'export'],
    events: ['view', 'edit', 'assign'],
    projects: ['view', 'create', 'edit', 'assign'],
    venues: ['view', 'create', 'edit', 'manage'],
    resources: ['view', 'create', 'edit', 'delete', 'assign', 'manage'],
    vendors: ['view', 'create', 'edit', 'assign'],
    staff: ['view', 'assign'],
  },
  finance: {
    dashboard: ['view'],
    reports: ['view', 'export', 'print'],
    crm: ['view'],
    events: ['view'],
    vendors: ['view', 'edit'],
    finance: ['view', 'create', 'edit', 'approve', 'export', 'print', 'manage'],
    sponsorship: ['view'],
  },
  marketing: {
    dashboard: ['view'],
    reports: ['view', 'export'],
    crm: ['view', 'edit'],
    events: ['view'],
    ticketing: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
    checkin: ['view'],
    sponsorship: ['view', 'create', 'edit', 'delete', 'manage'],
    marketing: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  },
}

const STAFF = [
  { id: 'st1', name: 'Hana Tadesse', role: 'admin', jobTitle: 'Director', dept: 'Management', phone: '+251 911 220 445', email: 'hana@amen.et', color: 'bg-brand-700', initials: 'HT', type: 'Employee' },
  { id: 'st2', name: 'Dawit Mengistu', role: 'manager', jobTitle: 'Project Manager', dept: 'Operations', phone: '+251 912 778 301', email: 'dawit@amen.et', color: 'bg-gold-500', initials: 'DM', type: 'Employee' },
  { id: 'st3', name: 'Selam Bekele', role: 'manager', jobTitle: 'Event Coordinator', dept: 'Operations', phone: '+251 913 554 209', email: 'selam@amen.et', color: 'bg-brand-500', initials: 'SB', type: 'Employee' },
  { id: 'st4', name: 'Yonas Girma', role: 'finance', jobTitle: 'Finance Officer', dept: 'Finance', phone: '+251 914 339 876', email: 'yonas@amen.et', color: 'bg-ink', initials: 'YG', type: 'Employee' },
  { id: 'st5', name: 'Sara Ahmed', role: 'operations', jobTitle: 'Logistics Lead', dept: 'Operations', phone: '+251 915 662 118', email: 'sara@amen.et', color: 'bg-brand-400', initials: 'SA', type: 'Employee' },
  { id: 'st6', name: 'Mekonnen Assefa', role: 'operations', jobTitle: 'Vendor Liaison', dept: 'Procurement', phone: '+251 916 998 540', email: 'meki@amen.et', color: 'bg-gold-400', initials: 'MA', type: 'Freelancer' },
  { id: 'st7', name: 'Liya Kebede', role: 'marketing', jobTitle: 'Marketing Lead', dept: 'Marketing', phone: '+251 917 445 772', email: 'liya@amen.et', color: 'bg-brand-600', initials: 'LK', type: 'Employee' },
  { id: 'st8', name: 'Bereket Tesfaye', role: 'operations', jobTitle: 'Technician', dept: 'Technical', phone: '+251 918 229 650', email: 'bereket@amen.et', color: 'bg-brand-300', initials: 'BT', type: 'Employee' },
]

async function main() {
  console.log('Seeding database...')

  // 1. Create permissions
  const permMap = {}
  for (const key of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, label: key.charAt(0).toUpperCase() + key.slice(1) },
    })
    permMap[key] = perm
  }

  // 2. Create roles and role permissions
  const roleMap = {}
  for (const [roleKey, modules] of Object.entries(ROLE_MATRIX)) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: {},
      create: {
        key: roleKey,
        label: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
        description: roleKey === 'admin' ? 'Full system access' : `${roleKey} role`,
      },
    })
    roleMap[roleKey] = role

    // Create role permissions
    for (const [module, perms] of Object.entries(modules)) {
      for (const permKey of perms) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_module_permissionId: {
              roleId: role.id,
              module,
              permissionId: permMap[permKey].id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            module,
            permissionId: permMap[permKey].id,
          },
        })
      }
    }
  }

  // 3. Create users with hashed passwords
  const userMap = {}
  for (const s of STAFF) {
    const hash = await bcrypt.hash('demo@amen', 10)
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: hash,
        name: s.name,
        initials: s.initials,
        color: s.color,
        phone: s.phone,
        dept: s.dept,
        jobTitle: s.jobTitle,
        type: s.type,
        status: 'active',
      },
    })
    userMap[s.id] = user

    // Assign role
    const role = roleMap[s.role]
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      })
    }
  }

  // 3b. Create client role (no module permissions — portal uses separate routes)
  const clientRole = await prisma.role.upsert({
    where: { key: 'client' },
    update: {},
    create: { key: 'client', label: 'Client', description: 'Client portal access — limited to own data' },
  })
  roleMap['client'] = clientRole

  // 4. Seed clients
  const clientMap = {}
  const clientsData = [
    { company: 'ETH FINTECH Group', industry: 'Financial Services', city: 'Addis Ababa', contactPerson: 'Dr. Meron Ayele', contactRole: 'Events Director', phone: '+251 911 222 000', email: 'meron@ethfintech.com', status: 'active', stage: 'contract', totalValue: 1850000, logo: 'EF' },
    { company: 'Zemen Pharmaceuticals', industry: 'Healthcare', city: 'Addis Ababa', contactPerson: 'Rahel Getahun', contactRole: 'Marketing Manager', phone: '+251 912 333 111', email: 'rahel@zemenpharma.com', status: 'active', stage: 'opportunity', totalValue: 640000, logo: 'ZP' },
    { company: 'Walia Telecom', industry: 'Telecommunications', city: 'Addis Ababa', contactPerson: 'Kebede Abebe', contactRole: 'Head of Brand', phone: '+251 913 444 222', email: 'kebede@walia.co.et', status: 'active', stage: 'quotation', totalValue: 980000, logo: 'WT' },
    { company: 'Sheba Construction', industry: 'Construction', city: 'Addis Ababa', contactPerson: 'Ashenafi Wolde', contactRole: 'Admin Director', phone: '+251 914 555 333', email: 'ashenafi@sheba.et', status: 'inactive', stage: 'lead', totalValue: 0, logo: 'SC' },
    { company: 'Abyssinia Bank', industry: 'Banking', city: 'Addis Ababa', contactPerson: 'Selamawit Desta', contactRole: 'PR Manager', phone: '+251 915 666 444', email: 'selamawit@abysbank.com', status: 'active', stage: 'contract', totalValue: 2400000, logo: 'AB' },
    { company: 'Koka University', industry: 'Education', city: 'Adama', contactPerson: 'Prof. Taddese Kassa', contactRole: 'Vice President', phone: '+251 916 777 555', email: 'consult@kokau.edu', status: 'active', stage: 'lead', totalValue: 0, logo: 'KU' },
    { company: 'Sof Omer Hotel', industry: 'Hospitality', city: 'Hawassa', contactPerson: 'Daniel Haile', contactRole: 'Sales Director', phone: '+251 917 888 666', email: 'events@sofomer.com', status: 'active', stage: 'negotiation', totalValue: 520000, logo: 'SO' },
  ]
  for (const c of clientsData) {
    const client = await prisma.client.create({ data: c })
    const oldId = c.company === 'ETH FINTECH Group' ? 'cl1' : c.company === 'Zemen Pharmaceuticals' ? 'cl2' : c.company === 'Walia Telecom' ? 'cl3' : c.company === 'Sheba Construction' ? 'cl4' : c.company === 'Abyssinia Bank' ? 'cl5' : c.company === 'Koka University' ? 'cl6' : 'cl7'
    clientMap[oldId] = client
  }

  // 4b. Create demo client portal user (linked to ETH FINTECH Group)
  const clientHash = await bcrypt.hash('demo@amen', 10)
  const portalUser = await prisma.user.upsert({
    where: { email: 'meron@ethfintech.com' },
    update: {},
    create: {
      email: 'meron@ethfintech.com',
      passwordHash: clientHash,
      name: 'Dr. Meron Ayele',
      initials: 'MA',
      color: 'bg-brand-600',
      phone: '+251 911 222 000',
      dept: 'Client',
      jobTitle: 'Events Director',
      type: 'Client',
      status: 'active',
      clientId: clientMap['cl1'].id,
    },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: portalUser.id, roleId: clientRole.id } },
    update: {},
    create: { userId: portalUser.id, roleId: clientRole.id },
  })
  userMap['portal1'] = portalUser

  // 5. Seed venues
  const venueMap = {}
  const venuesData = [
    { name: 'Millennium Hall', city: 'Addis Ababa', halls: 4, capacity: 5000, price: 850000, contact: '+251 911 100 001', equipment: ['Stage', 'Sound', 'Lighting', 'VIP Lounge'], status: 'available', color: 'bg-brand-700', abbr: 'MH' },
    { name: 'Sheraton Skyline Ballroom', city: 'Addis Ababa', halls: 2, capacity: 1200, price: 420000, contact: '+251 911 100 002', equipment: ['Sound', 'AV', 'Catering Kitchen'], status: 'booked', color: 'bg-gold-500', abbr: 'SB' },
    { name: 'Unity Park Pavilion', city: 'Addis Ababa', halls: 1, capacity: 800, price: 260000, contact: '+251 911 100 003', equipment: ['Open Air', 'Stage'], status: 'available', color: 'bg-brand-500', abbr: 'UP' },
    { name: 'Bishoftu Resort Gardens', city: 'Bishoftu', halls: 3, capacity: 2500, price: 640000, contact: '+251 911 100 004', equipment: ['Stage', 'Swimming Lawn'], status: 'maintenance', color: 'bg-brand-400', abbr: 'BR' },
    { name: 'Hilton Addis Grand Hall', city: 'Addis Ababa', halls: 2, capacity: 950, price: 380000, contact: '+251 911 100 005', equipment: ['AV', 'Backstage', 'Catering'], status: 'booked', color: 'bg-ink', abbr: 'HI' },
    { name: 'Skylight Convention Center', city: 'Addis Ababa', halls: 6, capacity: 6000, price: 1100000, contact: '+251 911 100 006', equipment: ['Exhibition Floor', 'Stage', 'Press Room'], status: 'available', color: 'bg-brand-600', abbr: 'SC' },
  ]
  for (let i = 0; i < venuesData.length; i++) {
    const venue = await prisma.venue.create({ data: venuesData[i] })
    venueMap['vn' + (i + 1)] = venue
  }

  // 6. Seed resources
  const resourcesData = [
    { name: 'LED Wall 4K 12m²', category: 'LED Screens', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Main Warehouse', code: 'A-LE-01' },
    { name: 'Line Array Sound System', category: 'Sound Systems', qty: 3, allocated: 2, maintenance: 0, status: 'in-use', location: 'Main Warehouse', code: 'A-SD-02' },
    { name: 'Moving Head Lights (Beam)', category: 'Lighting', qty: 24, allocated: 18, maintenance: 2, status: 'maintenance', location: 'Main Warehouse', code: 'A-LT-03' },
    { name: 'Truss Stage 8x10m', category: 'Stages', qty: 4, allocated: 1, maintenance: 0, status: 'available', location: 'Yard', code: 'A-ST-04' },
    { name: 'Banquet Chairs (Gold)', category: 'Furniture', qty: 400, allocated: 260, maintenance: 0, status: 'in-use', location: 'Yard', code: 'A-FR-05' },
    { name: 'Decorative Flower Arches', category: 'Decoration', qty: 12, allocated: 6, maintenance: 1, status: 'available', location: 'Store B', code: 'A-DC-06' },
    { name: '4x4 Utility Truck', category: 'Vehicles', qty: 3, allocated: 3, maintenance: 0, status: 'in-use', location: 'Fleet', code: 'A-VH-07' },
    { name: 'Diesel Generators 150kVA', category: 'Generators', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Yard', code: 'A-GN-08' },
    { name: 'Branding Banners / Standees', category: 'Branding', qty: 50, allocated: 22, maintenance: 0, status: 'available', location: 'Store A', code: 'A-BR-09' },
  ]
  for (const r of resourcesData) {
    await prisma.resource.create({ data: r })
  }

  // 7. Seed vendors
  const vendorMap = {}
  const vendorsData = [
    { name: 'Gourmet Addis Catering', type: 'Caterer', contact: 'Biniyam Worku', phone: '+251 918 000 001', rating: 4.8, contracts: 2, status: 'active' },
    { name: 'Bloom Decor Studio', type: 'Decorator', contact: 'Hirut Melaku', phone: '+251 918 000 002', rating: 4.6, contracts: 3, status: 'active' },
    { name: 'Secure Shield Ltd.', type: 'Security', contact: 'Captain Alemu', phone: '+251 918 000 003', rating: 4.9, contracts: 5, status: 'active' },
    { name: 'Lensny Photographers', type: 'Photographer', contact: 'Nardos Fikre', phone: '+251 918 000 004', rating: 4.7, contracts: 2, status: 'active' },
    { name: 'Motion Frame Video', type: 'Videographer', contact: 'Ezra Tamsir', phone: '+251 918 000 005', rating: 4.5, contracts: 2, status: 'active' },
    { name: 'Sena Entertainment', type: 'Entertainment', contact: 'Muluken Ayele', phone: '+251 918 000 006', rating: 4.4, contracts: 4, status: 'active' },
    { name: 'Kidan Printing House', type: 'Printing', contact: 'Kidist Tadesse', phone: '+251 918 000 007', rating: 4.3, contracts: 6, status: 'active' },
    { name: 'Fast Track Transport', type: 'Transportation', contact: 'Mesfin Haile', phone: '+251 918 000 008', rating: 4.6, contracts: 3, status: 'active' },
  ]
  for (let i = 0; i < vendorsData.length; i++) {
    const vendor = await prisma.vendor.create({ data: vendorsData[i] })
    vendorMap['vd' + (i + 1)] = vendor
  }

  // 8. Seed events
  const eventMap = {}
  const eventsData = [
    { name: 'EthFinTech Annual Summit 2026', clientId: 'cl1', venueId: 'vn1', category: 'Conference', date: '2026-08-18', time: '09:00', status: 'upcoming', pmId: 'st2', budget: 1850000, spent: 780000, stage: 8, attendees: null, progress: 64 },
    { name: 'Zemen Pharma Product Launch', clientId: 'cl2', venueId: 'vn2', category: 'Product Launch', date: '2026-08-25', time: '18:30', status: 'upcoming', pmId: 'st3', budget: 640000, spent: 210000, stage: 5, attendees: null, progress: 43 },
    { name: 'Abyssinia Bank Leadership Retreat', clientId: 'cl5', venueId: 'vn4', category: 'Retreat', date: '2026-08-02', time: '08:00', status: 'ongoing', pmId: 'st5', budget: 2400000, spent: 1240000, stage: 11, attendees: 146, progress: 86 },
    { name: 'Walia Telecom Partner Expo', clientId: 'cl3', venueId: 'vn6', category: 'Exhibition', date: '2026-09-12', time: '10:00', status: 'upcoming', pmId: 'st2', budget: 980000, spent: 340000, stage: 4, attendees: null, progress: 36 },
    { name: 'Sof Omer Hospitality Gala', clientId: 'cl7', venueId: 'vn3', category: 'Gala', date: '2026-07-20', time: '19:00', status: 'completed', pmId: 'st3', budget: 520000, spent: 505000, stage: 13, attendees: 690, progress: 100 },
    { name: 'Koka University Graduation Day', clientId: 'cl6', venueId: 'vn5', category: 'Ceremony', date: '2026-07-05', time: '09:00', status: 'completed', pmId: 'st5', budget: 0, spent: 0, stage: 13, attendees: 1200, progress: 100 },
  ]
  for (let i = 0; i < eventsData.length; i++) {
    const e = eventsData[i]
    const event = await prisma.event.create({
      data: {
        ...e,
        clientId: clientMap[e.clientId]?.id,
        venueId: venueMap[e.venueId]?.id,
        pmId: userMap[e.pmId]?.id,
        team: [userMap[e.pmId]?.id].filter(Boolean),
      },
    })
    eventMap['ev' + (i + 1)] = event
  }

  // 9. Seed tasks
  const tasksData = [
    { title: 'Confirm final speaker lineup', eventId: 'ev1', assigneeId: 'st2', priority: 'high', status: 'todo', due: '2026-08-05', comments: 3 },
    { title: 'Book catering tasting session', eventId: 'ev1', assigneeId: 'st5', priority: 'medium', status: 'in-progress', due: '2026-08-07', comments: 1 },
    { title: 'Finalize seating layout', eventId: 'ev1', assigneeId: 'st3', priority: 'high', status: 'in-progress', due: '2026-08-09', comments: 2 },
    { title: 'Ship exhibition banners', eventId: 'ev4', assigneeId: 'st5', priority: 'medium', status: 'todo', due: '2026-08-20', comments: 0 },
    { title: 'Approve lighting rig plan', eventId: 'ev3', assigneeId: 'st2', priority: 'high', status: 'review', due: '2026-07-30', comments: 4 },
    { title: 'Process VIP invitations', eventId: 'ev1', assigneeId: 'st7', priority: 'low', status: 'done', due: '2026-08-01', comments: 1 },
    { title: 'Contract signing with venue', eventId: 'ev4', assigneeId: 'st6', priority: 'medium', status: 'done', due: '2026-08-02', comments: 0 },
    { title: 'Sound check and stage test', eventId: 'ev2', assigneeId: 'st8', priority: 'high', status: 'todo', due: '2026-08-22', comments: 0 },
  ]
  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        ...t,
        eventId: eventMap[t.eventId]?.id,
        assigneeId: userMap[t.assigneeId]?.id,
      },
    })
  }

  // 10. Seed speakers
  const speakersData = [
    { name: 'Dr. Meskerem Adugna', topic: 'Digital Banking for the Next Decade', eventId: 'ev1', company: 'EthFinTech', time: '10:30', status: 'confirmed', initials: 'MA', color: 'bg-brand-700' },
    { name: 'Jemal Yusuf', topic: 'RegTech & Compliance Trends', eventId: 'ev1', company: 'Central Bank', time: '11:30', status: 'confirmed', initials: 'JY', color: 'bg-gold-500' },
    { name: 'Pr. Yalemwork Tsegaye', topic: 'Financial Inclusion through AI', eventId: 'ev1', company: 'Koka University', time: '14:00', status: 'pending', initials: 'YT', color: 'bg-brand-500' },
    { name: 'Samuel Mekonnen', topic: 'Partner Channel Innovation', eventId: 'ev4', company: 'Walia Telecom', time: '12:00', status: 'confirmed', initials: 'SM', color: 'bg-ink' },
  ]
  for (const s of speakersData) {
    await prisma.speaker.create({
      data: { ...s, eventId: eventMap[s.eventId]?.id },
    })
  }

  // 11. Seed exhibitors
  for (const e of [
    { company: 'InnovPay', booth: 'A1', size: 'Premium', package: 'Gold Sponsor', paid: 400000, status: 'confirmed' },
    { company: 'SavaTech', booth: 'B3', size: 'Standard', package: 'Exhibitor', paid: 150000, status: 'confirmed' },
    { company: 'PayCore', booth: 'A4', size: 'Premium', package: 'Silver Sponsor', paid: 250000, status: 'pending' },
    { company: 'Mulu Hub', booth: 'C2', size: 'Standard', package: 'Exhibitor', paid: 0, status: 'registering' },
  ]) {
    await prisma.exhibitor.create({ data: e })
  }

  // 12. Seed sponsors
  for (const s of [
    { name: 'Sheba Bank', package: 'Platinum', amount: 500000, status: 'active', deliverables: ['Main stage branding', 'Logo on tickets'] },
    { name: 'Ethio Air', package: 'Gold', amount: 300000, status: 'active', deliverables: ['VIP lounge', 'Announcements'] },
    { name: 'Dashen Brewery', package: 'Silver', amount: 180000, status: 'pending', deliverables: ['Beverage corner'] },
  ]) {
    await prisma.sponsor.create({ data: s })
  }

  // 13. Seed invoices
  for (const inv of [
    { clientId: 'cl1', eventId: 'ev1', amount: 925000, paid: 925000, status: 'paid', dueDate: '2026-07-15', ref: 'INV-2026-0141' },
    { clientId: 'cl1', eventId: 'ev1', amount: 925000, paid: 0, status: 'outstanding', dueDate: '2026-08-10', ref: 'INV-2026-0178' },
    { clientId: 'cl5', eventId: 'ev3', amount: 2400000, paid: 1680000, status: 'partial', dueDate: '2026-08-01', ref: 'INV-2026-0155' },
    { clientId: 'cl3', eventId: 'ev4', amount: 490000, paid: 0, status: 'outstanding', dueDate: '2026-08-15', ref: 'INV-2026-0188' },
    { clientId: 'cl7', eventId: 'ev5', amount: 520000, paid: 520000, status: 'paid', dueDate: '2026-07-01', ref: 'INV-2026-0120' },
  ]) {
    await prisma.invoice.create({
      data: { ...inv, clientId: clientMap[inv.clientId]?.id, eventId: eventMap[inv.eventId]?.id },
    })
  }

  // 14. Seed expenses
  for (const e of [
    { eventId: 'ev1', category: 'Venue Rental', amount: 425000, date: '2026-07-28', vendorId: 'vd1' },
    { eventId: 'ev1', category: 'Catering', amount: 210000, date: '2026-08-01', vendorId: 'vd1' },
    { eventId: 'ev1', category: 'Technical', amount: 145000, date: '2026-08-02', vendorId: 'vd4' },
    { eventId: 'ev3', category: 'Retreat Package', amount: 1240000, date: '2026-07-25', vendorId: 'vd5' },
    { eventId: 'ev5', category: 'Catering', amount: 180000, date: '2026-07-10', vendorId: 'vd1' },
  ]) {
    await prisma.expense.create({
      data: { ...e, eventId: eventMap[e.eventId]?.id, vendorId: vendorMap[e.vendorId]?.id },
    })
  }

  // 15. Seed registrations
  for (const r of [
    { eventId: 'ev3', name: 'Amanuel Tesfaye', email: 'amanuel@gmail.com', type: 'VIP', amount: 12000, paid: true, checkedIn: true, qr: 'AE-EV3-0001' },
    { eventId: 'ev3', name: 'Hannah Solomon', email: 'hannah@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: true, qr: 'AE-EV3-0002' },
    { eventId: 'ev3', name: 'Fitsum Alemu', email: 'fitsum@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: false, qr: 'AE-EV3-0003' },
    { eventId: 'ev3', name: 'Ruth Mekonnen', email: 'ruth@gmail.com', type: 'VIP', amount: 12000, paid: true, checkedIn: false, qr: 'AE-EV3-0004' },
    { eventId: 'ev3', name: 'Dagmawi Hailu', email: 'dagmawi@gmail.com', type: 'Group', amount: 5400, paid: false, checkedIn: false, qr: 'AE-EV3-0005' },
    { eventId: 'ev3', name: 'Nebiyat Zewdie', email: 'nebiyat@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: false, qr: 'AE-EV3-0006' },
  ]) {
    await prisma.registration.create({
      data: { ...r, eventId: eventMap[r.eventId]?.id },
    })
  }

  // 16. Seed campaigns
  for (const c of [
    { name: 'Summit Early Bird Blast', channel: 'Email', audience: 8200, sent: 8200, opens: 4210, clicks: 930, status: 'sent' },
    { name: 'Conference Reminder SMS', channel: 'SMS', audience: 1450, sent: 1450, opens: 0, clicks: 0, status: 'sent' },
    { name: 'WhatsApp VIP Invite', channel: 'WhatsApp', audience: 320, sent: 280, opens: 210, clicks: 122, status: 'sending' },
    { name: 'Early Bird Coupon Emails', channel: 'Email', audience: 5000, sent: 0, opens: 0, clicks: 0, status: 'draft' },
  ]) {
    await prisma.campaign.create({ data: c })
  }

  // 17. Seed coupons
  for (const c of [
    { code: 'SUMMIT20', type: 'Discount', value: '20%', usage: 142, max: 500, status: 'active' },
    { code: 'VIPFRIEND', type: 'Referral', value: '10%', usage: 38, max: 200, status: 'active' },
    { code: 'EARLYBIRD', type: 'Discount', value: '15%', usage: 500, max: 500, status: 'expired' },
  ]) {
    await prisma.coupon.create({ data: c })
  }

  // 18. Seed activities
  for (const a of [
    { text: 'New registration for EthFinTech Summit', type: 'registration', at: '12 min ago' },
    { text: 'Invoice INV-2026-0178 marked outstanding', type: 'finance', at: '48 min ago' },
    { text: 'Speaker Dr. Meskerem confirmed', type: 'speaker', at: '2 hr ago' },
    { text: 'Task "Approve lighting rig plan" moved to review', type: 'task', at: '3 hr ago' },
    { text: 'Venue allocation confirmed at Millennium Hall', type: 'venue', at: '5 hr ago' },
    { text: 'QR check-in recorded for Hannah Solomon', type: 'checkin', at: 'Yesterday' },
  ]) {
    await prisma.activityLog.create({ data: a })
  }

  // 19. Seed notifications
  for (const n of [
    { text: 'Budget alert: Event 1850000 approaching 60%', type: 'alert', at: '10 min ago' },
    { text: 'New client inquiry from Sheba Construction', type: 'crm', at: '1 hr ago' },
    { text: 'Maintenance due: Moving Head Lights', type: 'inventory', at: '3 hr ago' },
    { text: 'Payment received — INV-2026-0141', type: 'finance', at: '5 hr ago' },
    { text: 'Task deadline approaching tomorrow', type: 'task', at: '6 hr ago' },
  ]) {
    await prisma.notification.create({ data: n })
  }

  // 20. Seed login history
  const loginHistoryData = [
    { userId: userMap['st1']?.id, email: 'hana@amen.et', success: true, ipAddress: '192.168.1.10', userAgent: 'Chrome/Windows', reason: 'success' },
    { userId: userMap['st2']?.id, email: 'dawit@amen.et', success: true, ipAddress: '192.168.1.22', userAgent: 'Chrome/Windows', reason: 'success' },
    { userId: userMap['st2']?.id, email: 'dawit@amen.et', success: false, ipAddress: '192.168.1.22', userAgent: 'Chrome/Windows', reason: 'wrong_password' },
    { userId: userMap['st4']?.id, email: 'yonas@amen.et', success: true, ipAddress: '192.168.1.35', userAgent: 'Firefox/Windows', reason: 'success' },
    { userId: userMap['st5']?.id, email: 'sara@amen.et', success: true, ipAddress: '192.168.1.41', userAgent: 'Chrome/Mac', reason: 'success' },
    { userId: userMap['st7']?.id, email: 'liya@amen.et', success: true, ipAddress: '192.168.1.52', userAgent: 'Chrome/Windows', reason: 'success' },
    { userId: null, email: 'unknown@amen.et', success: false, ipAddress: '10.0.0.5', userAgent: 'Chrome/Windows', reason: 'user_not_found' },
  ]
  for (const h of loginHistoryData) {
    await prisma.loginHistory.create({
      data: {
        ...h,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  // 21. Seed workflow logs for each event
  const STAGE_NAMES = [
    'Client Created', 'Opportunity', 'Quotation', 'Contract', 'Event',
    'Tasks', 'Venue', 'Resources', 'Budget', 'Registration',
    'QR Tickets', 'Check-In', 'Reports', 'Completed',
  ]
  for (const [key, event] of Object.entries(eventMap)) {
    const currentStage = event.stage || 0
    for (let s = 0; s <= currentStage; s++) {
      await prisma.workflowLog.create({
        data: {
          eventId: event.id,
          stage: s,
          stageName: STAGE_NAMES[s] || `Stage ${s}`,
          action: s === currentStage ? 'set' : 'advanced',
          note: s === 0 ? 'Workflow started — client created' : `Advanced to ${STAGE_NAMES[s]}`,
          userId: userMap[event.pmId]?.id || userMap['st1']?.id,
          createdAt: new Date(Date.now() - (currentStage - s) * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  // 22. Seed approval requests
  const approvalData = [
    { type: 'budget', entityId: eventMap['ev1']?.id || '', entityName: 'EthFinTech Annual Summit 2026', amount: 1850000, status: 'pending', submittedBy: userMap['st2']?.id, note: 'Budget for venue, catering, AV, and marketing' },
    { type: 'contract', entityId: eventMap['ev2']?.id || '', entityName: 'Zemen Pharma Product Launch', amount: 640000, status: 'pending', submittedBy: userMap['st3']?.id, note: 'Sponsorship contract with Zemen Pharma' },
    { type: 'vendor_payment', entityId: eventMap['ev3']?.id || '', entityName: 'Abyssinia Bank Leadership Retreat', amount: 320000, status: 'pending', submittedBy: userMap['st5']?.id, note: 'Payment to Gourmet Addis Catering' },
    { type: 'purchase_request', entityId: eventMap['ev4']?.id || '', entityName: 'Walia Telecom Partner Expo', amount: 180000, status: 'approved', submittedBy: userMap['st2']?.id, reviewedBy: userMap['st1']?.id, note: 'AV equipment rental', reviewNote: 'Approved — within budget' },
    { type: 'sponsorship', entityId: eventMap['ev5']?.id || '', entityName: 'Sof Omer Hospitality Gala', amount: 250000, status: 'rejected', submittedBy: userMap['st3']?.id, reviewedBy: userMap['st1']?.id, note: 'Gold sponsorship package', reviewNote: 'Exceeds sponsorship cap for this event type' },
    { type: 'budget', entityId: eventMap['ev6']?.id || '', entityName: 'Koka University Graduation Day', amount: 450000, status: 'revision_requested', submittedBy: userMap['st5']?.id, reviewedBy: userMap['st1']?.id, note: 'Additional budget for stage setup', reviewNote: 'Need detailed breakdown of stage costs' },
  ]
  for (const a of approvalData) {
    await prisma.approvalRequest.create({ data: a })
  }

  // 23. Seed documents
  const docData = [
    { name: 'EthFinTech Contract.pdf', type: 'contract', module: 'events', entityId: eventMap['ev1']?.id, mimeType: 'application/pdf', size: 245000, url: '/uploads/ev1-contract.pdf', uploadedBy: userMap['st2']?.id },
    { name: 'EthFinTech Quotation.xlsx', type: 'quotation', module: 'events', entityId: eventMap['ev1']?.id, mimeType: 'application/vnd.ms-excel', size: 89000, url: '/uploads/ev1-quotation.xlsx', uploadedBy: userMap['st2']?.id },
    { name: 'EthFinTech Floor Plan.pdf', type: 'floor_plan', module: 'events', entityId: eventMap['ev1']?.id, mimeType: 'application/pdf', size: 156000, url: '/uploads/ev1-floorplan.pdf', uploadedBy: userMap['st5']?.id },
    { name: 'Zemen Pharma Contract.pdf', type: 'contract', module: 'events', entityId: eventMap['ev2']?.id, mimeType: 'application/pdf', size: 198000, url: '/uploads/ev2-contract.pdf', uploadedBy: userMap['st3']?.id },
    { name: 'ETH FINTECH Group - Company Profile.pdf', type: 'company_doc', module: 'clients', entityId: clientMap['cl1']?.id, mimeType: 'application/pdf', size: 320000, url: '/uploads/cl1-profile.pdf', uploadedBy: userMap['st1']?.id },
    { name: 'Gourmet Addis - Business License.pdf', type: 'license', module: 'vendors', entityId: vendorMap['vd1']?.id, mimeType: 'application/pdf', size: 78000, url: '/uploads/vd1-license.pdf', uploadedBy: userMap['st1']?.id },
    { name: 'Hana Kebede - Staff ID.pdf', type: 'id', module: 'staff', entityId: userMap['st1']?.id, mimeType: 'application/pdf', size: 45000, url: '/uploads/st1-id.pdf', uploadedBy: userMap['st1']?.id },
  ]
  for (const d of docData) {
    await prisma.document.create({ data: d })
  }

  // 24. Seed calendar events (meetings)
  const calData = [
    { title: 'EthFinTech Planning Meeting', type: 'meeting', date: todayISO(2), time: '10:00', endTime: '11:30', location: 'Conference Room A', notes: 'Review event timeline and assignments', userId: userMap['st2']?.id },
    { title: 'Budget Review with Finance', type: 'meeting', date: todayISO(4), time: '14:00', endTime: '15:00', location: 'Finance Office', notes: 'Q3 budget review', userId: userMap['st1']?.id },
    { title: 'Vendor Site Visit - AU Conference Hall', type: 'meeting', date: todayISO(-1), time: '09:00', endTime: '12:00', location: 'AU Conference Hall', notes: 'Venue inspection for Walia Telecom Expo', userId: userMap['st2']?.id },
  ]
  for (const c of calData) {
    await prisma.calendarEvent.create({ data: c })
  }

  // 25. Seed notifications
  const notifData = [
    { userId: userMap['st2']?.id, text: 'Budget approval submitted for EthFinTech Annual Summit 2026', type: 'approval', at: '5 min ago', link: '/approvals' },
    { userId: userMap['st1']?.id, text: 'New contract approval request: Zemen Pharma Product Launch', type: 'approval', at: '15 min ago', link: '/approvals' },
    { userId: userMap['st5']?.id, text: 'Budget updated for Abyssinia Bank Leadership Retreat: ETB 2,400,000', type: 'budget', at: '1 hr ago', link: '/finance' },
    { userId: userMap['st3']?.id, text: 'Workflow: Sof Omer Hospitality Gala advanced to Completed', type: 'workflow', at: '2 hr ago', link: '/workflow' },
    { text: 'Maintenance due: Moving Head Lights', type: 'inventory', at: '3 hr ago' },
    { text: 'Payment received — INV-2026-0141', type: 'finance', at: '5 hr ago' },
  ]
  for (const n of notifData) {
    await prisma.notification.create({ data: n })
  }

  console.log('Seed complete!')
  console.log('Demo users — email: [name]@amen.et, password: demo@amen')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
