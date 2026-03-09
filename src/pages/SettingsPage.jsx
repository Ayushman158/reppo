import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/authStore'
import { useWorkoutStore } from '@/store/workoutStore'

function SettingsRow({ icon, label, value, onTap, showChevron }) {
    return (
        <div
            onClick={onTap}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', background: 'var(--paper2)', borderRadius: 'var(--radius-md)',
                cursor: onTap ? 'pointer' : 'default', transition: 'background var(--ease)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon icon={icon} style={{ fontSize: 18, color: 'var(--ink2)', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {value && <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{value}</span>}
                {showChevron && <Icon icon="ph:caret-right-bold" style={{ fontSize: 14, color: 'var(--ink3)' }} />}
            </div>
        </div>
    )
}

function SectionLabel({ children }) {
    return (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 20 }}>
            {children}
        </div>
    )
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const { user, signOut } = useAuthStore()
    const clearCompleted = useWorkoutStore(s => s.clearCompletedSession)

    const handleSignOut = async () => {
        clearCompleted()
        await signOut()
        navigate('/')
    }

    const name = user?.user_metadata?.name || ''
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : (user?.email?.[0]?.toUpperCase() || 'A')
    const displayName = name || user?.email || 'Athlete'
    const email = user?.email || ''

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'env(safe-area-inset-top,0) 16px 100px' }}>

            {/* Header */}
            <header style={{ height: 64, display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <button
                    onClick={() => navigate('/app')}
                    style={{ background: 'none', border: 'none', color: 'var(--target)', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'var(--font-sans)' }}
                >
                    <span style={{ fontSize: 22 }}>‹</span> Notebook
                </button>
            </header>

            {/* Profile card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', marginBottom: 8 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--target-bg)', border: '2px solid var(--target)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--target)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                    {initials}
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{displayName}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{email}</div>
                </div>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

                <SectionLabel>Account</SectionLabel>
                <SettingsRow icon="ph:envelope-simple-bold" label="Email" value={email} />

                <SectionLabel>Training</SectionLabel>
                <SettingsRow icon="ph:barbell-bold" label="My Program" onTap={() => navigate('/app/program')} showChevron />
                <SettingsRow icon="ph:chart-line-up-bold" label="Insights" onTap={() => navigate('/app/insights')} showChevron />

                <SectionLabel>App</SectionLabel>
                <SettingsRow icon="ph:info-bold" label="Version" value="0.1.0 Beta" />
                <SettingsRow icon="ph:heart-bold" label="Built by a lifter, for lifters" />

                <div style={{ marginTop: 28 }}>
                    <button
                        onClick={handleSignOut}
                        style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: '1px dashed var(--red)', borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        <Icon icon="ph:sign-out-bold" />
                        Sign Out
                    </button>
                </div>

            </div>
        </div>
    )
}
