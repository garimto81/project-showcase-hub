# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Showcase Hub** - 개인용 앱 마켓/대시보드 플랫폼

자신이 개발하거나 사용하는 앱들을 한 곳에서 관리하고 빠르게 접근할 수 있는 웹 애플리케이션.

## Development Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

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
├── api/                 # API Routes
│   ├── auth/            # 인증 API (login, logout, session)
│   ├── projects/        # 프로젝트 CRUD
│   ├── comments/        # 댓글 관리
│   └── github/          # GitHub 레포 조회/동기화
└── proxy.ts             # 라우트 보호 (Next.js 16 Proxy)
```

### 라우트 보호

`src/proxy.ts`에서 라우트 보호 처리 (Next.js 16 Proxy):
- **Admin 라우트**: `/projects/new`, `/projects/[id]/edit` - Admin만 접근 가능
- **인증 라우트**: `/login` - 인증 시 `/projects`로 리다이렉트

### 인증 시스템 (v2.2 단순화)

`src/contexts/auth-context.tsx`에서 전역 인증 상태 관리:
- 환경변수 비밀번호 (ADMIN_PASSWORD) 기반 인증
- 단일 Admin 사용자
- `useAuth()` 훅으로 인증 상태 접근

```typescript
type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  signIn: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}
```

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

| 훅 | 용도 |
|----|------|
| `useAuth()` | 인증 상태 및 메서드 |
| `useProjects()` | 프로젝트 목록 조회 |
| `useRating()` | 별점 조회/등록 |
| `useComments()` | 댓글 CRUD |
| `useGithubRepos()` | GitHub 레포지토리 목록 |
| `useRepoScanner()` | GitHub 전체 스캔 |

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
