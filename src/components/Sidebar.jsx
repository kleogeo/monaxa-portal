import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, CheckSquare, FolderOpen,
  Calendar, Settings, LogOut, Calculator, FileText,
  Table2, ChevronDown, ChevronRight, Wrench, BookOpen,
  CalendarDays, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/team', icon: Users, label: 'Team View' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/rota', icon: CalendarDays, label: 'Rota & Leave' },
  { to: '/howto', icon: BookOpen, label: 'How-To Guide' },
]

const toolItems = [
  { to: '/calculator', icon: Calculator, label: 'Calculator' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/sheets', icon: Table2, label: 'Google Sheets' },
]

function SidebarContent({ onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [toolsOpen, setToolsOpen] = useState(toolItems.some(t => location.pathname.startsWith(t.to)))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    onClose?.()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const isToolActive = toolItems.some(t => location.pathname === t.to)

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-gold rounded-sm flex-shrink-0" />
            <span className="font-display text-lg font-bold tracking-tight text-white">MONAXA</span>
          </div>
          <p className="text-brand-muted text-xs mt-0.5 tracking-wider">OPS PORTAL</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-brand-muted hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`
            }>
            <Icon size={15} />{label}
          </NavLink>
        ))}

        {/* Tools */}
        <div className="pt-1">
          <button onClick={() => setToolsOpen(!toolsOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isToolActive ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'text-brand-muted hover:text-white hover:bg-white/5'
            }`}>
            <Wrench size={15} />
            <span className="flex-1 text-left">Tools</span>
            {toolsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {toolsOpen && (
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-brand-border pl-3">
              {toolItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'text-brand-muted hover:text-white hover:bg-white/5'
                    }`
                  }>
                  <Icon size={14} />{label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {profile?.role === 'admin' && (
          <NavLink to="/admin" onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                isActive ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`
            }>
            <Settings size={15} />Admin
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-brand-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
            style={{ backgroundColor: profile?.avatar_color || '#C9A84C' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Team Member'}</p>
            <p className="text-brand-muted text-xs capitalize">{profile?.role || 'member'}</p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-brand-muted hover:text-red-400 text-sm transition-colors mt-0.5 rounded-lg hover:bg-red-400/5">
          <LogOut size={14} />Sign out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-center text-brand-muted hover:text-white transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-brand-surface border-r border-brand-border z-50 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-brand-surface border-r border-brand-border fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>
    </>
  )
}
