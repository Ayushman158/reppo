import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkoutStore } from '@/store/workoutStore'
import { useAuthStore } from '@/store/authStore'
import { useOneRM } from '@/hooks/useOneRM'

import './WorkoutPage.css'

// ─── ELAPSED TIMER ────────────────────────────────────────────

function useElapsedTime(startedAt) {
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        if (!startedAt) return
        const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [startedAt])
    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── REST TIMER ───────────────────────────────────────────────

function RestSweep({ secondsRemaining, totalSeconds, onSkip }) {
    if (!secondsRemaining || secondsRemaining <= 0) return null
    const pct = ((totalSeconds - secondsRemaining) / totalSeconds) * 100
    return (
        <div className="rest-sweep-container" onClick={onSkip}>
            <div className="rest-sweep-fill" style={{ width: `${pct}%` }} />
            <div className="rest-sweep-text font-mono text-xs">
                REST {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')} · tap to skip
            </div>
        </div>
    )
}

// ─── PLATE CALCULATOR ──────────────────────────────────────────
function calculatePlates(targetWeight) {
    if (!targetWeight || targetWeight <= 20) return []
    // standard 20kg bar
    let remainingPerSide = (targetWeight - 20) / 2
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]
    const platesToUse = []

    for (const p of availablePlates) {
        while (remainingPerSide >= p) {
            platesToUse.push(p)
            remainingPerSide -= p
        }
    }
    return platesToUse
}

// ─── SET ROW ─────────────────────────────────────────────────

function SetRow({ setIndex, weight, reps, isDone, onEdit, onToggle, targetWeight, targetReps, isPr }) {
    const displayWeight = weight ?? targetWeight ?? 0
    const displayReps = reps ?? targetReps ?? 0

    const triggerHaptic = () => {
        if (!isDone && navigator.vibrate) {
            navigator.vibrate([15, 30, 15]) // rewarding double-tap haptic
        }
        onToggle(displayWeight, displayReps)
    }

    return (
        <div className={`set-row ${isDone ? 'done' : ''} ${isPr ? 'pr-burst' : ''}`}>
            <div className="set-number font-mono">{setIndex + 1}</div>
            <div className="set-inputs" onClick={() => !isDone && onEdit(setIndex, displayWeight, displayReps)}>
                <span className={isDone ? 'set-val-done' : 'set-val-pending'}>
                    {displayWeight}kg × {displayReps}
                </span>
            </div>
            <button
                className={`set-check ${isDone ? 'checked' : ''}`}
                onClick={triggerHaptic}
                aria-label={isDone ? 'Unlog set' : 'Log set'}
            >
                {isDone && <span className="animate-check-fill">✓</span>}
            </button>
        </div>
    )
}

// ─── EXERCISE BLOCK ───────────────────────────────────────────

function ExerciseBlock({ planEx }) {
    const { target, lastWeight, lastReps } = useOneRM(planEx.exercise_id, {
        repMin: planEx.target_rep_min,
        repMax: planEx.target_rep_max,
    })

    const { logSet, updateSet, sets, restTimer, restTimerExerciseId, skipRestTimer } = useWorkoutStore()
    const loggedSets = sets[planEx.exercise_id] || []
    const [editingSet, setEditingSet] = useState(null)

    const handleToggle = (setIdx, defWeight, defReps) => {
        if (setIdx === loggedSets.length) {
            logSet(planEx.exercise_id, { weight: defWeight, reps: defReps })
        }
    }

    // AI target as pre-fill; fallback to last session, then safe defaults
    const targetW = target?.weightHigh ?? lastWeight ?? 20
    const targetR = target?.repHigh ?? lastReps ?? 8
    const allDone = loggedSets.length >= planEx.target_sets

    // Show current row + one preview row
    const visibleRows = Math.min(loggedSets.length + 1, Math.max(planEx.target_sets, loggedSets.length + 1))
    const rows = []
    for (let i = 0; i < visibleRows; i++) {
        const logged = loggedSets[i]
        rows.push(
            <SetRow
                key={i}
                setIndex={i}
                weight={logged?.weight}
                reps={logged?.reps}
                isDone={!!logged}
                isPr={logged?.isPr}
                targetWeight={targetW}
                targetReps={targetR}
                onEdit={(idx, w, r) => setEditingSet({ index: idx, weight: w, reps: r })}
                onToggle={(w, r) => handleToggle(i, w, r)}
            />
        )
    }

    const showTimer = restTimerExerciseId === planEx.exercise_id && restTimer > 0
    const isBarbell = planEx.equipment === 'barbell' || planEx.name.toLowerCase().includes('barbell') || planEx.name.toLowerCase().includes('squat') || planEx.name.toLowerCase().includes('deadlift')
    const calculatedPlates = isBarbell && targetW > 20 ? calculatePlates(targetW) : []

    return (
        <div className={`exercise-block ${allDone ? 'ex-complete' : ''}`}>
            <div className="ex-block-header">
                <div className="ex-title-group">
                    <Link to={`/app/exercise/${planEx.exercise_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="ex-title">{planEx.name}</h3>
                    </Link>
                    {lastWeight && (
                        <div className="ex-last font-mono text-xs text-ink3">
                            last · {lastWeight}kg × {lastReps}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {target && (
                        <div className="ex-ai-target font-mono">
                            {target.weightHigh}kg × {target.repHigh}
                        </div>
                    )}
                    {calculatedPlates.length > 0 && (
                        <div className="plate-math-row animate-fade-in font-mono text-xs mt-1" style={{ color: 'var(--ink3)' }}>
                            [{calculatedPlates.join(', ')}]
                        </div>
                    )}
                </div>
            </div>

            <div className="sets-container">{rows}</div>

            {showTimer && (
                <RestSweep secondsRemaining={restTimer} totalSeconds={90} onSkip={skipRestTimer} />
            )}

            {editingSet && (
                <div className="inline-editor">
                    <span className="font-mono text-sm text-ink3 mr-4">SET {editingSet.index + 1}</span>
                    <input
                        type="number"
                        value={editingSet.weight}
                        onChange={(e) => setEditingSet({ ...editingSet, weight: e.target.value })}
                        autoFocus
                        className="inline-input font-mono w-16"
                    /> kg
                    <span className="mx-2">×</span>
                    <input
                        type="number"
                        value={editingSet.reps}
                        onChange={(e) => setEditingSet({ ...editingSet, reps: e.target.value })}
                        className="inline-input font-mono w-12"
                    />
                    <button className="inline-editor-done" onClick={() => {
                        updateSet(planEx.exercise_id, editingSet.index, {
                            weight: Number(editingSet.weight),
                            reps: Number(editingSet.reps),
                        })
                        if (navigator.vibrate) navigator.vibrate(10) // light haptic on edit save
                        setEditingSet(null)
                    }}>Done</button>
                </div>
            )}
        </div>
    )
}

// ─── MAIN PAGE ───────────────────────────────────────────────

export default function WorkoutPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { activeSession, sets, endSession } = useWorkoutStore()
    const [isFinishing, setIsFinishing] = useState(false)
    const [sessionName, setSessionName] = useState('')
    const elapsed = useElapsedTime(activeSession?.startedAt)

    useEffect(() => {
        if (!activeSession) navigate('/app')
        else if (!sessionName) setSessionName(activeSession.day_name || '')
    }, [activeSession, navigate, sessionName])

    if (!activeSession) return null

    const planExercises = activeSession.planExercises || []
    const doneCount = planExercises.filter(pe => (sets[pe.exercise_id]?.length || 0) >= pe.target_sets).length
    const totalCount = planExercises.length

    const handleFinish = async () => {
        setIsFinishing(true)
        const sessionData = endSession()  // clears activeSession, stores completedSession

        try {
            const { data: wkData, error: wkErr } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    split_day_id: sessionData.id,
                    started_at: sessionData.startedAt,
                    ended_at: sessionData.endedAt,
                    name: sessionName,
                })
                .select()
                .single()

            if (wkErr) throw wkErr

            const setsToInsert = []
            for (const [exId, exSets] of Object.entries(sessionData.sets)) {
                exSets.forEach(s => {
                    setsToInsert.push({
                        workout_id: wkData.id,
                        exercise_id: exId,
                        set_number: s.setNumber,
                        weight_kg: s.weight,
                        reps: s.reps,
                        is_pr: s.isPr || false,
                        logged_at: s.loggedAt,
                    })
                })
            }

            if (setsToInsert.length > 0) {
                const { error: setsErr } = await supabase.from('sets').insert(setsToInsert)
                if (setsErr) throw setsErr
            }

            navigate('/app/workout/complete')
        } catch (err) {
            console.error('Failed to save session:', err)
            alert('Failed to save session. Check console.')
            setIsFinishing(false)
        }
    }

    return (
        <div className="session-note-container animate-fade-in">
            <header className="note-page-header">
                <button className="text-target back-btn" onClick={() => navigate('/app')}>
                    <span style={{ fontSize: 22 }}>‹</span> Notebook
                </button>
                <div className="session-progress font-mono text-xs text-ink3">
                    {doneCount}/{totalCount} · {elapsed}
                </div>
                <button
                    className="finish-text-btn text-target"
                    style={{ fontWeight: 700 }}
                    onClick={handleFinish}
                    disabled={isFinishing}
                >
                    {isFinishing ? 'Saving…' : 'Done'}
                </button>
            </header>

            <input
                type="text"
                className="session-title-input font-display text-2xl"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Session name"
            />

            <div className="session-meta font-mono text-xs text-ink3 mb-8">
                {new Date(activeSession.startedAt).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                })} · {elapsed} elapsed
            </div>

            <textarea
                className="freeform-block font-sans text-base mb-6"
                placeholder="How are you feeling today?"
                rows={1}
                onInput={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                }}
            />

            <div className="blocks-container flex-col gap-6 mb-12">
                {planExercises.map((pe) => (
                    <ExerciseBlock key={pe.id} planEx={pe} />
                ))}
            </div>

            <textarea
                className="freeform-block font-sans text-base mt-8 mb-16"
                placeholder="Session summary or notes…"
                rows={1}
                onInput={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                }}
            />
        </div>
    )
}
