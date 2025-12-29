# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Showcase Hub** - 오픈소스 프로젝트 포트폴리오 관리 플랫폼

팀과 개인이 프로젝트를 타임라인, 갤러리, 칸반 보드 등 다양한 뷰로 관리하고 공유할 수 있는 웹 애플리케이션입니다.

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (new-york style) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + RBAC |
| State | Zustand + TanStack Query |
| Deploy | Vercel |

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

설정: `components.json` (new-york 스타일, lucide 아이콘)

## Architecture

### App Router 구조 (계획)

```
src/app/
├── (auth)/            # 인증 라우트 그룹 (login, signup)
├── (dashboard)/       # 보호된 대시보드 라우트 그룹
└── api/               # API Routes
```

### 계층형 데이터 모델

```
Organization → Workspace → Project → Sub-Project
```

각 계층은 역할 기반 접근 제어 (Admin, Manager, Member, Viewer) 적용

### 주요 컴포넌트 위치

| 디렉토리 | 용도 |
|----------|------|
| `components/ui/` | shadcn/ui 기본 컴포넌트 |
| `components/features/` | 기능별 도메인 컴포넌트 |
| `components/layout/` | 레이아웃 컴포넌트 |

### State Management (계획)

- **Server State**: TanStack Query (Supabase 데이터)
- **Client State**: Zustand (UI 상태, 뷰 모드)

## Key Conventions

- **언어**: 커밋 메시지와 문서는 한글 사용
- **Import**: `@/` alias 사용 (예: `@/components/ui/button`)
- **파일명**: 컴포넌트는 PascalCase, 유틸리티는 kebab-case
- **CSS**: Tailwind CSS 변수 기반 테마 (`globals.css`)

## Environment Setup

```bash
cp .env.example .env.local
```

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
