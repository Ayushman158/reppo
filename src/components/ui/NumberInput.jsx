import { useState, useEffect } from 'react'

/**
 * Animated number input with +/- steppers.
 * Displays a slide animation when the value changes.
 */
export default function NumberInput({
    value,
    onChange,
    min = 0,
    step = 1,
    label
}) {
    const [prevVal, setPrevVal] = useState(value)
    const [animKey, setAnimKey] = useState(0)
    const [direction, setDirection] = useState('up') // 'up' or 'down'

    useEffect(() => {
        if (value !== prevVal) {
            setDirection(value > prevVal ? 'up' : 'down')
            setPrevVal(value)
            setAnimKey(k => k + 1)
        }
    }, [value, prevVal])

    const handleMinus = () => {
        if (value > min) onChange(value - step)
    }

    const handlePlus = () => {
        onChange(value + step)
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            {label && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text2)', width: 80 }}>
                    {label}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <StepperButton onClick={handleMinus}>-</StepperButton>

                <div style={{ width: 80, height: 40, position: 'relative', overflow: 'hidden' }}>
                    {/* We use key to force re-render and re-trigger CSS animations */}
                    <div
                        key={animKey}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '2rem',
                            fontWeight: 700,
                            animation: `slide${direction === 'up' ? 'Up' : 'Down'}Fade 0.2s ease-out both`
                        }}
                    >
                        {value}
                    </div>
                </div>

                <StepperButton onClick={handlePlus}>+</StepperButton>
            </div>

            <style>{`
        @keyframes slideUpFade {
          0% { transform: translateY(15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDownFade {
          0% { transform: translateY(-15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    )
}

function StepperButton({ children, onClick }) {
    const [pressed, setPressed] = useState(false)

    return (
        <button
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onClick={onClick}
            style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: pressed ? 'var(--border)' : 'var(--bg3)',
                color: 'var(--text)',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background var(--ease)',
            }}
        >
            {children}
        </button>
    )
}
