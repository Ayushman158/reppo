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

// ─── Smart Paste: parse plain text into structured exercises ───
const SKIP_PATTERNS = [
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /^(day\s*\d|week\s*\d)/i,
    /^why[:]/i,
    /^[•\-\*]\s/,
    /^[➕⸻━─═]/,
    /^(cardio|abs circuit|daily|every day|consistency|that'?s it)/i,
    /^(light |rest|recovery|stretch)/i,
    /^[A-Z\s–—-]+$/,  // ALL-CAPS day headers like "MONDAY – Upper"
    /^\d+\s*(min|sec|s\/side)/i,
    /^(add|why|note|tip)/i,
]

function isSkipLine(line) {
    const trimmed = line.trim()
    if (trimmed.length < 3) return true
    if (/^[⸻━─═\-_*]{3,}$/.test(trimmed)) return true  // separators
    for (const pat of SKIP_PATTERNS) {
        if (pat.test(trimmed)) return true
    }
    // Skip lines that are just parenthetical notes
    if (/^\(.*\)$/.test(trimmed)) return true
    return false
}

function parseSetRep(line) {
    // Format: "3x5–8", "3x5-8", "2x10–12", "3–4x12–20", "3x8", "2 sets"
    // Also: "80kg x 8", "80 x 8" 
    const dashChars = '[\\-–—]'

    // Pattern 1: SETSxREP_MIN–REP_MAX  e.g. "3x5–8" or "3-4x12-20"
    const rangeMatch = line.match(new RegExp(`(\\d+)(?:${dashChars}(\\d+))?\\s*[x×]\\s*(\\d+)(?:${dashChars}(\\d+))?`, 'i'))
    if (rangeMatch) {
        const setCount = parseInt(rangeMatch[1])
        const repMin = parseInt(rangeMatch[3])
        const repMax = rangeMatch[4] ? parseInt(rangeMatch[4]) : repMin
        // Use the middle of the rep range
        const reps = Math.round((repMin + repMax) / 2)
        return { setCount: Math.min(setCount, 8), reps, weight: null }
    }

    // Pattern 2: "80kg x 8" weight-based
    const weightMatch = line.match(/(\d+(?:\.\d+)?)\s*kg\s*[x×]\s*(\d+)/i)
    if (weightMatch) {
        return { setCount: 1, reps: parseInt(weightMatch[2]), weight: parseFloat(weightMatch[1]) }
    }

    // Pattern 3: "2 sets" only
    const setsOnly = line.match(/(\d+)\s*sets?/i)
    if (setsOnly) {
        return { setCount: parseInt(setsOnly[1]), reps: 10, weight: null }
    }

    return null
}

function PasteRoutine({ onParsed, onClose }) {
    const [text, setText] = useState('')
    const [parsing, setParsing] = useState(false)
    const textRef = useRef(null)

    useEffect(() => { textRef.current?.focus() }, [])

    async function handleParse() {
        if (!text.trim() || parsing) return
        setParsing(true)

        const { data: allExercises } = await supabase
            .from('exercises')
            .select('id, name, equipment, muscle_group')

        const exerciseLib = allExercises || []
        const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

        const libMap = {}
        exerciseLib.forEach(ex => { libMap[norm(ex.name)] = ex })
        const libNames = Object.keys(libMap)

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        const result = []

        for (const line of lines) {
            if (isSkipLine(line)) continue

            // Extract exercise name: everything before " – 3x" or " - 3x" or " (" 
            let namePart = line
                .replace(/\s*[–—-]\s*\d+.*$/, '')     // Remove " – 3x5–8 ..."
                .replace(/\s*\(.*\)\s*/g, '')           // Remove "(progression lift)"
                .replace(/\s*\d+\s*[x×]\s*\d+.*$/i, '') // Remove "3x5-8" if no dash separator
                .replace(/\s*\d+\s*sets?.*$/i, '')       // Remove "2 sets"
                .trim()

            const normalizedName = norm(namePart)
            if (normalizedName.length < 3) continue

            // Fuzzy match against library
            let bestMatch = null
            let bestScore = 0

            for (const libName of libNames) {
                if (normalizedName === libName) {
                    bestMatch = libMap[libName]; bestScore = 1000; break
                }
                if (normalizedName.includes(libName) || libName.includes(normalizedName)) {
                    const score = Math.min(normalizedName.length, libName.length)
                    if (score > bestScore) { bestScore = score; bestMatch = libMap[libName] }
                }
            }

            // Partial word match ("bench" → "bench press", "lateral" → "lateral raise")
            if (!bestMatch) {
                const words = normalizedName.split(' ')
                for (const libName of libNames) {
                    for (const word of words) {
                        if (word.length >= 4 && libName.includes(word)) {
                            const score = word.length
                            if (score > bestScore) { bestScore = score; bestMatch = libMap[libName] }
                        }
                    }
                }
            }

            if (!bestMatch) continue

            const parsed = parseSetRep(line)
            const setCount = parsed?.setCount || 3
            const reps = parsed?.reps || 8
            const weight = parsed?.weight || null

            // Don't duplicate — if the same exercise appears again in a different day, just add it
            const sets = []
            for (let i = 0; i < setCount; i++) {
                sets.push({ weight_kg: weight || 20, reps, logged: false })
            }

            result.push({ exercise: bestMatch, sets })
        }

        setParsing(false)
        onParsed(result)
        onClose()
    }

    return (
        <div className="ex-search-overlay" onClick={onClose}>
            <div className="ex-search-modal paste-modal" onClick={e => e.stopPropagation()}>
                <div className="paste-header">Paste your routine</div>
                <p className="paste-hint">Paste your entire week from Notes. Day headers and notes are auto-skipped.</p>
                <textarea
                    ref={textRef}
                    className="paste-textarea"
                    placeholder={`Bench Press – 3x5–8\nBarbell Row – 3x6–10\nLateral Raises – 3x12–20\nTricep Pushdown – 2x8–12`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={10}
                />
                <button className="paste-go-btn" onClick={handleParse} disabled={parsing || !text.trim()}>
                    {parsing ? 'Parsing…' : `Structure It →`}
                </button>
            </div>
        </div>
    )
}

// ─── Set Row ───
function SetRow({ set, index, onToggle, onEdit, onDelete, total }) {
    const w = set.weight_kg ?? 0
    const r = set.reps ?? 0
    const done = set.logged

    return (
        <div className={`set-row ${done ? 'done' : ''}`}>
            <span className="set-num">{index + 1}</span>
            <button className="set-values" onClick={() => onEdit(index)}>
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
            {total > 1 && (
                <button className="set-delete" onClick={() => onDelete(index)}>🗑</button>
            )}
        </div>
    )
}

// ─── Exercise Block ───
function ExerciseBlock({ exercise, sets, lastData, onUpdateSets, onRemove }) {
    const [editing, setEditing] = useState(null)
    const isBarbell = ['barbell'].includes(exercise.equipment)
    const firstW = sets[0]?.weight_kg || 20
    const plates = isBarbell && firstW > 20 ? calcPlates(firstW) : []
    const lastW = sets.length > 0 ? sets[sets.length - 1].weight_kg : (lastData?.weight_kg || 20)
    const lastR = sets.length > 0 ? sets[sets.length - 1].reps : (lastData?.reps || 8)

    function handleToggle(i) {
        const newSets = [...sets]
        newSets[i] = { ...newSets[i], logged: !newSets[i].logged }
        onUpdateSets(newSets)
    }

    function handleDelete(i) {
        onUpdateSets(sets.filter((_, idx) => idx !== i))
    }

    function addSet() {
        onUpdateSets([...sets, { weight_kg: lastW, reps: lastR, logged: false }])
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
            logged: newSets[editing.index].logged,
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
                        total={sets.length}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            <button className="add-set-btn" onClick={addSet}>+ Set</button>

            {editing && (
                <div className="inline-editor">
                    <span className="editor-label">SET {editing.index + 1}</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={editing.weight_kg}
                        onChange={e => setEditing(p => ({ ...p, weight_kg: e.target.value }))}
                        className="editor-input"
                        autoFocus
                    />
                    <span>kg ×</span>
                    <input
                        type="number"
                        inputMode="numeric"
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
    const [showPaste, setShowPaste] = useState(false)
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

    // Handle pasted routine
    async function handlePastedRoutine(parsedExercises) {
        if (parsedExercises.length === 0) return
        // Fetch last data for all new exercises
        const newExIds = parsedExercises.map(p => p.exercise.id)
        await fetchLastData(newExIds, id)
        setExercises(prev => [...prev, ...parsedExercises])
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

            <div className="add-buttons-row">
                <button className="add-exercise-btn" onClick={() => setShowSearch(true)}>
                    + Add Exercise
                </button>
                <button className="paste-btn" onClick={() => setShowPaste(true)}>
                    📋 Paste Routine
                </button>
            </div>

            {showSearch && (
                <ExerciseSearch
                    onSelect={handleAddExercise}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {showPaste && (
                <PasteRoutine
                    onParsed={handlePastedRoutine}
                    onClose={() => setShowPaste(false)}
                />
            )}
        </div>
    )
}
