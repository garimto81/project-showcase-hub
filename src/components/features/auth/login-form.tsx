'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithEmail } = useAuth()

  // Admin 로그인
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState<string | null>(null)
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false)

  // User 로그인
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userError, setUserError] = useState<string | null>(null)
  const [isUserSubmitting, setIsUserSubmitting] = useState(false)

  // Admin 로그인 처리
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword || isAdminSubmitting) return

    setIsAdminSubmitting(true)
    setAdminError(null)

    try {
      const { error } = await signIn(adminPassword)
      if (error) {
        setAdminError(error)
      } else {
        const next = searchParams.get('next') || '/projects'
        router.push(next)
        router.refresh()
      }
    } finally {
      setIsAdminSubmitting(false)
    }
  }

  // User 로그인 처리
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail || !userPassword || isUserSubmitting) return

    setIsUserSubmitting(true)
    setUserError(null)

    try {
      const { error } = await signInWithEmail(userEmail, userPassword)
      if (error) {
        setUserError(error)
      } else {
        const next = searchParams.get('next') || '/projects'
        router.push(next)
        router.refresh()
      }
    } finally {
      setIsUserSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
        <CardDescription className="text-center">
          관리자 또는 사용자 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
          </TabsList>

          {/* Admin 탭 */}
          <TabsContent value="admin">
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">비밀번호</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="관리자 비밀번호 입력"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={isAdminSubmitting}
                  required
                  autoFocus
                />
              </div>

              {adminError && (
                <p className="text-sm text-destructive" role="alert">{adminError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isAdminSubmitting}>
                {isAdminSubmitting ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </TabsContent>

          {/* User 탭 */}
          <TabsContent value="user">
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">이메일</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="example@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={isUserSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">비밀번호</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  disabled={isUserSubmitting}
                  required
                />
              </div>

              {userError && (
                <p className="text-sm text-destructive" role="alert">{userError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isUserSubmitting}>
                {isUserSubmitting ? '로그인 중...' : '로그인'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  회원가입
                </Link>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
