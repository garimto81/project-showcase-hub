# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Showcase Hub** - 오픈소스 프로젝트 포트폴리오 관리 플랫폼

팀과 개인이 프로젝트를 타임라인, 갤러리, 칸반 보드 등 다양한 뷰로 관리하고 공유할 수 있는 웹 애플리케이션입니다.

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + RBAC |
| State | Zustand + TanStack Query |
| Deploy | Vercel |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Feature-specific components
│   └── layout/            # Layout components
├── lib/
│   ├── supabase/          # Supabase client & utilities
│   ├── utils.ts           # Utility functions
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript type definitions
```

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

## Database Setup (Supabase)

1. Create Supabase project at https://supabase.com
2. Copy `.env.example` to `.env.local`
3. Add Supabase credentials
4. Run migrations (when available)

## Key Conventions

- **한글 출력**: 커밋 메시지와 문서는 한글 사용
- **절대 경로**: import는 `@/` alias 사용
- **컴포넌트 파일명**: PascalCase (예: `ProjectCard.tsx`)
- **유틸리티 파일명**: kebab-case (예: `format-date.ts`)
