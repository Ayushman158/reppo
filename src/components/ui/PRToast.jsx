import { useEffect, useState } from 'react'
import './PRToast.css'

/**
 * Slide-up gold PR Toast with CSS confetti targeting the hero space.
 */
export default function PRToast({ exerciseName, weight, reps, diffMsg, onClose }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Slight delay to allow base UI to settle before throwing confetti
        const t = setTimeout(() => setVisible(true), 50)
        const t2 = setTimeout(() => {
            setVisible(false)
            setTimeout(onClose, 300) // Call parent onClose after reverse anim
        }, 4000)

        return () => {
            clearTimeout(t)
            clearTimeout(t2)
        }
    }, [onClose])

    const particles = Array.from({ length: 12 }).map((_, i) => ({
        tx: `${(Math.random() - 0.5) * 150}px`,
        ty: `${(Math.random() - 1) * 150}px`,
        tr: `${Math.random() * 360}deg`,
        delay: `${Math.random() * 0.2}s`,
        bg: ['#FFB800', '#22C55E', '#4F7EFF'][Math.floor(Math.random() * 3)]
    }))

    return (
        <div className={`pr-toast-container ${visible ? 'visible' : ''}`}>
            {/* Confetti */}
            {visible && particles.map((p, i) => (
                <div
                    key={i}
                    className="pr-particle"
                    style={{
                        '--tx': p.tx,
                        '--ty': p.ty,
                        '--tr': p.tr,
                        background: p.bg,
                        animationDelay: p.delay
                    }}
                />
            ))}

            {/* Card */}
            <div className="pr-card" onClick={() => setVisible(false)}>
                <div className="pr-title">🏆 NEW PR</div>
                <div className="pr-body">{exerciseName} · {weight}kg × {reps}</div>
                {diffMsg && <div className="pr-msg">{diffMsg}</div>}
            </div>
        </div>
    )
}
