/**
 * Breathing SVG ring timer for rest periods.
 */
export default function RingTimer({
    secondsRemaining,
    totalSeconds = 90,
    onSkip
}) {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (secondsRemaining / totalSeconds) * circumference

    const formatTime = (s) => {
        const mins = Math.floor(s / 60)
        const secs = s % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--bg2)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-6)'
            }}
        >
            <div
                style={{ position: 'relative', width: 120, height: 120 }}
                className="animate-breathe"
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Background Track */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="var(--bg3)"
                        strokeWidth="6"
                    />
                    {/* Animated fill indicator */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="var(--brand)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>

                {/* Text inside ring */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--text)'
                }}>
                    {formatTime(secondsRemaining)}
                </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Rest</div>
                <button
                    onClick={onSkip}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text3)',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    TAP TO SKIP
                </button>
            </div>
        </div>
    )
}
