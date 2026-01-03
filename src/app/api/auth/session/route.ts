import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      isAuthenticated: session.isAuthenticated,
      isAdmin: session.isAuthenticated, // 단일 사용자이므로 인증 = Admin
    })
  } catch {
    return NextResponse.json(
      { isAuthenticated: false, isAdmin: false },
      { status: 200 }
    )
  }
}
