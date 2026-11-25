import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AudioLines, ChevronLeft, ChevronRight, Clock3, LayoutDashboard,
  Link2, Mail, Menu, MessageSquareText, PhoneCall, Shield, X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/email', label: 'Email analysis', icon: Mail },
  { to: '/sms', label: 'SMS & messages', icon: MessageSquareText },
  { to: '/url', label: 'URL scanner', icon: Link2 },
  { to: '/voice', label: 'Voice analysis', icon: AudioLines, badge: 'BETA' },
  { to: '/calls', label: 'Live call', icon: PhoneCall, badge: 'SOON' },
  { to: '/history', label: 'Analysis history', icon: Clock3 },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <button className="mobile-menu icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Shield size={22} strokeWidth={2.2} /></div>
          {!collapsed && <div className="brand-name">THREAT<span>NEX</span><small>THREAT INTELLIGENCE</small></div>}
        </div>
        <div className="nav-section-label">{!collapsed && 'WORKSPACE'}</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <Icon size={18} />
              {!collapsed && <><span>{label}</span>{badge && <small className={`nav-badge ${badge === 'SOON' ? 'muted' : ''}`}>{badge}</small>}</>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" />
            {!collapsed && <div><strong>Protection active</strong><small>Heuristic engine online</small></div>}
          </div>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Collapse navigation">
            {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse sidebar</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
