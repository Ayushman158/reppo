import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Icon } from '@iconify/react'
import Button from '@/components/ui/Button' // Reusing our custom spring button

export default function AuthPage({ mode: initialMode = 'signup' }) {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithProvider } = useAuthStore()

  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === 'signup'

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
      // Rely on PublicOnlyRoute to navigate once the authStore listener sets the user state
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider) => {
    setError(null)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err.message || `Failed to authenticate with ${provider}.`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left — branding */}
      <div className="grid-bg" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(79,126,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 480, position: 'relative' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em', color: '#fff', textDecoration: 'none', display: 'block', marginBottom: 64 }}>
            REP<span style={{ color: 'var(--brand)' }}>PO</span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 5vw, 64px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: 24, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            YOUR PLAN.<br />
            <span style={{ color: 'var(--brand)' }}>AMPLIFIED.</span>
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: 18, lineHeight: 1.6, marginBottom: 48, fontWeight: 400 }}>
            Join serious lifters who have ditched the guesswork. Reppo learns your strength curve and tells you exactly what weight to target every session.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', padding: 24, backdropFilter: 'blur(10px)' }}>
            <p style={{ fontSize: 15, color: '#E4E4E7', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16 }}>
              "Finally an app that enhances MY program instead of replacing it. The 1RM auto-calc saves me 10 minutes of mental math."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>A</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Alex K.</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>PPL lifter · 3 years</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="animate-fade-in" style={{ width: 480, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', background: 'var(--bg2)', borderLeft: '1px solid var(--border)', boxShadow: '-20px 0 40px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-base)', color: '#fff' }}>
          {isSignup ? 'Create account' : 'Welcome back'}
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32 }}>
          {isSignup ? 'Start logging sets intelligently for free.' : 'Enter your details to log in.'}
        </p>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, fontSize: 14, color: 'var(--red)', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '14px', background: '#fff', color: '#000', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'opacity var(--ease)' }}
            onMouseOver={e => e.currentTarget.style.opacity = 0.9}
            onMouseOut={e => e.currentTarget.style.opacity = 1}
          >
            <Icon icon="logos:google-icon" width="20" height="20" />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '14px', background: '#111', color: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background var(--ease)' }}
            onMouseOver={e => e.currentTarget.style.background = '#222'}
            onMouseOut={e => e.currentTarget.style.background = '#111'}
          >
            <Icon icon="ph:apple-logo-fill" width="22" height="22" />
            Continue with Apple
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex" required={isSignup}
                style={{ width: '100%', padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-base)', fontSize: 15, outline: 'none', transition: 'border-color var(--ease)' }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
              style={{ width: '100%', padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-base)', fontSize: 15, outline: 'none', transition: 'border-color var(--ease)' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignup ? 'Min. 8 characters' : 'Your password'} required minLength={8}
              style={{ width: '100%', padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-base)', fontSize: 15, outline: 'none', transition: 'border-color var(--ease)' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2" style={{ padding: '16px', fontSize: '16px' }}>
            {loading ? (
              <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" /> Authenticating...</>
            ) : (
              isSignup ? 'Create account' : 'Log in'
            )}
          </Button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)', marginTop: 24 }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <span style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup')
              setError(null)
            }}>
            {isSignup ? 'Log in' : 'Sign up free'}
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', fontWeight: 500, transition: 'color var(--ease)' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'var(--text3)'}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
