import { useEffect, useState } from 'react'
import { AdminPage } from '../features/admin/AdminPage.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'
import { AdminShell } from '../features/auth/AdminShell.jsx'
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx'
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx'
import { HealthPage } from '../features/health/HealthPage.jsx'
import { JournalPage } from '../features/journal/JournalPage.jsx'
import { LibraryPage } from '../features/library/LibraryPage.jsx'
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx'
import { PlantDetailPage } from '../features/plants/PlantDetailPage.jsx'
import { PlantsPage } from '../features/plants/PlantsPage.jsx'
import { ProfilePage } from '../features/profile/ProfilePage.jsx'
import { ReportsPage } from '../features/reports/ReportsPage.jsx'
import { SchedulePage } from '../features/schedule/SchedulePage.jsx'
import { SettingsPage } from '../features/settings/SettingsPage.jsx'
import { ToastHost } from '../shared/components/ToastHost.jsx'
import { GreenCareProvider } from '../shared/context/GreenCareContext.jsx'
import { AppShell } from '../shared/layouts/AppShell.jsx'
import { ModalRenderer } from '../shared/components/ModalRenderer.jsx'
import { parseHash } from './routes.js'

export default function App() {
  return (
    <AuthProvider>
      <GreenCareProvider>
        <RoutedApp />
        <ToastHost />
        <ModalRenderer />
      </GreenCareProvider>
    </AuthProvider>
  )
}

function RoutedApp() {
  const [route, setRoute] = useState(parseHash)
  const [adminSection, setAdminSection] = useState('database')

  useEffect(() => {
    function updateRoute() {
      setRoute(parseHash())
    }
    if (!window.location.hash) window.location.hash = '#/dashboard'
    window.addEventListener('hashchange', updateRoute)
    updateRoute()
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  const page = route.page === 'myplants' ? 'plants' : route.page

  // Admin pages get the dedicated AdminShell
  if (page === 'admin') {
    return (
      <ProtectedRoute page={page}>
        <AdminShell activeSection={adminSection} onSectionChange={setAdminSection}>
          <AdminPage section={adminSection} />
        </AdminShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute page={page}>
      <AppShell page={page}>
        {renderPage(page, route.detailId)}
      </AppShell>
    </ProtectedRoute>
  )
}

function renderPage(page, detailId) {
  if (page === 'plants' && detailId) return <PlantDetailPage plantId={detailId} />
  if (page === 'plants') return <PlantsPage />
  if (page === 'library') return <LibraryPage />
  if (page === 'schedule') return <SchedulePage />
  if (page === 'journal') return <JournalPage />
  if (page === 'health') return <HealthPage />
  if (page === 'reports') return <ReportsPage />
  if (page === 'notifications') return <NotificationsPage />
  if (page === 'settings') return <SettingsPage />
  if (page === 'profile') return <ProfilePage />
  return <DashboardPage />
}
