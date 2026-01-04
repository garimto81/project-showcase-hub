"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'user' | 'anonymous'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
}

type AuthContextType = {
  isAuthenticated: boolean  // Admin 또는 User
  isAdmin: boolean
  user: AuthUser | null
  loading: boolean
  signIn: (password: string) => Promise<{ error: string | null }>  // Admin 로그인
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>  // User 로그인
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>  // User 회원가입
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const checkSession = useCallback(async () => {
    try {
      // 1. Admin 세션 확인 (환경변수 비밀번호)
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.isAuthenticated) {
        setUser({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@local',
          role: 'admin',
        })
        setLoading(false)
        return
      }

      // 2. Supabase Auth 세션 확인 (User)
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()

      if (supabaseUser) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'user',
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // 초기 세션 확인
  useEffect(() => {
    checkSession()

    // Supabase Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User 로그인
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'user',
        })
      } else if (event === 'SIGNED_OUT') {
        // Admin 세션도 확인
        await checkSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkSession, supabase])

  // Admin 로그인 (환경변수 비밀번호)
  const signIn = useCallback(async (password: string): Promise<{ error: string | null }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || '로그인에 실패했습니다' }
      }

      setUser({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@local',
        role: 'admin',
      })
      return { error: null }
    } catch {
      return { error: '로그인 처리 중 오류가 발생했습니다' }
    }
  }, [])

  // User 로그인 (Supabase Auth)
  const signInWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message || '로그인에 실패했습니다' }
      }

      // onAuthStateChange가 자동으로 user 상태 업데이트
      return { error: null }
    } catch {
      return { error: '로그인 처리 중 오류가 발생했습니다' }
    }
  }, [supabase])

  // User 회원가입 (Supabase Auth)
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error: string | null }> => {
    try {
      // 1. Supabase Auth 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (signUpError) {
        return { error: signUpError.message || '회원가입에 실패했습니다' }
      }

      if (!authData.user) {
        return { error: '회원가입에 실패했습니다' }
      }

      // 2. profiles 테이블에 프로필 생성
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email,  // fallback to input email
          display_name: displayName,
        })

      if (profileError) {
        // 프로필 생성 실패 시 (이미 존재할 수 있음)
        console.warn('Profile creation warning:', profileError)
      }

      // 3. 자동 로그인 (Supabase가 자동으로 세션 생성)
      return { error: null }
    } catch {
      return { error: '회원가입 처리 중 오류가 발생했습니다' }
    }
  }, [supabase])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      if (user?.role === 'admin') {
        // Admin 로그아웃 (세션 삭제)
        await fetch('/api/auth/logout', { method: 'POST' })
      } else if (user?.role === 'user') {
        // User 로그아웃 (Supabase Auth)
        await supabase.auth.signOut()
      }
    } finally {
      setUser(null)
    }
  }, [user, supabase])

  const isAuthenticated = user !== null && user.role !== 'anonymous'
  const isAdmin = user?.role === 'admin'

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAdmin,
      user,
      loading,
      signIn,
      signInWithEmail,
      signUp,
      signOut,
    }),
    [isAuthenticated, isAdmin, user, loading, signIn, signInWithEmail, signUp, signOut]
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
