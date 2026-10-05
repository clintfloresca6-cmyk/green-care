import { useEffect, useState } from 'react'
import { goTo, navItems } from '../../app/routes.js'
import { Avatar } from '../components/Avatar.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { useGreenCare } from '../context/GreenCareContext.jsx'
import notificationIcon from '../../assets/bell1.svg'
import settingsIcon from '../../assets/gear.svg'
import logoutIcon from '../../assets/logout.svg'

export function AppShell({ page, children }) {
  const { state, actions, unreadCount } = useGreenCare()
  const { currentUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    function closePanel(event) {
      if (!event.target.closest('.notif-wrap')) setNotifOpen(false)
    }
    document.addEventListener('click', closePanel)
    return () => document.removeEventListener('click', closePanel)
  }, [])

  const visibleNav = currentUser?.role === 'admin'
    ? [...navItems, { page: 'admin', label: 'Admin', icon: 'admin' }]
    : navItems

  function handleSearch(event) {
    if (event.key !== 'Enter') return
    const query = event.currentTarget.value.trim().toLowerCase()
    if (!query) return
    const plant = state.plants.find((item) => item.name.toLowerCase().includes(query) || item.species.toLowerCase().includes(query))
    if (plant) {
      goTo('plants', plant.id)
      return
    }
    const species = state.library.find((item) => item.common.toLowerCase().includes(query) || item.scientific.toLowerCase().includes(query))
    if (species) {
      goTo('library')
      actions.toast(`Showing Plant Library for "${event.currentTarget.value.trim()}"`)
      return
    }
    goTo('journal')
    actions.toast(`No exact match; showing your Care Journal for "${event.currentTarget.value.trim()}"`)
  }

  function handleLogout() {
    logout()
    window.location.hash = '#/dashboard'
  }

  // Display name and photo from auth user (with fallback to profile)
  const displayName = currentUser?.name || state.profile?.name || ''
  const displayPhoto = currentUser?.photo || state.profile?.photo || null
  const displayRole = currentUser?.role === 'admin' ? 'Admin' : (state.profile?.role || 'Plant Enthusiast')

  // Apply theme to HTML element
  useEffect(() => {
    if (state.settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [state.settings.theme])

  return (
    <>
      <div className={sidebarOpen ? 'sidebar-overlay show' : 'sidebar-overlay'} onClick={() => setSidebarOpen(false)} />
      <div className="app-shell">
        <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <img src="../favicon.svg" alt="" style={{ width: '35px', height: '35px' }} />
            </span>
            <span className="brand-name">GreenCare</span>
          </div>

          <nav className="nav" aria-label="Primary">
            {visibleNav.map((item) => (
              <button
                className={page === item.page ? 'nav-item active' : 'nav-item'}
                key={item.page}
                type="button"
                onClick={() => {
                  goTo(item.page)
                  setSidebarOpen(false)
                }}
              >
                <img className="nav-icon" src={item.icon} alt={item.label} />
                {item.label}
                {item.page === 'notifications' && unreadCount > 0 ? <span className="nav-badge">{unreadCount}</span> : null}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className={page === 'settings' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => goTo('settings')}>
              <img className="nav-icon" src={settingsIcon} alt="Settings" />
              Settings
            </button>
            <button className="sidebar-profile" type="button" onClick={() => goTo('profile')}>
              <Avatar name={displayName} photo={displayPhoto} />
              <span className="profile-meta">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">{displayRole}</span>
              </span>
            </button>
            <button className="nav-item nav-item--ghost" type="button" onClick={handleLogout}>
              <img className="nav-icon" src={logoutIcon} alt="Log out" /> Log Out
            </button>
          </div>
        </aside>

        <div className="main-col">
          <header className="topbar">
            <button className="icon-btn menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setSidebarOpen(true)}>
              <span data-icon="menu"></span>
            </button>

            <div className="topbar-search">
              <span data-icon="search"></span>
              <input type="search" placeholder="Search your plants, species, or journal..." onKeyDown={handleSearch} />
            </div>

            <div className="topbar-actions">
              <div className="notif-wrap">
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Notifications"
                  onClick={(event) => {
                    event.stopPropagation()
                    setNotifOpen((open) => !open)
                  }}
                >
                  <img src={notificationIcon} alt="Notifications" />
                  {unreadCount > 0 ? <span className="dot-badge"></span> : null}
                </button>
                {notifOpen ? <NotificationPanel close={() => setNotifOpen(false)} /> : null}
              </div>

              <button className="header-avatar" type="button" onClick={() => goTo('profile')}>
                <Avatar name={displayName} photo={displayPhoto} size="sm" />
              </button>
            </div>
          </header>

          <main className="content">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

function NotificationPanel({ close }) {
  const { state, actions } = useGreenCare()
  const sorted = [...state.notifications].sort((a, b) => (a.is_read === b.is_read ? 0 : a.is_read ? 1 : -1))

  function openNotification(notice) {
    actions.markNotificationRead(notice.id)
    close()
    if (notice.page === 'plants' && notice.plantId) goTo('plants', notice.plantId)
    else if (notice.page) goTo(notice.page)
  }

  return (
    <div className="notif-panel">
      <div className="notif-panel-head">
        <h4>Notifications</h4>
        <div className="notif-panel-actions">
          <button className="link-btn" type="button" onClick={actions.markAllRead}>Mark all as read</button>
          <button className="link-btn" type="button" onClick={actions.clearNotifications}>Clear all</button>
        </div>
      </div>
      <div className="notif-list">
        {sorted.length ? sorted.map((notice) => (
          <button className={!notice.is_read ? 'notif-item' : 'notif-item unread'} key={notice.id} type="button" onClick={() => openNotification(notice)}>
            <span className="n-icon"><img src={notice.icon} alt="" /></span>
            {!notice.is_read && <span className="dot-badge"></span>}
            <span>
              <span className="n-text">{notice.text}</span>
              <span className="n-time">{notice.notice_date}</span>
            </span>
          </button>
        )) : <p className="muted" style={{ padding: 10 }}>You're all caught up.</p>}
      </div>
    </div>
  )
}
