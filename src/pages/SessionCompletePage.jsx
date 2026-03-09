import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutStore } from '@/store/workoutStore'
import { useDashboardData } from '@/hooks/useDashboardData' // For easy stat pulling
import Button from '@/components/ui/Button'
import './SessionCompletePage.css'

export default function SessionCompletePage() {
    const navigate = useNavigate()
    const activeSession = useWorkoutStore(s => s.activeSession)
    const { data } = useDashboardData() // Could pass state via router, but doing this for simplicity
    const [statsVisible, setStatsVisible] = useState(false)
    const [streakVisible, setStreakVisible] = useState(false)
    const [streakCount, setStreakCount] = useState(0)

    useEffect(() => {
        // Redirect if they land here without finishing a session
        if (!activeSession) {
            navigate('/app')
        }

        // Sequence Animations
        const t1 = setTimeout(() => setStatsVisible(true), 1200)
        const t2 = setTimeout(() => {
            setStreakVisible(true)
            // Animate streak count-up
            let current = 0
            const target = data?.stats?.streak || 1
            const interval = setInterval(() => {
                current += 1
                setStreakCount(current)
                if (current >= target) clearInterval(interval)
            }, 50)
        }, 2000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [activeSession, navigate, data])

    if (!activeSession) return null

    // For confetti
    const particles = Array.from({ length: 40 }).map(() => ({
        tx: `${(Math.random() - 0.5) * 400}px`,
        ty: `${(Math.random() - 1) * 600}px`,
        tr: `${Math.random() * 360}deg`,
        delay: `${Math.random() * 0.5}s`,
        bg: ['#FFB800', '#22C55E', '#4F7EFF', '#FFFFFF'][Math.floor(Math.random() * 4)],
        size: `${Math.random() * 10 + 5}px`
    }))

    return (
        <div className="complete-container">
            {/* Confetti Explosion Layer */}
            <div className="confetti-layer">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="c-particle"
                        style={{
                            '--tx': p.tx,
                            '--ty': p.ty,
                            '--tr': p.tr,
                            background: p.bg,
                            width: p.size,
                            height: p.size,
                            animationDelay: p.delay
                        }}
                    />
                ))}
            </div>

            <div className="content-layer">
                <div className="check-ring">
                    <svg viewBox="0 0 100 100" className="check-svg">
                        <circle cx="50" cy="50" r="45" className="circle-path" />
                        <path d="M 30 50 L 45 65 L 70 35" className="check-path" />
                    </svg>
                </div>

                <h1 className="title-complete font-display animate-slide-up-fade" style={{ animationDelay: '0.8s' }}>
                    SESSION COMPLETE
                </h1>

                {statsVisible && (
                    <div className="stats-row animate-slide-up-fade">
                        <div className="c-stat-box">
                            <span className="c-label">VOLUME</span>
                            <span className="c-val">{Math.floor(Math.random() * 5000 + 3000)}<span className="c-unit">kg</span></span>
                        </div>
                        <div className="c-stat-box">
                            <span className="c-label">TIME</span>
                            <span className="c-val">45<span className="c-unit">min</span></span>
                        </div>
                        <div className="c-stat-box">
                            <span className="c-label">PRs</span>
                            <span className="c-val text-pr">2<span className="c-unit text-pr">🏆</span></span>
                        </div>
                    </div>
                )}

                {streakVisible && (
                    <div className="streak-card animate-spring-in">
                        <div className="flame-icon">🔥</div>
                        <div className="streak-count font-display">{streakCount}</div>
                        <div className="streak-label">DAY STREAK</div>
                    </div>
                )}

                <div className="actions animate-fade-up" style={{ animationDelay: '3s', animationFillMode: 'both' }}>
                    <Button variant="ghost" className="w-full">VIEW BREAKDOWN</Button>
                    <Button
                        className="w-full mt-4"
                        onClick={() => navigate('/app')}
                        style={{ height: '64px', fontSize: '1.25rem', background: '#fff', color: '#000' }}
                    >
                        DONE
                    </Button>
                </div>
            </div>
        </div>
    )
}
