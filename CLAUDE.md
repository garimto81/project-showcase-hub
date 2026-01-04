# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Showcase Hub** - 개인용 앱 마켓/대시보드 플랫폼

자신이 개발하거나 사용하는 앱들을 한 곳에서 관리하고 빠르게 접근할 수 있는 웹 애플리케이션.

## Development Commands

### Basic Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

### Testing Commands

```bash
# Unit Tests (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Coverage report

# E2E Tests (Playwright)
npm run test:e2e          # 공개 페이지 테스트 (chromium)
npm run test:e2e:ui       # UI mode
npm run test:e2e:auth     # 인증 필요 테스트 (setup + authenticated)

# 개별 테스트
npx playwright test tests/e2e/projects.spec.ts  # 특정 파일
npx playwright test --project=setup             # 인증 설정만
npx playwright test --project=authenticated     # 인증된 테스트만
```

**Playwright 프로젝트 구조:**
- `chromium`: 공개 페이지 테스트 (기본 실행)
- `setup`: 인증 설정 (`.auth/user.json` 생성)
- `authenticated`: 인증 필요 테스트 (setup 의존)

### shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

설정: `components.json` (new-york 스타일, lucide 아이콘, RSC 지원)

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, RSC) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (new-york style) |
| Database | Supabase (PostgreSQL) |
| Auth | 환경변수 비밀번호 (ADMIN_PASSWORD) |
| GitHub | 공개 API (/users/{username}/repos) |
| Deploy | Vercel |

## Architecture

### App Router 구조

```
src/app/
├── (auth)/              # 인증 라우트 그룹 (login)
├── (dashboard)/         # 대시보드 라우트 (projects)
└── api/                 # API Routes
    ├── auth/            # 인증 API (login, logout, session)
    ├── projects/        # 프로젝트 CRUD
    ├── comments/        # 댓글 관리
    └── github/          # GitHub 레포 조회/동기화
```

### 라우트 보호

Next.js 16에서는 `src/proxy.ts`가 제거되어 라우트 보호를 사용하지 않습니다:
- 모든 라우트는 클라이언트 사이드에서 `useAuth()` 훅으로 접근 제어
- `/projects/new`, `/projects/[id]/edit`: 컴포넌트 내부에서 `isAdmin` 체크
- `/login`: `AuthContext`에서 인증 시 리다이렉트 처리

### 인증 시스템 (v2.4 다중 인증)

`src/contexts/auth-context.tsx`에서 전역 인증 상태 관리.
**3가지 인증 방식 지원**:

| 방식 | 인증 방법 | UUID | 권한 |
|------|-----------|------|------|
| **Admin** | 환경변수 비밀번호 (ADMIN_PASSWORD) | `...0001` (고정) | 앱 CRUD |
| **User** | Supabase Auth (회원가입/로그인) | Supabase 생성 | 댓글/별점 |
| **Anonymous** | 인증 없음 | `...0002` (고정) | 댓글/별점 |

```typescript
type AuthContextType = {
  isAuthenticated: boolean  // Admin 또는 User
  isAdmin: boolean
  user: AuthUser | null
  loading: boolean
  signIn: (password: string) => Promise<...>                        // Admin 로그인
  signInWithEmail: (email, password) => Promise<...>                // User 로그인
  signUp: (email, password, displayName) => Promise<...>            // User 회원가입
  signOut: () => Promise<void>
}

type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'user' | 'anonymous'
}
```

**인증 흐름**:
1. `checkSession()`: Admin 세션 → Supabase Auth 순서로 확인
2. `signUp()`: Supabase Auth 회원가입 → profiles 테이블 자동 생성
3. `signOut()`: role에 따라 Admin/User 로그아웃 처리

**API 인증 유틸리티** (`src/lib/api/utils.ts`):
- `getAuthUser()`: 선택적 인증 (Admin → User → Anonymous)
- `requireAuth()`: Admin/User 전용 (익명 차단)
- `requireAdmin()`: Admin 전용

### Supabase 클라이언트

| 파일 | 용도 |
|------|------|
| `src/lib/supabase/client.ts` | 클라이언트 사이드 (브라우저) |
| `src/lib/supabase/server.ts` | 서버 사이드 (RSC, API Routes) |
| `src/lib/auth/session.ts` | 세션 토큰 생성/검증 |

### 데이터베이스 스키마

```
profiles (id, email, display_name, avatar_url)
    ↓
projects (id, title, description, owner_id, thumbnail_url, github_repo)
    ↓
├── project_metadata (github_stars, github_forks, tech_stack 등)
├── ratings (id, project_id, user_id, score 1-5)
└── comments (id, project_id, user_id, content)
```

타입 정의: `src/types/database.ts`
마이그레이션: `supabase/migrations/`

### 주요 커스텀 훅

| 훅 | 용도 | 위치 |
|----|------|------|
| `useAuth()` | 인증 상태 및 메서드 | `src/hooks/use-auth.ts` |
| `useProjects()` | 프로젝트 목록 조회 | `src/hooks/use-projects.ts` |
| `useRating()` | 별점 조회/등록 | `src/hooks/use-rating.ts` |
| `useComments()` | 댓글 CRUD | `src/hooks/use-comments.ts` |
| `useGithubRepos()` | GitHub 레포지토리 목록 | `src/hooks/use-github-repos.ts` |
| `useRepoScanner()` | GitHub 전체 스캔 | `src/hooks/use-repo-scanner.ts` |
| `useProjectMetadata()` | 프로젝트 메타데이터 관리 | `src/hooks/use-project-metadata.ts` |

### Feature 컴포넌트 구조

```
src/components/features/
├── auth/        # 로그인 폼
├── projects/    # 프로젝트 카드, 목록, 폼
├── views/       # 갤러리, 보드, 타임라인, 리스트 뷰
├── rating/      # 별점 컴포넌트
├── comments/    # 댓글 섹션
└── github/      # GitHub 레포 카드, 동기화 섹션
```

## Key Conventions

- **언어**: 커밋 메시지와 문서는 한글 사용
- **Import**: `@/` alias 사용 (예: `@/components/ui/button`)
- **파일명**: 컴포넌트는 kebab-case (shadcn/ui 관례)
- **CSS**: Tailwind CSS 변수 기반 테마 (`globals.css`)

## Environment Variables

```bash
cp .env.example .env.local
```

필수:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 익명 키
- `ADMIN_PASSWORD` - 관리자 로그인 비밀번호
- `GITHUB_USERNAME` - GitHub 사용자명 (공개 API용, 기본값: garimto81)

선택:
- `NEXT_PUBLIC_SITE_URL` - 사이트 URL (기본값: http://localhost:3000)

### GitHub API 설정

OAuth 없이 공개 API 사용:
- 레포 목록: `GET /users/{GITHUB_USERNAME}/repos`
- 레포 정보: `GET /repos/{owner}/{repo}`
- 레이트 제한: 시간당 60회 (5분 캐싱으로 대응)

## Key Libraries and Utilities

### Core Libraries

| 라이브러리 | 용도 |
|-----------|------|
| `@supabase/ssr` | SSR 환경 Supabase 클라이언트 |
| `@supabase/supabase-js` | Supabase JavaScript 클라이언트 |
| `date-fns` | 날짜 포맷팅 및 조작 |
| `sonner` | Toast 알림 |
| `next-themes` | 다크 모드 테마 전환 |

### Utilities

| 유틸리티 | 용도 | 위치 |
|---------|------|------|
| `cn()` | Tailwind CSS 클래스 병합 | `src/lib/utils.ts` |
| `createClient()` | 클라이언트 사이드 Supabase | `src/lib/supabase/client.ts` |
| `createServerClient()` | 서버 사이드 Supabase | `src/lib/supabase/server.ts` |
| `generateToken()` / `verifyToken()` | 세션 토큰 관리 | `src/lib/auth/session.ts` |
| `detectDeploymentUrl()` | GitHub 레포 배포 URL 감지 | `src/lib/deployment-detector.ts` |
| `scanUserRepos()` | GitHub 레포 전체 스캔 | `src/lib/repo-scanner.ts` |
| `handleApiError()` | API 에러 처리 | `src/lib/api/utils.ts` |

## Testing Guidelines

### Unit Tests (Vitest)

- 테스트 파일: `*.test.ts` 또는 `*.spec.ts`
- 위치: 테스트할 파일과 동일한 디렉토리
- Setup: `src/test/setup.tsx`
- 커버리지 제외: `src/components/ui/**` (shadcn/ui)

### E2E Tests (Playwright)

- 테스트 파일: `tests/e2e/*.spec.ts`
- Base URL: `https://project-showcase-hub-phi.vercel.app` (production)
- 인증 상태: `tests/e2e/.auth/user.json`
- 스크린샷: 실패 시에만 자동 저장

**주의사항:**
- E2E 테스트는 기본적으로 production 환경 대상
- 로컬 테스트: `BASE_URL=http://localhost:3000 npm run test:e2e`
- 인증 필요 테스트는 별도 프로젝트로 실행 (`test:e2e:auth`)
