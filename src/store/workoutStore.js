import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Live workout session state.
 * Persisted to localStorage so the session survives navigation away or accidental refresh.
 * Saved to Supabase on session end.
 */
export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // Active session
      activeSession: null,   // { splitDayId, splitDayName, startedAt, planExercises }
      currentExerciseIndex: 0,
      sets: {},     // { [exerciseId]: [{weight, reps, setNumber, isPr, loggedAt}] }
      restTimer: null,
      restTimerExerciseId: null,
      timerInterval: null,

      // Completed session held for the celebration screen
      completedSession: null,  // { ...sessionData, volume, prCount, durationSeconds }

      // ── Start a new session ──────────────────────────────────
      startSession: (splitDay, planExercises) => {
        set({
          activeSession: {
            ...splitDay,
            planExercises,
            startedAt: new Date().toISOString(),
          },
          currentExerciseIndex: 0,
          sets: {},
          completedSession: null,
        })
      },

      // ── Log a set ────────────────────────────────────────────
      logSet: (exerciseId, { weight, reps, isPr = false }) => {
        const { sets } = get()
        const existing = sets[exerciseId] || []
        const setNumber = existing.length + 1

        set({
          sets: {
            ...sets,
            [exerciseId]: [...existing, { weight, reps, setNumber, isPr, loggedAt: new Date().toISOString() }],
          },
          restTimerExerciseId: exerciseId,
        })

        get().startRestTimer(90)
      },

      // ── Update a logged set ──────────────────────────────────
      updateSet: (exerciseId, setIndex, { weight, reps }) => {
        const { sets } = get()
        const existing = sets[exerciseId] || []
        if (setIndex >= existing.length) return

        const updatedSetsList = [...existing]
        updatedSetsList[setIndex] = { ...updatedSetsList[setIndex], weight, reps }

        set({ sets: { ...sets, [exerciseId]: updatedSetsList } })
      },

      // ── Move to next exercise ─────────────────────────────────
      nextExercise: () => {
        set(state => ({ currentExerciseIndex: state.currentExerciseIndex + 1 }))
      },

      // ── Rest timer ────────────────────────────────────────────
      startRestTimer: (seconds) => {
        // Clear on persist restore — intervals can't be serialized
        const existing = get().timerInterval
        if (existing) clearInterval(existing)

        set({ restTimer: seconds })

        const interval = setInterval(() => {
          const { restTimer } = get()
          if (restTimer <= 1) {
            clearInterval(interval)
            set({ restTimer: 0, timerInterval: null })
          } else {
            set(state => ({ restTimer: state.restTimer - 1 }))
          }
        }, 1000)

        set({ timerInterval: interval })
      },

      skipRestTimer: () => {
        const { timerInterval } = get()
        if (timerInterval) clearInterval(timerInterval)
        set({ restTimer: 0, timerInterval: null, restTimerExerciseId: null })
      },

      // ── End session (builds completedSession, clears active) ─
      endSession: () => {
        const { activeSession, sets } = get()

        // Compute stats
        let volume = 0
        let prCount = 0
        for (const exSets of Object.values(sets)) {
          for (const s of exSets) {
            volume += (s.weight || 0) * (s.reps || 0)
            if (s.isPr) prCount++
          }
        }

        const startedAt = activeSession?.startedAt
        const endedAt = new Date().toISOString()
        const durationSeconds = startedAt
          ? Math.floor((new Date(endedAt) - new Date(startedAt)) / 1000)
          : 0

        const sessionData = {
          ...activeSession,
          endedAt,
          sets,
        }

        const completed = {
          ...sessionData,
          volume: Math.round(volume),
          prCount,
          durationSeconds,
        }

        const { timerInterval } = get()
        if (timerInterval) clearInterval(timerInterval)

        set({
          activeSession: null,
          currentExerciseIndex: 0,
          sets: {},
          restTimer: null,
          timerInterval: null,
          restTimerExerciseId: null,
          completedSession: completed,
        })

        return sessionData
      },

      clearCompletedSession: () => set({ completedSession: null }),
    }),
    {
      name: 'reppo-workout-session',
      // Don't persist the timer interval handle (it can't be serialized)
      partialize: (state) => ({
        activeSession: state.activeSession,
        sets: state.sets,
        currentExerciseIndex: state.currentExerciseIndex,
        completedSession: state.completedSession,
        restTimerExerciseId: state.restTimerExerciseId,
        // restTimer intentionally omitted — stale timer after refresh is worse UX
      }),
    }
  )
)
