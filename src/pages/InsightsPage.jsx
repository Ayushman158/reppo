import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useDashboardData } from '@/hooks/useDashboardData'
import './InsightsPage.css'

function WorkoutCard({ workout }) {
    const date = new Date(workout.date)
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return (
        <div className="wk-card">
            <div className="wk-card-header">
                <span className="wk-name">{workout.name}</span>
                <span className="wk-date font-mono text-xs text-ink3">{dateStr}</span>
            </div>
            <div className="wk-meta">
                <span className="wk-chip">
                    <Icon icon="ph:barbell-bold" style={{ fontSize: 12 }} />
                    {workout.volume}kg
                </span>
                {workout.prCount > 0 && (
                    <span className="wk-chip wk-chip--gold">
                        🏆 {workout.prCount} PR{workout.prCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    )
}

export default function InsightsPage() {
    const navigate = useNavigate()
    const { data, loading } = useDashboardData()

    const insights = useMemo(() => {
        if (!data) return null
        const prs = data.stats.prCount
        const streak = data.stats.streak
        const vol = data.recentWorkouts?.reduce((acc, w) => acc + (w.volume || 0), 0) || 0
        const sessions = data.recentWorkouts?.length || 0
        const weekSessions = data.stats.workoutsThisWeek || 0

        let headline
        if (streak > 4)         headline = 'Momentum is Everything.'
        else if (prs > 2)        headline = 'Breaking Records.'
        else if (weekSessions >= 3) headline = 'Consistency is Key.'
        else                     headline = 'Building the Foundation.'

        const subhead = weekSessions > 0
            ? `${weekSessions} session${weekSessions > 1 ? 's' : ''} this week · ${vol.toLocaleString()}kg moved.`
            : 'No sessions logged this week yet.'

        const highlight = prs > 0
            ? `You hit ${prs} personal record${prs > 1 ? 's' : ''} in your last ${sessions} sessions.`
            : sessions > 0
                ? 'Solid consistency. PRs come to those who show up.'
                : 'Start logging sessions to see your insights here.'

        const tip = streak > 2
            ? 'Progressive overload is a long game. Small, consistent increases beat big sporadic jumps every time.'
            : "The hardest part is showing up. Once you're there, the work takes care of itself."

        return { headline, subhead, highlight, tip }
    }, [data])

    if (loading || !insights) {
        return (
            <div className="insights-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse text-ink3 font-mono text-sm">Gathering insights…</div>
            </div>
        )
    }

    const recentWorkouts = data.recentWorkouts || []

    return (
        <div className="insights-container animate-fade-in">
            <header className="insights-header">
                <h1 className="font-display">Insights</h1>
                <div className="insights-date font-mono text-ink3">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </header>

            <article className="editorial-card">
                <h2 className="editorial-headline">{insights.headline}</h2>
                <p className="editorial-body">{insights.subhead} {insights.highlight}</p>

                <div className="editorial-stat-grid mt-8">
                    <div className="ed-stat">
                        <div className="ed-val font-mono">{data.stats.streak}</div>
                        <div className="ed-label">Day Streak</div>
                    </div>
                    <div className="ed-stat">
                        <div className="ed-val font-mono" style={{ color: 'var(--gold)' }}>{data.stats.prCount}</div>
                        <div className="ed-label">Total PRs</div>
                    </div>
                    <div className="ed-stat">
                        <div className="ed-val font-mono">{data.stats.workoutsThisWeek}</div>
                        <div className="ed-label">This Week</div>
                    </div>
                </div>

                <div className="editorial-divider"></div>

                <p className="editorial-tip font-sans text-ink2" style={{ fontStyle: 'italic' }}>
                    "{insights.tip}"
                </p>
            </article>

            {recentWorkouts.length > 0 && (
                <section style={{ marginTop: 28 }}>
                    <div className="section-label-ins">Recent Sessions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recentWorkouts.map(w => <WorkoutCard key={w.id} workout={w} />)}
                    </div>
                </section>
            )}

            <div className="strength-curve-teaser" style={{ marginTop: 28 }} onClick={() => navigate('/app/program')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon icon="ph:chart-line-up-bold" style={{ fontSize: 18, color: 'var(--target)' }} />
                        <span style={{ fontWeight: 600 }}>View Strength Curves</span>
                    </div>
                    <Icon icon="ph:arrow-right-bold" style={{ fontSize: 14, color: 'var(--target)' }} />
                </div>
                <p className="text-sm text-ink3 mt-1">Track your 1RM progression across every lift.</p>
            </div>
        </div>
    )
}
