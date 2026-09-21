// Central demo data + seeding helpers. All figures are realistic mock data.

const uid = () => Math.random().toString(36).slice(2, 10)

// Generate a mockup profile avatar (SVG data URL) - distinct gradient + initials.
export const mockAvatar = (initials, c1 = '#188A2E', c2 = '#0B3B16') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="96" height="96" rx="16" fill="url(#g)"/><circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.92)"/><path d="M22 86c4-20 15-32 26-32s22 12 26 32z" fill="rgba(255,255,255,0.92)"/><text x="48" y="91" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800" fill="#041C0B" text-anchor="middle">${initials}</text></svg>`)}`

// ----------------------------- STAFF -----------------------------
export const staffSeed = [
  { id: 'st1', name: 'Hana Tadesse', role: 'Director', dept: 'Management', phone: '+251 911 220 445', email: 'hana@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-700', initials: 'HT', avatar: mockAvatar('HT', '#188A2E', '#0B3B16'), salary: 120000, joinedDate: '2021-03-01', contractEnd: '', address: 'Bole, Addis Ababa', bio: 'Leads strategy and client partnerships across the agency.' },
  { id: 'st2', name: 'Dawit Mengistu', role: 'Project Manager', dept: 'Operations', phone: '+251 912 778 301', email: 'dawit@amen.et', type: 'Employee', status: 'active', color: 'bg-gold-500', initials: 'DM', avatar: mockAvatar('DM', '#D9A441', '#8A5E1C'), salary: 85000, joinedDate: '2022-01-15', contractEnd: '', address: 'Yeka, Addis Ababa', bio: 'PM for flagship summits and conferences.' },
  { id: 'st3', name: 'Selam Bekele', role: 'Event Coordinator', dept: 'Operations', phone: '+251 913 554 209', email: 'selam@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-500', initials: 'SB', avatar: mockAvatar('SB', '#0D9488', '#0B3B16'), salary: 52000, joinedDate: '2022-06-01', contractEnd: '', address: 'Kirkos, Addis Ababa', bio: 'Runs logistics and on-site coordination.' },
  { id: 'st4', name: 'Yonas Girma', role: 'Finance Officer', dept: 'Finance', phone: '+251 914 339 876', email: 'yonas@amen.et', type: 'Employee', status: 'active', color: 'bg-ink', initials: 'YG', avatar: mockAvatar('YG', '#10B981', '#065F46'), salary: 64000, joinedDate: '2023-02-01', contractEnd: '', address: 'Gulele, Addis Ababa', bio: 'Handles budgets, invoices and vendor payments.' },
  { id: 'st5', name: 'Sara Ahmed', role: 'Logistics Lead', dept: 'Operations', phone: '+251 915 662 118', email: 'sara@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-400', initials: 'SA', avatar: mockAvatar('SA', '#F59E0B', '#92400E'), salary: 58000, joinedDate: '2022-09-01', contractEnd: '', address: 'Arada, Addis Ababa', bio: 'Owns venue, transport and vendor procurement.' },
  { id: 'st6', name: 'Mekonnen Assefa', role: 'Vendor Liaison', dept: 'Procurement', phone: '+251 916 998 540', email: 'mekonnen@amen.et', type: 'Freelancer', status: 'active', color: 'bg-gold-400', initials: 'MA', avatar: mockAvatar('MA', '#0F172A', '#334155'), salary: 48000, joinedDate: '2023-05-15', contractEnd: '', address: 'Nifas Silk, Addis Ababa', bio: 'Vendor contracts, site inspections and supplier coordination.' },
  { id: 'st7', name: 'Liya Kebede', role: 'Marketing Lead', dept: 'Marketing', phone: '+251 917 445 772', email: 'liya@amen.et', type: 'Employee', status: 'active', color: 'bg-brand-600', initials: 'LK', avatar: mockAvatar('LK', '#0284C7', '#0C4A6E'), salary: 45000, joinedDate: '2023-08-01', contractEnd: '', address: 'Bole, Addis Ababa', bio: 'Runs campaigns, registrations and attendee comms.' },
  { id: 'st8', name: 'Bereket Tesfaye', role: 'Technician', dept: 'Technical', phone: '+251 918 229 650', email: 'bereket@amen.et', type: 'Freelancer', status: 'active', color: 'bg-brand-300', initials: 'BT', avatar: mockAvatar('BT', '#E11D48', '#7F1D1D'), salary: 0, joinedDate: '2024-02-01', contractEnd: '2026-12-31', address: 'Lideta, Addis Ababa', bio: 'Freelance tech support for exhibitions and check-ins.' },
]

// ----------------------------- CLIENTS -----------------------------
export const clientsSeed = [
{ id: 'cl1', company: 'ETH FINTECH Group', industry: 'Financial Services', city: 'Addis Ababa', address: 'Bole Road, Churchill Tower 8th Floor, Addis Ababa', website: 'https://ethfintech.com', taxId: 'ET-ETH-2023-48912', contactPerson: 'Dr. Meron Ayele', role: 'Events Director', phone: '+251 911 222 000', email: 'meron@ethfintech.com', status: 'active', stage: 'contract', totalValue: 1850000, logo: 'EF' },
  { id: 'cl2', company: 'Zemen Pharmaceuticals', industry: 'Healthcare', city: 'Addis Ababa', address: 'Kazanchis, Zemen HQ, Addis Ababa', website: 'https://zemenpharma.com', taxId: 'ET-ZPH-2019-77821', contactPerson: 'Rahel Getahun', role: 'Marketing Manager', phone: '+251 912 333 111', email: 'rahel@zemenpharma.com', status: 'active', stage: 'opportunity', totalValue: 640000, logo: 'ZP' },
  { id: 'cl3', company: 'Walia Telecom', industry: 'Telecommunications', city: 'Addis Ababa', address: 'Megenagna, Walia Campus, Addis Ababa', website: 'https://walia.co.et', taxId: 'ET-WTC-2016-11304', contactPerson: 'Kebede Abebe', role: 'Head of Brand', phone: '+251 913 444 222', email: 'kebede@walia.co.et', status: 'active', stage: 'quotation', totalValue: 980000, logo: 'WT' },
  { id: 'cl4', company: 'Sheba Construction', industry: 'Construction', city: 'Addis Ababa', address: 'Cazanchise, Sheba Tower, Addis Ababa', website: 'https://sheba.et', taxId: 'ET-SCC-2011-90455', contactPerson: 'Ashenafi Wolde', role: 'Admin Director', phone: '+251 914 555 333', email: 'ashenafi@sheba.et', status: 'inactive', stage: 'lead', totalValue: 0, logo: 'SC' },
  { id: 'cl5', company: 'Abyssinia Bank', industry: 'Banking', city: 'Addis Ababa', address: 'Meklit Building 26, Addis Ababa', website: 'https://abysbank.com', taxId: 'ET-ABS-1998-33210', contactPerson: 'Selamawit Desta', role: 'PR Manager', phone: '+251 915 666 444', email: 'selamawit@abysbank.com', status: 'active', stage: 'contract', totalValue: 2400000, logo: 'AB' },
  { id: 'cl6', company: 'Koka University', industry: 'Education', city: 'Adama', address: 'Main Campus, Adama Town', website: 'https://kokau.edu', taxId: 'ET-KUU-2010-22187', contactPerson: 'Prof. Taddese Kassa', role: 'Vice President', phone: '+251 916 777 555', email: 'consult@kokau.edu', status: 'active', stage: 'lead', totalValue: 0, logo: 'KU' },
  { id: 'cl7', company: 'Sof Omer Hotel', industry: 'Hospitality', city: 'Hawassa', address: 'Lake Shore Road, Hawassa', website: 'https://sofomer.com', taxId: 'ET-SOH-2015-66012', contactPerson: 'Daniel Haile', role: 'Sales Director', phone: '+251 917 888 666', email: 'events@sofomer.com', status: 'active', stage: 'negotiation', totalValue: 520000, logo: 'SO' },
]

// ----------------------------- CONTRACTS -----------------------------
export const contractsSeed = [
  { id: 'ct1', clientId: 'cl1', eventId: 'ev1', ref: 'CTR-2026-0041', value: 1850000, startDate: '2026-06-10', endDate: '2026-09-30', status: 'signed', notes: 'Full-service conference production with AV and catering.' },
  { id: 'ct2', clientId: 'cl5', eventId: 'ev3', ref: 'CTR-2026-0055', value: 2400000, startDate: '2026-07-01', endDate: '2026-08-15', status: 'signed', notes: 'Leadership retreat - resort buyout, transport and meals.' },
  { id: 'ct3', clientId: 'cl7', eventId: 'ev5', ref: 'CTR-2026-0039', value: 520000, startDate: '2026-05-20', endDate: '2026-07-20', status: 'closed', notes: 'Hospitality gala - completed, final invoice settled.' },
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
  { id: 'vn1', name: 'Millennium Hall', city: 'Addis Ababa', address: 'Africa Avenue, Bole', halls: 4, capacity: 5000, price: 850000, contact: '+251 911 100 001', phone: '+251 911 100 001', email: 'bookings@millenniumhall.com', parking: 400, description: "Addis Ababa's largest convention hall with a main auditorium, breakout rooms and full staging infrastructure.", equipment: ['Stage', 'Sound', 'Lighting', 'VIP Lounge', 'WiFi'], status: 'available', color: 'bg-brand-700', abbr: 'MH', image: '' },
  { id: 'vn2', name: 'Sheraton Skyline Ballroom', city: 'Addis Ababa', address: 'Taitu Street', halls: 2, capacity: 1200, price: 420000, contact: '+251 911 100 002', phone: '+251 911 100 002', email: 'events@sheratonaddis.com', parking: 250, description: 'Iconic ballroom with panoramic city views, ideal for galas and high-profile product launches.', equipment: ['Stage', 'AV', 'Chandeliers', 'WiFi'], status: 'booked', color: 'bg-gold-500', abbr: 'SB', image: '' },
  { id: 'vn3', name: 'Unity Park Pavilion', city: 'Addis Ababa', address: 'Unity Park, Arat Kilo', halls: 1, capacity: 800, price: 260000, contact: '+251 911 100 003', phone: '+251 911 100 003', email: 'park@unitypark.gov.et', parking: 150, description: 'Open-air ceremonial pavilion surrounded by gardens - outdoor galas and cultural events.', equipment: ['Stage', 'Lighting', 'Garden', 'Outdoor Power'], status: 'available', color: 'bg-brand-500', abbr: 'UP', image: '' },
  { id: 'vn4', name: 'Bishoftu Resort Gardens', city: 'Bishoftu', address: 'Lakeside, Bishoftu', halls: 3, capacity: 2500, price: 640000, contact: '+251 911 100 004', phone: '+251 911 100 004', email: 'events@bishofturesort.com', parking: 200, description: 'Lakeside retreat venue with gardens, amphitheatre and conference pavilions.', equipment: ['Stage', 'Sound', 'Accommodation', 'WiFi'], status: 'maintenance', color: 'bg-brand-400', abbr: 'BR', image: '' },
  { id: 'vn5', name: 'Hilton Addis Grand Hall', city: 'Addis Ababa', address: 'Menelik II Avenue', halls: 2, capacity: 950, price: 380000, contact: '+251 911 100 005', phone: '+251 911 100 005', email: 'events@hiltonaddis.com', parking: 300, description: 'Grand hotel ballroom with banquet capacity, full AV and catering partners.', equipment: ['Stage', 'AV', 'Catering', 'WiFi'], status: 'booked', color: 'bg-ink', abbr: 'HI', image: '' },
  { id: 'vn6', name: 'Skylight Convention Center', city: 'Addis Ababa', address: 'Meskel Square', halls: 6, capacity: 6000, price: 1100000, contact: '+251 911 100 006', phone: '+251 911 100 006', email: 'info@skylightcc.com', parking: 500, description: 'Purpose-built exhibition and conference venue with 6 halls and a 6000m² exhibition floor.', equipment: ['Booth Grid', 'Stage', 'Sound', 'Lighting', 'WiFi', 'Loading Bay'], status: 'available', color: 'bg-brand-600', abbr: 'SC', image: '' },
]

// ----------------------------- RESOURCES / INVENTORY -----------------------------
export const resourcesSeed = [
  { id: 'rc1', name: 'LED Wall 4K 12m²', category: 'LED Screens', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Main Warehouse', code: 'A-LE-01', image: '', unitCost: 450000, supplier: 'Addis AV Traders', purchaseDate: '2024-03-15', notes: 'Hire-ready; spare power modules in stock.' },
  { id: 'rc2', name: 'Line Array Sound System', category: 'Sound Systems', qty: 3, allocated: 2, maintenance: 0, status: 'in-use', location: 'Main Warehouse', code: 'A-SD-02', image: '', unitCost: 380000, supplier: 'JBL Ethiopia', purchaseDate: '2023-11-20', notes: 'Full PA with 2 subwoofers and mixing desk.' },
  { id: 'rc3', name: 'Moving Head Lights', category: 'Lighting', qty: 24, allocated: 18, maintenance: 2, status: 'maintenance', location: 'Main Warehouse', code: 'A-LT-03', image: '', unitCost: 85000, supplier: 'Beam Lights Co', purchaseDate: '2024-01-10', notes: 'DMX controlled; two units under service.' },
  { id: 'rc4', name: 'Truss Stage (modular)', category: 'Stages', qty: 4, allocated: 1, maintenance: 0, status: 'available', location: 'Stage Warehouse', code: 'A-ST-04', image: '', unitCost: 210000, supplier: 'TrussPro', purchaseDate: '2023-06-05', notes: 'Covers up to 6m×4m per module.' },
  { id: 'rc5', name: 'Banquet Chairs', category: 'Furniture', qty: 400, allocated: 260, maintenance: 0, status: 'in-use', location: 'Hall Storage', code: 'A-FR-05', image: '', unitCost: 3500, supplier: 'Furniture World', purchaseDate: '2022-05-18', notes: 'White padded chairs; covers available.' },
  { id: 'rc6', name: 'Flower Arches', category: 'Decoration', qty: 12, allocated: 6, maintenance: 1, status: 'available', location: 'Decoration Store', code: 'A-DR-06', image: '', unitCost: 18000, supplier: 'Floral Studio', purchaseDate: '2024-02-12', notes: 'Compatible with white & rose florals.' },
  { id: 'rc7', name: '4x4 Utility Truck', category: 'Vehicles', qty: 3, allocated: 3, maintenance: 0, status: 'in-use', location: 'Fleet Yard', code: 'A-VH-07', image: '', unitCost: 2200000, supplier: 'Toyota Ethiopia', purchaseDate: '2023-01-30', notes: 'Diesel; trailers available for freight.' },
  { id: 'rc8', name: 'Diesel Generators', category: 'Generators', qty: 2, allocated: 1, maintenance: 0, status: 'available', location: 'Fleet Yard', code: 'A-GN-08', image: '', unitCost: 640000, supplier: 'Genset PLC', purchaseDate: '2022-09-14', notes: 'Backup power for outdoor staging.' },
  { id: 'rc9', name: 'Branding Banners', category: 'Branding', qty: 50, allocated: 22, maintenance: 0, status: 'available', location: 'Print Store', code: 'A-BR-09', image: '', unitCost: 4500, supplier: 'PrintHub', purchaseDate: '2024-04-01', notes: 'Rolled banners with stands; reprint on request.' },
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
  { id: 'ev1', name: 'EthFinTech Annual Summit 2026', clientId: 'cl1', venueId: 'vn1', category: 'Conference', date: '2026-08-18', time: '09:00', endDate: '2026-08-19', endTime: '17:00', deadline: '2026-08-14', capacity: 1200, price: 12000, published: true, description: "Two days of keynotes, panels and networking on the future of digital finance - Ethiopia's largest fintech gathering.", tags: ['Fintech', 'Conference', 'Networking'], contactName: 'Dr. Meron Ayele', contactPhone: '+251 911 222 000', status: 'upcoming', pmId: 'st2', budget: 1850000, spent: 780000, stage: 8, attendees: null, progress: 64 },
  { id: 'ev2', name: 'Zemen Pharma Product Launch', clientId: 'cl2', venueId: 'vn2', category: 'Product Launch', date: '2026-08-25', time: '18:30', endDate: '2026-08-25', endTime: '22:00', deadline: '2026-08-22', capacity: 600, price: 0, published: false, description: "Invitation-only unveiling of Zemen Pharmaceuticals' new product line with media and industry guests.", tags: ['Healthcare', 'Launch'], contactName: 'Rahel Getahun', contactPhone: '+251 912 333 111', status: 'upcoming', pmId: 'st3', budget: 640000, spent: 210000, stage: 5, attendees: null, progress: 43 },
  { id: 'ev3', name: 'Abyssinia Bank Leadership Retreat', clientId: 'cl5', venueId: 'vn4', category: 'Retreat', date: '2026-08-02', time: '08:00', endDate: '2026-08-04', endTime: '16:00', deadline: '2026-07-25', capacity: 160, price: 0, published: false, description: 'Two-day leadership retreat covering strategy, risk and branch performance for Abyssinia Bank senior leadership.', tags: ['Banking', 'Retreat', 'Leadership'], contactName: 'Selamawit Desta', contactPhone: '+251 915 666 444', status: 'ongoing', pmId: 'st5', budget: 2400000, spent: 1240000, stage: 11, attendees: 146, progress: 86 },
  { id: 'ev4', name: 'Walia Telecom Partner Expo', clientId: 'cl3', venueId: 'vn6', category: 'Exhibition', date: '2026-09-12', time: '10:00', endDate: '2026-09-13', endTime: '18:00', deadline: '2026-09-05', capacity: 3000, price: 5000, published: true, description: 'Open exhibition showcasing Walia Telecom partner ecosystem, booths, demos and B2B matchmaking.', tags: ['Telecom', 'Exhibition', 'B2B'], contactName: 'Kebede Abebe', contactPhone: '+251 913 444 222', status: 'upcoming', pmId: 'st2', budget: 980000, spent: 340000, stage: 4, attendees: null, progress: 36 },
  { id: 'ev5', name: 'Sof Omer Hospitality Gala', clientId: 'cl7', venueId: 'vn3', category: 'Gala', date: '2026-07-20', time: '19:00', endDate: '2026-07-20', endTime: '23:30', deadline: '2026-07-15', capacity: 700, price: 25000, published: true, description: "An elegant fundraising gala dinner for Sof Omer Hotel's hospitality partners and distinguished guests.", tags: ['Gala', 'Fundraiser', 'Hospitality'], contactName: 'Daniel Haile', contactPhone: '+251 917 888 666', status: 'completed', pmId: 'st3', budget: 520000, spent: 505000, stage: 13, attendees: 690, progress: 100 },
  { id: 'ev6', name: 'Koka University Graduation Day', clientId: 'cl6', venueId: 'vn5', category: 'Ceremony', date: '2026-07-05', time: '09:00', endDate: '2026-07-05', endTime: '14:00', deadline: '2026-06-30', capacity: 1500, price: 0, published: true, description: "Annual graduation ceremony for Koka University's graduating class of 2026.", tags: ['Ceremony', 'Academic'], contactName: 'Prof. Taddese Kassa', contactPhone: '+251 916 777 555', status: 'completed', pmId: 'st5', budget: 0, spent: 0, stage: 13, attendees: 1200, progress: 100 },
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

// ----------------------------- EVENT DOCUMENTS -----------------------------
export const eventDocsSeed = [
  { id: 'ed1', eventId: 'ev1', name: 'Fintech Summit Event Proposal.pdf', ext: 'PDF', size: '2.4 MB' },
  { id: 'ed2', eventId: 'ev1', name: 'Millennium Hall Contract.pdf', ext: 'PDF', size: '1.1 MB' },
  { id: 'ed3', eventId: 'ev1', name: 'Floor Plan Main Hall.png', ext: 'PNG', size: '4.8 MB' },
  { id: 'ed4', eventId: 'ev1', name: 'Run of Show - Day 1.xlsx', ext: 'XLSX', size: '980 KB' },
  { id: 'ed5', eventId: 'ev3', name: 'Retreat Agenda 2026.pdf', ext: 'PDF', size: '860 KB' },
  { id: 'ed6', eventId: 'ev4', name: 'Exhibitor Booth Layout.png', ext: 'PNG', size: '3.2 MB' },
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
  { id: 'sp1', name: 'Dr. Meskerem Adugna', topic: 'Digital Banking for the Next Decade', eventId: 'ev1', company: 'EthFinTech', email: 'meskerem@ethfintech.et', phone: '+251 911 700 001', bio: 'ED of EthFinTech and policy advisor on the National Digital Strategy.', time: '10:30', status: 'confirmed', initials: 'MA', color: 'bg-brand-700' },
  { id: 'sp2', name: 'Jemal Yusuf', topic: 'RegTech & Compliance Trends', eventId: 'ev1', company: 'Central Bank', email: 'jemal.yusuf@cb.gov.et', phone: '+251 911 700 002', bio: 'Senior banking supervisor leading payment-system oversight.', time: '11:30', status: 'confirmed', initials: 'JY', color: 'bg-gold-500' },
  { id: 'sp3', name: 'Pr. Yalemwork Tsegaye', topic: 'Financial Inclusion through AI', eventId: 'ev1', company: 'Koka University', email: 'y.tsegaye@koka.edu.et', phone: '+251 911 700 003', bio: 'Professor of applied AI researching agentic financial services.', time: '14:00', status: 'pending', initials: 'YT', color: 'bg-brand-500' },
  { id: 'sp4', name: 'Samuel Mekonnen', topic: 'Partner Channel Innovation', eventId: 'ev4', company: 'Walia Telecom', email: 'samuel@walia.et', phone: '+251 911 700 004', bio: 'Head of partnerships driving ecosystem co-innovation.', time: '12:00', status: 'confirmed', initials: 'SM', color: 'bg-ink' },
]

// ----------------------------- EXHIBITORS -----------------------------
export const exhibitorsSeed = [
  { id: 'ex1', company: 'InnovPay', booth: 'A1', size: 'Premium', package: 'Gold Sponsor', paid: 400000, status: 'confirmed', contact: 'Meron Taddesse', email: 'partners@innovpay.et', phone: '+251 911 800 001', website: 'innovpay.et', description: 'Payment gateway booth - live demo of QR payment and instant settlement.', logo: '' },
  { id: 'ex2', company: 'SavaTech', booth: 'B3', size: 'Standard', package: 'Exhibitor', paid: 150000, status: 'confirmed', contact: 'Kaleb Girma', email: 'hello@savatech.co', phone: '+251 912 800 002', website: 'savatech.co', description: 'SaaS tools for SME banking, compliance dashboards and core integrations.', logo: '' },
  { id: 'ex3', company: 'PayCore', booth: 'A4', size: 'Premium', package: 'Silver Sponsor', paid: 250000, status: 'pending', contact: 'Sara Ayalew', email: 'events@paycore.io', phone: '', website: 'paycore.io', description: 'Cross-border payments and FX-as-a-service for fintechs in the Horn of Africa.', logo: '' },
  { id: 'ex4', company: 'Mulu Hub', booth: 'C2', size: 'Standard', package: 'Exhibitor', paid: 0, status: 'registering', contact: 'Nahom Admasu', email: 'team@muluhub.com', phone: '+251 913 800 003', website: 'muluhub.com', description: 'Community innovation hub recruiting developers and partners.', logo: '' },
]

// ----------------------------- SPONSORS -----------------------------
export const sponsorsSeed = [
  { id: 'spn1', name: 'Sheba Bank', package: 'Platinum', amount: 500000, status: 'active', deliverables: ['Main stage branding', 'Logo on tickets'], contact: 'Meseret Haile', email: 'partner@shebabank.et', phone: '+251 911 710 001', date: '2026-07-10' },
  { id: 'spn2', name: 'Ethio Air', package: 'Gold', amount: 300000, status: 'active', deliverables: ['VIP lounge', 'Announcements'], contact: 'Yonas Abebe', email: 'events@ethioair.et', phone: '+251 911 710 002', date: '2026-07-14' },
  { id: 'spn3', name: 'Dashen Brewery', package: 'Silver', amount: 180000, status: 'pending', deliverables: ['Beverage corner'], contact: 'Lidya Girma', email: 'sponsor@dashen.com', phone: '+251 911 710 003', date: '2026-08-01' },
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
  { id: 'exp1', eventId: 'ev1', category: 'Venue Rental', amount: 425000, date: '2026-07-28', vendorId: 'vd1' },
  { id: 'exp2', eventId: 'ev1', category: 'Catering', amount: 210000, date: '2026-08-01', vendorId: 'vd1' },
  { id: 'exp3', eventId: 'ev1', category: 'Technical', amount: 145000, date: '2026-08-02', vendorId: 'vd4' },
  { id: 'exp4', eventId: 'ev3', category: 'Retreat Package', amount: 1240000, date: '2026-07-25', vendorId: 'vd5' },
  { id: 'exp5', eventId: 'ev5', category: 'Catering', amount: 180000, date: '2026-07-10', vendorId: 'vd1' },
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
  { id: 'rg1', eventId: 'ev3', name: 'Amanuel Tesfaye', email: 'amanuel@gmail.com', phone: '+251 911 100 111', type: 'VIP', amount: 12000, paid: true, paymentMethod: 'Telebirr', checkedIn: true, checkedInAt: '8/14/2026, 9:02:00 AM', qr: 'AE-EV3-0001' },
  { id: 'rg2', eventId: 'ev3', name: 'Hannah Solomon', email: 'hannah@gmail.com', phone: '+251 912 200 222', type: 'Standard', amount: 6000, paid: true, paymentMethod: 'Cash', checkedIn: true, checkedInAt: '8/14/2026, 9:15:00 AM', qr: 'AE-EV3-0002' },
  { id: 'rg3', eventId: 'ev3', name: 'Fitsum Alemu', email: 'fitsum@gmail.com', phone: '+251 913 300 333', type: 'Standard', amount: 6000, paid: true, paymentMethod: 'CBE Birr', checkedIn: false, qr: 'AE-EV3-0003' },
  { id: 'rg4', eventId: 'ev3', name: 'Ruth Mekonnen', email: 'ruth@gmail.com', phone: '+251 914 400 444', type: 'VIP', amount: 12000, paid: true, paymentMethod: 'Card', checkedIn: false, qr: 'AE-EV3-0004' },
  { id: 'rg5', eventId: 'ev3', name: 'Dagmawi Hailu', email: 'dagmawi@gmail.com', phone: '+251 915 500 555', type: 'Group', amount: 5400, paid: false, paymentMethod: 'Cash', checkedIn: false, qr: 'AE-EV3-0005' },
  { id: 'rg6', eventId: 'ev3', name: 'Nebiyat Zewdie', email: 'nebiyat@gmail.com', phone: '+251 916 600 666', type: 'Standard', amount: 6000, paid: true, paymentMethod: 'Telebirr', checkedIn: false, qr: 'AE-EV3-0006' },
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
  { id: 'n4', text: 'Payment received - INV-2026-0141', type: 'finance', at: '5 hr ago' },
  { id: 'n5', text: 'Task deadline approaching tomorrow', type: 'task', at: '6 hr ago' },
]

export const campaignsSeed = [
  { id: 'cm1', name: 'Summit Early Bird Blast', channel: 'Email', audience: 8200, sent: 8200, opens: 4210, clicks: 930, status: 'sent', schedule: '2026-07-20', description: 'Discount code push to drive early registrations for the summit.' },
  { id: 'cm2', name: 'Conference Reminder SMS', channel: 'SMS', audience: 1450, sent: 1450, opens: 0, clicks: 0, status: 'sent', schedule: '2026-07-28', description: 'Day-before reminder with venue and check-in info.' },
  { id: 'cm3', name: 'WhatsApp VIP Invite', channel: 'WhatsApp', audience: 320, sent: 280, opens: 210, clicks: 122, status: 'sending', schedule: '2026-08-05', description: 'Personalized VIP invitations with RSVP link.' },
  { id: 'cm4', name: 'Early Bird Coupon Emails', channel: 'Email', audience: 5000, sent: 0, opens: 0, clicks: 0, status: 'draft', schedule: '2026-08-20', description: 'Coupon drop for the remaining Early Bird seats.' },
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
  { id: 'vs4', name: 'Bethel Alemu', company: 'Sof Omer', checkin: '-', scanned: false },
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
  { id: 'ap2', type: 'budget', entityName: 'Zemen Pharma Launch - budget increase', amount: 120000, status: 'pending', submittedBy: 'st3', createdAt: '2026-08-05', note: 'Catering and décor exceed the original estimate.' },
  { id: 'ap3', type: 'contract', entityName: 'CTR-2026-0061 - Walia Telecom Expo', amount: 980000, status: 'pending', submittedBy: 'st2', createdAt: '2026-08-03', note: 'Expo agreement awaiting legal sign-off.' },
  { id: 'ap4', type: 'sponsorship', entityName: 'Dashen Brewery - Silver package', amount: 180000, status: 'revision_requested', submittedBy: 'st7', createdAt: '2026-08-02', note: 'Sponsor asked to swap beverage corner placement.' },
  { id: 'ap5', type: 'vendor_payment', entityName: 'Abyssinia Bank - second tranche', amount: 720000, status: 'approved', submittedBy: 'st4', createdAt: '2026-07-29', reviewNote: 'Matches milestone 2 of the retreat contract.' },
]

// ----------------------------- CALENDAR MEETINGS (offline) -----------------------------
export function calendarEventsSeed() {
  return [
    { id: 'ce1', title: 'Client kickoff - EthFinTech', type: 'meeting', date: todayISO(0), time: '10:00', location: 'Office HQ', notes: '' },
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
  if (n == null) return '-'
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  const s = a.toLocaleString('en-US')
  return `${sign}ETB ${s}`
}

export function fmtCompact(n) {
  if (n == null) return '-'
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