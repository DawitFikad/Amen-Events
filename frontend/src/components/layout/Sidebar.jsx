import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, KanbanSquare, MapPin, Package, Handshake,
  UserCog, Wallet, Ticket, QrCode, Mic2, Building2, BadgeDollarSign, Megaphone,
  BarChart3, Settings, ChevronDown, CalendarCheck2, UserCircle, Workflow,
  FileCheck, CalendarRange, FileText, MessageSquare, Bell, ClipboardList,
} from 'lucide-react'
import { useData } from '../../store/DataContext'
import logo from '../../logo.jpg'

const groups = [
  {
    label: 'Overview',
    items: [
      { to: '/erp/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true, module: 'dashboard' },
      { to: '/erp/notifications', label: 'My Notifications', icon: Bell, module: null },
      { to: '/erp/calendar', label: 'Enterprise Calendar', icon: CalendarRange, module: 'dashboard' },
      { to: '/erp/reports', label: 'Reporting & Analytics', icon: BarChart3, module: 'reports' },
    ],
  },
  {
    label: 'Core',
    items: [
      { to: '/erp/workflow', label: 'Event Workflow', icon: Workflow, module: 'events' },
      { to: '/erp/crm', label: 'CRM & Clients', icon: Users, module: 'crm' },
      { to: '/erp/admin/events', label: 'Event Management', icon: CalendarDays, module: 'events' },
      { to: '/erp/projects', label: 'Projects & Tasks', icon: KanbanSquare, module: 'projects' },
      { to: '/erp/venues', label: 'Venue Management', icon: MapPin, module: 'venues' },
      { to: '/erp/resources', label: 'Resource & Inventory', icon: Package, module: 'resources' },
      { to: '/erp/vendors', label: 'Vendor Management', icon: Handshake, module: 'vendors' },
      { to: '/erp/staff', label: 'Staff Management', icon: UserCog, module: 'staff' },
      { to: '/erp/finance', label: 'Financial Management', icon: Wallet, module: 'finance' },
      { to: '/erp/approvals', label: 'Approval Workflows', icon: FileCheck, module: 'finance' },
    ],
  },
  {
    label: 'Event Operations',
    items: [
      { to: '/erp/ticketing', label: 'Registration & Ticketing', icon: Ticket, module: 'ticketing' },
      { to: '/erp/checkin', label: 'QR Check-in', icon: QrCode, module: 'checkin' },
      { to: '/erp/speakers', label: 'Speakers & Conference', icon: Mic2, module: 'speakers' },
      { to: '/erp/exhibition', label: 'Exhibition Management', icon: Building2, module: 'exhibition' },
      { to: '/erp/sponsorship', label: 'Sponsorship', icon: BadgeDollarSign, module: 'sponsorship' },
      { to: '/erp/marketing', label: 'Marketing', icon: Megaphone, module: 'marketing' },
      { to: '/erp/operations', label: 'Operations', icon: ClipboardList, module: 'operations' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/erp/admin', label: 'Administration', icon: Settings, module: 'admin' },
      { to: '/erp/profile', label: 'My Profile', icon: UserCircle, module: null },
    ],
  },
]

function Section({ group, collapsed, setMobileNav }) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-300/70">{group.label}</p>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            onClick={() => setMobileNav && setMobileNav(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                isActive
                  ? 'bg-gold-400/15 text-gold-200 ring-1 ring-gold-400/25'
                  : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default function Sidebar({ collapsed, setCollapsed, mobileNav, setMobileNav }) {
  const { state, rbac } = useData()
  const events = state.events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').length
  const me = state.staff.find((m) => m.id === state.currentUserId)

  const visibleGroups = useMemo(() => {
    if (!rbac || !rbac.canAccess) return groups
    if (rbac.roleKey === 'client') {
      return [{ label: 'Portal', items: [
        { to: '/erp/portal', label: 'My Dashboard', icon: Building2, end: true, module: null },
        { to: '/erp/portal/events', label: 'My Events', icon: CalendarDays, module: null },
        { to: '/erp/portal/invoices', label: 'Invoices', icon: Wallet, module: null },
        { to: '/erp/portal/documents', label: 'Documents', icon: FileText, module: null },
        { to: '/erp/portal/messages', label: 'Messages', icon: MessageSquare, module: null },
        { to: '/erp/portal/profile', label: 'My Profile', icon: UserCircle, module: null },
      ]}]
    }
    return groups
      .map((g) => ({ ...g, items: g.items.filter((item) => item.module === null || rbac.canAccess(item.module)) }))
      .filter((g) => g.items.length > 0)
  }, [rbac])

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-700 transition-all duration-300 ${
        mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
          <img src={logo} alt="Amen Events" className="h-full w-full object-cover" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight text-white">Amen Events</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-300">Event OS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((g) => <Section key={g.label} group={g} collapsed={collapsed} setMobileNav={setMobileNav} />)}
      </nav>

      {/* Live summary */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-brand-200 mb-2">
              <span className="inline-flex items-center gap-1.5"><CalendarCheck2 size={13} /> Active pipeline</span>
              <span>{events} events</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[68%] rounded-full bg-gold-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{me?.initials}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{me?.name}</p>
                <p className="text-[10px] text-brand-300">{rbac?.roleDef?.label || me?.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-800 shadow-pop ring-1 ring-brand-100 hover:bg-brand-50"
      >
        <ChevronDown className={`transition ${collapsed ? 'rotate-0' : '-rotate-90'} h-4 w-4`} />
      </button>
    </aside>
  )
}