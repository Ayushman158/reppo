// Stub pages — Sprint 2+ will replace these with full implementations

const stub = (title, emoji) => () => (
  <div style={{ padding: 40 }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, marginBottom: 16 }}>
      {emoji} {title}
    </div>
    <div style={{ color: 'var(--text2)', fontSize: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'inline-block' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand)', marginBottom: 8 }}>// TODO: Sprint 2+</div>
      This screen is on the roadmap. The full implementation is coming in Sprint {title === 'Dashboard' ? 3 : title === 'Workout' ? 3 : 4}.
    </div>
  </div>
)

export const DashboardPage  = stub('Dashboard',  '⬡')
export const WorkoutPage    = stub('Workout',    '⚡')
export const ProgressPage   = stub('Progress',   '📈')
export const ProgramPage    = stub('Program',    '📋')
export const ExercisePage   = stub('Exercise',   '🏋️')
export const SettingsPage   = stub('Settings',   '⚙️')
export const NotFoundPage   = stub('404',        '🤷')
