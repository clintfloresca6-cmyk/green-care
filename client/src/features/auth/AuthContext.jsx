import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { subscribeToPush, unsubscribeFromPush } from '../../shared/utils/push.js'

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.ok) {
          const userData = await response.json()
          const session = {
            id: userData.data.id,
            name: userData.data.name,
            email: userData.data.email,
            role: userData.data.role,
            photo: userData.data.photo_url || null,
            location: userData.data.location || null,
          }
          setCurrentUser(session)
        } else {
          setCurrentUser(null)
        }
      } catch (error) {
        console.error('Failed to check auth status:', error)
        setCurrentUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    subscribeToPush().catch((err) => console.warn('[push] subscribe failed:', err))
  }, [currentUser])

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const userData = await response.json()
      const session = {
        id: userData.data.id,
        name: userData.data.name,
        email: userData.data.email,
        role: userData.data.role,
        photo: userData.data.photo_url || null,
        location: userData.data.location ?? null,
      }

      setCurrentUser(session)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      const userData = await response.json()
      const session = {
        id: userData.data.id,
        name: userData.data.name,
        email: userData.data.email,
        role: userData.data.role,
        photo: userData.data.photo_url || null,
        location: null,
      }

      setCurrentUser(session)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setCurrentUser(null)
    }
  }, [])

  const updateUserProfile = useCallback(async (patch) => {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/${currentUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const updatedUser = await response.json();
    // Assuming the backend returns { data: user }
    const userData = updatedUser.data;
    setCurrentUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      photo: userData.photo_url || null,
      location: userData.location ?? null,
    });
    return userData;
  }, [currentUser])

  const isAuthenticated = !checkingAuth && Boolean(currentUser)

  return (
    <AuthContext
      value={{ currentUser, isAuthenticated, login, signup, logout, updateUserProfile, checkingAuth }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}