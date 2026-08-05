import React, { useState } from 'react'
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { Calendar, User, Ticket, Bell, LogOut, Menu, X, Heart, Home, Mail, Search } from 'lucide-react'
import { useAttendee } from '../../store/AttendeeContext'
import logo from '../../logo.jpg'

export default function PortalLayout() {
  const { attendee, isAuthenticated, logout } = useAttendee()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    setUserMenu(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/events', label: 'Events' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  const bottomNav = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/my-tickets', label: 'Tickets', icon: Ticket },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav — premium, spacious */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-portal-600 shadow-sm">
              <img src={logo} alt="Amen Events" className="h-full w-full object-fill" />
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">Amen Events</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive(link.to) ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <Link to="/my-tickets" className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive('/my-tickets') ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  <Ticket size={18} />
                </Link>
                <Link to="/notifications" className={`relative rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive('/notifications') ? 'bg-portal-50 text-portal-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  <Bell size={18} />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 transition hover:bg-gray-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-600 text-white text-xs font-bold">
                      {attendee?.firstName?.[0] || 'U'}{attendee?.lastName?.[0] || ''}
                    </span>
                    <span className="max-w-[80px] truncate text-sm font-semibold text-gray-900">{attendee?.firstName}</span>
                  </button>
                  {userMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                        <div className="border-b border-gray-50 px-3 py-2.5">
                          <p className="text-sm font-bold text-gray-900">{attendee?.firstName} {attendee?.lastName}</p>
                          <p className="truncate text-xs text-gray-400">{attendee?.email}</p>
                        </div>
                        <Link to="/profile" onClick={() => setUserMenu(false)} className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <User size={16} /> Profile
                        </Link>
                        <Link to="/my-tickets" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <Ticket size={16} /> My Tickets
                        </Link>
                        <Link to="/my-events" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <Heart size={16} /> Wishlist
                        </Link>
                        <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/portal-login" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Login</Link>
                <Link to="/register" className="rounded-xl bg-portal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-portal-600 hover:shadow-md">Register</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-gray-700 md:hidden">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-gray-50" />
              {isAuthenticated ? (
                <>
                  <Link to="/my-tickets" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <Ticket size={18} /> My Tickets
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <User size={18} /> Profile
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/portal-login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700">Login</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-portal-500 px-4 py-3 text-center text-sm font-semibold text-white">Register</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="animate-page-enter pb-20 md:pb-0" key={location.pathname}>
        <Outlet />
      </main>

      {/* Footer — premium */}
      <footer className="hidden border-t border-gray-100 bg-gray-50/50 md:block">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-portal-600">
                  <img src={logo} alt="Amen Events" className="h-full w-full object-fill" />
                </span>
                <span className="font-bold text-gray-900">Amen Events</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">Ethiopia's premier event platform. Discover, register, and attend extraordinary events.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Explore</p>
              <div className="mt-4 space-y-2.5">
                <Link to="/events" className="block text-sm text-gray-500 transition hover:text-portal-600">Browse Events</Link>
                <Link to="/about" className="block text-sm text-gray-500 transition hover:text-portal-600">About Us</Link>
                <Link to="/contact" className="block text-sm text-gray-500 transition hover:text-portal-600">Contact</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Account</p>
              <div className="mt-4 space-y-2.5">
                <Link to="/portal-login" className="block text-sm text-gray-500 transition hover:text-portal-600">Login</Link>
                <Link to="/register" className="block text-sm text-gray-500 transition hover:text-portal-600">Create Account</Link>
                <Link to="/my-tickets" className="block text-sm text-gray-500 transition hover:text-portal-600">My Tickets</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Company</p>
              <div className="mt-4 space-y-2.5">
                <p className="text-sm text-gray-500">Gravity Technologies PLC</p>
                <p className="text-sm text-gray-500">Addis Ababa, Ethiopia</p>
                <p className="text-sm text-gray-500">support@amenevents.et</p>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            © 2026 Gravity Technologies PLC. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNav.map((item) => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition ${
                  active ? 'text-portal-600' : 'text-gray-400'
                }`}
              >
                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-semibold ${active ? 'text-portal-600' : 'text-gray-400'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
