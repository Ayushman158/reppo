import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardData } from '@/hooks/useDashboardData'

import './InsightsPage.css'

export default function InsightsPage() {
    const navigate = useNavigate()
    const { data, loading } = useDashboardData()

    // Simulate some editorial insights based on real data
    const insights = useMemo(() => {
        if (!data) return null;

        const prs = data.stats.prCount;
        const streak = data.stats.streak;
        const vol = data.recentWorkouts?.reduce((acc, w) => acc + (w.volume || 0), 0) || 0;

        return {
            headline: streak > 2 ? "Consistency is Key." : prs > 0 ? "Breaking Plateaus." : "Building Volume.",
            subhead: `You moved ${vol.toLocaleString()}kg this week across ${data.recentWorkouts?.length || 0} sessions.`,
            highlight: prs > 0 ? `You hit ${prs} new personal records.` : "Focus on technique and the PRs will follow.",
            tip: "Remember that true progressive overload isn't just weight; it's better form, slower eccentrics, and shorter rests."
        }
    }, [data])

    if (loading || !insights) {
        return (
            <div className="insights-container flex items-center justify-center p-8">
                <div className="animate-pulse text-ink3 font-mono text-sm">Gathering insights...</div>
            </div>
        )
    }

    return (
        <div className="insights-container animate-fade-in">
            <header className="insights-header">
                <h1 className="font-display">Weekly Debrief</h1>
                <div className="insights-date font-mono text-ink3">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </header>

            <article className="editorial-card">
                <h2 className="editorial-headline">{insights.headline}</h2>
                <p className="editorial-body">
                    {insights.subhead} {insights.highlight}
                </p>

                <div className="editorial-stat-grid mt-8">
                    <div className="ed-stat">
                        <div className="ed-val font-mono">{data.stats.streak}</div>
                        <div className="ed-label">Day Streak</div>
                    </div>
                    <div className="ed-stat">
                        <div className="ed-val font-mono">{data.stats.prCount}</div>
                        <div className="ed-label">Total PRs</div>
                    </div>
                    <div className="ed-stat">
                        <div className="ed-val font-mono">Top {data.stats.topRMPosition || '10'}%</div>
                        <div className="ed-label">Of Lifters</div>
                    </div>
                </div>

                <div className="editorial-divider"></div>

                <h3 className="section-label mb-3">Coach's Note</h3>
                <p className="editorial-tip font-sans text-ink2 italic">
                    "{insights.tip}"
                </p>
            </article>

            <div className="strength-curve-teaser mt-8" onClick={() => navigate('/app/exercise/1')}>
                <div className="flex-between">
                    <span className="font-bold">View Strength Curves</span>
                    <span className="text-target">→</span>
                </div>
                <p className="text-sm text-ink3 mt-1">Dive into your 1RM progression across specific exercises.</p>
            </div>
        </div>
    )
}
