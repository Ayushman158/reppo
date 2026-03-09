import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', userId)
    .single()
  return data
}

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  // ── Initialize: check existing session on app load ──────
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    const profile = user ? await fetchProfile(user.id) : null
    set({ session, user, profile, loading: false })

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const profile = user ? await fetchProfile(user.id) : null
      set({ session, user, profile })
    })
  },

  // ── Mark onboarding done locally (avoid re-fetch) ───────
  setOnboardingDone: () => set(s => ({ profile: { ...s.profile, onboarding_done: true } })),

  // ── Sign up ──────────────────────────────────────────────
  signUp: async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return data
  },

  // ── Log in ───────────────────────────────────────────────
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  // ── Log out ──────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  // ── OAuth Login ──────────────────────────────────────────
  signInWithProvider: async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app`
      }
    })
    if (error) throw error
    return data
  },
}))
