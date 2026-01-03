"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  signIn: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // 초기 세션 확인
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setIsAuthenticated(data.isAuthenticated)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

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

      setIsAuthenticated(true)
      return { error: null }
    } catch {
      return { error: '로그인 처리 중 오류가 발생했습니다' }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setIsAuthenticated(false)
    }
  }, [])

  // 단일 사용자이므로 인증 = Admin
  const isAdmin = isAuthenticated

  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, loading, signIn, signOut }),
    [isAuthenticated, isAdmin, loading, signIn, signOut]
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
