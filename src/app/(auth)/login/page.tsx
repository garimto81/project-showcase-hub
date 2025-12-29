import { Suspense } from 'react'
import { LoginForm } from '@/components/features/auth'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  )
}
