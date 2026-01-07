# Aiden's Market

> 개인용 앱 마켓/대시보드 플랫폼

자신이 개발하거나 사용하는 앱들을 한 곳에서 관리하고 빠르게 접근할 수 있는 웹 애플리케이션입니다.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-green)](https://supabase.com/)

## Features

- **다양한 뷰 모드**: Timeline (Gantt), Gallery, Board (Kanban), List
- **계층형 프로젝트**: Organization → Workspace → Project → Sub-Project
- **다양한 첨부 형식**: 링크, 이미지, 영상, 문서, GitHub 레포
- **팀 협업**: 역할 기반 접근 제어 (Admin, Manager, Member, Viewer)
- **실시간 동기화**: Supabase Realtime
- **다크 모드**: 시스템 테마 연동

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, RSC) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (new-york style) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Auth | 다중 인증 (Admin 비밀번호 + Supabase Auth + Anonymous) |
| GitHub | 공개 API (/users/{username}/repos) |
| Deploy | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- Node.js 18.17+
- npm or pnpm
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/garimto81/project-showcase-hub.git
cd project-showcase-hub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

필수 환경변수를 `.env.local` 파일에 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin 인증
ADMIN_PASSWORD=your-secure-admin-password

# GitHub (선택)
GITHUB_USERNAME=your-github-username

# Site URL (선택, 기본값: http://localhost:3000)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 인증 시스템 (v2.4 다중 인증)

이 애플리케이션은 **3가지 인증 방식**을 지원합니다:

| 인증 방식 | 설명 | 권한 |
|-----------|------|------|
| **Admin** | 환경변수 비밀번호 (`ADMIN_PASSWORD`) | 앱 CRUD 전체 권한 |
| **User** | Supabase Auth (이메일/비밀번호 회원가입) | 댓글 작성, 별점 등록 |
| **Anonymous** | 인증 없음 | 댓글 작성, 별점 등록 (익명) |

**로그인 페이지:** `/login`
- Admin 탭: 환경변수 비밀번호 입력
- User 탭: 이메일/비밀번호 로그인

**회원가입 페이지:** `/signup` (User 전용)

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Feature components
│   └── layout/            # Layout components
├── lib/                   # Utilities & configs
├── hooks/                 # Custom hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Scripts

### Development

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

### Testing

```bash
# Unit Tests (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Coverage report

# E2E Tests (Playwright)
npm run test:e2e          # 공개 페이지 테스트 (chromium)
npm run test:e2e:ui       # UI mode
npm run test:e2e:auth     # 인증 필요 테스트 (setup + authenticated)
```

**참고:** E2E 테스트는 기본적으로 `localhost:3000`을 대상으로 실행됩니다. Production 테스트: `BASE_URL=https://your-domain.vercel.app npm run test:e2e`

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
