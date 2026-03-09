import { useEffect, useState } from 'react'
import './StreakBadge.css'

export default function StreakBadge({ count }) {
    const [bounce, setBounce] = useState(false)
    const [prevCount, setPrevCount] = useState(count)

    useEffect(() => {
        if (count > prevCount && prevCount !== undefined) {
            setBounce(true)
            const t = setTimeout(() => setBounce(false), 300)
            return () => clearTimeout(t)
        }
        setPrevCount(count)
    }, [count, prevCount])

    if (count === 0) return null // Only show streaks > 0 per Duolingo principles usually (or ghost state), but we'll hide 0 for now to keep headers clean.

    return (
        <div className={`streak-badge ${bounce ? 'streak-bounce' : ''}`}>
            🔥 {count}
        </div>
    )
}
