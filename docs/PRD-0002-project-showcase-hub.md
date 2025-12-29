# PRD-0002: Project Showcase Hub

| 항목 | 값 |
|------|---|
| **Version** | 1.1.0 |
| **Status** | In Progress |
| **Priority** | P0 |
| **Created** | 2025-12-26 |
| **Updated** | 2025-12-26 |
| **License** | MIT |
| **Repository** | `D:\AI\claude01\project-showcase-hub` |

---

## 1. Executive Summary

### 1.1 배경
기존 GGP CAMERA 업무 현황 보드(v1.20)는 회사 내부 전용으로, 익명 인증과 단일 HTML 파일 구조로 운영되었습니다. 이를 **오픈소스 프로젝트**로 전환하여 누구나 자신의 프로젝트 포트폴리오를 관리하고 공유할 수 있는 플랫폼으로 발전시킵니다.

### 1.2 목표
- 오픈소스 프로젝트 포트폴리오 관리 플랫폼 구축
- 다양한 프로젝트 형식과 계층 구조 지원
- 팀 협업을 위한 회원 관리 및 권한 시스템

### 1.3 핵심 변화

| 기존 (v1.20) | 신규 (v2.0) |
|--------------|-------------|
| 회사 전용 (익명 인증) | 오픈 프로젝트 (회원 가입/로그인) |
| 단일 HTML 파일 | Next.js 15 모듈화 구조 |
| Firebase Firestore | Supabase PostgreSQL |
| 웹 링크만 지원 | 다양한 미디어 첨부 |
| 단일 프로젝트 | 계층형 프로젝트 (상위/하위) |
| 고정 담당자 4명 | 동적 회원 관리 + RBAC |

---

## 2. Technology Stack (2025)

| 영역 | 기술 | 버전 | 선정 이유 |
|------|------|------|----------|
| **Framework** | Next.js | 15.x (App Router) | SSR, SEO 최적화, React Server Components |
| **Language** | TypeScript | 5.x | 타입 안정성, AI 도구 호환성 |
| **UI** | Tailwind CSS | 3.x | 유틸리티 기반, 빠른 개발 |
| **Components** | shadcn/ui | latest | 접근성, 커스터마이징 용이 |
| **Database** | Supabase | PostgreSQL | 오픈소스, 실시간 동기화, RBAC |
| **Auth** | Supabase Auth | - | 소셜 로그인, Custom Claims |
| **State** | Zustand | 5.x | 경량, 보일러플레이트 최소화 |
| **Data Fetching** | TanStack Query | 5.x | 캐싱, 낙관적 업데이트 |
| **Forms** | React Hook Form + Zod | - | 타입 안전 유효성 검증 |
| **Storage** | Supabase Storage | - | 이미지, 문서 저장 |
| **Deploy** | Vercel | - | Edge Network, 자동 배포 |

### 참고 자료
- [Next.js 2025 Tech Stack Guide](https://www.wisp.blog/blog/what-nextjs-tech-stack-to-try-in-2025-a-developers-guide-to-modern-web-development)
- [Supabase RBAC Documentation](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [OpenProject (오픈소스 프로젝트 관리)](https://www.openproject.org/)

---

## 3. Target Users

### 3.1 Primary Users
- **개인 개발자**: 포트폴리오 관리 및 공개
- **팀/스타트업**: 프로젝트 진행 현황 추적
- **프리랜서**: 클라이언트 프로젝트 관리

### 3.2 User Roles (RBAC)

| Role | 권한 |
|------|------|
| **Admin** | 전체 관리 (회원, 조직, 설정) |
| **Manager** | 프로젝트/워크스페이스 관리 |
| **Member** | 프로젝트 CRUD, 담당자 지정 |
| **Viewer** | 읽기 전용 접근 |

---

## 4. Core Features

### 4.1 인증 & 회원 관리

#### 인증 방식
- 이메일/비밀번호 회원가입
- 소셜 로그인: Google, GitHub
- 매직 링크 (Passwordless)

#### 관리자 패널
- 회원 초대 (이메일)
- 권한 변경 (Role 할당)
- 계정 비활성화/삭제
- 활동 로그 조회

### 4.2 계층형 프로젝트 구조

```
Organization (조직)
├── Workspace (워크스페이스)
│   ├── Project (프로젝트)
│   │   ├── Sub-Project (하위 프로젝트)
│   │   ├── Sub-Project
│   │   └── Attachments (첨부파일)
│   └── Project
└── Settings
```

#### 특징
- 무제한 depth 계층 (parent_id 기반)
- 공개/비공개 설정 (visibility)
- 프로젝트별 담당자 지정

### 4.3 다양한 첨부 형식

| 타입 | 설명 | 메타데이터 |
|------|------|-----------|
| **link** | 외부 URL | title, favicon, description |
| **image** | 이미지 갤러리 | width, height, alt |
| **video** | YouTube, Vimeo 임베드 | embed_url, thumbnail |
| **document** | PDF, Office 문서 | filename, size, mime_type |
| **github** | GitHub 레포 연동 | repo_url, stars, language |

#### 미리보기 기능
- 링크: Open Graph 메타데이터 추출
- 이미지: 라이트박스 갤러리
- 영상: 인라인 플레이어
- 문서: PDF 뷰어

### 4.4 프로젝트 뷰 모드

| 뷰 | 설명 |
|----|------|
| **Timeline (Gantt)** | 타임라인 기반 일정 시각화 (기존 기능) |
| **Gallery** | 썸네일 그리드 (포트폴리오 스타일) |
| **Board** | 칸반 보드 (상태별 정렬) |
| **List** | 상세 목록 (테이블 형태) |

### 4.5 실시간 협업

- Supabase Realtime 구독
- 드래그 앤 드롭 정렬
- 낙관적 업데이트 (Optimistic Update)
- 다크 모드 (시스템 연동)

### 4.6 별점 & 댓글 시스템 ✅ (구현 완료)

#### 별점 시스템
| 기능 | 설명 |
|------|------|
| **1-5점 별점** | 시각적 별 아이콘으로 입력/표시 |
| **사용자당 1개** | 프로젝트당 1개 평가 (UNIQUE 제약) |
| **평균/분포 표시** | 전체 평균 점수 및 점수별 분포 그래프 |
| **인증 필수** | 로그인한 사용자만 평가 가능 |

#### 댓글 시스템
| 기능 | 설명 |
|------|------|
| **댓글 CRUD** | 생성, 조회, 수정, 삭제 |
| **작성자 프로필** | 아바타, 이름, 작성 시간 표시 |
| **수정 표시** | 수정된 댓글에 "(수정됨)" 표시 |
| **권한 관리** | 본인 댓글만 수정/삭제 가능 |

#### 구현 파일
```
src/components/features/
├── rating/
│   ├── star-rating.tsx      # 별점 입력/표시
│   ├── rating-summary.tsx   # 평균/분포 표시
│   └── project-rating.tsx   # 프로젝트 별점 컨테이너
└── comments/
    ├── comment-form.tsx     # 댓글 작성 폼
    ├── comment-item.tsx     # 개별 댓글 표시
    └── comments-section.tsx # 댓글 섹션 컨테이너

src/app/api/
├── projects/[projectId]/
│   ├── ratings/route.ts     # GET, POST, DELETE
│   └── comments/route.ts    # GET, POST
└── comments/[commentId]/
    └── route.ts             # PATCH, DELETE
```

---

## 5. Data Model

### 5.1 ERD

```sql
-- Users (Supabase Auth 확장)
profiles
├── id (uuid, FK → auth.users)
├── email (text)
├── full_name (text)
├── avatar_url (text)
├── created_at (timestamptz)

-- Organizations
organizations
├── id (uuid, PK)
├── name (text)
├── slug (text, unique)
├── owner_id (uuid, FK → profiles)
├── created_at (timestamptz)

-- Organization Members
members
├── id (uuid, PK)
├── org_id (uuid, FK → organizations)
├── user_id (uuid, FK → profiles)
├── role (enum: admin, manager, member, viewer)
├── invited_at (timestamptz)
├── accepted_at (timestamptz)

-- Workspaces
workspaces
├── id (uuid, PK)
├── org_id (uuid, FK → organizations)
├── name (text)
├── slug (text)
├── created_at (timestamptz)

-- Projects (Self-referencing for hierarchy)
projects
├── id (uuid, PK)
├── workspace_id (uuid, FK → workspaces)
├── parent_id (uuid, FK → projects, nullable)
├── title (text)
├── description (text)
├── status (enum: draft, active, completed, archived)
├── priority (enum: P0, P1, P2, P3)
├── visibility (enum: public, private)
├── thumbnail_url (text)
├── created_at (timestamptz)
├── updated_at (timestamptz)

-- Attachments
attachments
├── id (uuid, PK)
├── project_id (uuid, FK → projects)
├── type (enum: link, image, video, document, github)
├── url (text)
├── metadata (jsonb)
├── created_at (timestamptz)

-- Schedules
schedules
├── id (uuid, PK)
├── project_id (uuid, FK → projects)
├── start_date (date)
├── end_date (date, nullable)
├── status (enum: in_progress, completed)
├── progress (int, 0-100)

-- Project Assignees
project_assignees
├── project_id (uuid, FK → projects)
├── user_id (uuid, FK → profiles)
├── assigned_at (timestamptz)

-- Ratings ✅ (구현 완료)
ratings
├── id (uuid, PK)
├── project_id (uuid, FK → projects)
├── user_id (uuid, FK → profiles)
├── score (int, 1-5)
├── created_at (timestamptz)
├── updated_at (timestamptz)
├── UNIQUE(project_id, user_id)

-- Comments ✅ (구현 완료)
comments
├── id (uuid, PK)
├── project_id (uuid, FK → projects)
├── user_id (uuid, FK → profiles)
├── content (text)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### 5.2 RLS Policies

```sql
-- Organizations: 멤버만 조회 가능
CREATE POLICY "Members can view org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- Projects: visibility에 따른 접근 제어
CREATE POLICY "Public projects visible to all" ON projects
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Private projects for members" ON projects
  FOR SELECT USING (
    visibility = 'private' AND
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN members m ON m.org_id = w.org_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Ratings: 모두 조회 가능, 인증된 사용자만 CRUD ✅
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rating" ON ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: 모두 조회 가능, 인증된 사용자만 CRUD ✅
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 6. Admin Panel Features

### 6.1 대시보드
- 총 프로젝트 수, 활성 멤버 수
- 최근 활동 로그
- 저장소 사용량

### 6.2 회원 관리
- 초대 링크 생성
- 역할 변경 (Dropdown)
- 계정 비활성화/복구
- 마지막 접속 시간

### 6.3 감사 로그 (Audit Log)
```typescript
interface AuditLog {
  id: string;
  actor_id: string;
  action: 'create' | 'update' | 'delete' | 'invite' | 'role_change';
  target_type: 'project' | 'member' | 'organization';
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
}
```

---

## 7. Non-Functional Requirements

| 항목 | 요구사항 |
|------|----------|
| **Performance** | LCP < 2.5s, FID < 100ms |
| **Accessibility** | WCAG 2.1 AA 준수 |
| **Responsive** | Mobile-first, 320px ~ 1920px |
| **Security** | RBAC, RLS, HTTPS Only |
| **i18n** | 한국어, 영어 지원 |
| **SEO** | 동적 메타태그, sitemap.xml |

---

## 8. Implementation Phases

### Phase 1: 프로젝트 셋업 ✅ (완료)
- [x] GitHub 레포 생성 (`project-showcase-hub`)
- [x] Next.js 16 + TypeScript 초기화
- [x] Tailwind CSS v4 + shadcn/ui 설정
- [x] Supabase 클라이언트 설정
- [x] 기본 레이아웃 및 라우팅

### Phase 1.5: 별점/댓글 시스템 ✅ (완료 - 2025-12-26)
- [x] Supabase 클라이언트 (client.ts, server.ts)
- [x] 데이터베이스 타입 정의 (database.ts)
- [x] 인증 컨텍스트 (AuthProvider)
- [x] 별점 컴포넌트 (star-rating, rating-summary, project-rating)
- [x] 별점 API (GET, POST, DELETE)
- [x] 댓글 컴포넌트 (comment-form, comment-item, comments-section)
- [x] 댓글 API (GET, POST, PATCH, DELETE)
- [x] 데모 프로젝트 상세 페이지
- [x] 마이그레이션 SQL 작성

### Phase 2: 인증 시스템 (Week 2)
- [ ] Supabase Auth 설정
- [ ] 로그인/회원가입 UI
- [ ] 소셜 로그인 (Google, GitHub)
- [ ] RBAC Custom Claims 구현
- [ ] 보호된 라우트 미들웨어

### Phase 3: 핵심 기능 (Week 3-4)
- [ ] 조직/워크스페이스 CRUD
- [ ] 프로젝트 CRUD
- [ ] 계층형 프로젝트 구조
- [ ] 첨부파일 업로드/관리
- [ ] 타임라인 뷰 구현

### Phase 4: 관리자 패널 (Week 5)
- [ ] 관리자 대시보드
- [ ] 회원 관리 UI
- [ ] 초대 시스템
- [ ] 감사 로그

### Phase 5: 추가 기능 & 배포 (Week 6)
- [ ] 갤러리/보드/리스트 뷰
- [ ] 다크 모드
- [ ] Vercel 배포
- [ ] README 및 문서화

---

## 9. Success Metrics

| 지표 | 목표 |
|------|------|
| GitHub Stars | 100+ (3개월 내) |
| 활성 사용자 | 50+ 조직 |
| 평균 프로젝트 수 | 5+/조직 |
| Lighthouse Score | 90+ (Performance) |

---

## 10. Future Considerations

1. **API 공개**: REST/GraphQL API for 외부 연동
2. **플러그인 시스템**: 커스텀 뷰, 통합
3. **AI 기능**: 프로젝트 요약, 자동 태깅
4. **모바일 앱**: React Native 또는 PWA
5. **알림 시스템**: 마감일 알림, 멘션

---

## Appendix

### A. 참고 오픈소스

| 프로젝트 | 설명 | 라이선스 |
|----------|------|----------|
| [OpenProject](https://www.openproject.org/) | 프로젝트 포트폴리오 관리 | GPL-3.0 |
| [GanttProject](https://www.ganttproject.biz/) | Gantt 차트 도구 | GPL-3.0 |
| [Magic Portfolio](https://vercel.com/templates/next.js/magic-portfolio-for-next-js) | Next.js 포트폴리오 템플릿 | MIT |

### B. 기술 문서

- [Supabase RBAC Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Next.js 15 Documentation](https://nextjs.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)
