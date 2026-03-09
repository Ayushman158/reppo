import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

import './ProgramPage.css'

export default function ProgramPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [activeSplit, setActiveSplit] = useState(null)
    const [splitDays, setSplitDays] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        async function fetchProgram() {
            setLoading(true)

            // Get the active split
            const { data: splitData } = await supabase
                .from('splits')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()

            if (splitData) {
                setActiveSplit(splitData)

                // Get the days
                const { data: daysData } = await supabase
                    .from('split_days')
                    .select(`
            *,
            plan_exercises(
                id,
                target_sets,
                target_rep_min,
                target_rep_max,
                exercises(name, target_muscle_group)
            )
          `)
                    .eq('split_id', splitData.id)
                    .order('sort_order')

                if (daysData) {
                    setSplitDays(daysData)
                }
            }
            setLoading(false)
        }

        fetchProgram()
    }, [user])

    if (loading) {
        return (
            <div className="program-container flex-center">
                <span className="text-ink3 font-mono animate-pulse text-sm">Loading Program...</span>
            </div>
        )
    }

    if (!activeSplit) {
        return (
            <div className="program-container flex-col flex-center text-center">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="font-display text-2xl mb-2">No Active Program</h2>
                <p className="text-ink2 mb-6">Create a new program to start logging sessions.</p>
                <Button onClick={() => navigate('/onboarding')}>Create Program Template</Button>
            </div>
        )
    }

    return (
        <div className="program-container animate-fade-in">
            <header className="program-header">
                <h1 className="font-display text-4xl">{activeSplit.name}</h1>
                <div className="status-badge">Active</div>
            </header>

            <p className="text-ink2 mb-8 uppercase text-sm font-mono tracking-2">
                {activeSplit.type === 'PPL' ? 'Push Pull Legs Strategy' : 'Custom Strategy'}
            </p>

            <div className="days-list flex-col gap-6">
                {splitDays.map((day) => (
                    <div key={day.id} className="day-card">
                        <div className="day-card-header flex-between">
                            <h3 className="font-display text-2xl">{day.day_name}</h3>
                            <span className="text-ink3 text-sm">{day.plan_exercises?.length || 0} Exercises</span>
                        </div>

                        <div className="ex-list mt-4">
                            {day.plan_exercises?.map((pe, idx) => (
                                <div key={pe.id} className="ex-list-item flex-between">
                                    <div className="flex gap-3 align-center">
                                        <span className="text-ink3 font-mono text-sm w-4">{idx + 1}.</span>
                                        <span className="font-medium text-ink">{pe.exercises?.name}</span>
                                    </div>
                                    <div className="font-mono text-target text-sm">
                                        {pe.target_sets} × {pe.target_rep_min}-{pe.target_rep_max}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="edit-day-btn mt-4 text-sm font-bold text-target">
                            Edit Day
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 mb-8">
                <Button variant="ghost" className="w-full" style={{ padding: '16px', border: '1px dashed var(--border2)' }} onClick={() => navigate('/onboarding')}>
                    + Replace Program
                </Button>
            </div>
        </div>
    )
}
