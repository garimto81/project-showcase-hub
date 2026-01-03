# MVP 체크리스트: AppHub - Personal App Marketplace

| 항목 | 값 |
|------|---|
| **PRD** | PRD-0002 |
| **Version** | 1.0.0 |
| **Created** | 2025-12-31 |
| **Updated** | 2025-12-31 |
| **Status** | 구현 완료 |

---

## 현재 상태 요약

### 구현 완료 (기존 Project Showcase Hub)
- [x] 인증 시스템 (Email, GitHub OAuth, Google OAuth)
- [x] 프로젝트 CRUD
- [x] 별점 시스템
- [x] 댓글 시스템
- [x] 뷰 모드 (Gallery, List, Board, Timeline)
- [x] GitHub 레포 조회 (개별)
- [x] 반응형 UI (shadcn/ui)
- [x] Supabase RLS 보안

### MVP 목표
**핵심 전환**: GitHub 레포 수동 import → **전체 레포 자동 스캔 및 앱 마켓 자동 배치**

---

## Phase 0: 준비 작업 ✅

### 0.1 DB 마이그레이션
- [x] `005_app_market_mvp.sql` 마이그레이션 생성
  - [x] `url` 필드 추가 (앱 URL)
  - [x] `app_type` 필드 추가 (기본값: 'web_app')
  - [x] `is_favorite` 필드 추가 (기본값: false)
  - [x] `github_repo` 필드 추가 (레포 full_name)
- [x] 인덱스 생성 (`idx_projects_is_favorite`, `idx_projects_app_type`, `idx_projects_github_repo`)

### 0.2 타입 정의 업데이트
- [x] `src/types/database.ts` 수정
  - [x] `Project` 인터페이스에 새 필드 추가
  - [x] `ScanStatus` 타입 정의 (`idle` | `scanning` | `completed` | `error`)
  - [x] `ScanResult` 인터페이스 정의
  - [x] `DetectedApp` 인터페이스 정의
  - [x] `DeploymentSource` 타입 정의
  - [x] `ScanProgress` 인터페이스 정의

---

## Phase 1: 배포 URL 자동 탐지 기능 ✅

### 1.1 배포 URL 탐지 유틸리티
- [x] `src/lib/deployment-detector.ts` 생성
  - [x] `DeploymentDetector` 클래스
  - [x] `detectDeploymentUrl(repo)` 함수
  - [x] GitHub API `homepage` 필드 확인
  - [x] GitHub Pages URL 확인 (`{user}.github.io/{repo}`)
  - [x] GitHub Environments/Deployments API 확인
  - [x] README.md 파싱 (Demo/Live 링크)
  - [x] README.md 배지 URL 추출 (Vercel, Netlify)
  - [x] URL 추론 패턴 (`{repo}.vercel.app` 등)
  - [x] URL 유효성 검증 (HEAD 요청)

### 1.2 배포 탐지 API
- [x] `src/app/api/github/detect-deployment/route.ts` 생성
  - [x] POST: 개별 레포 배포 URL 탐지
  - [x] 입력: `{ owner, repo }`
  - [x] 출력: `{ detected, app }` 또는 `{ detected: false }`

---

## Phase 2: 전체 레포 자동 스캔 기능 ✅

### 2.1 레포 스캔 유틸리티
- [x] `src/lib/repo-scanner.ts` 생성
  - [x] `RepoScanner` 클래스
  - [x] `scanAllRepos(options)` 함수
  - [x] 사용자의 모든 레포 목록 조회 (페이지네이션 처리)
  - [x] 병렬 배포 URL 탐지 (동시 5개)
  - [x] 배포된 레포 필터링
  - [x] 앱 데이터 자동 생성

### 2.2 전체 스캔 API
- [x] `src/app/api/github/scan-all/route.ts` 생성
  - [x] POST: 전체 레포 스캔 시작
  - [x] 스캔 결과 반환 (탐지된 앱 목록)
  - [x] DB에 앱 자동 저장
  - [x] 중복 레포 건너뛰기 (github_repo 필드 기준)

### 2.3 스캔 상태 관리 훅
- [x] `src/hooks/use-repo-scanner.ts` 생성
  - [x] `startScan()` - 스캔 시작
  - [x] `status` - 현재 상태 (idle, scanning, completed, error)
  - [x] `isScanning`, `isCompleted`, `hasError` 헬퍼
  - [x] `scannedRepos` - 스캔 완료 레포 수
  - [x] `totalRepos` - 전체 레포 수
  - [x] `savedApps`, `existingApps` - 저장/기존 앱 수
  - [x] `detectedApps` - 탐지된 앱 목록
  - [x] `error` - 에러 상태
  - [x] `reset()` - 상태 초기화

---

## Phase 3: 스캔 UI 컴포넌트 ✅

### 3.1 스캔 진행 상황 컴포넌트
- [x] `src/components/features/apps/scan-progress.tsx` 생성
  - [x] 프로그레스 바 표시
  - [x] 스캔 진행률 (%) 표시
  - [x] 탐지된 앱 수 표시
  - [x] 에러 상태 표시

### 3.2 스캔 완료 결과 컴포넌트
- [x] `src/components/features/apps/scan-results.tsx` 생성
  - [x] 새로 등록/이미 등록/배포 없음 통계
  - [x] 앱 미리보기 카드 목록
  - [x] "내 앱 마켓 보기" 버튼
  - [x] "다시 스캔" 버튼

### 3.3 수동 앱 추가 다이얼로그
- [x] `src/components/features/apps/manual-add-dialog.tsx` 생성
  - [x] URL 직접 입력 폼
  - [x] 앱 이름, 설명 입력
  - [x] 썸네일 URL 입력 (선택)
  - [x] 유효성 검사

### 3.4 컴포넌트 인덱스
- [x] `src/components/features/apps/index.ts` 생성

---

## Phase 4: GitHub 연동 시 자동 스캔 ✅

### 4.1 인증 컨텍스트
- [x] `src/contexts/auth-context.tsx` 확인
  - [x] `hasGitHubLinked` 상태 (기존 구현됨)
  - [x] `linkGitHubAccount()` 메서드 (기존 구현됨)

### 4.2 메인 대시보드 페이지 수정
- [x] `src/app/(dashboard)/page.tsx` 수정
  - [x] 스캔 상태에 따른 UI 분기
  - [x] GitHub 미연동 시 환영 화면
  - [x] 스캔 중 진행 상황 표시
  - [x] 스캔 완료 후 결과 표시
  - [x] "다시 스캔" 버튼 추가
  - [x] "수동 추가" 버튼 추가
  - [x] 앱이 없을 때 안내 화면
  - [x] 최초 방문 시 자동 스캔 (sessionStorage로 중복 방지)

---

## Phase 5: 앱 카드 수정 ✅

### 5.1 프로젝트 카드 → 앱 카드
- [x] `src/components/features/projects/project-card.tsx` 수정
  - [x] "앱 열기" 버튼 추가 (url 필드 사용)
  - [x] 즐겨찾기 토글 버튼 추가 (⭐)
  - [x] URL 없을 시 버튼 미표시
  - [x] 새 탭에서 열기 (`target="_blank"`)
  - [x] `onToggleFavorite` 콜백 prop 추가

### 5.2 프로젝트 훅 확장
- [x] `src/hooks/use-projects.ts` 수정
  - [x] `toggleFavorite(projectId, isFavorite)` 메서드 추가
  - [x] `create(data)` 메서드 추가 (에러 반환 형식)
  - [x] 새 필드 타입 지원 (`CreateProjectData`, `UpdateProjectData`)
  - [x] 낙관적 업데이트 (즐겨찾기 토글)

### 5.3 갤러리 뷰 수정
- [x] `src/components/features/views/gallery-view.tsx` 수정
  - [x] `ProjectCard` 컴포넌트 사용
  - [x] `onToggleFavorite` prop 전달

---

## Phase 6: 헤더 및 브랜딩 ✅

### 6.1 헤더 리브랜딩
- [x] `src/components/layout/dashboard-header.tsx` 수정
  - [x] "Project Showcase Hub" → "AppHub"
  - [x] Rocket 아이콘 추가

---

## Phase 7: 테스트 ✅

### 7.1 기존 테스트 업데이트
- [x] `src/components/features/projects/project-card.test.tsx` 수정
  - [x] 새 필드 포함한 mock 데이터
  - [x] 앱 열기 버튼 테스트
  - [x] URL 없을 시 버튼 미표시 테스트
  - [x] 즐겨찾기 표시 테스트

### 7.2 타입 체크 및 린트
- [x] TypeScript 타입 체크 통과 (`npx tsc --noEmit`)
- [x] ESLint 통과 (`npm run lint`)

### 7.3 빌드 테스트
- [x] 프로덕션 빌드 성공 (`npm run build`)

### 7.4 단위 테스트
- [x] 99개 테스트 통과 (`npm test`)

---

## Phase 8: 최종 확인 ✅

### 8.1 MVP 완료 기준 체크
- [x] **자동 스캔**: GitHub 연동 시 모든 레포가 자동으로 스캔된다
- [x] **자동 배치**: 배포된 앱이 발견되면 마켓에 자동 등록된다
- [x] **스캔 상태**: 스캔 진행 상황이 실시간으로 표시된다
- [x] **앱 실행**: 등록된 앱을 클릭하면 새 탭에서 열린다
- [x] **다시 스캔**: 수동으로 레포를 재스캔할 수 있다
- [x] **수동 추가**: URL을 직접 입력하여 앱을 추가할 수 있다
- [x] **즐겨찾기**: 앱을 즐겨찾기로 표시할 수 있다
- [x] **CRUD**: 앱을 수정하고 삭제할 수 있다 (기존 기능)

### 8.2 빌드 및 검증
- [x] TypeScript 컴파일 성공
- [x] ESLint 통과
- [x] 단위 테스트 통과 (99개)
- [x] 프로덕션 빌드 성공

### 8.3 배포 대기
- [ ] Supabase 마이그레이션 적용 (`supabase db push`)
- [ ] Vercel 배포 확인
- [ ] 프로덕션 환경 테스트

---

## 작업 파일 목록

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/types/database.ts` | `url`, `app_type`, `is_favorite`, `github_repo` 필드 및 스캔 관련 타입 추가 |
| `src/components/features/projects/project-card.tsx` | "앱 열기" 버튼, 즐겨찾기 토글 추가 |
| `src/components/features/projects/project-card.test.tsx` | 새 필드 mock 데이터 및 테스트 추가 |
| `src/components/features/views/gallery-view.tsx` | ProjectCard 컴포넌트 사용, 즐겨찾기 콜백 |
| `src/hooks/use-projects.ts` | 즐겨찾기 토글, create 메서드, 타입 확장 |
| `src/app/(dashboard)/page.tsx` | 스캔 UI 통합, 자동 스캔, 수동 추가 |
| `src/components/layout/dashboard-header.tsx` | AppHub 브랜딩 |

### 신규 파일
| 파일 | 설명 |
|------|------|
| `supabase/migrations/005_app_market_mvp.sql` | MVP 마이그레이션 |
| `src/lib/deployment-detector.ts` | 배포 URL 자동 탐지 유틸리티 |
| `src/lib/repo-scanner.ts` | 전체 레포 스캔 및 배치 로직 |
| `src/hooks/use-repo-scanner.ts` | 레포 스캔 상태 관리 훅 |
| `src/app/api/github/scan-all/route.ts` | 전체 레포 스캔 API |
| `src/app/api/github/detect-deployment/route.ts` | 개별 레포 배포 URL 탐지 API |
| `src/components/features/apps/scan-progress.tsx` | 스캔 진행 상황 표시 컴포넌트 |
| `src/components/features/apps/scan-results.tsx` | 스캔 완료 결과 표시 컴포넌트 |
| `src/components/features/apps/manual-add-dialog.tsx` | 수동 앱 추가 다이얼로그 |
| `src/components/features/apps/index.ts` | 앱 컴포넌트 인덱스 |

---

## 진행률

| Phase | 상태 | 완료 항목 |
|-------|------|----------|
| Phase 0: 준비 작업 | ✅ 완료 | 8/8 |
| Phase 1: 배포 URL 탐지 | ✅ 완료 | 12/12 |
| Phase 2: 전체 레포 스캔 | ✅ 완료 | 15/15 |
| Phase 3: 스캔 UI | ✅ 완료 | 12/12 |
| Phase 4: 자동 스캔 연동 | ✅ 완료 | 10/10 |
| Phase 5: 앱 카드 수정 | ✅ 완료 | 10/10 |
| Phase 6: 헤더/브랜딩 | ✅ 완료 | 2/2 |
| Phase 7: 테스트 | ✅ 완료 | 7/7 |
| Phase 8: 최종 확인 | ✅ 완료 | 12/12 |

**전체 진행률**: 88/88 (100%) - 배포 대기

---

## 다음 단계

1. **Supabase 마이그레이션 적용**
   ```bash
   npx supabase db push
   ```

2. **Vercel 배포**
   ```bash
   git add . && git commit -m "feat: MVP - AppHub 전체 레포 자동 스캔 기능"
   git push
   ```

3. **프로덕션 테스트**
   - GitHub 로그인 → 자동 스캔 → 앱 배치 확인
   - 앱 열기, 즐겨찾기, 수동 추가 테스트

---

## 참고

- **PRD 문서**: `docs/PRD-0002-project-showcase-hub.md`
- **기술 스택**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase
