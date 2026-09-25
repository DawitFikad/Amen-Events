import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Workflow, ChevronRight, ChevronLeft, CheckCircle2, Circle, Clock,
  Building2, FileText, Handshake, CalendarDays, KanbanSquare, MapPin,
  Package, Wallet, Ticket, QrCode, BarChart3, Trophy, ArrowRight, History,
  Search, Filter, ExternalLink, Sparkles, AlertCircle, Check, ArrowUpRight,
  TrendingUp, Layers, Compass, UserCheck, Shield, Send,
  Pencil, Plus, CheckSquare, MessageSquare, User, Tag, Calendar, DollarSign,
  Users, AlertTriangle, X, Eye, ChevronDown, ChevronUp, CheckCheck,
  ShieldCheck, Mail, Phone, Briefcase, SlidersHorizontal,
} from 'lucide-react'
import api from '../store/api'
import { useData } from '../store/DataContext'
import { PageHeader, Badge, Toast, Modal, Field, SkeletonPage } from '../components/ui'
import { fmt, todayISO } from '../store/data'

export const CANONICAL_STAGES = [
  { id: 0, name: 'Client Onboarding', key: 'client_created', module: 'crm', route: '/erp/crm', actionLabel: 'Open CRM' },
  { id: 1, name: 'Opportunity Qualification', key: 'opportunity', module: 'crm', route: '/erp/crm', actionLabel: 'CRM Pipeline' },
  { id: 2, name: 'Quotation & Proposal', key: 'quotation', module: 'crm', route: '/erp/crm', actionLabel: 'Quotes' },
  { id: 3, name: 'Contract & Legal SLA', key: 'contract', module: 'crm', route: '/erp/crm', actionLabel: 'Contracts' },
  { id: 4, name: 'Event Scheduling & Brief', key: 'event', module: 'events', route: '/erp/admin/events', actionLabel: 'Events' },
  { id: 5, name: 'Tasks & Team Breakdown', key: 'tasks', module: 'projects', route: '/erp/projects', actionLabel: 'Tasks' },
  { id: 6, name: 'Venue Allocation & Layout', key: 'venue', module: 'venues', route: '/erp/venues', actionLabel: 'Venues' },
  { id: 7, name: 'Production & Gear Allocation', key: 'resources', module: 'resources', route: '/erp/resources', actionLabel: 'Resources' },
  { id: 8, name: 'Budget Approval & Spend Control', key: 'budget', module: 'finance', route: '/erp/finance', actionLabel: 'Finance' },
  { id: 9, name: 'Attendee Registration & Sales', key: 'registration', module: 'ticketing', route: '/erp/ticketing', actionLabel: 'Registrations' },
  { id: 10, name: 'Digital QR Passes Issued', key: 'qr_tickets', module: 'ticketing', route: '/erp/ticketing', actionLabel: 'QR Passes' },
  { id: 11, name: 'On-Site Gate Check-In', key: 'checkin', module: 'checkin', route: '/erp/checkin', actionLabel: 'QR Scanner' },
  { id: 12, name: 'Settlement & Final Invoicing', key: 'reports', module: 'reports', route: '/erp/reports', actionLabel: 'Reports' },
  { id: 13, name: 'Event Evaluation & Archival', key: 'completed', module: 'events', route: '/erp/admin/events', actionLabel: 'Event Close' },
]

const STAGE_ICONS = [
  Building2, TrendingUp, FileText, Handshake, CalendarDays, KanbanSquare,
  MapPin, Package, Wallet, Ticket, QrCode, CheckCircle2, BarChart3, Trophy,
]

// 4 high-level phases
const PIPELINE_PHASES = [
  { id: 'all', label: 'All 14 Stages', range: [0, 13] },
  { id: 'initiation', label: 'Phase 1: Initiation & Sales', range: [0, 3], color: 'border-sky-300 text-sky-800 bg-sky-50' },
  { id: 'planning', label: 'Phase 2: Planning & Setup', range: [4, 7], color: 'border-amber-300 text-amber-800 bg-amber-50' },
  { id: 'execution', label: 'Phase 3: Operations & Gates', range: [8, 11], color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
  { id: 'closeout', label: 'Phase 4: Closeout & Archival', range: [12, 13], color: 'border-purple-300 text-purple-800 bg-purple-50' },
]

const EVENT_STATUSES = [
  { id: 'upcoming', label: 'Upcoming', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'planning', label: 'Planning', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'confirmed', label: 'Confirmed', cls: 'bg-brand-100 text-brand-800 border-brand-200' },
  { id: 'ongoing', label: 'In Progress / Ongoing', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'completed', label: 'Completed', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'on-hold', label: 'On Hold', cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'cancelled', label: 'Cancelled', cls: 'bg-red-100 text-red-800 border-red-200' },
]

// Generate rich, comprehensive details for all 14 steps for ANY selected event
export function buildStepDetails(event, state, customLogs = {}) {
  if (!event) return []
  const client = state.clients?.find((c) => c.id === event.clientId)
  const venue = state.venues?.find((v) => v.id === event.venueId)
  const pm = state.staff?.find((s) => s.id === event.pmId) || state.staff?.[1] || {
    name: 'Dawit Mengistu',
    role: 'Project Manager',
    dept: 'Operations',
    email: 'dawit@amen.et',
    phone: '+251 912 778 301',
    initials: 'DM',
  }
  const director = state.staff?.find((s) => s.id === 'st1') || {
    name: 'Hana Tadesse',
    role: 'Director',
    dept: 'Management',
    email: 'hana@amen.et',
    phone: '+251 911 220 445',
    initials: 'HT',
  }
  const financeLead = state.staff?.find((s) => s.id === 'st4') || {
    name: 'Yonas Girma',
    role: 'Finance Officer',
    dept: 'Finance',
    email: 'yonas@amen.et',
    phone: '+251 914 339 876',
    initials: 'YG',
  }
  const venueLead = state.staff?.find((s) => s.id === 'st5') || {
    name: 'Sara Ahmed',
    role: 'Logistics Lead',
    dept: 'Operations',
    email: 'sara@amen.et',
    phone: '+251 915 662 118',
    initials: 'SA',
  }
  const techLead = state.staff?.find((s) => s.id === 'st8') || {
    name: 'Bereket Tesfaye',
    role: 'Technician Lead',
    dept: 'Technical',
    email: 'bereket@amen.et',
    phone: '+251 918 229 650',
    initials: 'BT',
  }
  const marketingLead = state.staff?.find((s) => s.id === 'st7') || {
    name: 'Liya Kebede',
    role: 'Marketing Lead',
    dept: 'Marketing',
    email: 'liya@amen.et',
    phone: '+251 917 445 772',
    initials: 'LK',
  }
  const operationsLead = state.staff?.find((s) => s.id === 'st3') || {
    name: 'Selam Bekele',
    role: 'Event Coordinator',
    dept: 'Operations',
    email: 'selam@amen.et',
    phone: '+251 913 554 209',
    initials: 'SB',
  }

  const tasks = (state.tasks || []).filter((t) => t.eventId === event.id)
  const allocations = (state.allocations || []).filter((a) => a.eventId === event.id)
  const registrations = (state.registrations || []).filter((r) => r.eventId === event.id)
  const checkedInCount = registrations.filter((r) => r.checkedIn).length
  const qrGeneratedCount = registrations.filter((r) => r.qr || r.ticketCode).length
  const contracts = (state.contracts || []).filter((ct) => ct.eventId === event.id || ct.clientId === event.clientId)
  const invoices = (state.invoices || []).filter((i) => i.eventId === event.id)
  const currentStage = typeof event.stage === 'number' ? event.stage : 0

  const budgetVal = Number(event.budget) || 0
  const spentVal = Number(event.spent) || 0
  const capacityVal = Number(event.capacity) || 1000

  // Standard step definitions with "What Done", "By Who", "To Whom", Deliverables & Timestamps
  const stepConfigs = [
    {
      id: 0,
      phase: 'Phase 1: Initiation',
      phaseId: 'initiation',
      byWho: {
        name: director.name,
        role: director.role,
        dept: director.dept,
        email: director.email,
        phone: director.phone,
        initials: director.initials || 'HT',
      },
      toWhom: {
        name: client?.contactPerson || 'Client Leadership',
        org: client?.company || 'Corporate Client',
        role: client?.role || 'Events Director',
        contact: client?.phone || '+251 911 222 000',
        email: client?.email || 'contact@client.et',
      },
      whatDone: [
        `Registered client organization "${client?.company || 'Corporate Client'}" in the central CRM database with verified business profile.`,
        `Assigned dedicated project lead ${pm.name} (${pm.role}) as single point of contact.`,
        `Conducted preliminary requirements intake call and logged client brand specifications & preferences.`,
      ],
      deliverables: [
        { label: 'Client Profile', value: client?.company || 'Corporate Client', icon: 'building' },
        { label: 'Primary Contact', value: client?.contactPerson || 'Assigned Lead', icon: 'user' },
        { label: 'Industry', value: client?.industry || 'Commercial & Corporate', icon: 'tag' },
        { label: 'Tax ID (TIN)', value: client?.taxId || 'ET-Verified', icon: 'file' },
      ],
      dateCompleted: '2026-05-15',
    },
    {
      id: 1,
      phase: 'Phase 1: Initiation',
      phaseId: 'initiation',
      byWho: {
        name: pm.name,
        role: pm.role,
        dept: pm.dept,
        email: pm.email,
        phone: pm.phone,
        initials: pm.initials || 'DM',
      },
      toWhom: {
        name: client?.contactPerson || 'Events Committee',
        org: client?.company || 'Client Stakeholders',
        role: 'Planning Committee Chair',
        contact: client?.email || 'events@client.et',
        email: client?.email || 'events@client.et',
      },
      whatDone: [
        `Qualified commercial opportunity and confirmed expected headcount of ${capacityVal.toLocaleString()} attendees.`,
        `Drafted preliminary event format: ${event.category || 'Conference'} with main stage, breakout rooms, and networking areas.`,
        `Determined preliminary budget ceiling: ETB ${budgetVal > 0 ? budgetVal.toLocaleString() : '1,500,000'}.`,
        `Completed feasibility audit for dates, venue availability, and technical staging requirements.`,
      ],
      deliverables: [
        { label: 'Format & Type', value: event.category || 'Flagship Conference', icon: 'calendar' },
        { label: 'Target Audience', value: `${capacityVal.toLocaleString()} attendees`, icon: 'users' },
        { label: 'CRM Stage', value: client?.stage?.toUpperCase() || 'QUALIFIED OPPORTUNITY', icon: 'trending' },
      ],
      dateCompleted: '2026-05-28',
    },
    {
      id: 2,
      phase: 'Phase 1: Initiation',
      phaseId: 'initiation',
      byWho: {
        name: financeLead.name,
        role: financeLead.role,
        dept: financeLead.dept,
        email: financeLead.email,
        phone: financeLead.phone,
        initials: financeLead.initials || 'YG',
      },
      toWhom: {
        name: client?.contactPerson || 'Procurement Committee',
        org: client?.company || 'Finance Directorate',
        role: 'Head of Procurement',
        contact: client?.phone || '+251 911 222 000',
        email: client?.email || 'finance@client.et',
      },
      whatDone: [
        `Prepared itemized commercial quotation covering hall rental, AV staging, lighting, ushering, and project management.`,
        `Calculated statutory 15% VAT and structured commercial payment terms: 50% mobilization advance deposit + 50% final settlement.`,
        `Formally delivered formal quotation proposal document Ref #QUO-2026-${event.id.replace('ev', '00')} to client procurement.`,
      ],
      deliverables: [
        { label: 'Quotation Amount', value: `ETB ${(budgetVal || 1850000).toLocaleString()}`, icon: 'wallet' },
        { label: 'Payment Terms', value: '50% Advance / 50% Post-Event', icon: 'file' },
        { label: 'Quotation Ref', value: `QUO-2026-${event.id.replace('ev', '00')}`, icon: 'tag' },
      ],
      dateCompleted: '2026-06-05',
    },
    {
      id: 3,
      phase: 'Phase 1: Initiation',
      phaseId: 'initiation',
      byWho: {
        name: director.name,
        role: director.role,
        dept: director.dept,
        email: director.email,
        phone: director.phone,
        initials: director.initials || 'HT',
      },
      toWhom: {
        name: client?.contactPerson || 'Authorized Signatory',
        org: client?.company || 'Client Legal Directorate',
        role: 'Executive Director / Legal Counsel',
        contact: client?.email || 'legal@client.et',
        email: client?.email || 'legal@client.et',
      },
      whatDone: [
        `Drafted binding master event service agreement and production SLA with clear delivery milestones.`,
        `Reviewed and ratified indemnity clauses, cancellation parameters, insurance coverage, and force majeure terms.`,
        `Obtained formal dual execution signatures and registered legal contract in corporate compliance vault.`,
      ],
      deliverables: [
        { label: 'Contract Ref', value: contracts[0]?.ref || `CTR-2026-${event.id.replace('ev', '00')}`, icon: 'file' },
        { label: 'Contract Value', value: `ETB ${(contracts[0]?.value || budgetVal || 1850000).toLocaleString()}`, icon: 'wallet' },
        { label: 'Legal Status', value: 'Legally Executed & Signed', icon: 'shield' },
      ],
      dateCompleted: '2026-06-15',
    },
    {
      id: 4,
      phase: 'Phase 2: Planning',
      phaseId: 'planning',
      byWho: {
        name: pm.name,
        role: pm.role,
        dept: pm.dept,
        email: pm.email,
        phone: pm.phone,
        initials: pm.initials || 'DM',
      },
      toWhom: {
        name: 'Operational Core Committee',
        org: 'Amen Events & ' + (client?.company || 'Client Planning Team'),
        role: 'Joint Event Steering Committee',
        contact: pm.email,
        email: pm.email,
      },
      whatDone: [
        `Locked master calendar dates: ${event.date || '2026-08-18'} (${event.time || '09:00'} - ${event.endTime || '18:00'}).`,
        `Structured multi-track schedule outline: Opening Keynote, Panel Discussions, Exhibitor Hours, and VIP Networking Gala.`,
        `Published master event brief in system and distributed preliminary run-of-show to technical leads.`,
      ],
      deliverables: [
        { label: 'Master Date', value: `${event.date || 'TBD'} · ${event.time || '09:00'}`, icon: 'calendar' },
        { label: 'Assigned PM', value: pm.name, icon: 'user' },
        { label: 'Run of Show', value: 'Locked & Synchronized', icon: 'clock' },
      ],
      dateCompleted: '2026-06-25',
    },
    {
      id: 5,
      phase: 'Phase 2: Planning',
      phaseId: 'planning',
      byWho: {
        name: pm.name,
        role: pm.role,
        dept: pm.dept,
        email: pm.email,
        phone: pm.phone,
        initials: pm.initials || 'DM',
      },
      toWhom: {
        name: 'Amen Operations Team Leads',
        org: 'Logistics, Technical, Guest Relations & Marketing Divisions',
        role: 'Lead Task Assignees',
        contact: 'team@amen.et',
        email: 'team@amen.et',
      },
      whatDone: [
        `Built comprehensive Work Breakdown Structure (WBS) with ${tasks.length || 6} core action items.`,
        `Dispatched specific deliverables to logistics lead ${venueLead.name}, coordinator ${operationsLead.name}, and marketing lead ${marketingLead.name}.`,
        `Activated real-time task progress tracking and deadline notifications in Projects management module.`,
      ],
      deliverables: [
        { label: 'Total Tasks', value: `${tasks.length || 6} action items assigned`, icon: 'check' },
        { label: 'Completed Tasks', value: `${tasks.filter((t) => t.status === 'done').length} verified`, icon: 'check' },
        { label: 'Workforce', value: '4 Functional Units Active', icon: 'users' },
      ],
      dateCompleted: '2026-07-05',
    },
    {
      id: 6,
      phase: 'Phase 2: Planning',
      phaseId: 'planning',
      byWho: {
        name: venueLead.name,
        role: venueLead.role,
        dept: venueLead.dept,
        email: venueLead.email,
        phone: venueLead.phone,
        initials: venueLead.initials || 'SA',
      },
      toWhom: {
        name: (venue?.name || 'Millennium Hall') + ' Management',
        org: venue?.name || 'Millennium Hall Facility Administration',
        role: 'Facility Booking & Safety Director',
        contact: venue?.phone || '+251 911 888 999',
        email: venue?.email || 'events@millenniumhall.et',
      },
      whatDone: [
        `Secured official hall reservation agreement for "${venue?.name || 'Millennium Hall'}" (${venue?.city || 'Addis Ababa'}).`,
        `Completed on-site technical inspection: acoustics, ceiling load points for lighting trusses, and heavy load-in bays.`,
        `Finalized CAD floor plan layout: Main stage (18m x 8m), ${capacityVal.toLocaleString()} seats, VIP lounge, and 24 exhibition booths.`,
        `Submitted emergency evacuation plan and crowd safety documentation to Addis Fire & Emergency Prevention Authority.`,
      ],
      deliverables: [
        { label: 'Venue Allocated', value: venue?.name || 'Millennium Hall', icon: 'map' },
        { label: 'Location', value: venue?.address || venue?.city || 'Addis Ababa', icon: 'map' },
        { label: 'Hall Capacity', value: `${(venue?.capacity || capacityVal).toLocaleString()} pax`, icon: 'users' },
        { label: 'Floor Plan', value: 'Approved & Stamped', icon: 'file' },
      ],
      dateCompleted: '2026-07-15',
    },
    {
      id: 7,
      phase: 'Phase 2: Planning',
      phaseId: 'planning',
      byWho: {
        name: techLead.name,
        role: techLead.role,
        dept: techLead.dept,
        email: techLead.email,
        phone: techLead.phone,
        initials: techLead.initials || 'BT',
      },
      toWhom: {
        name: 'Technical AV & Staging Crew',
        org: 'Amen Equipment Depot & Sound Engineering Crew',
        role: 'Stage Production Lead',
        contact: techLead.phone,
        email: techLead.email,
      },
      whatDone: [
        `Reserved P2.6 ultra-high-definition LED video wall (12m x 4m) with multi-source video switching matrix.`,
        `Allocated 16-channel line-array acoustic sound system, 12 Shure digital wireless microphones, and active monitoring rigs.`,
        `Secured dual 250kVA silenced diesel backup generators with automatic transfer switches (ATS) for zero-outage guarantee.`,
        `Scheduled crew load-in: Day minus 1 at 06:00 AM for stage rigging and acoustic line checks.`,
      ],
      deliverables: [
        { label: 'Allocated Gear', value: `${allocations.length || 8} asset types deployed`, icon: 'package' },
        { label: 'Visual Display', value: '48m² P2.6 HD LED Wall', icon: 'tag' },
        { label: 'Power Backup', value: 'Dual 250kVA ATS Redundant', icon: 'shield' },
      ],
      dateCompleted: '2026-07-25',
    },
    {
      id: 8,
      phase: 'Phase 3: Operations',
      phaseId: 'execution',
      byWho: {
        name: financeLead.name,
        role: financeLead.role,
        dept: financeLead.dept,
        email: financeLead.email,
        phone: financeLead.phone,
        initials: financeLead.initials || 'YG',
      },
      toWhom: {
        name: director.name + ' & Client Finance Lead',
        org: 'Executive Financial Committee',
        role: 'Chief Financial Officer',
        contact: financeLead.email,
        email: financeLead.email,
      },
      whatDone: [
        `Ratified master event operating budget cap: ETB ${(budgetVal || 1850000).toLocaleString()}.`,
        `Audited and disbursed 50% mobilization payments to venue, staging sub-contractors, and security personnel.`,
        `Configured real-time expense monitoring ledger in Amen Finance module with 10% contingency allocation.`,
      ],
      deliverables: [
        { label: 'Approved Budget', value: `ETB ${(budgetVal || 1850000).toLocaleString()}`, icon: 'wallet' },
        { label: 'Current Spend', value: `ETB ${(spentVal || 820000).toLocaleString()}`, icon: 'wallet' },
        { label: 'Burn Rate', value: `${Math.round(((spentVal || 820000) / (budgetVal || 1850000 || 1)) * 100)}% utilized`, icon: 'trending' },
      ],
      dateCompleted: '2026-08-01',
    },
    {
      id: 9,
      phase: 'Phase 3: Operations',
      phaseId: 'execution',
      byWho: {
        name: marketingLead.name,
        role: marketingLead.role,
        dept: marketingLead.dept,
        email: marketingLead.email,
        phone: marketingLead.phone,
        initials: marketingLead.initials || 'LK',
      },
      toWhom: {
        name: 'Public Attendees & Corporate Delegates',
        org: 'Target Attendee Registry (' + (client?.company || 'Industry') + ')',
        role: 'Conference Attendees & VIP Guests',
        contact: 'tickets@amen.et',
        email: 'tickets@amen.et',
      },
      whatDone: [
        `Published branded registration and ticketing portal on the public attendee platform.`,
        `Configured multi-tier ticket passes: VIP All-Access, Standard Delegate, and Exhibitor Representative pass.`,
        `Integrated payment gateways (Telebirr, CBE Birr, Debit/Credit Card) with instant digital receipt generation.`,
        `Achieved registration milestone: ${registrations.length || 340} verified registrations recorded in database.`,
      ],
      deliverables: [
        { label: 'Confirmed Guests', value: `${registrations.length || 340} registered`, icon: 'users' },
        { label: 'Gateways', value: 'Telebirr, CBE Birr, Card Active', icon: 'tag' },
        { label: 'Portal Status', value: 'Live & Accepting Guests', icon: 'check' },
      ],
      dateCompleted: '2026-08-10',
    },
    {
      id: 10,
      phase: 'Phase 3: Operations',
      phaseId: 'execution',
      byWho: {
        name: 'Amen Security & Automated Ticketing Engine',
        role: 'Automated Cryptographic Key Engine',
        dept: 'IT & Security Systems',
        email: 'security@amen.et',
        phone: '+251 911 000 111',
        initials: 'IT',
      },
      toWhom: {
        name: 'All Confirmed Attendees',
        org: `${registrations.length || 340} Verified Ticket Holders`,
        role: 'Badge Holders & VIP Guests',
        contact: 'Email & SMS Gateways',
        email: 'notifications@amen.et',
      },
      whatDone: [
        `Generated cryptographically signed HMAC SHA-256 tamper-proof QR access codes for each registered attendee.`,
        `Dispatched personalized digital entry passes via instant SMS and confirmation PDF tickets via email.`,
        `Pre-cached digital decryption keys on physical entrance scanners to guarantee sub-second gate validation with offline fallback.`,
      ],
      deliverables: [
        { label: 'QR Passes Issued', value: `${registrations.length || 340} passes dispatched`, icon: 'qr' },
        { label: 'Encryption', value: 'HMAC SHA-256 Verified', icon: 'shield' },
        { label: 'Pass Format', value: 'Mobile Wallet + PDF + SMS', icon: 'file' },
      ],
      dateCompleted: '2026-08-14',
    },
    {
      id: 11,
      phase: 'Phase 3: Operations',
      phaseId: 'execution',
      byWho: {
        name: operationsLead.name,
        role: operationsLead.role,
        dept: operationsLead.dept,
        email: operationsLead.email,
        phone: operationsLead.phone,
        initials: operationsLead.initials || 'SB',
      },
      toWhom: {
        name: 'Arriving Attendees & Delegates at Gates',
        org: 'Access Checkpoints: Gates A, B, C & VIP Red Carpet',
        role: 'On-site Guests & Media Crews',
        contact: operationsLead.phone,
        email: operationsLead.email,
      },
      whatDone: [
        `Deployed 6 high-speed optical barcode scanners and 4 laser handheld terminals across entrance lanes.`,
        `Trained 12 student ushers on verification procedures, VIP fast-tracking, and instant on-demand badge thermal printing.`,
        `Maintained live synchronized gate clearance dashboard: ${checkedInCount || 215} attendees scanned into auditorium with 0 duplicate scans.`,
      ],
      deliverables: [
        { label: 'Verified Arrivals', value: `${checkedInCount || 215} attendees arrived`, icon: 'check' },
        { label: 'Turnout Rate', value: `${registrations.length ? Math.round((checkedInCount / registrations.length) * 100) : 68}% of registered capacity`, icon: 'users' },
        { label: 'Gate Status', value: 'Gates A, B & VIP Lanes Active', icon: 'shield' },
      ],
      dateCompleted: '2026-08-18',
    },
    {
      id: 12,
      phase: 'Phase 4: Closeout',
      phaseId: 'closeout',
      byWho: {
        name: financeLead.name,
        role: financeLead.role,
        dept: financeLead.dept,
        email: financeLead.email,
        phone: financeLead.phone,
        initials: financeLead.initials || 'YG',
      },
      toWhom: {
        name: client?.contactPerson || 'Client Accounts Payable',
        org: client?.company || 'Client Finance Department',
        role: 'Director of Accounts Payable',
        contact: client?.phone || '+251 911 222 000',
        email: client?.email || 'ap@client.et',
      },
      whatDone: [
        `Reconciled all actual expenses, vendor invoices, extra catering tabs, and technical overtime disbursements.`,
        `Generated final consolidated VAT settlement tax invoice Ref #INV-2026-${event.id.replace('ev', '00')} for remaining 50% balance.`,
        `Compiled comprehensive financial summary statement detailing budget variance and total expenditure.`,
      ],
      deliverables: [
        { label: 'Final Invoice Ref', value: invoices[0]?.ref || `INV-2026-${event.id.replace('ev', '00')}`, icon: 'file' },
        { label: 'Balance Due', value: `ETB ${Math.round((budgetVal || 1850000) * 0.5).toLocaleString()}`, icon: 'wallet' },
        { label: 'Settlement Status', value: invoices[0]?.status === 'paid' ? 'Paid & Reconciled' : 'Dispatched to Client', icon: 'check' },
      ],
      dateCompleted: '2026-08-25',
    },
    {
      id: 13,
      phase: 'Phase 4: Closeout',
      phaseId: 'closeout',
      byWho: {
        name: director.name + ' & ' + pm.name,
        role: 'Executive Director & Lead PM',
        dept: 'Management & Operations',
        email: director.email,
        phone: director.phone,
        initials: 'HT',
      },
      toWhom: {
        name: client?.contactPerson || 'Client Executive Leadership',
        org: client?.company || 'Corporate Client',
        role: 'Chief Executive Officer',
        contact: client?.email || 'ceo@client.et',
        email: client?.email || 'ceo@client.et',
      },
      whatDone: [
        `Conducted formal post-event debrief meeting with client leadership to review event metrics, speaker ratings, and feedback.`,
        `Achieved 96.4% attendee satisfaction score from digital exit survey with outstanding reviews for staging and acoustics.`,
        `Officially archived event master folder: high-resolution photos, 4K session recordings, attendance logs, and contracts into database vault.`,
      ],
      deliverables: [
        { label: 'Lifecycle Status', value: 'Fully Completed & Archived', icon: 'trophy' },
        { label: 'Satisfaction Score', value: '96.4% Positive Rating', icon: 'check' },
        { label: 'Event Master Vault', value: 'Archived in Cloud Storage', icon: 'shield' },
      ],
      dateCompleted: '2026-09-02',
    },
  ]

  // Enrich each step with dynamic state, completion status, and custom logged entries
  return stepConfigs.map((cfg) => {
    const isCompleted = cfg.id < currentStage || (cfg.id === 13 && (currentStage === 13 || event.status === 'completed'))
    const isCurrent = cfg.id === currentStage && !(cfg.id === 13 && event.status === 'completed')
    const isUpcoming = cfg.id > currentStage

    // Combine any user-logged custom step notes
    const stepCustomLogs = customLogs[event.id]?.[cfg.id] || []

    return {
      ...cfg,
      status: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming',
      isCompleted,
      isCurrent,
      isUpcoming,
      route: CANONICAL_STAGES[cfg.id].route,
      actionLabel: CANONICAL_STAGES[cfg.id].actionLabel,
      stepNumber: cfg.id + 1,
      title: CANONICAL_STAGES[cfg.id].name,
      customLogs: stepCustomLogs,
    }
  })
}

export default function WorkflowPage() {
  const { rbac, backendOnline, state, updateEvent, addTask, updateTask, addNotification, logActivity, setDemoFlag, loading } = useData()
  if (loading) return <SkeletonPage />

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(searchParams.get('eventId') || null)
  const [view, setView] = useState('pipeline') // 'pipeline' | 'matrix' | 'tasks' | 'history'
  const [phaseFilter, setPhaseFilter] = useState('all') // 'all' | 'initiation' | 'planning' | 'execution' | 'closeout'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'current' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('')
  const [stepSearch, setStepSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  // Expanded step cards state (only active step open by default; drops down when clicked)
  const [expandedSteps, setExpandedSteps] = useState(() => new Set([0]))

  // Custom step actions / notes stored per event & step
  const [customLogs, setCustomLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('amen_workflow_custom_logs') || '{}')
    } catch {
      return {}
    }
  })

  // Stage Transition Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTargetStage, setModalTargetStage] = useState(null)
  const [modalActionType, setModalActionType] = useState('advance') // 'advance' | 'revert' | 'jump'
  const [modalNote, setModalNote] = useState('')

  // Quick Edit Event Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Dispatch Action / Task Modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due: todayISO(),
    assigneeId: '',
    stageId: 5,
    notify: true,
  })

  // Add Step Detail / Log Note Modal state
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logForm, setLogForm] = useState({
    stepId: 0,
    byWho: '',
    toWhom: '',
    whatDone: '',
    deliverable: '',
    date: todayISO(),
  })

  const show = (m, t = 'success') => {
    setToast({ message: m, type: t })
    setTimeout(() => setToast(null), 3200)
  }

  // Derive enriched events list directly from live Supabase / local data store
  const storeEvents = useMemo(() => {
    return (state.events || []).map((e) => {
      const explicitStage = typeof e.stage === 'number' && e.stage >= 0 && e.stage <= 13 ? e.stage : null
      const computedStage = explicitStage !== null ? explicitStage : Math.max(0, Math.min(13, Math.round(((e.progress ?? 0) / 100) * 13)))
      const client = state.clients?.find((c) => c.id === e.clientId)
      const venue = state.venues?.find((v) => v.id === e.venueId)
      const pm = state.staff?.find((s) => s.id === e.pmId)

      return {
        id: e.id,
        name: e.name || 'Untitled Event',
        category: e.category || 'Conference',
        date: e.date || 'TBD',
        time: e.time || '09:00',
        endDate: e.endDate || '',
        endTime: e.endTime || '',
        status: e.status || 'upcoming',
        budget: Number(e.budget) || 0,
        spent: Number(e.spent) || 0,
        capacity: Number(e.capacity) || 0,
        clientId: e.clientId,
        venueId: e.venueId,
        pmId: e.pmId,
        description: e.description || '',
        contactName: e.contactName || '',
        contactPhone: e.contactPhone || '',
        client: { company: client?.company || 'No client assigned' },
        venue: { name: venue?.name || 'Unassigned venue' },
        pm: { name: pm?.name || 'Unassigned Lead' },
        stage: computedStage,
        stageName: CANONICAL_STAGES[computedStage]?.name || `Stage ${computedStage + 1}`,
        progress: e.progress ?? Math.round(((computedStage + 1) / 14) * 100),
      }
    })
  }, [state.events, state.clients, state.venues, state.staff, state.tasks, state.allocations, state.registrations, state.contracts, state.invoices, state.expenses])

  // Filtered event list for sidebar
  const filteredEvents = useMemo(() => {
    return storeEvents.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.client?.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (phaseFilter === 'all') return true
      const phase = PIPELINE_PHASES.find((p) => p.id === phaseFilter)
      if (phase) {
        return e.stage >= phase.range[0] && e.stage <= phase.range[1]
      }
      return true
    })
  }, [storeEvents, searchQuery, phaseFilter])

  // Selected event
  const selected = useMemo(() => {
    if (selectedId) {
      const found = storeEvents.find((e) => e.id === selectedId)
      if (found) return found
    }
    return storeEvents[0] || null
  }, [storeEvents, selectedId])

  // Synchronize selection with URL search param
  const selectEvent = (evt) => {
    setSelectedId(evt.id)
    setSearchParams({ eventId: evt.id }, { replace: true })
  }

  // Active tasks for the selected event
  const eventTasks = useMemo(() => {
    if (!selected?.id) return []
    return (state.tasks || []).filter((t) => t.eventId === selected.id)
  }, [state.tasks, selected?.id])

  // Real-time event activities from Supabase ActivityLog and workflow logs
  const eventActivities = useMemo(() => {
    if (!selected) return []
    const evName = (selected.name || '').toLowerCase()
    return (state.activities || []).filter((a) => {
      const txt = (a.text || '').toLowerCase()
      return txt.includes(evName) || txt.includes(selected.id.toLowerCase()) || a.type === 'workflow'
    }).slice(0, 30)
  }, [state.activities, selected])

  // Full detailed steps for selected event
  const stepDetails = useMemo(() => {
    if (!selected) return []
    return buildStepDetails(selected, state, customLogs)
  }, [selected, state, customLogs])

  // Filtered steps according to search and status filter
  const visibleSteps = useMemo(() => {
    return stepDetails.filter((step) => {
      if (statusFilter === 'completed' && !step.isCompleted) return false
      if (statusFilter === 'current' && !step.isCurrent) return false
      if (statusFilter === 'upcoming' && !step.isUpcoming) return false

      if (stepSearch.trim()) {
        const q = stepSearch.toLowerCase()
        const matchTitle = step.title.toLowerCase().includes(q)
        const matchBy = step.byWho.name.toLowerCase().includes(q) || step.byWho.role.toLowerCase().includes(q)
        const matchTo = step.toWhom.name.toLowerCase().includes(q) || step.toWhom.org.toLowerCase().includes(q)
        const matchDone = step.whatDone.some((w) => w.toLowerCase().includes(q))
        const matchDeliv = step.deliverables.some((d) => d.value.toLowerCase().includes(q) || d.label.toLowerCase().includes(q))
        return matchTitle || matchBy || matchTo || matchDone || matchDeliv
      }

      return true
    })
  }, [stepDetails, statusFilter, stepSearch])

  // Step expansion helpers
  const toggleStep = (stepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const expandAll = () => setExpandedSteps(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]))
  const collapseAll = () => setExpandedSteps(new Set())

  // Trigger modal for stage transition
  const initiateTransition = (targetStage, actionType = 'advance') => {
    setModalTargetStage(targetStage)
    setModalActionType(actionType)
    setModalNote('')
    setModalOpen(true)
  }

  // Execute stage update with full Supabase PostgreSQL persistence
  const commitStageTransition = async () => {
    if (!selected || modalTargetStage === null) return
    setBusy(true)

    const nextStageId = Math.max(0, Math.min(13, modalTargetStage))
    const nextProgress = Math.round(((nextStageId + 1) / 14) * 100)
    const nextStatus = nextStageId === 13 ? 'completed' : selected.status === 'completed' ? 'ongoing' : selected.status
    const stageName = CANONICAL_STAGES[nextStageId].name

    try {
      await updateEvent(selected.id, {
        stage: nextStageId,
        progress: nextProgress,
        status: nextStatus,
      })

      if (backendOnline && api?.workflow) {
        if (modalActionType === 'advance') {
          await api.workflow.advance(selected.id, modalNote)
        } else if (modalActionType === 'revert') {
          await api.workflow.revert(selected.id, modalNote)
        } else {
          await api.workflow.setStage(selected.id, nextStageId, modalNote)
        }
      }

      const logText = modalNote
        ? `Workflow: ${selected.name} advanced to Stage ${nextStageId + 1} (${stageName}) by ${state.currentUser?.name || 'Lead'} — "${modalNote}"`
        : `Workflow: ${selected.name} set to Stage ${nextStageId + 1} (${stageName})`
      logActivity(logText, 'workflow')

      if (selected.pmId) {
        addNotification({
          text: `Workflow updated: "${selected.name}" is now at Stage ${nextStageId + 1}: ${stageName}`,
          type: 'workflow',
          userId: selected.pmId,
        })
      }

      show(`Event successfully updated to Stage ${nextStageId + 1}: ${stageName}`)
      setModalOpen(false)
    } catch (err) {
      console.error('Stage transition error:', err)
      show('Failed to update stage in database', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Quick next / prev helpers
  const handleQuickAdvance = () => {
    if (!selected || selected.stage >= 13) return
    initiateTransition(selected.stage + 1, 'advance')
  }

  const handleQuickRevert = () => {
    if (!selected || selected.stage <= 0) return
    initiateTransition(selected.stage - 1, 'revert')
  }

  // Live Event Status update
  const handleStatusChange = async (newStatus) => {
    if (!selected || selected.status === newStatus) return
    setBusy(true)
    try {
      const updates = { status: newStatus }
      if (newStatus === 'completed') {
        updates.stage = 13
        updates.progress = 100
      }
      await updateEvent(selected.id, updates)
      logActivity(`Event "${selected.name}" status updated to ${newStatus}`, 'event')

      if (selected.pmId) {
        addNotification({
          text: `Status for "${selected.name}" changed to ${newStatus.toUpperCase()}`,
          type: 'event',
          userId: selected.pmId,
        })
      }

      show(`Status updated to "${newStatus}"`)
    } catch (err) {
      show('Failed to update event status', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Open Quick Edit Modal
  const openEditModal = () => {
    if (!selected) return
    setEditForm({
      name: selected.name,
      category: selected.category,
      status: selected.status,
      date: selected.date,
      time: selected.time,
      endDate: selected.endDate,
      endTime: selected.endTime,
      venueId: selected.venueId || '',
      clientId: selected.clientId || '',
      pmId: selected.pmId || '',
      budget: selected.budget || 0,
      capacity: selected.capacity || 0,
      description: selected.description || '',
      contactName: selected.contactName || '',
      contactPhone: selected.contactPhone || '',
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selected || !editForm.name?.trim()) {
      show('Please fill out this field: Event name', 'warn')
      return
    }
    setBusy(true)
    try {
      await updateEvent(selected.id, {
        ...editForm,
        budget: Number(editForm.budget) || 0,
        capacity: Number(editForm.capacity) || 0,
      })
      logActivity(`Event details updated for "${editForm.name}"`, 'event')
      show('Event details saved to database')
      setEditModalOpen(false)
    } catch (err) {
      show('Failed to save changes to database', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Open Action Dispatch Modal
  const openActionModal = () => {
    if (!selected) return
    setActionForm({
      title: '',
      description: '',
      priority: 'medium',
      due: todayISO(),
      assigneeId: selected.pmId || state.staff[0]?.id || '',
      stageId: selected.stage || 5,
      notify: true,
    })
    setActionModalOpen(true)
  }

  const handleDispatchAction = async () => {
    if (!actionForm.title?.trim()) {
      show('Please fill out this field: Action title', 'warn')
      return
    }
    if (!actionForm.assigneeId) {
      show('Please select a person to assign this action to', 'warn')
      return
    }
    setBusy(true)
    try {
      const assignedPerson = state.staff?.find((s) => s.id === actionForm.assigneeId)
      const personName = assignedPerson?.name || 'Team Member'

      const taskPayload = {
        title: actionForm.title.trim(),
        description: actionForm.description.trim() || `Workflow Action for ${selected.name} (Stage ${actionForm.stageId + 1}: ${CANONICAL_STAGES[actionForm.stageId]?.name})`,
        eventId: selected.id,
        assigneeId: actionForm.assigneeId,
        priority: actionForm.priority,
        status: 'todo',
        due: actionForm.due || todayISO(),
        progress: 0,
      }
      await addTask(taskPayload)

      if (actionForm.notify) {
        addNotification({
          text: `Action Assigned by Workflow: "${actionForm.title}" for event "${selected.name}". Due: ${actionForm.due}`,
          type: 'task',
          userId: actionForm.assigneeId,
        })
      }

      logActivity(`Workflow Action dispatched to ${personName}: "${actionForm.title}" (${selected.name})`, 'task')

      show(`Action dispatched to ${personName}!`)
      setActionModalOpen(false)
      setView('tasks')
    } catch (err) {
      show('Failed to dispatch action item', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Open Log Custom Step Action modal
  const openLogModal = (stepId = 0) => {
    const targetStep = stepDetails[stepId] || stepDetails[selected?.stage || 0]
    setLogForm({
      stepId: targetStep ? targetStep.id : 0,
      byWho: targetStep ? targetStep.byWho.name : (state.currentUser?.name || 'Lead Manager'),
      toWhom: targetStep ? (targetStep.toWhom.org + ' · ' + targetStep.toWhom.name) : (selected?.client?.company || 'Client Stakeholders'),
      whatDone: '',
      deliverable: '',
      date: todayISO(),
    })
    setLogModalOpen(true)
  }

  const handleSaveStepLog = () => {
    if (!logForm.whatDone?.trim()) {
      show('Please describe what was done in this step', 'warn')
      return
    }

    const eventId = selected.id
    const stepId = logForm.stepId
    const newEntry = {
      id: 'step_log_' + Date.now(),
      byWho: logForm.byWho.trim() || 'Lead Officer',
      toWhom: logForm.toWhom.trim() || 'Stakeholders',
      whatDone: logForm.whatDone.trim(),
      deliverable: logForm.deliverable.trim(),
      date: logForm.date || todayISO(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updated = {
      ...customLogs,
      [eventId]: {
        ...(customLogs[eventId] || {}),
        [stepId]: [...((customLogs[eventId]?.[stepId]) || []), newEntry],
      },
    }

    setCustomLogs(updated)
    try {
      localStorage.setItem('amen_workflow_custom_logs', JSON.stringify(updated))
    } catch (e) {
      console.warn('LocalStorage save failed:', e)
    }

    logActivity(`Step ${stepId + 1} (${CANONICAL_STAGES[stepId]?.name}) Update: ${newEntry.whatDone} (By: ${newEntry.byWho} → To: ${newEntry.toWhom})`, 'workflow')
    show(`Recorded update for Step ${stepId + 1}: ${CANONICAL_STAGES[stepId]?.name}!`)
    setLogModalOpen(false)
  }

  // Toggle Task Completion
  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    const nextProgress = nextStatus === 'done' ? 100 : 0
    await updateTask(task.id, { status: nextStatus, progress: nextProgress })
    logActivity(`Task "${task.title}" marked as ${nextStatus}`, 'task')
    show(`Task marked as ${nextStatus}`)
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = storeEvents.length
    const completed = storeEvents.filter((e) => e.stage === 13 || e.status === 'completed').length
    const inProgress = total - completed
    const avgProgress = total > 0 ? Math.round(storeEvents.reduce((acc, e) => acc + (e.progress || 0), 0) / total) : 0
    return { total, completed, inProgress, avgProgress }
  }, [storeEvents])

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Event Workflow & Governance"
          subtitle="Step-by-step lifecycle tracking with verified accountability (By Who), recipient counterpart (To Whom), and concrete deliverables across all 14 stages."
          icon={Workflow}
        />
        <div className="flex flex-wrap items-center gap-2">
          {selected && (
            <>
              <button
                onClick={() => openLogModal(selected.stage)}
                className="btn-outline flex items-center gap-1.5 text-xs !py-2 px-3 hover:bg-slate-50"
              >
                <Plus size={13} /> Log Step Update
              </button>
              <button
                onClick={openActionModal}
                className="btn-primary flex items-center gap-1.5 text-xs !py-2 px-3.5 shadow-sm"
              >
                <Send size={13} /> Dispatch Task
              </button>
              <button
                onClick={openEditModal}
                className="btn-outline flex items-center gap-1.5 text-xs !py-2 px-3 hover:bg-slate-50"
              >
                <Pencil size={13} /> Edit Event
              </button>
            </>
          )}
          <Link to="/erp/admin/events" className="btn-outline flex items-center gap-1.5 text-xs !py-2 hover:bg-slate-50">
            <CalendarDays size={13} /> Events Directory
          </Link>
        </div>
      </div>

      {/* KPI Overview Strip - Clean Enterprise Metrics */}
      <div className="card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-0 overflow-hidden shadow-xs border border-slate-200">
        <div className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Events In Pipeline</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-400">Total tracked lifecycle events</p>
        </div>

        <div className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active In-Flight</p>
          <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
          <p className="text-xs text-slate-400">Currently in planning or operations</p>
        </div>

        <div className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed & Closed</p>
          <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
          <p className="text-xs text-slate-400">All 14 stages finalized</p>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Progress</p>
            <span className="text-xs font-semibold text-slate-700">{stats.avgProgress}%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.avgProgress}%</p>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-1">
            <div className="h-full bg-brand-700 transition-all duration-300" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Event Navigator + Pipeline Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Left: Event Selection Drawer */}
        <div className="space-y-3">
          <div className="card flex flex-col p-3.5 space-y-3 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Select Event ({filteredEvents.length})
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Live Data
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event or client…"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {/* Phase Filters */}
            <div className="flex flex-wrap gap-1">
              {PIPELINE_PHASES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhaseFilter(p.id)}
                  className={`rounded px-2 py-1 text-[10px] font-medium transition ${phaseFilter === p.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="max-h-[640px] overflow-y-auto space-y-1.5 pr-0.5">
              {filteredEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No matching events found.
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selected?.id === evt.id
                  const isDone = evt.stage === 13 || evt.status === 'completed'
                  const StageIcon = STAGE_ICONS[evt.stage] || Circle

                  return (
                    <button
                      key={evt.id}
                      onClick={() => selectEvent(evt)}
                      className={`group flex w-full flex-col rounded-lg border p-3 text-left transition ${isSelected
                          ? 'border-brand-600 bg-brand-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-900 group-hover:text-brand-700">
                          {evt.name}
                        </span>
                        <span className={`text-[10px] font-semibold ${isDone ? 'text-slate-600' : 'text-slate-900'}`}>
                          {evt.progress}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">{evt.client?.company || 'No client'}</span>
                        <span>{evt.date || 'TBD'}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${isDone ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            <StageIcon size={10} />
                          </span>
                          <span className="truncate text-[10px] font-medium text-slate-700">
                            Step {evt.stage + 1}: {evt.stageName}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-medium text-slate-400">
                          {evt.status}
                        </span>
                      </div>

                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-300 ${isDone ? 'bg-slate-700' : 'bg-brand-600'
                            }`}
                          style={{ width: `${evt.progress}%` }}
                        />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Active Event Pipeline Detail Workspace */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Event Header Banner Card - Clean & Minimal */}
              <div className="card border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selected.name}</h2>
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        Step {selected.stage + 1} of 14: {CANONICAL_STAGES[selected.stage]?.name}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize border ${selected.status === 'completed' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                          selected.status === 'ongoing' ? 'bg-brand-50 text-brand-800 border-brand-200' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                        {selected.status}
                      </span>
                    </div>

                    {/* Quick Status Control Dropdown */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500">Status:</span>
                      <select
                        value={selected.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={busy}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-2xs focus:border-slate-500 focus:outline-none"
                      >
                        {EVENT_STATUSES.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={openEditModal}
                        className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
                      >
                        <Pencil size={12} /> Edit
                      </button>

                      <button
                        onClick={() => openLogModal(selected.stage)}
                        className="text-xs text-brand-700 hover:text-brand-900 px-2 py-1 rounded hover:bg-brand-50 font-medium transition flex items-center gap-1"
                      >
                        <Plus size={12} /> Log Step Update
                      </button>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        <span className="text-slate-400">Client:</span>
                        <span className="font-medium text-slate-800">{selected.client?.company || 'No client assigned'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="text-slate-400">Venue:</span>
                        <span className="font-medium text-slate-800">{selected.venue?.name || 'Unassigned'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-slate-400" />
                        <span className="text-slate-400">Date:</span>
                        <span className="font-medium text-slate-800">{selected.date || 'TBD'} ({selected.time || '09:00'})</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck size={13} className="text-slate-400" />
                        <span className="text-slate-400">Lead:</span>
                        <span className="font-medium text-slate-800">{selected.pm?.name || 'Dawit Mengistu'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet size={13} className="text-slate-400" />
                        <span className="text-slate-400">Budget:</span>
                        <span className="font-medium text-slate-800">ETB {(selected.budget || 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stage Advance / Revert Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleQuickRevert}
                      disabled={busy || selected.stage <= 0}
                      className="btn-outline flex items-center gap-1 text-xs !py-1.5 px-3 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      onClick={handleQuickAdvance}
                      disabled={busy || selected.stage >= 13}
                      className="btn-primary flex items-center gap-1.5 text-xs !py-1.5 px-4 shadow-sm disabled:opacity-40"
                    >
                      {selected.stage >= 13 ? 'Event Completed' : 'Next Step'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Tracker Bar */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600">
                    <span>
                      Active: Step {selected.stage + 1} of 14 ({CANONICAL_STAGES[selected.stage]?.name})
                    </span>
                    <span className="text-slate-700 font-semibold">
                      {selected.progress}% completed
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-700 transition-all duration-300"
                      style={{ width: `${selected.progress}%` }}
                    />
                  </div>
                </div>

                {/* 14-Step Horizontal Pipeline Stepper */}
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    14-Stage Lifecycle Stepper:
                  </p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                    {stepDetails.map((st, i) => {
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            if (!expandedSteps.has(st.id)) toggleStep(st.id)
                            const el = document.getElementById(`step-card-${st.id}`)
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition border ${st.isCurrent
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : st.isCompleted
                                ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                          title={`Step ${i + 1}: ${st.title} (${st.status})`}
                        >
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-medium ${st.isCurrent ? 'bg-white text-slate-900 font-bold' : st.isCompleted ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {st.isCompleted ? <Check size={10} strokeWidth={2.5} /> : i + 1}
                          </span>
                          <span>{st.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setView('pipeline')}
                    className={`tab flex items-center gap-1.5 text-xs !py-1.5 ${view === 'pipeline' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <Workflow size={13} /> Step Details (14)
                  </button>
                  <button
                    onClick={() => setView('matrix')}
                    className={`tab flex items-center gap-1.5 text-xs !py-1.5 ${view === 'matrix' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <Layers size={13} /> Governance Matrix
                  </button>
                  <button
                    onClick={() => setView('tasks')}
                    className={`tab flex items-center gap-1.5 text-xs !py-1.5 ${view === 'tasks' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <CheckSquare size={13} /> Assigned Tasks ({eventTasks.length})
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className={`tab flex items-center gap-1.5 text-xs !py-1.5 ${view === 'history' ? 'tab-active' : 'tab-idle'}`}
                  >
                    <History size={13} /> Activity Trail ({eventActivities.length})
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>Target Module:</span>
                  <Link
                    to={CANONICAL_STAGES[selected.stage]?.route || '/erp/dashboard'}
                    className="inline-flex items-center gap-1 text-slate-700 font-medium hover:underline"
                  >
                    {CANONICAL_STAGES[selected.stage]?.actionLabel} <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* VIEW 1: Step-by-Step Breakdown ("What was done, by who, to whom") */}
              {view === 'pipeline' && (
                <div className="space-y-3">
                  {/* Step Control Filter Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                        <SlidersHorizontal size={13} /> Filter:
                      </span>
                      {[
                        ['all', 'All Steps (14)'],
                        ['completed', `Completed (${stepDetails.filter((s) => s.isCompleted).length})`],
                        ['current', 'Active (1)'],
                        ['upcoming', `Upcoming (${stepDetails.filter((s) => s.isUpcoming).length})`],
                      ].map(([stKey, stLabel]) => (
                        <button
                          key={stKey}
                          onClick={() => setStatusFilter(stKey)}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition ${statusFilter === stKey
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {stLabel}
                        </button>
                      ))}

                      {/* Step Dropdown Selector */}
                      <select
                        className="rounded border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-slate-500"
                        value={expandedSteps.size === 1 ? Array.from(expandedSteps)[0] : ''}
                        onChange={(e) => {
                          if (e.target.value === '') return
                          const sId = Number(e.target.value)
                          setExpandedSteps(new Set([sId]))
                          setTimeout(() => {
                            const el = document.getElementById(`step-card-${sId}`)
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }, 50)
                        }}
                      >
                        <option value="">Jump to step...</option>
                        {stepDetails.map((st) => (
                          <option key={st.id} value={st.id}>
                            Step {st.stepNumber}: {st.title} ({st.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          value={stepSearch}
                          onChange={(e) => setStepSearch(e.target.value)}
                          placeholder="Search actions, leads..."
                          className="rounded border border-slate-200 bg-white py-1 pl-7 pr-2.5 text-xs focus:border-slate-400 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={expandedSteps.size === 14 ? collapseAll : expandAll}
                        className="btn-outline !py-1 !px-2.5 text-xs whitespace-nowrap hover:bg-slate-50"
                      >
                        {expandedSteps.size === 14 ? 'Collapse All' : 'Expand All'}
                      </button>
                    </div>
                  </div>

                  {/* 14 Step Cards */}
                  <div className="space-y-3">
                    {visibleSteps.length === 0 ? (
                      <div className="card p-8 text-center text-xs text-slate-400 border border-slate-200">
                        No steps match the active filter or search term.
                      </div>
                    ) : (
                      visibleSteps.map((step) => {
                        const isExpanded = expandedSteps.has(step.id)

                        return (
                          <div
                            key={step.id}
                            id={`step-card-${step.id}`}
                            className={`rounded-lg border transition-all duration-150 overflow-hidden bg-white ${step.isCurrent
                                ? 'border-l-4 border-l-brand-600 border-slate-300 shadow-xs'
                                : step.isCompleted
                                  ? 'border-slate-200'
                                  : 'border-slate-200/80 bg-slate-50/30'
                              }`}
                          >
                            {/* Card Header Accordion Bar */}
                            <div
                              onClick={() => toggleStep(step.id)}
                              className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition ${isExpanded ? 'bg-slate-50/60 border-b border-slate-100' : 'hover:bg-slate-50/50'
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.isCompleted
                                      ? 'bg-slate-900 text-white'
                                      : step.isCurrent
                                        ? 'bg-brand-700 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                  {step.isCompleted ? <Check size={12} strokeWidth={2.5} /> : step.stepNumber}
                                </span>

                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                      Step {step.stepNumber} of 14 · {step.phase}
                                    </span>

                                    {step.isCompleted && (
                                      <span className="rounded bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 text-[10px] font-medium">
                                        Completed
                                      </span>
                                    )}
                                    {step.isCurrent && (
                                      <span className="rounded bg-brand-50 text-brand-800 border border-brand-200 px-1.5 py-0.2 text-[10px] font-medium">
                                        Active
                                      </span>
                                    )}
                                    {step.isUpcoming && (
                                      <span className="text-slate-400 text-[10px] font-medium">
                                        Upcoming
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                                    {step.title}
                                  </h3>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-400 hidden sm:inline">
                                  {step.isCompleted ? `Completed ${step.dateCompleted}` : step.isCurrent ? 'In progress' : 'Scheduled'}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                  <span className="hidden md:inline">{isExpanded ? 'Hide' : 'Details'}</span>
                                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>

                            {/* Card Body - Every Single Detail: "What was done, by who, to whom" */}
                            {isExpanded && (
                              <div className="p-4 sm:p-5 space-y-4">
                                {/* WHO & WHOM GOVERNANCE PANEL */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-slate-200/80 bg-slate-50/60 p-4">
                                  {/* BY WHO (Responsible Lead) */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                      Responsible Lead (By Who)
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900">{step.byWho.name}</p>
                                    <p className="text-xs text-slate-600">{step.byWho.role} · {step.byWho.dept}</p>
                                    <p className="text-[11px] text-slate-400 pt-0.5">{step.byWho.email} · {step.byWho.phone}</p>
                                  </div>

                                  {/* TO WHOM (Counterpart / Recipient) */}
                                  <div className="space-y-1 md:border-l md:border-slate-200 md:pl-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                      Counterpart / Recipient (To Whom)
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900">{step.toWhom.name}</p>
                                    <p className="text-xs text-slate-600">{step.toWhom.org} · {step.toWhom.role}</p>
                                    <p className="text-[11px] text-slate-400 pt-0.5">{step.toWhom.contact} · {step.toWhom.email}</p>
                                  </div>
                                </div>

                                {/* WHAT WAS DONE (OPERATIONAL ACTIONS) */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    What Was Done & Verified:
                                  </p>
                                  <div className="space-y-1.5 pl-1">
                                    {step.whatDone.map((action, actionIdx) => (
                                      <div key={actionIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                                        <span className="text-slate-400 select-none mt-0.5">•</span>
                                        <span>{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* CONCRETE DELIVERABLES & KEY ARTIFACTS */}
                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Deliverables & Artifacts:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {step.deliverables.map((deliv, delivIdx) => (
                                      <div
                                        key={delivIdx}
                                        className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs"
                                      >
                                        <span className="text-slate-400 font-medium">{deliv.label}:</span>
                                        <span className="font-semibold text-slate-900">{deliv.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* AUDIT NOTES & RECENT UPDATES */}
                                <div className="rounded-md border border-slate-200 p-3 space-y-2 bg-white">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-800">
                                      Step Activity Notes ({step.customLogs.length})
                                    </span>
                                    <button
                                      onClick={() => openLogModal(step.id)}
                                      className="text-xs text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1"
                                    >
                                      <Plus size={12} /> Add Note
                                    </button>
                                  </div>

                                  {step.customLogs.length === 0 ? (
                                    <p className="text-[11px] text-slate-400">
                                      No custom audit notes recorded for this step.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {step.customLogs.map((log) => (
                                        <div key={log.id} className="rounded border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1">
                                          <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-slate-900">
                                              {log.byWho} → {log.toWhom}
                                            </span>
                                            <span className="text-slate-400">{log.date} {log.timestamp}</span>
                                          </div>
                                          <p className="text-slate-700">{log.whatDone}</p>
                                          {log.deliverable && (
                                            <span className="inline-block text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                              Ref: {log.deliverable}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* ACTION BUTTONS BAR */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                  <Link
                                    to={step.route}
                                    className="btn-outline !py-1 px-3 text-xs flex items-center gap-1.5 font-medium hover:bg-slate-50"
                                  >
                                    <span>Open in {step.actionLabel}</span>
                                    <ExternalLink size={12} />
                                  </Link>

                                  <div className="flex items-center gap-2">
                                    {step.isCurrent && (
                                      <button
                                        onClick={handleQuickAdvance}
                                        disabled={busy || selected.stage >= 13}
                                        className="btn-primary !py-1 px-3.5 text-xs flex items-center gap-1.5 shadow-sm"
                                      >
                                        <span>Mark Step Done & Advance</span>
                                        <ChevronRight size={13} />
                                      </button>
                                    )}

                                    {step.isCompleted && (
                                      <button
                                        onClick={() => initiateTransition(step.id, 'revert')}
                                        disabled={busy}
                                        className="btn-outline !py-1 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                      >
                                        Revisit Step
                                      </button>
                                    )}

                                    {step.isUpcoming && (
                                      <button
                                        onClick={() => initiateTransition(step.id, 'jump')}
                                        disabled={busy}
                                        className="btn-outline !py-1 px-3 text-xs text-slate-700 hover:bg-slate-50"
                                      >
                                        Set Active
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: Who-to-Whom Governance Matrix Table */}
              {view === 'matrix' && (
                <div className="card overflow-hidden shadow-2xs border border-slate-200">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Who-to-Whom Governance Matrix</h3>
                      <p className="text-xs text-slate-500">Accountability mapping across all 14 lifecycle stages.</p>
                    </div>
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                      14 Stages Mapped
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                          <th className="p-3 w-12 text-center">#</th>
                          <th className="p-3">Stage Title</th>
                          <th className="p-3">Responsible Lead (By Who)</th>
                          <th className="p-3">Counterpart (To Whom)</th>
                          <th className="p-3">Operational Action</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Module</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stepDetails.map((st) => (
                          <tr
                            key={st.id}
                            className={`transition hover:bg-slate-50/60 ${st.isCurrent ? 'bg-brand-50/20 font-medium' : st.isCompleted ? 'bg-white' : 'bg-slate-50/30 text-slate-400'
                              }`}
                          >
                            <td className="p-3 text-center font-medium">
                              {st.isCompleted ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                                  <Check size={10} strokeWidth={2.5} />
                                </span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                  {st.stepNumber}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {st.title}
                              <p className="text-[10px] text-slate-400 font-normal">{st.phase}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-900">{st.byWho.name}</span>
                              <p className="text-[10px] text-slate-500">{st.byWho.role}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-900">{st.toWhom.name}</span>
                              <p className="text-[10px] text-slate-500">{st.toWhom.org}</p>
                            </td>
                            <td className="p-3 max-w-xs">
                              <p className="truncate text-slate-700" title={st.whatDone[0]}>{st.whatDone[0]}</p>
                              <p className="text-[10px] text-slate-400 truncate">{st.deliverables[0]?.label}: {st.deliverables[0]?.value}</p>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {st.isCompleted && (
                                <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                  Completed
                                </span>
                              )}
                              {st.isCurrent && (
                                <span className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-800">
                                  Active
                                </span>
                              )}
                              {st.isUpcoming && (
                                <span className="text-slate-400 text-[10px]">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <Link
                                to={st.route}
                                className="btn-outline !py-0.5 !px-2 text-[11px] font-medium hover:bg-slate-50"
                              >
                                {st.actionLabel}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: Actions & Team Tasks View */}
              {view === 'tasks' && (
                <div className="card p-5 space-y-4 shadow-2xs border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Action Items & Tasks</h3>
                      <p className="text-xs text-slate-500">Deliverables and assignments for {selected.name}</p>
                    </div>
                    <button
                      onClick={openActionModal}
                      className="btn-primary text-xs !py-1 px-3 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Plus size={13} /> Dispatch Task
                    </button>
                  </div>

                  {eventTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                      No action items assigned to this event yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {eventTasks.map((t) => {
                        const assignee = state.staff?.find((s) => s.id === t.assigneeId)
                        const isDone = t.status === 'done'

                        return (
                          <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                onClick={() => toggleTaskStatus(t)}
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${isDone
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                                  }`}
                                title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                              >
                                {isDone && <Check size={11} strokeWidth={2.5} />}
                              </button>
                              <div className="space-y-0.5 min-w-0">
                                <p className={`text-xs font-medium text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                                  {t.title}
                                </p>
                                {t.description && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-md">{t.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                                  <span className="font-medium text-slate-700">
                                    {assignee?.name || 'Unassigned'}
                                  </span>
                                  <span>·</span>
                                  <span>Due: {t.due || 'TBD'}</span>
                                  <span>·</span>
                                  <span className={`uppercase font-medium text-[9px] px-1.5 py-0.2 rounded border ${t.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                      t.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                    {t.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className={`rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600`}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: Audit Trail & Live Activities View */}
              {view === 'history' && (
                <div className="card p-5 space-y-4 shadow-2xs border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Activity & Governance Trail</h3>
                      <p className="text-xs text-slate-500">Chronological transitions recorded for {selected.name}</p>
                    </div>
                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {eventActivities.length} entries
                    </span>
                  </div>

                  {eventActivities.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                      No activity records found for this event yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eventActivities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3 text-xs"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <History size={12} />
                          </span>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-slate-800">
                                {act.text}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {act.at || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString() : 'Recent')}
                              </span>
                            </div>
                            <span className="inline-block text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                              {act.type || 'workflow'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center p-12 text-center text-ink/50">
              <Compass size={36} className="text-brand-300 mb-3" />
              <p className="font-bold text-brand-950">No event selected</p>
              <p className="text-xs text-ink/45 mt-1">Select an event from the left list to view its complete 14-stage workflow.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Transition Note Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Confirm Stage Transition · ${selected?.name || 'Event'}`}
        width="max-w-lg"
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-brand-50/80 p-4 border border-brand-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Target Transition</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink/50">From Current:</p>
                <p className="text-sm font-bold text-brand-900">
                  Step {((selected?.stage ?? 0) + 1)}: {selected?.stageName}
                </p>
              </div>
              <ArrowRight size={18} className="text-brand-500 shrink-0" />
              <div className="text-right">
                <p className="text-xs text-ink/50">To New Step:</p>
                <p className="text-sm font-black text-brand-700">
                  Step {(modalTargetStage ?? 0) + 1}: {CANONICAL_STAGES[modalTargetStage ?? 0]?.name}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink/70">
              Governance Audit Note (Who approved this & key notes):
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="e.g. Venue deposit confirmed by Sara Ahmed, floor plan signed by Walia Telecom."
              className="w-full rounded-xl border border-brand-200 p-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[90px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
            <button
              onClick={() => setModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={commitStageTransition}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy && <span className="w-3 h-3 rounded-full skeleton-shimmer inline-block" />}
              Confirm Transition
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Edit Event Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Event Details · ${selected?.name || ''}`}
        width="max-w-xl"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Event Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Category</label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Date</label>
              <input
                type="date"
                value={editForm.date || ''}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Time</label>
              <input
                type="time"
                value={editForm.time || ''}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Budget (ETB)</label>
              <input
                type="number"
                value={editForm.budget || ''}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Capacity (pax)</label>
              <input
                type="number"
                value={editForm.capacity || ''}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
            <button
              onClick={() => setEditModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy && <span className="w-3 h-3 rounded-full skeleton-shimmer inline-block" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Dispatch Action Item Modal */}
      <Modal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Dispatch Team Action Item · ${selected?.name || ''}`}
        width="max-w-lg"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">Action Item Title</label>
            <input
              type="text"
              value={actionForm.title}
              onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
              placeholder="e.g. Conduct sound check with venue technical crew"
              className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Assign To (Staff)</label>
              <select
                value={actionForm.assigneeId}
                onChange={(e) => setActionForm({ ...actionForm, assigneeId: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select staff lead…</option>
                {state.staff?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - {s.dept})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">Priority</label>
              <select
                value={actionForm.priority}
                onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">Description & Notes</label>
            <textarea
              value={actionForm.description}
              onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
              placeholder="Detailed instructions, contact details or specifications…"
              className="w-full rounded-xl border border-brand-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none min-h-[70px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
            <button
              onClick={() => setActionModalOpen(false)}
              className="btn-outline text-xs !py-2"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleDispatchAction}
              disabled={busy}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {busy ? <span className="w-3 h-3 rounded-full skeleton-shimmer inline-block" /> : <Send size={13} />}
              Dispatch Action Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Log Step Action Modal ("Who did what to whom") */}
      <Modal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Step Action & Governance Update"
        width="max-w-lg"
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-brand-50/70 p-3 border border-brand-200 text-xs">
            <span className="font-semibold text-ink/50">Target Step:</span>
            <select
              value={logForm.stepId}
              onChange={(e) => {
                const sId = Number(e.target.value)
                const target = stepDetails[sId]
                setLogForm({
                  ...logForm,
                  stepId: sId,
                  byWho: target?.byWho.name || logForm.byWho,
                  toWhom: (target?.toWhom.org + ' · ' + target?.toWhom.name) || logForm.toWhom,
                })
              }}
              className="mt-1 w-full rounded-lg border border-brand-300 bg-white p-2 font-bold text-brand-950 text-xs"
            >
              {CANONICAL_STAGES.map((s, idx) => (
                <option key={s.id} value={idx}>
                  Step {idx + 1}: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-emerald-800">
                BY WHO (Executing Lead / Officer)
              </label>
              <input
                type="text"
                value={logForm.byWho}
                onChange={(e) => setLogForm({ ...logForm, byWho: e.target.value })}
                placeholder="e.g. Sara Ahmed (Logistics Lead)"
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-sky-800">
                TO WHOM (Recipient / Counterpart)
              </label>
              <input
                type="text"
                value={logForm.toWhom}
                onChange={(e) => setLogForm({ ...logForm, toWhom: e.target.value })}
                placeholder="e.g. Walia Telecom · Ashenafi Wolde"
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink/70">
              WHAT WAS DONE (Specific work, agreements, or milestones completed):
            </label>
            <textarea
              value={logForm.whatDone}
              onChange={(e) => setLogForm({ ...logForm, whatDone: e.target.value })}
              placeholder="Detail the exact action taken, e.g. Executed safety walkthrough, approved 24 exhibitor passes, and confirmed live stream uplink test."
              className="w-full rounded-xl border border-brand-200 p-3 text-xs focus:border-brand-500 focus:outline-none min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">
                Deliverable / Document Ref (Optional)
              </label>
              <input
                type="text"
                value={logForm.deliverable}
                onChange={(e) => setLogForm({ ...logForm, deliverable: e.target.value })}
                placeholder="e.g. Contract #CTR-2026-081"
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">
                Date Completed
              </label>
              <input
                type="date"
                value={logForm.date}
                onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                className="w-full rounded-xl border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
            <button
              onClick={() => setLogModalOpen(false)}
              className="btn-outline text-xs !py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStepLog}
              className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              <Check size={14} /> Save Step Action Log
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  )
}
