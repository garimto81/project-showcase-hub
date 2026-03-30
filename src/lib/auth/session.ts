import { cookies } from 'next/headers'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_SECRET = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || 'default-secret'

// 세션 토큰 생성 (비밀번호 해시 기반)
export function createSessionToken(): string {
  const timestamp = Date.now().toString()
  const hash = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex')
  return `${timestamp}.${hash}`
}

// 세션 토큰 검증
export function isValidSessionToken(token: string): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestamp, hash] = parts
  const expectedHash = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex')

  // 타이밍 공격 방지를 위한 상수 시간 비교
  if (hash.length !== expectedHash.length) return false

  let result = 0
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }

  if (result !== 0) return false

  // 세션 만료 확인 (7일)
  const tokenTime = parseInt(timestamp, 10)
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7일
  if (Date.now() - tokenTime > maxAge) return false

  return true
}

// 비밀번호 검증 (bcrypt 해시 비교)
export async function verifyPassword(password: string): Promise<boolean> {
  // bcrypt 해시가 설정된 경우 (권장)
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  if (adminPasswordHash) {
    return bcrypt.compare(password, adminPasswordHash)
  }

  // 평문 fallback (deprecated — ADMIN_PASSWORD_HASH 사용 권장)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.warn('ADMIN_PASSWORD 또는 ADMIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다')
    return false
  }

  console.warn('ADMIN_PASSWORD 평문 비교는 deprecated입니다. ADMIN_PASSWORD_HASH (bcrypt) 사용을 권장합니다.')
  const passwordBuffer = Buffer.from(password)
  const adminPasswordBuffer = Buffer.from(adminPassword)

  if (passwordBuffer.length !== adminPasswordBuffer.length) {
    crypto.timingSafeEqual(adminPasswordBuffer, adminPasswordBuffer)
    return false
  }

  return crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer)
}

// 현재 세션 확인 (서버 컴포넌트/API용)
export async function getSession(): Promise<{ isAuthenticated: boolean }> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  return {
    isAuthenticated: sessionToken ? isValidSessionToken(sessionToken) : false
  }
}

// 세션 쿠키 옵션
export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7일
  path: '/',
}
