import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import './DashboardPage.css'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [workouts, setWorkouts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (!user) return
        fetchWorkouts()
    }, [user])

    async function fetchWorkouts() {
        setLoading(true)
        const { data } = await supabase
            .from('workouts')
            .select(`
        id, started_at, ended_at, notes,
        sets (weight_kg, reps, exercise_id, exercises(name))
      `)
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(50)

        const formatted = (data || []).map(w => {
            const exerciseNames = [...new Set(w.sets?.map(s => s.exercises?.name).filter(Boolean))]
            const volume = w.sets?.reduce((a, s) => a + (s.weight_kg || 0) * (s.reps || 0), 0) || 0
            const setCount = w.sets?.length || 0
            return {
                id: w.id,
                date: w.started_at,
                title: exerciseNames.length > 0
                    ? exerciseNames.slice(0, 3).join(', ') + (exerciseNames.length > 3 ? '…' : '')
                    : 'Empty Note',
                exerciseCount: exerciseNames.length,
                setCount,
                volume: Math.round(volume),
            }
        })
        setWorkouts(formatted)
        setLoading(false)
    }

    async function handleNew() {
        if (creating) return
        setCreating(true)
        const { data, error } = await supabase
            .from('workouts')
            .insert({ user_id: user.id, started_at: new Date().toISOString() })
            .select()
            .single()

        if (data && !error) {
            navigate(`/app/note/${data.id}`)
        } else {
            console.error('Failed to create workout:', error)
            setCreating(false)
        }
    }

    const formatDate = (iso) => {
        const d = new Date(iso)
        const now = new Date()
        const diff = now - d
        if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today'
        if (diff < 172800000) return 'Yesterday'
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const filtered = search
        ? workouts.filter(w => w.title.toLowerCase().includes(search.toLowerCase()))
        : workouts

    return (
        <div className="notes-container">
            <header className="notes-header">
                <div className="notes-logo">REP<span className="accent">PO</span></div>
                <button className="settings-btn" onClick={() => navigate('/app/settings')}>⚙</button>
            </header>

            <div className="notes-search">
                <input
                    type="text"
                    placeholder="Search workouts…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="notes-loading">
                    {[0, 1, 2].map(i => <div key={i} className="skeleton-card" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="notes-empty">
                    <div className="empty-icon">📝</div>
                    <h2>No workouts yet</h2>
                    <p>Tap <strong>+</strong> to log your first session.</p>
                </div>
            ) : (
                <div className="notes-list">
                    {filtered.map(w => (
                        <button
                            key={w.id}
                            className="note-card"
                            onClick={() => navigate(`/app/note/${w.id}`)}
                        >
                            <div className="note-date">{formatDate(w.date)}</div>
                            <div className="note-title">{w.title}</div>
                            <div className="note-meta">
                                {w.exerciseCount} exercise{w.exerciseCount !== 1 ? 's' : ''}
                                {w.volume > 0 && <> · {w.volume.toLocaleString()}kg</>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <button className="fab" onClick={handleNew} disabled={creating}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    )
}
