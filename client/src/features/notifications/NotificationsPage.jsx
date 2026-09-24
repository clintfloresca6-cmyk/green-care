import { goTo } from '../../app/routes.js'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDate } from '../../shared/utils/date.js'

export function NotificationsPage() {
  const { state, actions } = useGreenCare()
  const notifications = [...state.notifications].sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1))

  function openNotice(notice) {
    actions.markNotificationRead(notice.id)
    if (notice.page === 'plants' && notice.plantId) goTo('plants', notice.plantId)
    else if (notice.page) goTo(notice.page)
  }

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="muted">Everything GreenCare has flagged for you.</p>
        </div>
        <div className="notif-panel-actions">
          <button className="link-btn" type="button" onClick={actions.markAllRead}>Mark all as read</button>
          <button className="link-btn" type="button" onClick={actions.clearNotifications}>Clear all</button>
        </div>
      </div>
      <div className="notif-list notif-list--page">
        {notifications.length ? notifications.map((notice) => (
          <button className={notice.read ? 'notif-item' : 'notif-item unread'} key={notice.id} type="button" onClick={() => openNotice(notice)}>
            <span className="n-icon">{notice.icon}</span>
            <span>
              <span className="n-text">{notice.text}</span>
              <span className="n-time">{fmtDate(notice.time)}</span>
            </span>
          </button>
        )) : <p className="muted">You're all caught up.</p>}
      </div>
    </section>
  )
}
