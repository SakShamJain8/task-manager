import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, Zap } from 'lucide-react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
import './AppLayout.css'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/my-tasks', icon: CheckSquare, label: 'My Tasks' }
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()
  const currentUser = user || storedUser

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`app-shell ${mobileMenuOpen ? 'app-shell--menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-topbar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark">
              <Zap size={18} />
            </div>
            <span className="sidebar-logo-text">Task Manager</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setMobileMenuOpen(open => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="app-sidebar-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav id="app-sidebar-nav" className={`sidebar-nav ${mobileMenuOpen ? 'sidebar-nav--open' : ''}`}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.name}</div>
              <div className="sidebar-user-email">{currentUser?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  )
}