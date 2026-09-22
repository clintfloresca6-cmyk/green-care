export const navItems = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { page: 'plants', label: 'My Plants', icon: 'myplants' },
  { page: 'library', label: 'Plant Library', icon: 'library' },
  { page: 'schedule', label: 'Care Schedule', icon: 'schedule' },
  { page: 'journal', label: 'Care Journal', icon: 'journal' },
  { page: 'health', label: 'Plant Health', icon: 'health' },
  { page: 'reports', label: 'Reports', icon: 'reports' },
  { page: 'notifications', label: 'Notifications', icon: 'bell' },
]

export function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [page = 'dashboard', detailId] = hash.split('/')
  return { page: page || 'dashboard', detailId }
}

export function goTo(page, detailId) {
  window.location.hash = detailId ? `#/${page}/${detailId}` : `#/${page}`
}
