import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, CheckSquare, FolderOpen,
  Calendar, Settings, LogOut, Bell
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/team', icon: Users, label: 'Team View' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <aside className="w-60 min-h-screen bg-brand-surface border-r border-brand-border flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-gold rounded-sm flex-shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-white">MONAXA</span>
        </div>
        <p className="text-brand-muted text-xs mt-0.5 tracking-wider">OPS PORTAL</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                  : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {profile?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-2 ${
                isActive
                  ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                  : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings size={16} />
            Admin
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-brand-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
            style={{ backgroundColor: profile?.avatar_color || '#C9A84C' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Team Member'}</p>
            <p className="text-brand-muted text-xs capitalize">{profile?.role || 'member'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-brand-muted hover:text-red-400 text-sm transition-colors mt-1 rounded-lg hover:bg-red-400/5"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
