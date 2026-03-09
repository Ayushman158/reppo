import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { epley, roundToPlate } from '@/lib/1rm'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const SPLITS = [
  { id: 'ppl', label: 'Push / Pull / Legs', desc: '6-day or 3-day cycle', icon: '💪' },
  { id: 'ul', label: 'Upper / Lower', desc: '4-day split', icon: '⚡' },
  { id: 'fb', label: 'Full Body', desc: '3 days/week', icon: '🔥' },
  { id: 'custom', label: 'Custom', desc: 'I\'ll set up my own days', icon: '⚙️' },
]

const PPL_EXERCISES = {
  'Push A': ['Bench Press', 'Overhead Press', 'Incline DB Press', 'Lateral Raise', 'Tricep Pushdown', 'Overhead Tricep Ext'],
  'Pull A': ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Cable Row', 'Face Pull', 'Bicep Curl'],
  'Legs A': ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Leg Extension'],
}

const KEY_LIFTS = [
  { id: 'bench', label: 'Bench Press', hint: '80' },
  { id: 'squat', label: 'Squat', hint: '100' },
  { id: 'deadlift', label: 'Deadlift', hint: '120' },
  { id: 'ohp', label: 'Overhead Press', hint: '60' },
]

export default function OnboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [split, setSplit] = useState(null)
  const [splitId, setSplitId] = useState(null)
  const [activeDay, setActiveDay] = useState('Push A')
  const [selected, setSelected] = useState({})
  const [strengths, setStrengths] = useState({ bench: '', squat: '', deadlift: '', ohp: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const totalSteps = 3
  const pct = (step / totalSteps) * 100

  const toggleEx = (day, ex) => {
    setSelected(prev => {
      const dayExes = prev[day] || PPL_EXERCISES[day]
      const exists = dayExes.includes(ex)
      return { ...prev, [day]: exists ? dayExes.filter(e => e !== ex) : [...dayExes, ex] }
    })
  }

  const isSelected = (day, ex) => (selected[day] || PPL_EXERCISES[day]).includes(ex)

  const handleStep1 = async () => {
    if (!split) return
    setSaving(true)
    setError(null)
    try {
      if (splitId) {
        // Update existing if went back
        const { error: updErr } = await supabase.from('splits').update({
          type: split,
          name: SPLITS.find(s => s.id === split).label
        }).eq('id', splitId)
        if (updErr) throw updErr
      } else {
        // Insert new
        const { data, error: insErr } = await supabase.from('splits').insert({
          user_id: user.id,
          type: split,
          name: SPLITS.find(s => s.id === split).label,
          is_active: true
        }).select().single()
        if (insErr) throw insErr
        setSplitId(data.id)
      }
      setStep(2)
    } catch (err) {
      setError('Failed to save split: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStep2 = async () => {
    if (!splitId) return
    setSaving(true)
    setError(null)
    try {
      // Get exercise library
      const { data: exData, error: exErr } = await supabase.from('exercises').select('id, name')
      if (exErr) throw exErr
      const exMap = {}
      exData.forEach(e => exMap[e.name] = e.id)

      // Clenup if we've been here before
      await supabase.from('split_days').delete().eq('split_id', splitId)

      // Insert split_days
      const daysToInsert = Object.keys(PPL_EXERCISES).map((dayName, i) => ({
        split_id: splitId,
        day_name: dayName,
        day_type: dayName.split(' ')[0].toLowerCase(), // 'push', 'pull', 'legs'
        sort_order: i
      }))
      const { data: daysData, error: daysErr } = await supabase.from('split_days').insert(daysToInsert).select()
      if (daysErr) throw daysErr

      // Insert plan_exercises
      const planExToInsert = []
      for (const day of daysData) {
        const selectedForDay = selected[day.day_name] || PPL_EXERCISES[day.day_name]
        selectedForDay.forEach((exName, i) => {
          if (exMap[exName]) {
            planExToInsert.push({
              split_day_id: day.id,
              exercise_id: exMap[exName],
              target_sets: 3,
              target_rep_min: 6,
              target_rep_max: 8,
              track_1rm: KEY_LIFTS.some(kl => kl.label === exName),
              sort_order: i
            })
          }
        })
      }

      if (planExToInsert.length > 0) {
        const { error: planErr } = await supabase.from('plan_exercises').insert(planExToInsert)
        if (planErr) throw planErr
      }

      setStep(3)
    } catch (err) {
      setError('Failed to save exercises: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStep3 = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data: exData, error: exErr } = await supabase.from('exercises').select('id, name')
      if (exErr) throw exErr
      const exMap = {}
      exData.forEach(e => exMap[e.name] = e.id)

      const rmsToInsert = []
      KEY_LIFTS.forEach(lift => {
        if (strengths[lift.id]) {
          const est1rm = epley(parseFloat(strengths[lift.id]), 5) // Working weight x 5 reps
          rmsToInsert.push({
            user_id: user.id,
            exercise_id: exMap[lift.label],
            value_kg: est1rm,
            session_count: 1
          })
        }
      })

      if (rmsToInsert.length > 0) {
        // use upsert in case they already exist
        const { error: rmErr } = await supabase.from('estimated_1rms').upsert(rmsToInsert, { onConflict: 'user_id, exercise_id' })
        if (rmErr) throw rmErr
      }

      const { error: profErr } = await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id)
      if (profErr) throw profErr

      navigate('/app')
    } catch (err) {
      setError('Failed to save strengths: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      const { error: profErr } = await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id)
      if (profErr) throw profErr
      navigate('/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--bg3)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
        <div style={{ height: '100%', background: 'var(--brand)', width: `${pct}%`, transition: 'width 0.5s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em' }}>
          REP<span style={{ color: 'var(--brand)' }}>PO</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i + 1 < step ? 'var(--green)' : i + 1 === step ? 'var(--brand)' : 'var(--border2)', transition: 'all 0.2s', transform: i + 1 === step ? 'scale(1.3)' : 'scale(1)' }} />
          ))}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Step {step} of {totalSteps}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 640, width: '100%', margin: '0 auto', padding: '56px 40px' }}>

        {/* ── Step 1: Split ── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              Step 1 · Training Structure
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>
              How do you structure your training?
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Reppo uses this to set up your session rotation. You can customise it anytime.
            </p>
            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--red)' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
              {SPLITS.map(s => (
                <div key={s.id} onClick={() => setSplit(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', border: `1px solid ${split === s.id ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', background: split === s.id ? 'var(--brand-dim)' : 'var(--bg2)', cursor: 'pointer', transition: 'all var(--ease)' }}>
                  <div style={{ fontSize: 26 }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.desc}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${split === s.id ? 'var(--brand)' : 'var(--border2)'}`, background: split === s.id ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {split === s.id && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleStep1} disabled={saving || !split} style={{ width: '100%', padding: 16, background: split ? 'var(--brand)' : 'var(--bg4)', border: 'none', borderRadius: 'var(--radius-lg)', color: split ? '#fff' : 'var(--text3)', fontSize: 16, fontWeight: 600, cursor: split && !saving ? 'pointer' : 'default', fontFamily: 'var(--font-base)', transition: 'all var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving...</> : 'Continue →'}
            </button>
          </div>
        )}

        {/* ── Step 2: Exercises ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              Step 2 · Your Exercises
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>
              Confirm your exercises
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>
              We've pre-filled a standard PPL layout. Tap to remove any exercise.
            </p>
            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            {/* Day tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Object.keys(PPL_EXERCISES).map(day => (
                <button key={day} onClick={() => setActiveDay(day)} style={{ padding: '8px 14px', background: activeDay === day ? 'var(--brand)' : 'transparent', border: `1px solid ${activeDay === day ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius)', color: activeDay === day ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)', transition: 'all var(--ease)' }}>
                  {day}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {PPL_EXERCISES[activeDay].map(ex => {
                const sel = isSelected(activeDay, ex)
                return (
                  <div key={ex} onClick={() => toggleEx(activeDay, ex)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${sel ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: sel ? 'var(--brand-dim)' : 'var(--bg3)', cursor: 'pointer', transition: 'all 0.12s' }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{ex}</span>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel ? 'var(--brand)' : 'var(--border2)'}`, background: sel ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} disabled={saving} style={{ padding: '14px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>← Back</button>
              <button onClick={handleStep2} disabled={saving} style={{ flex: 1, padding: 14, background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving...</> : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Strengths ── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              Step 3 · Seed Your Strength
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>
              What can you lift for ~5 reps?
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 16, lineHeight: 1.6 }}>
              Reppo calculates your estimated 1RM and sets your first targets. Skip any lift you don't do.
            </p>

            <div style={{ background: 'var(--brand-dim)', border: '1px solid rgba(79,126,255,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--brand)' }}>
              🤖 Reppo uses the Epley formula and updates your 1RM automatically after every session.
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '8px 20px', marginBottom: 28 }}>
              {KEY_LIFTS.map((lift, i) => {
                const val = strengths[lift.id]
                const est = val ? roundToPlate(epley(parseFloat(val), 5)) : null
                return (
                  <div key={lift.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < KEY_LIFTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{lift.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" placeholder={lift.hint} value={val} onChange={e => setStrengths(p => ({ ...p, [lift.id]: e.target.value }))} step="2.5"
                        style={{ width: 80, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 500, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>kg</span>
                    </div>
                    {est && (
                      <span style={{ padding: '3px 10px', background: 'var(--brand-dim)', border: '1px solid rgba(79,126,255,0.25)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--brand)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        ~{est}kg 1RM
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} disabled={saving} style={{ padding: '14px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>← Back</button>
              <button onClick={handleStep3} disabled={saving} style={{ flex: 1, padding: 14, background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Finalizing...</> : 'Launch Reppo →'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span onClick={handleSkip} style={{ fontSize: 13, color: 'var(--text3)', cursor: saving ? 'default' : 'pointer' }}>
                Skip — let Reppo learn from my sessions
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
