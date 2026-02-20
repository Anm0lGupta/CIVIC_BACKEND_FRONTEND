// src/components/Sidebar.jsx

import { NavLink } from 'react-router-dom'
import { Home, Map, BarChart3, User, PlusCircle, Shield, Wifi, Search } from 'lucide-react'

const navItems = [
  { icon: Home,       label: 'Dashboard',       path: '/dashboard' },
  { icon: Wifi,       label: 'Social Scraper',  path: '/social',   badge: 'AI' },
  { icon: Map,        label: 'Map View',         path: '/map' },
  { icon: PlusCircle, label: 'Report Issue',     path: '/report' },
  { icon: Search,     label: 'Track Complaint',  path: '/track' },
  { icon: BarChart3,  label: 'Scorecards',       path: '/scorecards' },
  { icon: User,       label: 'Profile',          path: '/profile' },
]

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-orange-500">⬡</span> Civic Mirror
        </h1>
        <p className="text-xs text-slate-400 mt-1">Transparency Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {/* Admin link at bottom of nav */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`
            }
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Admin Panel</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Hackathon Demo</p>
          <p className="text-sm text-white font-semibold">Built with React + Vite</p>
          <p className="text-xs text-orange-400 mt-1">CODEZEN 2026 · DataCrafters</p>
        </div>
      </div>
    </aside>
  )
}