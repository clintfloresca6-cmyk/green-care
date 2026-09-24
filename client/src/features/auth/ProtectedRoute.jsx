import { useEffect } from 'react'
import { goTo } from '../../app/routes.js'
import { AuthPage } from './AuthPage.jsx'
import { useAuth } from './AuthContext.jsx'

/**
 * Renders children only when the user is authenticated.
 * - If not authenticated → shows the AuthPage (login/signup)
 * - If authenticated as non-admin but trying to access admin page → redirects to dashboard
 */
export function ProtectedRoute({ page, children }) {
  const { isAuthenticated, currentUser } = useAuth()

  // Redirect non-admin users away from the admin page
  useEffect(() => {
    if (isAuthenticated && page === 'admin' && currentUser?.role !== 'admin') {
      goTo('dashboard')
    }
  }, [isAuthenticated, page, currentUser?.role])

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return children
}
