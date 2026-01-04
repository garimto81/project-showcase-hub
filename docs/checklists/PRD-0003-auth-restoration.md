# PRD-0003: 이중 인증 시스템 복원 및 별점/댓글 기능 수정

| 항목 | 값 |
|------|---|
| **Issue** | #31 |
| **PRD** | PRD-0002 v2.3.0 |
| **Priority** | P0 |
| **Created** | 2026-01-04 |
| **Status** | 🟡 In Progress |

---

## 개요

v2.2에서 단일 Admin 사용자 시스템으로 변경하면서 별점과 댓글 기능이 작동하지 않는 문제를 해결합니다.
일반 사용자가 Supabase Auth로 로그인하여 별점/댓글을 남길 수 있도록 이중 인증 시스템을 구현합니다.

**참조**: [Issue #31](https://github.com/garimto81/project-showcase-hub/issues/31)

---

## Phase 1: 데이터베이스 마이그레이션

### 1.1 Admin 프로필 생성
- [ ] Supabase에서 Admin 전용 고정 UUID 생성
- [ ] `profiles` 테이블에 Admin 레코드 등록
- [ ] 마이그레이션 파일 생성 (`supabase/migrations/006_admin_profile.sql`)

**예상 UUID**: `00000000-0000-0000-0000-000000000001` (또는 Supabase 생성)

**SQL**:
```sql
-- Admin 프로필 생성 (중복 방지)
INSERT INTO profiles (id, email, display_name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@local',
  'Admin',
  NULL
)
ON CONFLICT (id) DO NOTHING;
```

### 1.2 기존 데이터 정리
- [ ] `comments` 테이블에서 잘못된 `user_id` 확인
- [ ] `ratings` 테이블에서 잘못된 `user_id` 확인
- [ ] 필요 시 Admin UUID로 마이그레이션

---

## Phase 2: 인증 시스템 수정

### 2.1 API 유틸리티 수정 (`src/lib/api/utils.ts`)

- [ ] `ADMIN_USER.id`를 고정 UUID로 변경
- [ ] `requireAuth()` 이중 인증 지원
  - [ ] 세션 토큰 확인 (Admin)
  - [ ] Supabase Auth 확인 (User)
- [ ] `AuthResult` 타입에 `role` 필드 추가

**코드**:
```typescript
const ADMIN_UUID = '00000000-0000-0000-0000-000000000001'

const ADMIN_USER = {
  id: ADMIN_UUID,
  email: 'admin@local',
  role: 'admin' as const
}

export async function requireAuth(): Promise<AuthResult> {
  // 1. 세션 토큰 확인 (Admin)
  const session = await getSession()
  if (session.isAuthenticated) {
    return { user: ADMIN_USER }
  }

  // 2. Supabase Auth 확인 (User)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: 'user' as const
      }
    }
  }

  return { error: apiError.unauthorized() }
}
```

### 2.2 인증 컨텍스트 수정 (`src/contexts/auth-context.tsx`)

- [ ] `AuthContextType`에 `user` 정보 추가
- [ ] Supabase Auth 세션 확인 추가
- [ ] `signInWithEmail()` 메서드 추가 (User 로그인)
- [ ] `signUp()` 메서드 추가 (User 회원가입)

**타입**:
```typescript
type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  user: { id: string; email: string; role: 'admin' | 'user' } | null
  loading: boolean
  signIn: (password: string) => Promise<{ error: string | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}
```

---

## Phase 3: API 엔드포인트 테스트

### 3.1 별점 API 테스트
- [ ] Admin으로 별점 등록 (환경변수 인증)
- [ ] User로 별점 등록 (Supabase Auth)
- [ ] 별점 조회 (인증 불필요)
- [ ] 별점 삭제

### 3.2 댓글 API 테스트
- [ ] Admin으로 댓글 작성
- [ ] User로 댓글 작성
- [ ] 댓글 조회 (인증 불필요)
- [ ] 댓글 수정/삭제

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

---

## Phase 5: 테스트

### 5.1 단위 테스트
- [ ] `requireAuth()` 이중 인증 테스트
- [ ] `AuthContext` User/Admin 구분 테스트

### 5.2 E2E 테스트 (`tests/e2e/auth.spec.ts`)

- [ ] User 회원가입 테스트
- [ ] User 로그인 테스트
- [ ] User 별점 등록 테스트
- [ ] User 댓글 작성 테스트
- [ ] Admin 로그인 테스트
- [ ] Admin 앱 CRUD 테스트

### 5.3 수동 테스트
- [ ] Production 환경에서 User 회원가입
- [ ] Production 환경에서 User 별점 등록
- [ ] Production 환경에서 User 댓글 작성
- [ ] Admin 환경변수 로그인

---

## Phase 6: 문서 업데이트

- [x] PRD v2.3.0 업데이트
- [ ] `CLAUDE.md` 인증 시스템 섹션 업데이트
- [ ] API 문서 (인증 방식 설명)

---

## 완료 기준

| 기준 | 상태 |
|------|:----:|
| Admin 고정 UUID 생성 | ⬜ |
| `requireAuth()` 이중 인증 지원 | ⬜ |
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

## 참조

- Issue: https://github.com/garimto81/project-showcase-hub/issues/31
- PRD: `docs/PRD-0002-project-showcase-hub.md` (v2.3.0)
- 마이그레이션: `supabase/migrations/006_admin_profile.sql`
