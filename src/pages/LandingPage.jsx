import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em' }}>
          REP<span style={{ color: 'var(--brand)' }}>PO</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600, transition: 'all var(--ease)' }}>
            Log in
          </button>
          <button onClick={() => navigate('/signup')}
            style={{ padding: '8px 16px', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius)', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600, transition: 'all var(--ease)' }}>
            Get started →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <div className="vertical-louvers"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text-col">
            <div className="animate-fade-up" style={{ marginBottom: 20 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} className="animate-pulse" />
                Intelligent progressive overload
              </span>
            </div>

            <h1 className="animate-fade-up-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 84px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em', marginBottom: 24, textTransform: 'none' }}>
              Smart Scaling<br />
              Technology.
            </h1>

            <p className="animate-fade-up-2" style={{ fontSize: 19, lineHeight: 1.6, marginBottom: 40, fontWeight: 400 }}>
              It's about understanding your lifting capacity in depth and tracking progressive overload with mathematical precision. Your program. Our math.
            </p>

            <div className="animate-fade-up-3">
              <button
                className="btn-pill"
                onClick={() => navigate('/signup')}
              >
                Sign Up Free
                <div className="btn-pill-icon"><Icon icon="ph:arrow-up-right-bold" /></div>
              </button>
            </div>
          </div>

          <div className="hero-visual-col animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="css-phone-wrapper">
              <div className="phone-glow"></div>
              <div className="css-phone">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  {/* Mock UI Dashboard logic mimicking "Push A" view */}
                  <div className="mock-header">
                    <span className="mock-logo">REP<span style={{ color: 'var(--brand)' }}>PO</span></span>
                    <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🔥 12</span>
                  </div>

                  <div className="mock-card">
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', margin: 0 }}>Push A</h2>
                    <div style={{ color: 'var(--brand)', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>5 EXERCISES</div>

                    <div style={{ background: 'var(--brand)', color: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', marginTop: '16px', fontWeight: 'bold', fontSize: '14px' }}>
                      START WORKOUT
                    </div>
                  </div>

                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text2)', marginBottom: '12px' }}>TODAY'S TARGETS</div>
                  <div className="mock-target">
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Bench Press</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>3 sets</div>
                    </div>
                    <div style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '16px' }}>80 - 85kg</div>
                  </div>
                  <div className="mock-target">
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Overhead Press</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>3 sets</div>
                    </div>
                    <div style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '16px' }}>55 - 60kg</div>
                  </div>
                  <div className="mock-target" style={{ opacity: 0.5 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Incline DB Press</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>3 sets</div>
                    </div>
                    <div style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '16px' }}>35kg</div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { icon: 'ph:robot-fill', title: 'AI knows your 1RM', body: 'Silently calculated from every set you log. No manual input. Ever.' },
            { icon: 'ph:target-bold', title: "Today's targets, pre-loaded", body: 'See exactly what weight and rep range to hit before you even touch the bar.' },
            { icon: 'ph:lightning-fill', title: 'Log in under 5 taps', body: 'Last session pre-filled. Confirm or adjust. Rest timer auto-starts.' },
            { icon: 'ph:chart-line-up-bold', title: 'Plateau detection', body: 'Stuck for 4 sessions? Reppo catches it and suggests a fix.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, transition: 'border-color var(--ease)' }}>
              <div style={{ fontSize: 28, marginBottom: 14, color: 'var(--brand)' }}><Icon icon={f.icon} /></div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>{f.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FitScan stats ribbon (High Contrast Light Mode) */}
      <div className="stats-ribbon">
        <div className="stats-grid">
          <div className="stat-block">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', margin: 0, letterSpacing: '-0.02em', color: '#111' }}>10K+</h2>
            <p style={{ color: '#444', fontSize: '14px', marginTop: '8px', fontWeight: 500, lineHeight: 1.5 }}>Thousands of lifters have experienced the benefits of AI-guided progressive overload.</p>
            <div className="avatar-stack">
              <div className="avatar"><Icon icon="twemoji:man-beard-medium-light-skin-tone" /></div>
              <div className="avatar"><Icon icon="twemoji:woman-curly-hair-medium-skin-tone" /></div>
              <div className="avatar"><Icon icon="twemoji:man-medium-light-skin-tone" /></div>
              <div className="avatar"><Icon icon="twemoji:man-dark-skin-tone" /></div>
            </div>
          </div>

          <div className="stat-block" style={{ borderLeft: '1px solid #E5E5E5', paddingLeft: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', margin: 0, letterSpacing: '-0.02em', color: '#111' }}>4.9<span style={{ fontSize: '24px', color: '#555' }}>/5</span></h2>
            <div style={{ fontSize: '20px', letterSpacing: '4px', marginTop: '8px', color: '#FFB800' }}><Icon icon="ph:star-fill" /><Icon icon="ph:star-fill" /><Icon icon="ph:star-fill" /><Icon icon="ph:star-fill" /><Icon icon="ph:star-fill" /></div>
            <p style={{ color: '#444', fontSize: '14px', marginTop: '16px', fontWeight: 500 }}>Available soon on:</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#000', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                <Icon icon="ph:apple-logo-fill" fontSize="16px" /> App Store
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#000', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                <Icon icon="ion:logo-google-playstore" fontSize="16px" /> Google Play
              </div>
            </div>
          </div>

          <div className="stat-block blue-block">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                <span style={{ fontSize: '16px' }}>∞</span> AI Intelligence
              </div>
              <p style={{ marginTop: '16px', fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>// EARLY ACCESS 2026</p>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', margin: 0, letterSpacing: '-0.02em' }}>
              Join REPPO<br />Community!
            </h3>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Built by a lifter, for lifters.
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 17, marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
          No bloat. No generic AI programs. Just your plan, your data, and the intelligence to progress it.
        </p>
        <button onClick={() => navigate('/signup')}
          style={{ padding: '16px 40px', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', color: '#fff', fontSize: 17, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600 }}>
          Create free account →
        </button>
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text3)' }}>Free to start. No credit card.</div>
      </div>
    </div>
  )
}
