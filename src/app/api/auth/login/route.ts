import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 세션 토큰 생성 및 쿠키 설정
    const sessionToken = createSessionToken()
    const cookieStore = await cookies()

    cookieStore.set(
      sessionCookieOptions.name,
      sessionToken,
      {
        httpOnly: sessionCookieOptions.httpOnly,
        secure: sessionCookieOptions.secure,
        sameSite: sessionCookieOptions.sameSite,
        maxAge: sessionCookieOptions.maxAge,
        path: sessionCookieOptions.path,
      }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
