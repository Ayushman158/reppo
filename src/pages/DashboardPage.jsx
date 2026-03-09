import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useWorkoutStore } from '@/store/workoutStore'
import { useOneRM } from '@/hooks/useOneRM'
import './DashboardPage.css'

function NotebookHeader() {
    const navigate = useNavigate()
    return (
        <header className="notebook-header">
            <div className="notebook-logo">REP<span className="po">PO</span></div>
            <div className="avatar-circle" onClick={() => navigate('/app/settings')}>A</div>
        </header>
    )
}

function StatPills({ stats }) {
    if (!stats) return null;
    return (
        <div className="stats-row">
            <div className="stat-pill">
                <div className="stat-val">{stats.streak}</div>
                <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-pill">
                <div className="stat-val">{stats.workoutsThisWeek}</div>
                <div className="stat-label">This Week</div>
            </div>
            <div className="stat-pill">
                <div className="stat-val text-gold">{stats.prCount}</div>
                <div className="stat-label">Total PRs</div>
            </div>
        </div>
    )
}

// Per-exercise row that fetches and displays its AI target
function ExerciseTargetRow({ planEx }) {
    const { target, loading } = useOneRM(planEx.exercise_id, {
        repMin: planEx.target_rep_min,
        repMax: planEx.target_rep_max,
    })

    let targetStr = '—'
    if (loading) {
        targetStr = '···'
    } else if (target) {
        const w = target.weightLow === target.weightHigh
            ? `${target.weightHigh}kg`
            : `${target.weightLow}–${target.weightHigh}kg`
        const r = target.repLow === target.repHigh
            ? `${target.repHigh}`
            : `${target.repLow}–${target.repHigh}`
        targetStr = `${w} × ${r}`
    }

    return (
        <div className="note-ex-row">
            <span className="note-ex-name">{planEx.name}</span>
            <span className={`note-ex-target${loading ? ' note-ex-target--loading' : ''}`}>
                {targetStr}
            </span>
        </div>
    )
}

function TodaysNote({ splitDay, planExercises }) {
    const navigate = useNavigate()
    const startSession = useWorkoutStore((s) => s.startSession)

    if (!splitDay) {
        return (
            <div className="note-card">
                <div className="note-title text-ink3">No active plan</div>
                <p className="text-sm text-ink2 mb-4">Set up a program to get started.</p>
                <button className="start-btn" onClick={() => navigate('/app/program')}>
                    Create Program
                </button>
            </div>
        )
    }

    return (
        <div className="note-card pinned animate-fade-up">
            <div className="note-meta">
                <span>TODAY</span>
                <span className="text-target">Today's targets</span>
            </div>
            <div className="note-title">{splitDay.day_name}</div>

            <div className="note-exercises">
                {planExercises?.slice(0, 4).map(pe => (
                    <ExerciseTargetRow key={pe.id} planEx={pe} />
                ))}
                {planExercises?.length > 4 && (
                    <div className="text-xs text-ink3 mt-1">+{planExercises.length - 4} more exercises</div>
                )}
            </div>

            <button
                className="start-btn"
                onClick={() => {
                    startSession(splitDay, planExercises)
                    navigate('/app/workout')
                }}
            >
                START SESSION
            </button>
        </div>
    )
}

function PastSessions({ workouts }) {
    if (!workouts?.length) return null

    return (
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="section-label">Past Notes</div>
            <div>
                {workouts.map(w => (
                    <div
                        key={w.id}
                        className="past-session-card"
                        onClick={() => {/* Navigate to past note details */ }}
                    >
                        <div className="ps-header">
                            <span className="ps-title">{w.name}</span>
                            <span className="ps-date">
                                {new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="ps-meta">
                            {w.volume}kg volume {w.prCount > 0 && <span className="text-gold">· {w.prCount} PRs</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { data, loading } = useDashboardData()

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-ink3 animate-pulse text-sm font-mono">Loading Notebook...</div>
            </div>
        )
    }

    return (
        <div className="notebook-container">
            <NotebookHeader />

            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search notes, exercises, PRs..." />
            </div>

            <StatPills stats={data.stats} />

            <TodaysNote splitDay={data.splitDay} planExercises={data.planExercises} />

            <PastSessions workouts={data.recentWorkouts} />

            <button className="fab" onClick={() => {/* Handle freeform note */ }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    )
}
