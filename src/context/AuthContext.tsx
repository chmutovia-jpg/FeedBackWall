import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'

export interface SignUpResult {
  /** True when Supabase requires the user to confirm their email before they can log in. */
  needsEmailConfirmation: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const NO_SUPABASE_MESSAGE = 'Accounts require Supabase to be configured for this deployment.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Local demo mode (no Supabase): there's no auth, so resolve immediately.
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    // Restore any persisted session on load (keeps users logged in after refresh).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Keep React in sync with sign in / sign out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      async signUp(email, password) {
        if (!supabase) throw new Error(NO_SUPABASE_MESSAGE)
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        return { needsEmailConfirmation: !data.session }
      },
      async signIn(email, password) {
        if (!supabase) throw new Error(NO_SUPABASE_MESSAGE)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      },
      async signOut() {
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
      },
    }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
