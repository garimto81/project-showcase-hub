# PRD-0003: 다중 인증 시스템 및 익명 댓글/별점 기능

| 항목 | 값 |
|------|---|
| **Issue** | #31 |
| **PRD** | PRD-0002 v2.4.0 |
| **Priority** | P0 |
| **Created** | 2026-01-04 |
| **Updated** | 2026-01-05 |
| **Status** | 🟡 In Progress |

---

## 개요

v2.2에서 단일 Admin 사용자 시스템으로 변경하면서 별점과 댓글 기능이 작동하지 않는 문제를 해결합니다.
**3가지 인증 방식**을 지원하여 모든 사용자가 별점/댓글을 남길 수 있도록 합니다:

1. **Admin**: 환경변수 비밀번호 → 앱 관리 권한
2. **User**: Supabase Auth (회원가입/로그인) → 프로필 연결
3. **Anonymous**: 인증 없음 → 즉시 댓글/별점 작성

**참조**: [Issue #31](https://github.com/garimto81/project-showcase-hub/issues/31)

---

## 인증 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         인증 시스템                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Admin              User                Anonymous               │
│  ┌──────────┐      ┌──────────┐        ┌──────────┐            │
│  │ 환경변수 │      │ Supabase │        │ 인증 없음│            │
│  │ 비밀번호 │      │ Auth     │        │          │            │
│  └──────────┘      └──────────┘        └──────────┘            │
│       ↓                 ↓                    ↓                  │
│  ┌──────────┐      ┌──────────┐        ┌──────────┐            │
│  │ 세션토큰 │      │ Email/   │        │ (없음)   │            │
│  │ (Cookie) │      │ Password │        │          │            │
│  └──────────┘      └──────────┘        └──────────┘            │
│       ↓                 ↓                    ↓                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │            getAuthUser()                         │          │
│  │  1. 세션 토큰 확인 → Admin                      │          │
│  │  2. Supabase Auth → User                        │          │
│  │  3. 인증 없음 → Anonymous                       │          │
│  └──────────────────────────────────────────────────┘          │
│       ↓                 ↓                    ↓                  │
│  고정 UUID:        실제 UUID:          고정 UUID:              │
│  ...0001           Supabase 생성        ...0002                │
│                                                                  │
│  권한:             권한:                권한:                   │
│  앱 CRUD           댓글/별점            댓글/별점               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 데이터베이스 마이그레이션

### 1.1 Admin & Anonymous 프로필 생성
- [ ] `supabase/migrations/006_multi_auth_profiles.sql` 생성
- [ ] Admin 고정 UUID 프로필 생성
- [ ] Anonymous 고정 UUID 프로필 생성

**SQL**:
```sql
-- Admin 프로필 생성 (앱 관리용)
INSERT INTO profiles (id, email, display_name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@local',
  'Admin',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Anonymous 프로필 생성 (익명 댓글/별점용)
INSERT INTO profiles (id, email, display_name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'anonymous@local',
  '익명 사용자',
  NULL
)
ON CONFLICT (id) DO NOTHING;
```

### 1.2 기존 데이터 정리
- [ ] `comments` 테이블에서 잘못된 `user_id` 확인
- [ ] `ratings` 테이블에서 잘못된 `user_id` 확인
- [ ] 잘못된 데이터를 Anonymous UUID로 마이그레이션

**SQL**:
```sql
-- 잘못된 user_id를 Anonymous로 변경
UPDATE comments
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id NOT IN (SELECT id FROM profiles);

UPDATE ratings
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id NOT IN (SELECT id FROM profiles);
```

---

## Phase 2: 인증 시스템 수정

### 2.1 API 유틸리티 수정 (`src/lib/api/utils.ts`)

- [ ] 고정 UUID 상수 정의
- [ ] `requireAuth()` → `getAuthUser()` 변경 (선택적 인증)
- [ ] `requireAdmin()` 추가 (Admin 전용)
- [ ] `AuthResult` 타입에 `role` 필드 추가

**코드**:
```typescript
// 고정 UUID
const ADMIN_UUID = '00000000-0000-0000-0000-000000000001'
const ANONYMOUS_UUID = '00000000-0000-0000-0000-000000000002'

const ADMIN_USER = {
  id: ADMIN_UUID,
  email: 'admin@local',
  role: 'admin' as const
}

const ANONYMOUS_USER = {
  id: ANONYMOUS_UUID,
  email: 'anonymous@local',
  role: 'anonymous' as const
}

// 선택적 인증 (익명 허용)
export async function getAuthUser(): Promise<AuthUser> {
  // 1. 세션 토큰 확인 (Admin)
  const session = await getSession()
  if (session.isAuthenticated) {
    return ADMIN_USER
  }

  // 2. Supabase Auth 확인 (User)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return {
      id: user.id,
      email: user.email || '',
      role: 'user' as const
    }
  }

  // 3. 인증 없음 → Anonymous
  return ANONYMOUS_USER
}

// 필수 인증 (Admin/User만)
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthUser()
  if (user.role === 'anonymous') {
    return { error: apiError.unauthorized() }
  }
  return { user }
}

// Admin 전용
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getAuthUser()
  if (user.role !== 'admin') {
    return { error: apiError.forbidden() }
  }
  return { user }
}
```

### 2.2 API 라우트 수정

#### 2.2.1 별점 API (`src/app/api/projects/[projectId]/ratings/route.ts`)
- [ ] POST: `getAuthUser()` 사용 (익명 허용)
- [ ] DELETE: `requireAuth()` 사용 (본인 것만 삭제)

#### 2.2.2 댓글 API (`src/app/api/projects/[projectId]/comments/route.ts`)
- [ ] POST: `getAuthUser()` 사용 (익명 허용)
- [ ] PATCH/DELETE: `requireAuth()` 사용 (본인 것만 수정/삭제)

#### 2.2.3 프로젝트 API (`src/app/api/projects/route.ts`)
- [ ] POST: `requireAdmin()` 사용 (Admin만 생성)
- [ ] PATCH/DELETE: `requireAdmin()` 사용

### 2.3 인증 컨텍스트 수정 (`src/contexts/auth-context.tsx`)

- [ ] `AuthContextType`에 `user` 정보 추가
- [ ] Supabase Auth 세션 확인 추가
- [ ] `signInWithEmail()` 메서드 추가 (User 로그인)
- [ ] `signUp()` 메서드 추가 (User 회원가입)

**타입**:
```typescript
type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'user' | 'anonymous'
}

type AuthContextType = {
  isAuthenticated: boolean  // Admin 또는 User
  isAdmin: boolean
  user: AuthUser | null
  loading: boolean
  signIn: (password: string) => Promise<{ error: string | null }>  // Admin
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>  // User
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>  // User
  signOut: () => Promise<void>
}
```

---

## Phase 3: API 엔드포인트 테스트

### 3.1 별점 API 테스트
- [ ] Admin으로 별점 등록 (환경변수 인증)
- [ ] User로 별점 등록 (Supabase Auth)
- [ ] **익명으로 별점 등록 (인증 없음)**
- [ ] 별점 조회 (인증 불필요)
- [ ] 별점 삭제 (본인 것만)

### 3.2 댓글 API 테스트
- [ ] Admin으로 댓글 작성
- [ ] User로 댓글 작성
- [ ] **익명으로 댓글 작성 (인증 없음)**
- [ ] 댓글 조회 (인증 불필요)
- [ ] 댓글 수정/삭제 (본인 것만)

---

## Phase 4: UI 수정

### 4.1 로그인 페이지 (`src/app/(auth)/login/page.tsx`)

- [ ] 탭 UI 추가 (Admin / User)
- [ ] Admin 탭: 환경변수 비밀번호 입력
- [ ] User 탭: Email/Password 입력
- [ ] 회원가입 링크 추가 (User)

**UI 구조**:
```
┌────────────────────────────────────┐
│  AppHub Login                      │
├────────────────────────────────────┤
│  [Admin] [User]  ← 탭              │
├────────────────────────────────────┤
│  Admin 탭:                         │
│  Password: [__________]            │
│  [Login]                           │
├────────────────────────────────────┤
│  User 탭:                          │
│  Email: [__________]               │
│  Password: [__________]            │
│  [Login] [Sign Up]                 │
└────────────────────────────────────┘
```

### 4.2 회원가입 페이지 (`src/app/(auth)/signup/page.tsx`)

- [ ] 페이지 생성
- [ ] Email/Password/Display Name 입력
- [ ] `signUp()` 호출
- [ ] 성공 시 프로필 자동 생성
- [ ] 성공 시 자동 로그인 → 대시보드 리다이렉트

### 4.3 댓글 섹션 (`src/components/features/comments/comments-section.tsx`)

- [ ] **로그인 없이도 댓글 작성 가능**
- [ ] 익명 사용자 표시: "익명 사용자"
- [ ] 로그인된 사용자 표시: Display Name 또는 Email
- [ ] 본인 댓글에만 수정/삭제 버튼 표시

### 4.4 별점 컴포넌트 (`src/components/features/rating/star-rating.tsx`)

- [ ] **로그인 없이도 별점 등록 가능**
- [ ] 익명 별점 허용

---

## Phase 5: 테스트

### 5.1 단위 테스트
- [ ] `getAuthUser()` 삼중 인증 테스트
- [ ] `requireAuth()` 익명 차단 테스트
- [ ] `requireAdmin()` Admin 전용 테스트
- [ ] `AuthContext` User/Admin 구분 테스트

### 5.2 E2E 테스트 (`tests/e2e/auth.spec.ts`)

- [ ] **익명 별점 등록 테스트**
- [ ] **익명 댓글 작성 테스트**
- [ ] User 회원가입 테스트
- [ ] User 로그인 테스트
- [ ] User 별점 등록 테스트
- [ ] User 댓글 작성 테스트
- [ ] Admin 로그인 테스트
- [ ] Admin 앱 CRUD 테스트

### 5.3 수동 테스트
- [ ] **Production 환경에서 익명 별점 등록**
- [ ] **Production 환경에서 익명 댓글 작성**
- [ ] Production 환경에서 User 회원가입
- [ ] Production 환경에서 User 별점 등록
- [ ] Production 환경에서 User 댓글 작성
- [ ] Admin 환경변수 로그인

---

## Phase 6: 문서 업데이트

- [x] PRD v2.4.0 업데이트 (익명 기능 추가)
- [ ] `CLAUDE.md` 인증 시스템 섹션 업데이트
- [ ] API 문서 (인증 방식 설명)

---

## 완료 기준

| 기준 | 상태 |
|------|:----:|
| Admin 고정 UUID 생성 | ⬜ |
| Anonymous 고정 UUID 생성 | ⬜ |
| `getAuthUser()` 삼중 인증 지원 | ⬜ |
| `requireAdmin()` Admin 전용 인증 | ⬜ |
| **익명 별점 등록 성공** | ⬜ |
| **익명 댓글 작성 성공** | ⬜ |
| User 회원가입 기능 | ⬜ |
| User 로그인 기능 | ⬜ |
| User 별점 등록 성공 | ⬜ |
| User 댓글 작성 성공 | ⬜ |
| E2E 테스트 통과 | ⬜ |
| Production 배포 및 검증 | ⬜ |

---

## 연결된 PR

- [ ] #32 (예정): DB 마이그레이션 및 인증 시스템 수정
- [ ] #33 (예정): 로그인/회원가입 UI
- [ ] #34 (예정): E2E 테스트 추가

---

## 타입 정의

```typescript
// src/types/auth.ts

export type UserRole = 'admin' | 'user' | 'anonymous'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
}

export type AuthResult = {
  user?: AuthUser
  error?: { message: string; status: number }
}
```

---

## 참조

- Issue: https://github.com/garimto81/project-showcase-hub/issues/31
- PRD: `docs/PRD-0002-project-showcase-hub.md` (v2.4.0)
- 마이그레이션: `supabase/migrations/006_multi_auth_profiles.sql`
- 기존 커밋: `e70afc5` - 익명 댓글/별점 작성 지원 (부분 구현)
