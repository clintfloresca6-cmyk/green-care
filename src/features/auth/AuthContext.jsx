import { createContext, useCallback, useContext, useState } from 'react'

const AUTH_KEY = 'greencare_auth_v1'
const ACCOUNTS_KEY = 'greencare_accounts_v1'

// ─── Hardcoded seed accounts ──────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  {
    id: 'u_admin',
    name: 'Admin User',
    email: 'admin@greencare.app',
    password: 'admin123',
    role: 'admin',
    photo: null,
  },
  {
    id: 'u_user',
    name: 'Jane Botanist',
    email: 'user@greencare.app',
    password: 'user123',
    role: 'user',
    photo: null,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : SEED_ACCOUNTS
  } catch {
    return SEED_ACCOUNTS
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(user) {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadSession)

  const login = useCallback((email, password) => {
    const accounts = loadAccounts()
    const account = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    )
    if (!account) {
      return { success: false, error: 'Invalid email or password. Please try again.' }
    }
    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      photo: account.photo,
    }
    saveSession(session)
    setCurrentUser(session)
    return { success: true }
  }, [])

  const signup = useCallback((name, email, password) => {
    const accounts = loadAccounts()
    const exists = accounts.some(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (exists) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    const newAccount = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'user',
      photo: null,
    }
    const updated = [...accounts, newAccount]
    saveAccounts(updated)
    const session = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      photo: newAccount.photo,
    }
    saveSession(session)
    setCurrentUser(session)
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    saveSession(null)
    setCurrentUser(null)
  }, [])

  const updateUserProfile = useCallback((patch) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...patch }
      saveSession(updated)
      return updated
    })
  }, [])

  const isAuthenticated = Boolean(currentUser)

  return (
    <AuthContext
      value={{ currentUser, isAuthenticated, login, signup, logout, updateUserProfile }}
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
