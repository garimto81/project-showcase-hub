import { Suspense } from 'react'
import { SignupForm } from '@/components/features/auth'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">로딩 중...</div>}>
      <SignupForm />
    </Suspense>
  )
}
