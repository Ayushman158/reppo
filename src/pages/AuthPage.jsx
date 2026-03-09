import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Icon } from '@iconify/react'
import './AuthPage.css'

export default function AuthPage({ mode: initialMode = 'signup' }) {
  const { signIn, signUp, signInWithProvider } = useAuthStore()

  const [mode, setMode] = useState(initialMode)
  const [showEmail, setShowEmail] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)
  const [error, setError] = useState(null)

  const isSignup = mode === 'signup'

  const handleOAuth = async (provider) => {
    setError(null)
    setOauthLoading(provider)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err.message || `Failed to sign in with ${provider}.`)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignup) {
        localStorage.setItem('reppo_onboarding', 'true')
        await signUp({ email, password, name })
      } else {
        await signIn({ email, password })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          REP<span>PO</span>
        </Link>

        <h1 className="auth-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="auth-sub">
          {isSignup ? 'Start logging smarter. Free forever.' : 'Sign in to your account.'}
        </p>

        {error && (
          <div className="auth-error">
            <Icon icon="ph:warning-circle-bold" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Primary OAuth buttons */}
        <div className="auth-oauth-stack">
          <button
            className="auth-btn-google"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? (
              <span className="auth-spinner" />
            ) : (
              <Icon icon="logos:google-icon" width="20" height="20" />
            )}
            Continue with Google
          </button>

          <button
            className="auth-btn-apple"
            onClick={() => handleOAuth('apple')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'apple' ? (
              <span className="auth-spinner auth-spinner--dark" />
            ) : (
              <Icon icon="ph:apple-logo-fill" width="22" height="22" />
            )}
            Continue with Apple
          </button>
        </div>

        {/* Email toggle */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <button
            className="auth-divider-label"
            onClick={() => setShowEmail(v => !v)}
          >
            {showEmail ? 'hide email option' : 'or use email'}
          </button>
          <div className="auth-divider-line" />
        </div>

        {showEmail && (
          <form onSubmit={handleSubmit} className="auth-form animate-fade-in">
            {isSignup && (
              <div className="auth-field">
                <label>Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex"
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isSignup ? 'Min. 8 characters' : 'Your password'}
                required
                minLength={8}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            <button type="submit" className="auth-btn-email" disabled={loading}>
              {loading ? (
                <><span className="auth-spinner" /> Signing in…</>
              ) : (
                isSignup ? 'Create account' : 'Log in'
              )}
            </button>
          </form>
        )}

        {/* Mode toggle */}
        <p className="auth-toggle">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(null); setShowEmail(false) }}
          >
            {isSignup ? 'Log in' : 'Sign up free'}
          </button>
        </p>
      </div>
    </div>
  )
}
