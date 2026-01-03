import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionCookieOptions } from '@/lib/auth/session'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // 세션 쿠키 삭제
    cookieStore.set(sessionCookieOptions.name, '', {
      httpOnly: sessionCookieOptions.httpOnly,
      secure: sessionCookieOptions.secure,
      sameSite: sessionCookieOptions.sameSite,
      maxAge: 0, // 즉시 만료
      path: sessionCookieOptions.path,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
