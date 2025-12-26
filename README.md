# Project Showcase Hub

> 오픈소스 프로젝트 포트폴리오 관리 플랫폼

팀과 개인이 프로젝트를 **타임라인**, **갤러리**, **칸반 보드** 등 다양한 뷰로 관리하고 공유할 수 있는 웹 애플리케이션입니다.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

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
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Auth | Supabase Auth + RBAC |
| State | Zustand + TanStack Query |
| Deploy | Vercel |

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

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

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

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

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
