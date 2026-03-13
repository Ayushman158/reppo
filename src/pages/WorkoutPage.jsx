import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import './WorkoutPage.css'

// ─── Plate Calculator ───
function calcPlates(w) {
    if (!w || w <= 20) return []
    let perSide = (w - 20) / 2
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25]
    const result = []
    for (const p of plates) {
        while (perSide >= p) { result.push(p); perSide -= p }
    }
    return result
}

// ─── Exercise Search Dropdown ───
function ExerciseSearch({ onSelect, onClose }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const inputRef = useRef(null)

    useEffect(() => { inputRef.current?.focus() }, [])

    useEffect(() => {
        if (query.length < 1) { setResults([]); return }
        const t = setTimeout(async () => {
            const { data } = await supabase
                .from('exercises')
                .select('id, name, equipment, muscle_group')
                .ilike('name', `%${query}%`)
                .limit(8)
            setResults(data || [])
        }, 150)
        return () => clearTimeout(t)
    }, [query])

    return (
        <div className="ex-search-overlay" onClick={onClose}>
            <div className="ex-search-modal" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search exercises…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="ex-search-input"
                />
                <div className="ex-search-results">
                    {results.map(ex => (
                        <button
                            key={ex.id}
                            className="ex-search-item"
                            onClick={() => onSelect(ex)}
                        >
                            <span className="ex-search-name">{ex.name}</span>
                            <span className="ex-search-meta">{ex.muscle_group}</span>
                        </button>
                    ))}
                    {query.length > 0 && results.length === 0 && (
                        <div className="ex-search-empty">No exercises found</div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Set Row ───
function SetRow({ set, index, onToggle, onEdit }) {
    const w = set.weight_kg ?? 0
    const r = set.reps ?? 0
    const done = set.logged

    return (
        <div className={`set-row ${done ? 'done' : ''}`}>
            <span className="set-num">{index + 1}</span>
            <button
                className="set-values"
                onClick={() => !done && onEdit(index)}
            >
                {w}kg × {r}
            </button>
            <button
                className={`set-check ${done ? 'checked' : ''}`}
                onClick={() => {
                    if (!done && navigator.vibrate) navigator.vibrate([15, 30, 15])
                    onToggle(index)
                }}
            >
                {done ? '✓' : '○'}
            </button>
        </div>
    )
}

// ─── Exercise Block ───
function ExerciseBlock({ exercise, sets, lastData, onUpdateSets, onRemove }) {
    const [editing, setEditing] = useState(null)
    const isBarbell = ['barbell'].includes(exercise.equipment)
    const targetW = lastData?.weight_kg || 20
    const targetR = lastData?.reps || 8
    const plates = isBarbell && targetW > 20 ? calcPlates(targetW) : []

    function handleToggle(i) {
        const newSets = [...sets]
        if (i < newSets.length) {
            newSets[i] = { ...newSets[i], logged: !newSets[i].logged }
        }
        onUpdateSets(newSets)
    }

    function addSet() {
        const newSets = [...sets, { weight_kg: targetW, reps: targetR, logged: false }]
        onUpdateSets(newSets)
    }

    function handleEdit(i) {
        setEditing({ index: i, weight_kg: sets[i].weight_kg, reps: sets[i].reps })
    }

    function saveEdit() {
        if (!editing) return
        const newSets = [...sets]
        newSets[editing.index] = {
            ...newSets[editing.index],
            weight_kg: Number(editing.weight_kg),
            reps: Number(editing.reps),
        }
        onUpdateSets(newSets)
        if (navigator.vibrate) navigator.vibrate(10)
        setEditing(null)
    }

    return (
        <div className="exercise-block">
            <div className="ex-header">
                <div>
                    <div className="ex-name">{exercise.name}</div>
                    {lastData && (
                        <div className="ex-last">last: {lastData.weight_kg}kg × {lastData.reps}</div>
                    )}
                </div>
                <button className="ex-remove" onClick={onRemove}>×</button>
            </div>

            {plates.length > 0 && (
                <div className="ex-plates">[{plates.join(', ')}]</div>
            )}

            <div className="sets-container">
                {sets.map((s, i) => (
                    <SetRow
                        key={i}
                        set={s}
                        index={i}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                    />
                ))}
            </div>

            <button className="add-set-btn" onClick={addSet}>+ Set</button>

            {editing && (
                <div className="inline-editor">
                    <span className="editor-label">SET {editing.index + 1}</span>
                    <input
                        type="number"
                        value={editing.weight_kg}
                        onChange={e => setEditing(p => ({ ...p, weight_kg: e.target.value }))}
                        className="editor-input"
                        autoFocus
                    />
                    <span>kg ×</span>
                    <input
                        type="number"
                        value={editing.reps}
                        onChange={e => setEditing(p => ({ ...p, reps: e.target.value }))}
                        className="editor-input"
                    />
                    <button className="editor-done" onClick={saveEdit}>Done</button>
                </div>
            )}
        </div>
    )
}

// ─── Elapsed Timer ───
function useElapsed(startedAt) {
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

// ─── Main Note Page ───
export default function WorkoutPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [workout, setWorkout] = useState(null)
    const [exercises, setExercises] = useState([]) // [{ exercise, sets }]
    const [lastDataMap, setLastDataMap] = useState({}) // { exerciseId: { weight_kg, reps } }
    const [showSearch, setShowSearch] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [notes, setNotes] = useState('')

    const elapsed = useElapsed(workout?.started_at)

    // Load workout and its sets
    useEffect(() => {
        if (!id || !user) return

        async function load() {
            setLoading(true)
            const { data: wk } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', id)
                .single()

            if (!wk) { navigate('/app'); return }
            setWorkout(wk)
            setNotes(wk.notes || '')

            // Load existing sets
            const { data: setsData } = await supabase
                .from('sets')
                .select('exercise_id, weight_kg, reps, set_number, is_pr, exercises(id, name, equipment, muscle_group)')
                .eq('workout_id', id)
                .order('set_number')

            if (setsData && setsData.length > 0) {
                // Group by exercise
                const grouped = {}
                const exerciseMap = {}
                setsData.forEach(s => {
                    const exId = s.exercise_id
                    if (!grouped[exId]) grouped[exId] = []
                    grouped[exId].push({ weight_kg: s.weight_kg, reps: s.reps, logged: true })
                    exerciseMap[exId] = s.exercises
                })

                const exList = Object.entries(grouped).map(([exId, sets]) => ({
                    exercise: exerciseMap[exId],
                    sets,
                }))
                setExercises(exList)

                // Fetch last data for those exercises
                await fetchLastData(Object.keys(grouped), id)
            }

            setLoading(false)
        }
        load()
    }, [id, user])

    // Fetch "last time" data for a list of exercise IDs
    async function fetchLastData(exerciseIds, currentWorkoutId) {
        const map = {}
        for (const exId of exerciseIds) {
            const { data } = await supabase
                .from('sets')
                .select('weight_kg, reps, workout_id')
                .eq('exercise_id', exId)
                .neq('workout_id', currentWorkoutId)
                .order('logged_at', { ascending: false })
                .limit(1)
            if (data && data.length > 0) {
                map[exId] = { weight_kg: data[0].weight_kg, reps: data[0].reps }
            }
        }
        setLastDataMap(prev => ({ ...prev, ...map }))
    }

    // Add exercise from search
    async function handleAddExercise(ex) {
        setShowSearch(false)
        const lastW = lastDataMap[ex.id]?.weight_kg || 20
        const lastR = lastDataMap[ex.id]?.reps || 8

        // Fetch last data if we don't have it
        if (!lastDataMap[ex.id]) {
            await fetchLastData([ex.id], id)
        }

        const defaultSets = [
            { weight_kg: lastDataMap[ex.id]?.weight_kg || lastW, reps: lastDataMap[ex.id]?.reps || lastR, logged: false },
            { weight_kg: lastDataMap[ex.id]?.weight_kg || lastW, reps: lastDataMap[ex.id]?.reps || lastR, logged: false },
            { weight_kg: lastDataMap[ex.id]?.weight_kg || lastW, reps: lastDataMap[ex.id]?.reps || lastR, logged: false },
        ]

        setExercises(prev => [...prev, { exercise: ex, sets: defaultSets }])
    }

    function handleRemoveExercise(index) {
        setExercises(prev => prev.filter((_, i) => i !== index))
    }

    function handleUpdateSets(exIndex, newSets) {
        setExercises(prev => prev.map((e, i) => i === exIndex ? { ...e, sets: newSets } : e))
    }

    // Save and go back
    const handleSave = useCallback(async () => {
        if (saving || !workout) return
        setSaving(true)

        // Delete old sets for this workout
        await supabase.from('sets').delete().eq('workout_id', workout.id)

        // Insert new sets
        const setsToInsert = []
        exercises.forEach(({ exercise, sets }) => {
            sets.forEach((s, i) => {
                if (s.logged) {
                    setsToInsert.push({
                        workout_id: workout.id,
                        exercise_id: exercise.id,
                        set_number: i + 1,
                        weight_kg: s.weight_kg,
                        reps: s.reps,
                        is_pr: false,
                    })
                }
            })
        })

        if (setsToInsert.length > 0) {
            await supabase.from('sets').insert(setsToInsert)
        }

        // Update workout notes + ended_at
        await supabase
            .from('workouts')
            .update({
                notes,
                ended_at: new Date().toISOString(),
            })
            .eq('id', workout.id)

        navigate('/app')
    }, [saving, workout, exercises, notes, navigate])

    if (loading) {
        return (
            <div className="note-container">
                <div className="note-loading">Loading…</div>
            </div>
        )
    }

    const dateStr = workout?.started_at
        ? new Date(workout.started_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric'
        })
        : 'New Workout'

    return (
        <div className="note-container">
            <header className="note-header">
                <button className="back-btn" onClick={handleSave}>
                    {saving ? 'Saving…' : '‹ Back'}
                </button>
                <span className="note-timer">{elapsed}</span>
            </header>

            <h1 className="note-date-title">{dateStr}</h1>

            <textarea
                className="note-freetext"
                placeholder="How are you feeling?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={1}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />

            <div className="exercises-list">
                {exercises.map((ex, i) => (
                    <ExerciseBlock
                        key={`${ex.exercise.id}-${i}`}
                        exercise={ex.exercise}
                        sets={ex.sets}
                        lastData={lastDataMap[ex.exercise.id]}
                        onUpdateSets={(newSets) => handleUpdateSets(i, newSets)}
                        onRemove={() => handleRemoveExercise(i)}
                    />
                ))}
            </div>

            <button className="add-exercise-btn" onClick={() => setShowSearch(true)}>
                + Add Exercise
            </button>

            {showSearch && (
                <ExerciseSearch
                    onSelect={handleAddExercise}
                    onClose={() => setShowSearch(false)}
                />
            )}
        </div>
    )
}
