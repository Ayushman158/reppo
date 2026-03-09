import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Initialize auth on app mount.
 * Use once at the top level (App.jsx or main.jsx).
 */
export function useAuthInit() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])
}

/**
 * Convenience hook for current user.
 */
export function useUser() {
  return useAuthStore(s => s.user)
}
