import React, { useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, FileText, Wallet, FolderOpen,
  Bell, MessageSquare, UserCircle, LifeBuoy, LogOut, Building2,
  Ticket, Users, GitBranch,
} from 'lucide-react'
import { useData } from '../../store/DataContext'

const groups = [
  {
    label: 'Main',
    items: [
      { to: '/erp/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/erp/portal/browse', label: 'Browse Events', icon: Ticket },
      { to: '/erp/portal/events', label: 'My Events', icon: CalendarDays },
    ],
  },
  {
    label: 'Event Management',
    items: [
      { to: '/erp/portal/timeline', label: 'Timeline', icon: GitBranch },
      { to: '/erp/portal/attendees', label: 'Attendees', icon: Users },
      { to: '/erp/portal/tickets', label: 'Tickets', icon: Ticket },
    ],
  },
  {
    label: 'Financials',
    items: [
      { to: '/erp/portal/invoices', label: 'Invoices & Payments', icon: Wallet },
      { to: '/erp/portal/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/erp/portal/notifications', label: 'Notifications', icon: Bell },
      { to: '/erp/portal/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/erp/portal/profile', label: 'Profile & Settings', icon: UserCircle },
      { to: '/erp/portal/support', label: 'Support', icon: LifeBuoy },
    ],
  },
]

export default function ClientSidebar({ collapsed, mobileNav, setMobileNav }) {
  const { state, logout } = useData()
  const navigate = useNavigate()
  const client = state.clients.find((c) => c.id === state.currentUserId)
  const myEvents = state.events.filter((e) => e.clientId === state.currentUserId)
  const upcomingCount = myEvents.filter((e) => e.status === 'upcoming').length

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-700 transition-all duration-300 ${
        mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-4 border-b border-white/10">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Building2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight text-white">Amen Events</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-300">Client Portal</p>
          </div>
        )}
      </div>

      {/* Client info */}
      {!collapsed && client && (
        <div className="px-3 py-3 border-b border-white/10">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                {client.logo || client.company?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{client.company}</p>
                <p className="truncate text-[11px] text-brand-300">{client.contactPerson}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-brand-200">
              <span>Active events</span>
              <span className="font-bold text-white">{upcomingCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-300/70">{g.label}</p>
            )}
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  onClick={() => setMobileNav && setMobileNav(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                      isActive
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-brand-100 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-3 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-brand-100 transition hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
