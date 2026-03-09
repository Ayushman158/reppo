import { create } from 'zustand'

/**
 * Live workout session state.
 * Manages the active session while user is in the gym.
 * Persisted to Supabase on session end.
 */
export const useWorkoutStore = create((set, get) => ({
  // Active session
  activeSession: null,   // { splitDayId, splitDayName, startedAt }
  currentExerciseIndex: 0,
  sets: {},     // { [exerciseId]: [{weight, reps, setNumber, pr}] }
  restTimer: null,   // seconds remaining
  restTimerExerciseId: null,  // which exercise triggered the current rest timer
  timerInterval: null,

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

    // Start rest timer
    get().startRestTimer(90)
  },

  // ── Update a logged set ──────────────────────────────────
  updateSet: (exerciseId, setIndex, { weight, reps }) => {
    const { sets } = get()
    const existing = sets[exerciseId] || []
    if (setIndex >= existing.length) return // Can't update if it doesn't exist

    const updatedSetsList = [...existing]
    updatedSetsList[setIndex] = { ...updatedSetsList[setIndex], weight, reps }

    set({
      sets: {
        ...sets,
        [exerciseId]: updatedSetsList,
      }
    })
  },

  // ── Move to next exercise ─────────────────────────────────
  nextExercise: () => {
    set(state => ({ currentExerciseIndex: state.currentExerciseIndex + 1 }))
  },

  // ── Rest timer ────────────────────────────────────────────
  startRestTimer: (seconds) => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)

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

  // ── End session (returns data for Supabase save) ─────────
  endSession: () => {
    const { activeSession, sets } = get()
    const sessionData = {
      ...activeSession,
      endedAt: new Date().toISOString(),
      sets,
    }
    // Reset state
    set({
      activeSession: null,
      currentExerciseIndex: 0,
      sets: {},
      restTimer: null,
      restTimerExerciseId: null,
    })
    return sessionData
  },
}))
