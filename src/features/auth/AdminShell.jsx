import { useState } from 'react'
import { goTo } from '../../app/routes.js'
import { Avatar } from '../../shared/components/Avatar.jsx'
import { useAuth } from './AuthContext.jsx'

const adminNavItems = [
  {
    id: 'database',
    label: 'Plant Database',
    icon: 'database',
    description: 'Manage species library',
  },
  {
    id: 'reports',
    label: 'User Reports',
    icon: 'reports',
    description: 'Review flagged content',
  },
  {
    id: 'templates',
    label: 'Notification Templates',
    icon: 'bell',
    description: 'Edit alert messages',
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: 'settings',
    description: 'Platform configuration',
  },
]

export function AdminShell({ children, activeSection, onSectionChange }) {
  const { currentUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const displayName = currentUser?.name || 'Admin'
  const displayPhoto = currentUser?.photo || null

  function handleLogout() {
    logout()
    window.location.hash = '#/dashboard'
  }

  return (
    <>
      <div
        className={sidebarOpen ? 'sidebar-overlay show' : 'sidebar-overlay'}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="app-shell">
        {/* ── Admin Sidebar ─────────────────────────────────── */}
        <aside className={sidebarOpen ? 'sidebar admin-sidebar open' : 'sidebar admin-sidebar'}>
          {/* Brand */}
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <img src="../favicon.svg" alt="" style={{ width: '35px', height: '35px' }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="brand-name">GreenCare</span>
              <span className="admin-sidebar-badge">Admin Console</span>
            </div>
          </div>

          {/* Section label */}
          <div className="admin-sidebar-section-label">Console Navigation</div>

          {/* Admin nav */}
          <nav className="nav" aria-label="Admin">
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? 'nav-item admin-nav-item active' : 'nav-item admin-nav-item'}
                onClick={() => {
                  onSectionChange(item.id)
                  setSidebarOpen(false)
                }}
              >
                <span className="nav-icon" data-icon={item.icon} />
                <span className="admin-nav-text">
                  <span className="admin-nav-label">{item.label}</span>
                  <span className="admin-nav-desc">{item.description}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="admin-sidebar-divider" />

          {/* Back to app */}
          <div className="admin-sidebar-section-label">User Area</div>
          <button
            type="button"
            className="nav-item"
            onClick={() => goTo('dashboard')}
          >
            <span className="nav-icon" data-icon="dashboard" />
            Back to App
          </button>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-profile" style={{ cursor: 'default' }}>
              <Avatar name={displayName} photo={displayPhoto} />
              <span className="profile-meta">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role" style={{ color: 'var(--clay-500)' }}>Administrator</span>
              </span>
            </div>
            <button className="nav-item nav-item--ghost" type="button" onClick={handleLogout}>
              <span className="nav-icon" data-icon="logout" />
              Log out
            </button>
          </div>
        </aside>

        {/* ── Main Column ───────────────────────────────────── */}
        <div className="main-col">
          {/* Admin topbar */}
          <header className="topbar admin-topbar">
            <button
              className="icon-btn menu-toggle"
              type="button"
              aria-label="Toggle admin navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <span data-icon="menu" />
            </button>

            {/* Breadcrumb */}
            <div className="admin-topbar-crumb">
              <button
                type="button"
                className="admin-crumb-back"
                onClick={() => goTo('dashboard')}
                title="Back to app"
              >
                ← App
              </button>
              <span className="admin-crumb-sep">/</span>
              <span className="admin-crumb-current">Admin Console</span>
              <span className="admin-crumb-sep">/</span>
              <span className="admin-crumb-page">
                {adminNavItems.find((i) => i.id === activeSection)?.label}
              </span>
            </div>

            {/* Admin badge */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="admin-topbar-role-pill">
                <span className="admin-topbar-dot" />
                Admin Mode
              </div>
              <Avatar name={displayName} photo={displayPhoto} size="sm" />
            </div>
          </header>

          <main className="content admin-content">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
