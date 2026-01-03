import { NextResponse, type NextRequest } from 'next/server'
import { isValidSessionToken } from '@/lib/auth/session'

const SESSION_COOKIE_NAME = 'admin_session'

// Admin 전용 라우트 (프로젝트 생성/수정)
const adminRoutes = ['/projects/new']
// Admin 전용 패턴 (동적 라우트)
const adminPatterns = [/^\/projects\/[^/]+\/edit$/]
// 인증 라우트 (로그인 상태면 /projects로 리다이렉트)
const authRoutes = ['/login']

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // 세션 쿠키 확인
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isAuthenticated = sessionToken ? isValidSessionToken(sessionToken) : false

  // Admin 라우트 체크: /projects/new, /projects/[id]/edit
  const isAdminRoute = adminRoutes.some((route) => pathname === route) ||
    adminPatterns.some((pattern) => pattern.test(pathname))

  if (isAdminRoute) {
    // 미인증 시 로그인으로 리다이렉트
    if (!isAuthenticated) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // 인증 라우트: 로그인 상태면 /projects로 리다이렉트
  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/projects/:path*', '/login'],
}
