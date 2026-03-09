import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkoutStore } from '@/store/workoutStore'
import { useAuthStore } from '@/store/authStore'
import { useOneRM } from '@/hooks/useOneRM'

import './WorkoutPage.css'

// ─── HELPER COMPONENTS ───────────────────────────────────────

function RestSweep({ secondsRemaining, totalSeconds, onSkip }) {
    if (secondsRemaining === null || secondsRemaining <= 0) return null;
    const pct = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

    return (
        <div className="rest-sweep-container" onClick={onSkip}>
            <div className="rest-sweep-track">
                <div className="rest-sweep-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="rest-sweep-text font-mono text-xs">
                REST {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')} · tap to skip
            </div>
        </div>
    )
}

function SetRow({ setIndex, weight, reps, isDone, onEdit, onToggle, targetWeight, targetReps, isPr }) {
    const displayWeight = weight || targetWeight || 0
    const displayReps = reps || targetReps || 0

    return (
        <div className={`set-row ${isDone ? 'done' : ''} ${isPr ? 'pr-burst' : ''}`}>
            <div className="set-number font-mono">{setIndex + 1}</div>
            <div className="set-inputs" onClick={() => onEdit(setIndex, displayWeight, displayReps)}>
                <span className={isDone ? 'text-ink' : 'text-target'}>{displayWeight}</span> kg
                <span className="text-ink3 mx-2">×</span>
                <span className={isDone ? 'text-ink' : 'text-target'}>{displayReps}</span>
            </div>
            <button
                className={`set-check ${isDone ? 'checked' : ''}`}
                onClick={() => onToggle(displayWeight, displayReps)}
            >
                {isDone && <span className="animate-check-fill">✓</span>}
            </button>
        </div>
    )
}

function ExerciseBlock({ planEx, isCompleted }) {
    const { target } = useOneRM(planEx.exercise_id, {
        repMin: planEx.target_rep_min,
        repMax: planEx.target_rep_max
    })

    const { logSet, updateSet, sets, restTimer, restTimerExerciseId, skipRestTimer } = useWorkoutStore()
    const loggedSets = sets[planEx.exercise_id] || []

    const [editingSet, setEditingSet] = useState(null)

    const handleToggleSet = (setIdx, defWeight, defReps) => {
        if (setIdx === loggedSets.length) {
            const isPr = Math.random() > 0.85;
            logSet(planEx.exercise_id, {
                weight: defWeight,
                reps: defReps,
                isPr
            })
        }
    }

    const targetW = target?.weightHigh || 20
    const targetR = target?.repHigh || 10

    const totalSetRows = Math.max(planEx.target_sets, loggedSets.length + 1)
    const rows = []

    for (let i = 0; i < totalSetRows; i++) {
        const logged = loggedSets[i]
        const isDone = !!logged
        if (i > loggedSets.length) continue;

        rows.push(
            <SetRow
                key={i}
                setIndex={i}
                weight={logged?.weight}
                reps={logged?.reps}
                isDone={isDone}
                isPr={logged?.isPr}
                targetWeight={targetW}
                targetReps={targetR}
                onEdit={(idx, w, r) => setEditingSet({ index: idx, weight: w, reps: r })}
                onToggle={(w, r) => handleToggleSet(i, w, r)}
            />
        )
    }

    // Show rest timer only for the exercise that triggered it
    const showRestTimer = restTimerExerciseId === planEx.exercise_id && restTimer > 0

    return (
        <div className={`exercise-block ${isCompleted ? 'completed opacity-60' : ''}`}>
            <div className="ex-block-header">
                <h3 className="ex-title">{planEx.name}</h3>
                {target && (
                    <div className="ex-ai-target font-mono">
                        {target.weightHigh}kg × {target.repHigh}
                    </div>
                )}
            </div>

            <div className="sets-container">
                {rows}
            </div>

            {showRestTimer && (
                <RestSweep secondsRemaining={restTimer} totalSeconds={90} onSkip={skipRestTimer} />
            )}

            {editingSet && (
                <div className="inline-editor animate-slide-up-fade">
                    <span className="font-mono text-sm text-ink3 mr-4">SET {editingSet.index + 1}</span>
                    <input type="number" value={editingSet.weight}
                        onChange={(e) => setEditingSet({ ...editingSet, weight: e.target.value })}
                        autoFocus
                        className="inline-input font-mono w-16" /> kg
                    <span className="mx-2">×</span>
                    <input type="number" value={editingSet.reps} className="inline-input font-mono w-12"
                        onChange={(e) => setEditingSet({ ...editingSet, reps: e.target.value })} />
                    <button className="inline-editor-done" onClick={() => {
                        updateSet(planEx.exercise_id, editingSet.index, { weight: Number(editingSet.weight), reps: Number(editingSet.reps) })
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
    const [sessionName, setSessionName] = useState("")

    useEffect(() => {
        if (!activeSession) {
            navigate('/app')
        } else {
            setSessionName(activeSession.day_name)
        }
    }, [activeSession, navigate])

    if (!activeSession) return null

    const planExercises = activeSession.planExercises || []

    // Progress: count exercises with at least one logged set
    const doneCount = planExercises.filter(pe => (sets[pe.exercise_id]?.length || 0) > 0).length
    const totalCount = planExercises.length

    const handleFinish = async () => {
        setIsFinishing(true)
        const sessionData = endSession()

        try {
            const { data: wkData, error: wkErr } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    split_day_id: sessionData.id,
                    started_at: sessionData.startedAt,
                    ended_at: sessionData.endedAt,
                    name: sessionName
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
                        logged_at: s.loggedAt
                    })
                })
            }

            if (setsToInsert.length > 0) {
                const { error: setsErr } = await supabase.from('sets').insert(setsToInsert)
                if (setsErr) throw setsErr
            }

            navigate('/app')
        } catch (err) {
            console.error('Failed to save session note:', err)
            alert("Failed to save session note. Check console.")
            setIsFinishing(false)
        }
    }

    return (
        <div className="session-note-container animate-fade-in">
            {/* Header */}
            <header className="note-page-header">
                <button className="text-target back-btn" onClick={() => navigate('/app')}>
                    <span className="text-xl">‹</span> Notebook
                </button>
                <div className="session-progress font-mono text-xs text-ink3">
                    {doneCount} / {totalCount}
                </div>
                <button
                    className="finish-text-btn text-target font-bold"
                    onClick={handleFinish}
                    disabled={isFinishing}
                >
                    {isFinishing ? 'Saving...' : 'Done'}
                </button>
            </header>

            {/* Editable Title */}
            <input
                type="text"
                className="session-title-input font-display text-3xl"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
            />

            <div className="session-meta font-mono text-xs text-ink3 mb-8">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>

            {/* Freeform initial thought block */}
            <textarea
                className="freeform-block font-sans text-base mb-6"
                placeholder="How are you feeling today?"
                rows={1}
                onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
            />

            {/* Exercise Blocks */}
            <div className="blocks-container flex-col gap-6 mb-12">
                {planExercises.map((pe) => (
                    <ExerciseBlock
                        key={pe.id}
                        planEx={pe}
                        isCompleted={false}
                    />
                ))}
            </div>

            <textarea
                className="freeform-block font-sans text-base mt-8 mb-16"
                placeholder="Session summary or notes..."
                rows={1}
                onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
            />
        </div>
    )
}
