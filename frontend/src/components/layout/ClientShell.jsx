import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X, Bell, Search } from 'lucide-react'
import ClientSidebar from './ClientSidebar'
import { useData } from '../../store/DataContext'
import { useNavigate } from 'react-router-dom'

export default function ClientShell() {
  const { state } = useData()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const client = state.clients.find((c) => c.id === state.currentUserId)
  const myEvents = state.events.filter((e) => e.clientId === state.currentUserId)
  const unreadNotifs = state.notifications.length

  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <ClientSidebar collapsed={collapsed} mobileNav={mobileNav} setMobileNav={setMobileNav} />

      {/* Mobile overlay */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileNav(false)} />
      )}

      {/* Main */}
      <div className={`${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'} transition-all duration-300`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-brand-100 bg-white/90 px-4 backdrop-blur lg:px-6">
          <button
            onClick={() => setMobileNav(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-100 text-brand-700 lg:hidden"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-brand-100 text-brand-700 hover:bg-brand-50 lg:flex"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* Quick search */}
          <button
            onClick={() => navigate('/erp/portal/events')}
            className="hidden items-center gap-2 rounded-lg border border-brand-100 px-3 py-2 text-sm text-ink/40 hover:bg-brand-50 sm:flex"
          >
            <Search size={15} /> Search events…
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/erp/portal/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brand-100 text-brand-700 hover:bg-brand-50"
          >
            <Bell size={17} />
            {unreadNotifs > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Client badge */}
          {client && (
            <div className="flex items-center gap-2.5 rounded-lg border border-brand-100 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-[10px] font-bold text-white">
                {client.logo || client.company?.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-brand-950 leading-tight">{client.contactPerson}</p>
                <p className="text-[10px] text-ink/40 leading-tight">{client.company}</p>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
