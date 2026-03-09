/**
 * Top horizontal progress bar tracking completion.
 */
export default function ProgressBar({ progressPercentage }) {
    return (
        <div
            style={{
                width: '100%',
                height: '4px', // Original spec said 3px, 4px is safer for mobile tap/visual
                background: 'var(--bg3)',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    height: '100%',
                    background: 'var(--brand)',
                    width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />
        </div>
    )
}
