import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { rollingOneRM, generateTarget, detectTrend, isPlateaued } from '@/lib/1rm'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook: fetch and compute 1RM data for one exercise.
 *
 * @param {string} exerciseId
 * @returns {{ oneRM, target, trend, plateaued, loading }}
 */
export function useOneRM(exerciseId, { repMin = 6, repMax = 8 } = {}) {
  const { user } = useAuthStore()
  const [oneRM, setOneRM] = useState(null)
  const [target, setTarget] = useState(null)
  const [trend, setTrend] = useState('flat')
  const [plateaued, setPlateaued] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !exerciseId) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)

      // Fetch last 4 best sets for this exercise (most recent first)
      const { data: sets } = await supabase
        .from('sets')
        .select('weight_kg, reps, workouts(started_at)')
        .eq('exercise_id', exerciseId)
        .eq('workouts.user_id', user.id)
        .eq('is_warmup', false)
        .order('workouts(started_at)', { ascending: false })
        .limit(40) // enough to get 4 sessions worth

      if (!sets || sets.length === 0) {
        // Fallback: Check if we have an estimated 1RM from onboarding!
        const { data: estRm } = await supabase
          .from('estimated_1rms')
          .select('value_kg')
          .eq('exercise_id', exerciseId)
          .eq('user_id', user.id)
          .single()

        if (estRm) {
          setOneRM(estRm.value_kg)
          setTarget(generateTarget({
            oneRM: estRm.value_kg,
            targetRepMin: repMin,
            targetRepMax: repMax,
            trend: 'flat',
            isFirstSession: true,
          }))
        }

        setLoading(false)
        return
      }

      // Group by session, keep best set per session
      const bySession = {}
      sets.forEach(s => {
        const date = s.workouts?.started_at?.split('T')[0]
        if (!date) return
        if (!bySession[date] || s.weight_kg > bySession[date].weight_kg) {
          bySession[date] = { weight: s.weight_kg, reps: s.reps }
        }
      })

      const recentSets = Object.values(bySession).slice(0, 4)

      // Calculate rolling 1RM
      const rm = rollingOneRM(recentSets)
      setOneRM(rm)

      // Trend + plateau
      const rmHistory = recentSets.map(s => s.weight * (1 + s.reps / 30))
      const t = detectTrend(rmHistory.reverse())
      setTrend(t)
      setPlateaued(isPlateaued(rmHistory))

      // Generate today's target
      setTarget(generateTarget({
        oneRM: rm,
        targetRepMin: repMin,
        targetRepMax: repMax,
        trend: t,
        isFirstSession: recentSets.length === 0,
      }))

      setLoading(false)
    }

    load()
  }, [user, exerciseId, repMin, repMax])

  return { oneRM, target, trend, plateaued, loading }
}
