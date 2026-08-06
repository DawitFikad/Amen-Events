// Central demo data + seeding helpers. All figures are realistic mock data.

const uid = () => Math.random().toString(36).slice(2, 10)

// ----------------------------- STAFF -----------------------------
export const staffSeed = [
  { id: 'st1', name: 'Hana Tadesse', role: 'Director', dept: 'Management', phone: '+251 911 220 445', email: 'hana@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-700', initials: 'HT' },
  { id: 'st2', name: 'Dawit Mengistu', role: 'Project Manager', dept: 'Operations', phone: '+251 912 778 301', email: 'dawit@amen.et', type: 'Employee', status: 'active', color: 'bg-gold-500', initials: 'DM' },
  { id: 'st3', name: 'Selam Bekele', role: 'Event Coordinator', dept: 'Operations', phone: '+251 913 554 209', email: 'selam@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-500', initials: 'SB' },
  { id: 'st4', name: 'Yonas Girma', role: 'Finance Officer', dept: 'Finance', phone: '+251 914 339 876', email: 'yonas@amen.et', type: 'Employee', status: 'active', color: 'bg-ink', initials: 'YG' },
  { id: 'st5', name: 'Sara Ahmed', role: 'Logistics Lead', dept: 'Operations', phone: '+251 915 662 118', email: 'sara@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-400', initials: 'SA' },
  { id: 'st6', name: 'Mekonnen Assefa', role: 'Vendor Liaison', dept: 'Procurement', phone: '+251 916 998 540', email: 'meki@amen.et', type: 'Freelancer', status: 'active', color: 'bg-gold-400', initials: 'MA' },
  { id: 'st7', name: 'Liya Kebede', role: 'Marketing Lead', dept: 'Marketing', phone: '+251 917 445 772', email: 'liya@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-600', initials: 'LK' },
  { id: 'st8', name: 'Bereket Tesfaye', role: 'Technician', dept: 'Technical', phone: '+251 918 229 650', email: 'bereket@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-300', initials: 'BT' },
]

// ----------------------------- CLIENTS -----------------------------
export const clientsSeed = [
  { id: 'cl1', company: 'ETH FINTECH Group', industry: 'Financial Services', city: 'Addis Ababa', contactPerson: 'Dr. Meron Ayele', role: 'Events Director', phone: '+251 911 222 000', email: 'meron@ethfintech.com', status: 'active', stage: 'contract', totalValue: 1850000, logo: 'EF' },
  { id: 'cl2', company: 'Zemen Pharmaceuticals', industry: 'Healthcare', city: 'Addis Ababa', contactPerson: 'Rahel Getahun', role: 'Marketing Manager', phone: '+251 912 333 111', email: 'rahel@zemenpharma.com', status: 'active', stage: 'opportunity', totalValue: 640000, logo: 'ZP' },
  { id: 'cl3', company: 'Walia Telecom', industry: 'Telecommunications', city: 'Addis Ababa', contactPerson: 'Kebede Abebe', role: 'Head of Brand', phone: '+251 913 444 222', email: 'kebede@walia.co.et', status: 'active', stage: 'quotation', totalValue: 980000, logo: 'WT' },
  { id: 'cl4', company: 'Sheba Construction', industry: 'Construction', city: 'Addis Ababa', contactPerson: 'Ashenafi Wolde', role: 'Admin Director', phone: '+251 914 555 333', email: 'ashenafi@sheba.et', status: 'inactive', stage: 'lead', totalValue: 0, logo: 'SC' },
  { id: 'cl5', company: 'Abyssinia Bank', industry: 'Banking', city: 'Addis Ababa', contactPerson: 'Selamawit Desta', role: 'PR Manager', phone: '+251 915 666 444', email: 'selamawit@abysbank.com', status: 'active', stage: 'contract', totalValue: 2400000, logo: 'AB' },
  { id: 'cl6', company: 'Koka University', industry: 'Education', city: 'Adama', contactPerson: 'Prof. Taddese Kassa', role: 'Vice President', phone: '+251 916 777 555', email: 'consult@kokau.edu', status: 'active', stage: 'lead', totalValue: 0, logo: 'KU' },
  { id: 'cl7', company: 'Sof Omer Hotel', industry: 'Hospitality', city: 'Hawassa', contactPerson: 'Daniel Haile', role: 'Sales Director', phone: '+251 917 888 666', email: 'events@sofomer.com', status: 'active', stage: 'negotiation', totalValue: 520000, logo: 'SO' },
]

// ----------------------------- CONTRACTS -----------------------------
export const contractsSeed = [
  { id: 'ct1', clientId: 'cl1', eventId: 'ev1', ref: 'CTR-2026-0041', value: 1850000, startDate: '2026-06-10', endDate: '2026-09-30', status: 'signed', notes: 'Full-service conference production with AV and catering.' },
  { id: 'ct2', clientId: 'cl5', eventId: 'ev3', ref: 'CTR-2026-0055', value: 2400000, startDate: '2026-07-01', endDate: '2026-08-15', status: 'signed', notes: 'Leadership retreat — resort buyout, transport and meals.' },
  { id: 'ct3', clientId: 'cl7', eventId: 'ev5', ref: 'CTR-2026-0039', value: 520000, startDate: '2026-05-20', endDate: '2026-07-20', status: 'closed', notes: 'Hospitality gala — completed, final invoice settled.' },
  { id: 'ct4', clientId: 'cl3', eventId: 'ev4', ref: 'CTR-2026-0061', value: 980000, startDate: '2026-08-01', endDate: '2026-10-15', status: 'draft', notes: 'Expo agreement awaiting legal sign-off.' },
]

// ----------------------------- CLIENT DOCUMENTS -----------------------------
export const clientDocsSeed = [
  { id: 'cd1', clientId: 'cl1', name: 'Signed Contract · Contract_2026.pdf', ext: 'PDF', size: '2.4 MB' },
  { id: 'cd2', clientId: 'cl1', name: 'Requirements Brief · brief.pdf', ext: 'PDF', size: '980 KB' },
  { id: 'cd3', clientId: 'cl5', name: 'Retreat Requirements · brief.pdf', ext: 'PDF', size: '1.1 MB' },
  { id: 'cd4', clientId: 'cl3', name: 'Expo Booth Specs · booths.xlsx', ext: 'XLSX', size: '640 KB' },
  { id: 'cd5', clientId: 'cl1', name: 'Brand Guidelines · brand.zip', ext: 'ZIP', size: '4.2 MB' },
]

// ----------------------------- VENUES -----------------------------
export const venuesSeed = [
  { id: 'vn1', name: 'Millennium Hall', city: 'Addis Ababa', halls: 4, capacity: 5000, price: 850000, contact: '+251 911 100 001', equipment: ['Stage', 'Sound', 'Lighting', 'VIP Lounge'], status: 'available', color: 'bg-brand-700', abbr: 'MH' },
  { id: 'vn2', name: 'Sheraton Skyline Ballroom', city: 'Addis Ababa', halls: 2, capacity: 1200, price: 420000, contact: '+251 911 100 002', equipment: ['Sound', 'AV', 'Catering Kitchen'], status: 'booked', color: 'bg-gold-500', abbr: 'SB' },
  { id: 'vn3', name: 'Unity Park Pavilion', city: 'Addis Ababa', halls: 1, capacity: 800, price: 260000, contact: '+251 911 100 003', equipment: ['Open Air', 'Stage'], status: 'available', color: 'bg-brand-500', abbr: 'UP' },
  { id: 'vn4', name: 'Bishoftu Resort Gardens', city: 'Bishoftu', halls: 3, capacity: 2500, price: 640000, contact: '+251 911 100 004', equipment: ['Stage', 'Swimming Lawn'], status: 'maintenance', color: 'bg-brand-400', abbr: 'BR' },
  { id: 'vn5', name: 'Hilton Addis Grand Hall', city: 'Addis Ababa', halls: 2, capacity: 950, price: 380000, contact: '+251 911 100 005', equipment: ['AV', 'Backstage', 'Catering'], status: 'booked', color: 'bg-ink', abbr: 'HI' },
  { id: 'vn6', name: 'Skylight Convention Center', city: 'Addis Ababa', halls: 6, capacity: 6000, price: 1100000, contact: '+251 911 100 006', equipment: ['Exhibition Floor', 'Stage', 'Press Room'], status: 'available', color: 'bg-brand-600', abbr: 'SC' },
]

// ----------------------------- RESOURCES / INVENTORY -----------------------------
export const resourcesSeed = [
  { id: 'rc1', name: 'LED Wall 4K 12m²', category: 'LED Screens', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Main Warehouse', code: 'A-LE-01' },
  { id: 'rc2', name: 'Line Array Sound System', category: 'Sound Systems', qty: 3, allocated: 2, maintenance: 0, status: 'in-use', location: 'Main Warehouse', code: 'A-SD-02' },
  { id: 'rc3', name: 'Moving Head Lights (Beam)', category: 'Lighting', qty: 24, allocated: 18, maintenance: 2, status: 'maintenance', location: 'Main Warehouse', code: 'A-LT-03' },
  { id: 'rc4', name: 'Truss Stage 8x10m', category: 'Stages', qty: 4, allocated: 1, maintenance: 0, status: 'available', location: 'Yard', code: 'A-ST-04' },
  { id: 'rc5', name: 'Banquet Chairs (Gold)', category: 'Furniture', qty: 400, allocated: 260, maintenance: 0, status: 'in-use', location: 'Yard', code: 'A-FR-05' },
  { id: 'rc6', name: 'Decorative Flower Arches', category: 'Decoration', qty: 12, allocated: 6, maintenance: 1, status: 'available', location: 'Store B', code: 'A-DC-06' },
  { id: 'rc7', name: '4x4 Utility Truck', category: 'Vehicles', qty: 3, allocated: 3, maintenance: 0, status: 'in-use', location: 'Fleet', code: 'A-VH-07' },
  { id: 'rc8', name: 'Diesel Generators 150kVA', category: 'Generators', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Yard', code: 'A-GN-08' },
  { id: 'rc9', name: 'Branding Banners / Standees', category: 'Branding', qty: 50, allocated: 22, maintenance: 0, status: 'available', location: 'Store A', code: 'A-BR-09' },
]

// ----------------------------- MAINTENANCE -----------------------------
export const maintenanceSeed = [
  { id: 'mt1', resourceId: 'rc3', task: 'Replace blown moving-head lamps & tension test', date: '2026-08-10', status: 'pending' },
  { id: 'mt2', resourceId: 'rc6', task: 'Re-wrap flower arch frames', date: '2026-08-14', status: 'scheduled' },
  { id: 'mt3', resourceId: 'rc2', task: 'Speaker firmware update & cable audit', date: '2026-07-28', status: 'done' },
]

// ----------------------------- VENDORS -----------------------------
export const vendorsSeed = [
  { id: 'vd1', name: 'Gourmet Addis Catering', type: 'Caterer', contact: 'Biniyam Worku', phone: '+251 918 000 001', rating: 4.8, contracts: 2, status: 'active' },
  { id: 'vd2', name: 'Bloom Decor Studio', type: 'Decorator', contact: 'Hirut Melaku', phone: '+251 918 000 002', rating: 4.6, contracts: 3, status: 'active' },
  { id: 'vd3', name: 'Secure Shield Ltd.', type: 'Security', contact: 'Captain Alemu', phone: '+251 918 000 003', rating: 4.9, contracts: 5, status: 'active' },
  { id: 'vd4', name: 'Lensny Photographers', type: 'Photographer', contact: 'Nardos Fikre', phone: '+251 918 000 004', rating: 4.7, contracts: 2, status: 'active' },
  { id: 'vd5', name: 'Motion Frame Video', type: 'Videographer', contact: 'Ezra Tamsir', phone: '+251 918 000 005', rating: 4.5, contracts: 2, status: 'active' },
  { id: 'vd6', name: 'Sena Entertainment', type: 'Entertainment', contact: 'Muluken Ayele', phone: '+251 918 000 006', rating: 4.4, contracts: 4, status: 'active' },
  { id: 'vd7', name: 'Kidan Printing House', type: 'Printing', contact: 'Kidist Tadesse', phone: '+251 918 000 007', rating: 4.3, contracts: 6, status: 'active' },
  { id: 'vd8', name: 'Fast Track Transport', type: 'Transportation', contact: 'Mesfin Haile', phone: '+251 918 000 008', rating: 4.6, contracts: 3, status: 'active' },
]

// ----------------------------- EVENTS -----------------------------
export const eventsSeed = [
  { id: 'ev1', name: 'EthFinTech Annual Summit 2026', clientId: 'cl1', venueId: 'vn1', category: 'Conference', date: '2026-08-18', time: '09:00', status: 'upcoming', pmId: 'st2', budget: 1850000, spent: 780000, stage: 60, attendees: null, progress: 62 },
  { id: 'ev2', name: 'Zemen Pharma Product Launch', clientId: 'cl2', venueId: 'vn2', category: 'Product Launch', date: '2026-08-25', time: '18:30', status: 'upcoming', pmId: 'st3', budget: 640000, spent: 210000, stage: 35, attendees: null, progress: 35 },
  { id: 'ev3', name: 'Abyssinia Bank Leadership Retreat', clientId: 'cl5', venueId: 'vn4', category: 'Retreat', date: '2026-08-02', time: '08:00', status: 'ongoing', pmId: 'st5', budget: 2400000, spent: 1240000, stage: 78, attendees: 146, progress: 78 },
  { id: 'ev4', name: 'Walia Telecom Partner Expo', clientId: 'cl3', venueId: 'vn6', category: 'Exhibition', date: '2026-09-12', time: '10:00', status: 'upcoming', pmId: 'st2', budget: 980000, spent: 340000, stage: 24, attendees: null, progress: 24 },
  { id: 'ev5', name: 'Sof Omer Hospitality Gala', clientId: 'cl7', venueId: 'vn3', category: 'Gala', date: '2026-07-20', time: '19:00', status: 'completed', pmId: 'st3', budget: 520000, spent: 505000, stage: 100, attendees: 690, progress: 100 },
  { id: 'ev6', name: 'Koka University Graduation Day', clientId: 'cl6', venueId: 'vn5', category: 'Ceremony', date: '2026-07-05', time: '09:00', status: 'completed', pmId: 'st5', budget: 0, spent: 0, stage: 30, attendees: 1200, progress: 30 },
]

// ----------------------------- EVENT SUPPLIERS -----------------------------
export const eventSuppliersSeed = [
  { eventId: 'ev1', vendorId: 'vd1' },
  { eventId: 'ev1', vendorId: 'vd3' },
  { eventId: 'ev1', vendorId: 'vd4' },
  { eventId: 'ev3', vendorId: 'vd1' },
  { eventId: 'ev3', vendorId: 'vd5' },
  { eventId: 'ev3', vendorId: 'vd8' },
  { eventId: 'ev4', vendorId: 'vd7' },
  { eventId: 'ev4', vendorId: 'vd6' },
  { eventId: 'ev5', vendorId: 'vd1' },
  { eventId: 'ev5', vendorId: 'vd2' },
  { eventId: 'ev5', vendorId: 'vd6' },
]

// ----------------------------- EVENT CHECKLISTS -----------------------------
export const eventChecklistsSeed = [
  { id: 'ec1', eventId: 'ev1', label: 'Venue contract signed', done: true },
  { id: 'ec2', eventId: 'ev1', label: 'Catering tasting completed', done: true },
  { id: 'ec3', eventId: 'ev1', label: 'Speaker confirmations', done: true },
  { id: 'ec4', eventId: 'ev1', label: 'AV & staging plan', done: false },
  { id: 'ec5', eventId: 'ev1', label: 'Security briefing', done: false },
  { id: 'ec6', eventId: 'ev1', label: 'VIP seating layout', done: false },
  { id: 'ec7', eventId: 'ev3', label: 'Retreat itinerary final', done: true },
  { id: 'ec8', eventId: 'ev3', label: 'Transport booked', done: true },
  { id: 'ec9', eventId: 'ev3', label: 'Accommodation allocated', done: true },
  { id: 'ec10', eventId: 'ev3', label: 'Day 2 breakout rooms', done: false },
  { id: 'ec11', eventId: 'ev4', label: 'Booth floor plan', done: true },
  { id: 'ec12', eventId: 'ev4', label: 'Exhibitor kits sent', done: false },
  { id: 'ec13', eventId: 'ev4', label: 'Branding production', done: false },
]

// ----------------------------- TASKS -----------------------------
export const tasksSeed = [
  { id: 'tk1', title: 'Confirm final speaker lineup', eventId: 'ev1', assigneeId: 'st2', priority: 'high', status: 'todo', due: '2026-08-05', comments: 3, progress: 0 },
  { id: 'tk2', title: 'Book catering tasting session', eventId: 'ev1', assigneeId: 'st5', priority: 'medium', status: 'in-progress', due: '2026-08-07', comments: 1, progress: 40 },
  { id: 'tk3', title: 'Finalize seating layout', eventId: 'ev1', assigneeId: 'st3', priority: 'high', status: 'in-progress', due: '2026-08-09', comments: 2, progress: 55 },
  { id: 'tk4', title: 'Ship exhibition banners', eventId: 'ev4', assigneeId: 'st5', priority: 'medium', status: 'todo', due: '2026-08-20', comments: 0, progress: 0 },
  { id: 'tk5', title: 'Approve lighting rig plan', eventId: 'ev3', assigneeId: 'st2', priority: 'high', status: 'review', due: '2026-07-30', comments: 4, progress: 80 },
  { id: 'tk6', title: 'Process VIP invitations', eventId: 'ev1', assigneeId: 'st7', priority: 'low', status: 'done', due: '2026-08-01', comments: 1, progress: 100 },
  { id: 'tk7', title: 'Contract signing with venue', eventId: 'ev4', assigneeId: 'st6', priority: 'medium', status: 'done', due: '2026-08-02', comments: 0, progress: 100 },
  { id: 'tk8', title: 'Sound check and stage test', eventId: 'ev2', assigneeId: 'st8', priority: 'high', status: 'todo', due: '2026-08-22', comments: 0, progress: 0 },
]

// ----------------------------- SPEAKERS -----------------------------
export const speakersSeed = [
  { id: 'sp1', name: 'Dr. Meskerem Adugna', topic: 'Digital Banking for the Next Decade', eventId: 'ev1', company: 'EthFinTech', time: '10:30', status: 'confirmed', initials: 'MA', color: 'bg-brand-700' },
  { id: 'sp2', name: 'Jemal Yusuf', topic: 'RegTech & Compliance Trends', eventId: 'ev1', company: 'Central Bank', time: '11:30', status: 'confirmed', initials: 'JY', color: 'bg-gold-500' },
  { id: 'sp3', name: 'Pr. Yalemwork Tsegaye', topic: 'Financial Inclusion through AI', eventId: 'ev1', company: 'Koka University', time: '14:00', status: 'pending', initials: 'YT', color: 'bg-brand-500' },
  { id: 'sp4', name: 'Samuel Mekonnen', topic: 'Partner Channel Innovation', eventId: 'ev4', company: 'Walia Telecom', time: '12:00', status: 'confirmed', initials: 'SM', color: 'bg-ink' },
]

// ----------------------------- EXHIBITORS -----------------------------
export const exhibitorsSeed = [
  { id: 'ex1', company: 'InnovPay', booth: 'A1', size: 'Premium', package: 'Gold Sponsor', paid: 400000, status: 'confirmed' },
  { id: 'ex2', company: 'SavaTech', booth: 'B3', size: 'Standard', package: 'Exhibitor', paid: 150000, status: 'confirmed' },
  { id: 'ex3', company: 'PayCore', booth: 'A4', size: 'Premium', package: 'Silver Sponsor', paid: 250000, status: 'pending' },
  { id: 'ex4', company: 'Mulu Hub', booth: 'C2', size: 'Standard', package: 'Exhibitor', paid: 0, status: 'registering' },
]

// ----------------------------- SPONSORS -----------------------------
export const sponsorsSeed = [
  { id: 'spn1', name: 'Sheba Bank', package: 'Platinum', amount: 500000, status: 'active', deliverables: ['Main stage branding', 'Logo on tickets'] },
  { id: 'spn2', name: 'Ethio Air', package: 'Gold', amount: 300000, status: 'active', deliverables: ['VIP lounge', 'Announcements'] },
  { id: 'spn3', name: 'Dashen Brewery', package: 'Silver', amount: 180000, status: 'pending', deliverables: ['Beverage corner'] },
]

// ----------------------------- INVOICES / FINANCE -----------------------------
export const invoicesSeed = [
  { id: 'inv1', clientId: 'cl1', eventId: 'ev1', amount: 925000, paid: 925000, status: 'paid', dueDate: '2026-07-15', ref: 'INV-2026-0141' },
  { id: 'inv2', clientId: 'cl1', eventId: 'ev1', amount: 925000, paid: 0, status: 'outstanding', dueDate: '2026-08-10', ref: 'INV-2026-0178' },
  { id: 'inv3', clientId: 'cl5', eventId: 'ev3', amount: 2400000, paid: 1680000, status: 'partial', dueDate: '2026-08-01', ref: 'INV-2026-0155' },
  { id: 'inv4', clientId: 'cl3', eventId: 'ev4', amount: 490000, paid: 0, status: 'outstanding', dueDate: '2026-08-15', ref: 'INV-2026-0188' },
  { id: 'inv5', clientId: 'cl7', eventId: 'ev5', amount: 520000, paid: 520000, status: 'paid', dueDate: '2026-07-01', ref: 'INV-2026-0120' },
]

export const expensesSeed = [
  { id: 'ex1', eventId: 'ev1', category: 'Venue Rental', amount: 425000, date: '2026-07-28', vendorId: 'vd1' },
  { id: 'ex2', eventId: 'ev1', category: 'Catering', amount: 210000, date: '2026-08-01', vendorId: 'vd1' },
  { id: 'ex3', eventId: 'ev1', category: 'Technical', amount: 145000, date: '2026-08-02', vendorId: 'vd4' },
  { id: 'ex4', eventId: 'ev3', category: 'Retreat Package', amount: 1240000, date: '2026-07-25', vendorId: 'vd5' },
  { id: 'ex5', eventId: 'ev5', category: 'Catering', amount: 180000, date: '2026-07-10', vendorId: 'vd1' },
]

// ----------------------------- PURCHASE REQUESTS -----------------------------
export const purchaseRequestsSeed = [
  { id: 'pr1', eventId: 'ev1', item: 'Extra moving head lights (12)', category: 'Technical', amount: 86000, requestedBy: 'st8', date: '2026-08-04', status: 'pending' },
  { id: 'pr2', eventId: 'ev3', item: 'Diesel top-up for generators', category: 'Logistics', amount: 45000, requestedBy: 'st5', date: '2026-08-02', status: 'approved' },
  { id: 'pr3', eventId: 'ev4', item: 'Sponsor gift bags (300)', category: 'Marketing', amount: 120000, requestedBy: 'st7', date: '2026-08-05', status: 'rejected' },
  { id: 'pr4', eventId: 'ev1', item: 'Aisle signage & standees', category: 'Branding', amount: 64000, requestedBy: 'st5', date: '2026-08-06', status: 'pending' },
]

// ----------------------------- REGISTRATIONS -----------------------------
export const registrationsSeed = [
  { id: 'rg1', eventId: 'ev3', name: 'Amanuel Tesfaye', email: 'amanuel@gmail.com', type: 'VIP', amount: 12000, paid: true, checkedIn: true, qr: 'AE-EV3-0001' },
  { id: 'rg2', eventId: 'ev3', name: 'Hannah Solomon', email: 'hannah@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: true, qr: 'AE-EV3-0002' },
  { id: 'rg3', eventId: 'ev3', name: 'Fitsum Alemu', email: 'fitsum@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: false, qr: 'AE-EV3-0003' },
  { id: 'rg4', eventId: 'ev3', name: 'Ruth Mekonnen', email: 'ruth@gmail.com', type: 'VIP', amount: 12000, paid: true, checkedIn: false, qr: 'AE-EV3-0004' },
  { id: 'rg5', eventId: 'ev3', name: 'Dagmawi Hailu', email: 'dagmawi@gmail.com', type: 'Group', amount: 5400, paid: false, checkedIn: false, qr: 'AE-EV3-0005' },
  { id: 'rg6', eventId: 'ev3', name: 'Nebiyat Zewdie', email: 'nebiyat@gmail.com', type: 'Standard', amount: 6000, paid: true, checkedIn: false, qr: 'AE-EV3-0006' },
]

// ----------------------------- ACTIVITIES -----------------------------
export const activitiesSeed = [
  { id: 'ac1', text: 'New registration for EthFinTech Summit', type: 'registration', at: '12 min ago' },
  { id: 'ac2', text: 'Invoice INV-2026-0178 marked outstanding', type: 'finance', at: '48 min ago' },
  { id: 'ac3', text: 'Speaker Dr. Meskerem confirmed', type: 'speaker', at: '2 hr ago' },
  { id: 'ac4', text: 'Task "Approve lighting rig plan" moved to review', type: 'task', at: '3 hr ago' },
  { id: 'ac5', text: 'Venue allocation confirmed at Millennium Hall', type: 'venue', at: '5 hr ago' },
  { id: 'ac6', text: 'QR check-in recorded for Hannah Solomon', type: 'checkin', at: 'Yesterday' },
]

// ----------------------------- NOTIFICATIONS -----------------------------
export const notificationsSeed = [
  { id: 'n1', text: 'Budget alert: Event 1850000 approaching 60%', type: 'alert', at: '10 min ago' },
  { id: 'n2', text: 'New client inquiry from Sheba Construction', type: 'crm', at: '1 hr ago' },
  { id: 'n3', text: 'Maintenance due: Moving Head Lights', type: 'inventory', at: '3 hr ago' },
  { id: 'n4', text: 'Payment received — INV-2026-0141', type: 'finance', at: '5 hr ago' },
  { id: 'n5', text: 'Task deadline approaching tomorrow', type: 'task', at: '6 hr ago' },
]

export const campaignsSeed = [
  { id: 'cm1', name: 'Summit Early Bird Blast', channel: 'Email', audience: 8200, sent: 8200, opens: 4210, clicks: 930, status: 'sent' },
  { id: 'cm2', name: 'Conference Reminder SMS', channel: 'SMS', audience: 1450, sent: 1450, opens: 0, clicks: 0, status: 'sent' },
  { id: 'cm3', name: 'WhatsApp VIP Invite', channel: 'WhatsApp', audience: 320, sent: 280, opens: 210, clicks: 122, status: 'sending' },
  { id: 'cm4', name: 'Early Bird Coupon Emails', channel: 'Email', audience: 5000, sent: 0, opens: 0, clicks: 0, status: 'draft' },
]

export const couponsSeed = [
  { id: 'cp1', code: 'SUMMIT20', type: 'Discount', value: '20%', usage: 142, max: 500, status: 'active' },
  { id: 'cp2', code: 'VIPFRIEND', type: 'Referral', value: '10%', usage: 38, max: 200, status: 'active' },
  { id: 'cp3', code: 'EARLYBIRD', type: 'Discount', value: '15%', usage: 500, max: 500, status: 'expired' },
]

// ----------------------------- SPEAKER & CONFERENCE (M12) -----------------------------
export const sessionsSeed = [
  { id: 'ag1', time: '09:00', session: 'Registration & Welcome Coffee', venue: 'Main Foyer', type: 'networking' },
  { id: 'ag2', time: '10:00', session: 'Keynote: The Future of Digital Banking', venue: 'Grand Hall', type: 'keynote', speakerId: 'sp1' },
  { id: 'ag3', time: '11:30', session: 'Panel: RegTech & Compliance', venue: 'Grand Hall', type: 'panel', speakerIds: ['sp2', 'sp3'] },
  { id: 'ag4', time: '13:30', session: 'Workshop: AI in Finance', venue: 'Breakout A', type: 'workshop', speakerId: 'sp3' },
  { id: 'ag5', time: '15:30', session: 'Closing Fireside Chat', venue: 'Grand Hall', type: 'fireside', speakerId: 'sp1' },
]

export const sessionAttendanceSeed = [
  { id: 'sa1', sessionId: 'ag2', session: 'Keynote', registered: 640, attended: 590 },
  { id: 'sa2', sessionId: 'ag3', session: 'Panel: RegTech', registered: 520, attended: 470 },
  { id: 'sa3', sessionId: 'ag4', session: 'AI Workshop', registered: 220, attended: 205 },
]

export const certificateHoldersSeed = [
  { id: 'cf1', name: 'Meseret Lemma', session: 'Keynote session', issued: false },
  { id: 'cf2', name: 'Tigist Fikru', session: 'Panel: RegTech', issued: false },
  { id: 'cf3', name: 'Beza Tadesse', session: 'AI in Finance workshop', issued: false },
  { id: 'cf4', name: 'Nahom Girma', session: 'Fireside chat', issued: false },
]

// ----------------------------- EXHIBITION (M13) -----------------------------
export const exhibitionBoothsSeed = [
  { booth: 'A1', company: 'InnovPay', status: 'confirmed', tier: 'gold', x: 1, y: 1 },
  { booth: 'A2', company: null, status: 'free', tier: null, x: 2, y: 1 },
  { booth: 'A3', company: null, status: 'free', tier: null, x: 3, y: 1 },
  { booth: 'A4', company: 'PayCore', status: 'pending', tier: 'silver', x: 4, y: 1 },
  { booth: 'B1', company: null, status: 'free', tier: null, x: 1, y: 2 },
  { booth: 'B2', company: null, status: 'free', tier: null, x: 2, y: 2 },
  { booth: 'B3', company: 'SavaTech', status: 'confirmed', tier: 'standard', x: 3, y: 2 },
  { booth: 'B4', company: null, status: 'free', tier: null, x: 4, y: 2 },
  { booth: 'C1', company: null, status: 'free', tier: null, x: 1, y: 3 },
  { booth: 'C2', company: 'Mulu Hub', status: 'registering', tier: 'standard', x: 2, y: 3 },
  { booth: 'C3', company: null, status: 'free', tier: null, x: 3, y: 3 },
  { booth: 'C4', company: null, status: 'free', tier: null, x: 4, y: 3 },
]

export const visitorsSeed = [
  { id: 'vs1', name: 'Samuel Tekle', company: 'Savvy Startups', checkin: '10:02', scanned: true },
  { id: 'vs2', name: 'Hanna Mamo', company: 'Mulu Hub', checkin: '10:14', scanned: true },
  { id: 'vs3', name: 'Yared Teshome', company: 'Addis Innovation', checkin: '10:31', scanned: true },
  { id: 'vs4', name: 'Bethel Alemu', company: 'Sof Omer', checkin: '—', scanned: false },
]

// ----------------------------- SPONSORSHIP (M14) -----------------------------
export const brandingLocationsSeed = [
  { loc: 'Main Stage', val: 400000, by: 'Platinum · Sheba Bank' },
  { loc: 'VIP Lounge', val: 0, by: 'Gold · Ethio Air' },
  { loc: 'Ticket Backs', val: 0, by: 'Platinum' },
  { loc: 'Registration Desk', val: 0, by: 'Silver' },
]

export const sponsorDeliverablesSeed = [
  { id: 'dv1', sponsorId: 'spn1', item: 'Main stage branding installed', status: 'done', date: '2026-08-16' },
  { id: 'dv2', sponsorId: 'spn1', item: 'Logo on printed tickets', status: 'in-progress', date: '2026-08-20' },
  { id: 'dv3', sponsorId: 'spn2', item: 'VIP lounge setup', status: 'pending', date: '2026-08-17' },
  { id: 'dv4', sponsorId: 'spn2', item: 'Opening announcement script', status: 'done', date: '2026-08-12' },
]

// ----------------------------- APPROVALS (offline workflows) -----------------------------
export const approvalsSeed = [
  { id: 'ap1', type: 'purchase_request', entityName: 'Extra moving head lights (12)', amount: 86000, status: 'pending', submittedBy: 'st8', createdAt: '2026-08-04', note: 'Borrowed inventory insufficient for the main stage.' },
  { id: 'ap2', type: 'budget', entityName: 'Zemen Pharma Launch — budget increase', amount: 120000, status: 'pending', submittedBy: 'st3', createdAt: '2026-08-05', note: 'Catering and décor exceed the original estimate.' },
  { id: 'ap3', type: 'contract', entityName: 'CTR-2026-0061 — Walia Telecom Expo', amount: 980000, status: 'pending', submittedBy: 'st2', createdAt: '2026-08-03', note: 'Expo agreement awaiting legal sign-off.' },
  { id: 'ap4', type: 'sponsorship', entityName: 'Dashen Brewery — Silver package', amount: 180000, status: 'revision_requested', submittedBy: 'st7', createdAt: '2026-08-02', note: 'Sponsor asked to swap beverage corner placement.' },
  { id: 'ap5', type: 'vendor_payment', entityName: 'Abyssinia Bank — second tranche', amount: 720000, status: 'approved', submittedBy: 'st4', createdAt: '2026-07-29', reviewNote: 'Matches milestone 2 of the retreat contract.' },
]

// ----------------------------- CALENDAR MEETINGS (offline) -----------------------------
export function calendarEventsSeed() {
  return [
    { id: 'ce1', title: 'Client kickoff — EthFinTech', type: 'meeting', date: todayISO(0), time: '10:00', location: 'Office HQ', notes: '' },
    { id: 'ce2', title: 'Catering tasting', type: 'meeting', date: todayISO(1), time: '15:00', location: 'Gourmet Addis', notes: '' },
    { id: 'ce3', title: 'Sponsor pitch review', type: 'meeting', date: todayISO(2), time: '11:30', location: 'Meeting Room B', notes: '' },
    { id: 'ce4', title: 'AV & staging walkthrough', type: 'task', date: todayISO(3), time: '09:00', location: 'Millennium Hall', notes: '' },
  ]
}

export const revenueTrend = [
  { m: 'Feb', v: 820 }, { m: 'Mar', v: 960 }, { m: 'Apr', v: 1100 }, { m: 'May', v: 980 },
  { m: 'Jun', v: 1450 }, { m: 'Jul', v: 1720 }, { m: 'Aug', v: 2080 },
]

export const categorySplit = [
  { name: 'Conference', value: 38 }, { name: 'Exhibition', value: 22 },
  { name: 'Retreat', value: 18 }, { name: 'Gala', value: 12 }, { name: 'Launch', value: 10 },
]

export const lookup = {
  clients: clientsSeed.reduce((a, c) => ((a[c.id] = c), a), {}),
  events: eventsSeed.reduce((a, e) => ((a[e.id] = e), a), {}),
  staff: staffSeed.reduce((a, s) => ((a[s.id] = s), a), {}),
  venues: venuesSeed.reduce((a, v) => ((a[v.id] = v), a), {}),
  vendors: vendorsSeed.reduce((a, v) => ((a[v.id] = v), a), {}),
}

export function fmt(n) {
  if (n == null) return '—'
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  const s = a.toLocaleString('en-US')
  return `${sign}ETB ${s}`
}

export function fmtCompact(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return String(n)
}

export const currency = (n) => fmtCompact(n)

export function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}