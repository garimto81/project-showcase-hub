import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Admin 전용 라우트 (프로젝트 생성/수정)
const adminRoutes = ['/projects/new']
// Admin 전용 패턴 (동적 라우트)
const adminPatterns = [/^\/projects\/[^/]+\/edit$/]
// 인증 라우트 (로그인 상태면 /projects로 리다이렉트)
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Admin 라우트 체크: /projects/new, /projects/[id]/edit
  const isAdminRoute = adminRoutes.some((route) => pathname === route) ||
    adminPatterns.some((pattern) => pattern.test(pathname))

  if (isAdminRoute) {
    // 미인증 시 로그인으로 리다이렉트
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    // Admin이 아니면 /projects로 리다이렉트
    if (adminUserId && user.id !== adminUserId) {
      const url = request.nextUrl.clone()
      url.pathname = '/projects'
      return NextResponse.redirect(url)
    }
  }

  // 인증 라우트: 로그인 상태면 /projects로 리다이렉트
  if (authRoutes.some((route) => pathname.startsWith(route)) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/projects/:path*', '/login', '/signup'],
}
