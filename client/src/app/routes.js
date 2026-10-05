import dashboardIcon from '../assets/dashboard.svg'
import plantsIcon from '../assets/plant.svg'
import libraryIcon from '../assets/book.svg'
import scheduleIcon from '../assets/calendar.svg'
import journalIcon from '../assets/journal.svg'
import healthIcon from '../assets/heart.svg'
import reportsIcon from '../assets/stat.svg'
import notificationsIcon from '../assets/bell.svg'

export const navItems = [
  { page: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
  { page: 'plants', label: 'My Plants', icon: plantsIcon },
  { page: 'library', label: 'Plant Library', icon: libraryIcon },
  { page: 'schedule', label: 'Care Schedule', icon: scheduleIcon },
  { page: 'journal', label: 'Care Journal', icon: journalIcon },
  { page: 'health', label: 'Plant Health', icon: healthIcon },
  { page: 'reports', label: 'Reports', icon: reportsIcon },
  { page: 'notifications', label: 'Notifications', icon: notificationsIcon },
]

export function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [page = 'dashboard', detailId] = hash.split('/')
  return { page: page || 'dashboard', detailId }
}

export function goTo(page, detailId) {
  window.location.hash = detailId ? `#/${page}/${detailId}` : `#/${page}`
}
