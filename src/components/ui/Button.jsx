import { useState } from 'react'

/**
 * Button component with a spring-press active state.
 */
export default function Button({
    children,
    onClick,
    variant = 'primary', // 'primary', 'amber', 'ghost'
    className = '',
    style = {},
    disabled = false,
    ...props
}) {
    const [isPressed, setIsPressed] = useState(false)

    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius)',
        border: 'none',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.12s ease, filter 0.12s ease',
        transform: isPressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        filter: isPressed && !disabled ? 'brightness(0.9)' : 'brightness(1)',
        opacity: disabled ? 0.6 : 1,
    }

    const variants = {
        primary: {
            background: 'var(--brand)',
            color: '#fff',
        },
        amber: {
            background: 'var(--amber)',
            color: 'var(--amber-dim)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text2)',
        }
    }

    return (
        <button
            onPointerDown={() => setIsPressed(true)}
            onPointerUp={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
            onClick={disabled ? undefined : onClick}
            style={{ ...baseStyle, ...variants[variant], ...style }}
            className={className}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}
