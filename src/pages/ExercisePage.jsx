import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

import './ExercisePage.css'

export default function ExercisePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [exercise, setExercise] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || !id) return

        async function fetchData() {
            setLoading(true)

            // 1. Get exercise details
            const { data: exData } = await supabase
                .from('exercises')
                .select('*')
                .eq('id', id)
                .single()

            if (exData) setExercise(exData)

            // 2. Get user's workouts first for RLS
            const { data: userWorkouts } = await supabase
                .from('workouts')
                .select('id, name, date:started_at')
                .eq('user_id', user.id)

            if (userWorkouts && userWorkouts.length > 0) {
                const workoutMap = userWorkouts.reduce((acc, w) => {
                    acc[w.id] = w
                    return acc
                }, {})

                // 3. Get all sets for this exercise
                const { data: setsData } = await supabase
                    .from('sets')
                    .select('weight_kg, reps, is_pr, workout_id')
                    .eq('exercise_id', id)
                    .in('workout_id', Object.keys(workoutMap))

                if (setsData) {
                    // Group sets by workout to find max weight per session (for 1RM proxy chart)
                    const sessionMap = {}
                    setsData.forEach(s => {
                        const wid = s.workout_id
                        if (!sessionMap[wid]) {
                            sessionMap[wid] = {
                                workout: workoutMap[wid],
                                maxWeight: s.weight_kg,
                                totalSets: 1,
                                prs: s.is_pr ? 1 : 0
                            }
                        } else {
                            sessionMap[wid].totalSets++
                            if (s.is_pr) sessionMap[wid].prs++
                            if (s.weight_kg > sessionMap[wid].maxWeight) {
                                sessionMap[wid].maxWeight = s.weight_kg
                            }
                        }
                    })

                    const sortedHistory = Object.values(sessionMap)
                        .sort((a, b) => new Date(a.workout.date) - new Date(b.workout.date))

                    setHistory(sortedHistory)
                }
            }
            setLoading(false)
        }

        fetchData()
    }, [id, user])

    const chartData = useMemo(() => {
        // Map history into concise curve points
        return history.map(h => ({
            date: new Date(h.workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            maxWeight: h.maxWeight
        }))
    }, [history])

    if (loading) {
        return (
            <div className="exercise-page-container flex-center" style={{ minHeight: '100vh' }}>
                <div className="text-ink3 animate-pulse font-mono text-sm">Loading backlink...</div>
            </div>
        )
    }

    if (!exercise) return null

    return (
        <div className="exercise-page-container animate-fade-in">
            <header className="ex-page-header">
                <button className="back-btn text-target" onClick={() => navigate(-1)}>
                    <span className="text-xl">‹</span> Back
                </button>
            </header>

            <div className="ex-title-group mb-8">
                <h1 className="font-display text-3xl mb-1">{exercise.name}</h1>
                <div className="text-ink3 font-mono text-sm uppercase tracking-2">
                    {exercise.target_muscle_group} • {exercise.mechanic}
                </div>
            </div>

            {chartData.length > 1 ? (
                <div className="chart-card mb-8">
                    <div className="section-label mb-4">Strength Curve (Max Weight)</div>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--target)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--target)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'var(--ink3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={['dataMin - 10', 'dataMax + 10']}
                                    tick={{ fill: 'var(--ink3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}
                                    itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                                    labelStyle={{ color: 'var(--ink3)', fontSize: '12px', marginBottom: '4px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="maxWeight"
                                    stroke="var(--target)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="chart-card mb-8 flex-center text-center" style={{ height: 200 }}>
                    <div className="text-ink3 mb-2 font-mono text-sm">Insufficient Data</div>
                    <div className="text-ink2 text-sm">Log this exercise more times to build your strength curve.</div>
                </div>
            )}

            <div className="section-label mb-4">Linked Notes</div>

            {history.length > 0 ? (
                <div className="history-list flex-col gap-3">
                    {/* Reverse history to show newest first in the list */}
                    {[...history].reverse().map((h) => (
                        <div key={h.workout.id} className="history-item">
                            <div className="flex-between mb-2">
                                <span className="font-bold text-ink">{h.workout.name}</span>
                                <span className="text-ink3 text-sm">
                                    {new Date(h.workout.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex-between font-mono text-sm">
                                <span className="text-ink2">{h.totalSets} sets logged</span>
                                <span className="text-ink font-bold">Max {h.maxWeight}kg</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-ink3 text-sm">No linked sessions found.</div>
            )}
        </div>
    )
}
