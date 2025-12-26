"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { User, Session, SupabaseClient, AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AuthResult = { error: AuthError | null }

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)

  // 클라이언트 측에서만 Supabase 초기화
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // 동적으로 클라이언트 생성
    import('@/lib/supabase/client').then(({ createClient }) => {
      const client = createClient()
      setSupabase(client)
    })
  }, [])

  useEffect(() => {
    if (!supabase) return

    // 초기 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: { message: 'Supabase가 초기화되지 않았습니다', name: 'AuthError' } as AuthError }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: { message: 'Supabase가 초기화되지 않았습니다', name: 'AuthError' } as AuthError }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email }
      }
    })
    return { error }
  }, [supabase])

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google'): Promise<void> => {
    if (!supabase) return

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined

    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    })
  }, [supabase])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }, [supabase])

  const value = useMemo(
    () => ({ user, session, loading, signIn, signUp, signInWithOAuth, signOut }),
    [user, session, loading, signIn, signUp, signInWithOAuth, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
