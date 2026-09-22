import { useState } from 'react'
import './auth.css'
import { useAuth } from './AuthContext.jsx'

// ── Password strength helper ──────────────────────────────────────────────────
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  return score
}

const strengthMeta = [
  { label: '', color: 'transparent', pct: 0 },
  { label: 'Too weak', color: '#B0563F', pct: 20 },
  { label: 'Weak', color: '#B4864F', pct: 40 },
  { label: 'Fair', color: '#c9a83c', pct: 60 },
  { label: 'Strong', color: '#5B8C6A', pct: 80 },
  { label: 'Very strong', color: '#2E5A47', pct: 100 },
]

// ── Eye icon ──────────────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onFillAdmin, onFillUser }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleFill(e, pw) {
    setEmail(e)
    setPassword(pw)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    // Simulate async check
    await new Promise((r) => setTimeout(r, 600))
    const result = login(email, password)
    setLoading(false)
    if (!result.success) setError(result.error)
  }

  return (
    <form className="auth-form-enter" onSubmit={handleSubmit} noValidate>
      <h2 className="auth-heading">Welcome back 🌿</h2>
      <p className="auth-subheading">Sign in to your GreenCare account to tend to your plants.</p>

      {error && (
        <div className="auth-error" role="alert">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="login-email">Email address</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            className={error && !email ? 'error' : ''}
            required
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            className={error && !password ? 'error' : ''}
            required
          />
          <button
            type="button"
            className="auth-pw-toggle"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowPw((v) => !v)}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
      </div>

      <div className="auth-row">
        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>
        <button type="button" className="auth-forgot" onClick={() => alert('Password reset is not available in this prototype.')}>
          Forgot password?
        </button>
      </div>

      <button type="submit" className="auth-submit" disabled={loading}>
        <span className="auth-submit-inner">
          {loading && <span className="auth-spinner" aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </span>
      </button>

      {/* Demo credentials */}
      <div className="auth-demo-hint">
        <div className="auth-demo-hint-title">Demo credentials</div>
        <div className="auth-demo-accounts">
          <div className="auth-demo-account">
            <span className="auth-demo-role auth-demo-role--admin">Admin</span>
            <span className="auth-demo-creds">admin@greencare.app · admin123</span>
            <button type="button" className="auth-demo-fill" onClick={() => handleFill('admin@greencare.app', 'admin123')}>Fill</button>
          </div>
          <div className="auth-demo-account">
            <span className="auth-demo-role auth-demo-role--user">User</span>
            <span className="auth-demo-creds">user@greencare.app · user123</span>
            <button type="button" className="auth-demo-fill" onClick={() => handleFill('user@greencare.app', 'user123')}>Fill</button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ── Signup Form ───────────────────────────────────────────────────────────────
function SignupForm() {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)
  const meta = strengthMeta[Math.min(strength, 5)]

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 700))
    const result = signup(name, email, password)
    setLoading(false)
    if (!result.success) setError(result.error)
  }

  return (
    <form className="auth-form-enter" onSubmit={handleSubmit} noValidate>
      <h2 className="auth-heading">Create account 🌱</h2>
      <p className="auth-subheading">Join GreenCare and start tracking your plant care journey.</p>

      {error && (
        <div className="auth-error" role="alert">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="signup-name">Full name</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">👤</span>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Botanist"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            required
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="signup-email">Email address</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            required
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="signup-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            required
          />
          <button
            type="button"
            className="auth-pw-toggle"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowPw((v) => !v)}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
        {password && (
          <div className="auth-strength">
            <div className="auth-strength-bar">
              <div
                className="auth-strength-fill"
                style={{ width: `${meta.pct}%`, background: meta.color }}
              />
            </div>
            <span className="auth-strength-label" style={{ color: meta.color }}>{meta.label}</span>
          </div>
        )}
      </div>

      <div className="auth-field" style={{ marginBottom: 24 }}>
        <label htmlFor="signup-confirm">Confirm password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="signup-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            className={confirm && confirm !== password ? 'error' : ''}
            required
          />
          <button
            type="button"
            className="auth-pw-toggle"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirm((v) => !v)}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
      </div>

      <button type="submit" className="auth-submit" disabled={loading}>
        <span className="auth-submit-inner">
          {loading && <span className="auth-spinner" aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </span>
      </button>

      <p style={{ fontSize: 12, color: 'var(--ink-400)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        New accounts are created as <strong>User</strong> role. Admin access requires the admin credentials.
      </p>
    </form>
  )
}

// ── Brand Panel ───────────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-blobs">
        <div className="auth-brand-blob auth-brand-blob--1" />
        <div className="auth-brand-blob auth-brand-blob--2" />
        <div className="auth-brand-blob auth-brand-blob--3" />
      </div>

      <div className="auth-brand-cards">
        <div className="auth-brand-card auth-brand-card--1">
          <span className="auth-brand-card-icon">🌿</span>
          <div>
            <div className="auth-brand-card-label">Luna · Monstera</div>
            <div className="auth-brand-card-sub">Next watering: Tomorrow</div>
          </div>
        </div>
        <div className="auth-brand-card auth-brand-card--2">
          <span className="auth-brand-card-icon">✅</span>
          <div>
            <div className="auth-brand-card-label">Task completed</div>
            <div className="auth-brand-card-sub">Fertilized Basil · Today</div>
          </div>
        </div>
        <div className="auth-brand-card auth-brand-card--3">
          <span className="auth-brand-card-icon">💧</span>
          <div>
            <div className="auth-brand-card-label">Watering streak</div>
            <div className="auth-brand-card-sub">12 days in a row 🔥</div>
          </div>
        </div>
      </div>

      <div className="auth-brand-content">
        <div className="auth-brand-logo">
          <img src="/favicon.svg" alt="" className="auth-brand-logo-img" />
          <span className="auth-brand-logo-name">GreenCare</span>
        </div>
        <h1 className="auth-brand-headline">
          Your plants.<br />
          <em>Beautifully</em> cared for.
        </h1>
        <p className="auth-brand-tagline">
          Track watering schedules, monitor plant health, log care activities, and grow your green space — all in one place.
        </p>
      </div>
    </div>
  )
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
export function AuthPage({ defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)

  return (
    <div className="auth-page">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-tabs" role="tablist">
            <button
              id="tab-login"
              role="tab"
              aria-selected={tab === 'login'}
              className={tab === 'login' ? 'auth-tab active' : 'auth-tab'}
              type="button"
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={tab === 'signup'}
              className={tab === 'signup' ? 'auth-tab active' : 'auth-tab'}
              type="button"
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {tab === 'login' ? <LoginForm key="login" /> : <SignupForm key="signup" />}
        </div>
      </div>
    </div>
  )
}
