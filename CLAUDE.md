# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Showcase Hub** - 오픈소스 프로젝트 포트폴리오 관리 플랫폼

팀과 개인이 프로젝트를 타임라인, 갤러리, 칸반 보드 등 다양한 뷰로 관리하고 공유할 수 있는 웹 애플리케이션.

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
| Auth | Supabase Auth (GitHub, Google OAuth) |
| Deploy | Vercel |

## Architecture

### App Router 구조

```
src/app/
├── (auth)/              # 인증 라우트 그룹 (login, signup)
├── (dashboard)/         # 보호된 대시보드 라우트 (projects)
├── api/                 # API Routes
│   ├── projects/        # 프로젝트 CRUD
│   ├── comments/        # 댓글 관리
│   └── github/repos/    # GitHub 레포지토리 조회
└── auth/callback/       # OAuth 콜백 처리
```

### 라우트 보호

`src/proxy.ts`에서 라우트 보호 처리 (Next.js 16 Proxy):
- **Admin 라우트**: `/projects/new`, `/projects/[id]/edit` - Admin만 접근 가능
- **인증 라우트**: `/login`, `/signup` - 인증 시 `/projects`로 리다이렉트

### 인증 시스템

`src/contexts/auth-context.tsx`에서 전역 인증 상태 관리:
- Email/Password, GitHub OAuth, Google OAuth 지원
- GitHub 계정 연동 (기존 사용자가 GitHub 추가 연결)
- `useAuth()` 훅으로 인증 상태 접근

### Supabase 클라이언트

| 파일 | 용도 |
|------|------|
| `src/lib/supabase/client.ts` | 클라이언트 사이드 (브라우저) |
| `src/lib/supabase/server.ts` | 서버 사이드 (RSC, API Routes) |

### 데이터베이스 스키마

```
profiles (id, email, display_name, avatar_url)
    ↓
projects (id, title, description, owner_id, thumbnail_url)
    ↓
├── ratings (id, project_id, user_id, score 1-5) - 사용자당 1개
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

### Feature 컴포넌트 구조

```
src/components/features/
├── auth/        # 로그인/회원가입 폼, OAuth 버튼
├── projects/    # 프로젝트 카드, 목록, 폼
├── views/       # 갤러리, 보드, 타임라인, 리스트 뷰
├── rating/      # 별점 컴포넌트
├── comments/    # 댓글 섹션
└── github/      # GitHub 레포 카드, 연동 섹션
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
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (OAuth 리다이렉트용)

### OAuth 설정 (Supabase Dashboard에서 설정)

GitHub/Google 로그인은 **Supabase Dashboard**에서 설정:
1. Authentication → Providers → GitHub/Google 활성화
2. Client ID, Client Secret 입력
3. Callback URL: `https://<project>.supabase.co/auth/v1/callback`

참고: `supabase/config.toml`은 로컬 개발용 설정
