import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useDashboardData() {
    const { user } = useAuthStore()
    const [data, setData] = useState({
        splitDay: null,
        planExercises: [],
        recentWorkouts: [],
        plateauAlerts: [],
        stats: { streak: 0, topRM: 0, prCount: 0 }
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        async function load() {
            try {
                setLoading(true)

                // 1. Fetch Active Split
                const { data: splitResult } = await supabase
                    .from('splits')
                    .select('id, name, type')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single()

                if (!splitResult) {
                    setData(prev => ({ ...prev, splitDay: null }))
                    setLoading(false)
                    return
                }

                // 2. Fetch Split Days
                const { data: splitDays } = await supabase
                    .from('split_days')
                    .select('*')
                    .eq('split_id', splitResult.id)
                    .order('sort_order', { ascending: true })

                // 3. Last Workout to determine next split day
                const { data: lastWorkoutData } = await supabase
                    .from('workouts')
                    .select('split_day_id, started_at')
                    .eq('user_id', user.id)
                    .order('started_at', { ascending: false })
                    .limit(1)

                let nextDay = splitDays[0]
                if (lastWorkoutData && lastWorkoutData.length > 0 && lastWorkoutData[0].split_day_id) {
                    const lastId = lastWorkoutData[0].split_day_id
                    const lastIdx = splitDays.findIndex(d => d.id === lastId)
                    if (lastIdx !== -1) {
                        // Next day, wrapping around
                        nextDay = splitDays[(lastIdx + 1) % splitDays.length]
                    }
                }

                let planExercises = []
                if (nextDay) {
                    // Fetch plan exercises for this day
                    const { data: pe } = await supabase
                        .from('plan_exercises')
                        .select(`
              id,
              target_sets,
              target_rep_min,
              target_rep_max,
              track_1rm,
              exercises (id, name, movement_type)
            `)
                        .eq('split_day_id', nextDay.id)
                        .order('sort_order', { ascending: true })

                    if (pe) {
                        planExercises = pe.map(p => ({
                            ...p,
                            exercise_id: p.exercises.id,
                            name: p.exercises.name,
                            movement_type: p.exercises.movement_type
                        }))
                    }
                }

                // 4. Recent Workouts (last 3) -> calculate volume and PRs
                const { data: recentWk } = await supabase
                    .from('workouts')
                    .select(`
            id, started_at, split_day_id,
            split_days (day_name),
            sets (weight_kg, reps, is_pr)
          `)
                    .eq('user_id', user.id)
                    .order('started_at', { ascending: false })
                    .limit(3)

                const recentFormatted = (recentWk || []).map(w => {
                    const prCount = w.sets.filter(s => s.is_pr).length
                    const volume = w.sets.reduce((acc, s) => acc + (s.weight_kg * s.reps), 0)
                    return {
                        id: w.id,
                        date: w.started_at,
                        name: w.split_days?.day_name || 'Workout',
                        prCount,
                        volume
                    }
                })

                // 5. Calculate Quick Stats
                // Workouts this week (Monday → Sunday)
                const now = new Date()
                const dayOfWeek = now.getDay()
                const startOfWeek = new Date(now)
                startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
                startOfWeek.setHours(0, 0, 0, 0)
                const { count: workoutsThisWeek } = await supabase
                    .from('workouts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('started_at', startOfWeek.toISOString())

                const { data: userWorkouts } = await supabase
                    .from('workouts')
                    .select('id')
                    .eq('user_id', user.id)

                let totalPrs = 0
                if (userWorkouts && userWorkouts.length > 0) {
                    const workoutIds = userWorkouts.map(w => w.id)
                    const { count } = await supabase
                        .from('sets')
                        .select('*', { count: 'exact', head: true })
                        .in('workout_id', workoutIds)
                        .eq('is_pr', true)

                    totalPrs = count || 0
                }

                // Top 1RM
                const { data: top1rms } = await supabase
                    .from('estimated_1rms')
                    .select('value_kg')
                    .eq('user_id', user.id)
                    .order('value_kg', { ascending: false })
                    .limit(1)

                const topRM = top1rms?.[0]?.value_kg || 0

                // Plateau alerts
                const { data: alertsData } = await supabase
                    .from('plateau_alerts')
                    .select('id, triggered_at, action_taken, exercises(name)')
                    .eq('user_id', user.id)
                    .is('dismissed_at', null)

                setData({
                    splitDay: nextDay,
                    planExercises,
                    recentWorkouts: recentFormatted,
                    plateauAlerts: alertsData || [],
                    stats: {
                        streak: recentWk?.length || 0, // Simplified streak
                        workoutsThisWeek: workoutsThisWeek || 0,
                        topRM,
                        prCount: totalPrs
                    }
                })
            } catch (err) {
                console.error('Error loading dashboard data:', err)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [user])

    return { data, loading }
}
