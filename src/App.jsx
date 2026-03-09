import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Pages
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import OnboardPage from '@/pages/OnboardPage'
import DashboardPage from '@/pages/DashboardPage'
import WorkoutPage from '@/pages/WorkoutPage'
import SessionCompletePage from '@/pages/SessionCompletePage'
import InsightsPage from '@/pages/InsightsPage'
import ProgramPage from '@/pages/ProgramPage'
import ExercisePage from '@/pages/ExercisePage'
import SettingsPage from '@/pages/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Layout
import AppLayout from '@/components/layout/AppLayout'

// Route guards
function PrivateRoute({ children, requireOnboarding = false }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  // Redirect to onboarding if not yet done (skip if we're already on /onboarding)
  if (requireOnboarding && profile !== null && !profile?.onboarding_done) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, profile } = useAuthStore()
  if (!user) return children
  if (profile !== null && !profile?.onboarding_done) return <Navigate to="/onboarding" replace />
  return <Navigate to="/app" replace />
}

export default function App() {
  const { init, loading } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="animate-spin" style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand)', borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />

      {/* Onboarding — auth required, but no sidebar */}
      <Route path="/onboarding" element={<PrivateRoute><OnboardPage /></PrivateRoute>} />

      {/* App — auth required, with sidebar layout */}
      <Route path="/app" element={<PrivateRoute requireOnboarding><AppLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="workout/complete" element={<SessionCompletePage />} />
        <Route path="workout/:id" element={<WorkoutPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="exercise/:id" element={<ExercisePage />} />
        <Route path="program" element={<ProgramPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
