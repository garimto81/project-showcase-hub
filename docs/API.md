# Aiden's Market API Reference

> REST API 문서
> Base URL: `/api`

---

## 인증

대부분의 API는 Supabase Auth를 통한 인증이 필요합니다.

### 인증 방식
- **Session Cookie**: Supabase Auth에서 발급한 세션 쿠키
- **401 Unauthorized**: 인증이 필요한 엔드포인트에 미인증 접근 시

### 에러 응답 형식
```json
{
  "error": "에러 메시지"
}
```

---

## Projects (프로젝트)

### GET /api/projects
프로젝트 목록을 조회합니다.

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| userId | string | ❌ | 특정 사용자의 프로젝트만 조회 |
| search | string | ❌ | 제목/설명 검색어 |
| limit | number | ❌ | 페이지 크기 (기본값: 20) |
| offset | number | ❌ | 페이지 오프셋 (기본값: 0) |

**Response 200**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "프로젝트 제목",
      "description": "설명",
      "thumbnail_url": "https://...",
      "url": "https://...",
      "app_type": "web_app",
      "is_favorite": false,
      "github_repo": "user/repo",
      "owner_id": "uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "profiles": {
        "id": "uuid",
        "display_name": "사용자명",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

### POST /api/projects
새 프로젝트를 생성합니다.

**인증**: 필수 ✅

**Request Body**
```json
{
  "title": "프로젝트 제목",
  "description": "프로젝트 설명 (선택)",
  "thumbnail_url": "https://... (선택)"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| title | string | ✅ | 프로젝트 제목 |
| description | string | ❌ | 프로젝트 설명 |
| thumbnail_url | string | ❌ | 썸네일 이미지 URL |

**Response 201**
```json
{
  "id": "uuid",
  "title": "프로젝트 제목",
  "description": "설명",
  "owner_id": "uuid",
  ...
}
```

**Errors**
- `400 Bad Request`: 제목이 없거나 빈 문자열
- `401 Unauthorized`: 미인증

---

### GET /api/projects/:projectId
프로젝트 상세 정보를 조회합니다.

**Response 200**
```json
{
  "id": "uuid",
  "title": "프로젝트 제목",
  "description": "설명",
  "profiles": {
    "id": "uuid",
    "display_name": "사용자명",
    "avatar_url": "https://..."
  },
  ...
}
```

**Errors**
- `404 Not Found`: 프로젝트를 찾을 수 없음

---

### PATCH /api/projects/:projectId
프로젝트를 수정합니다.

**인증**: 필수 ✅ (소유자만)

**Request Body**
```json
{
  "title": "새 제목 (선택)",
  "description": "새 설명 (선택)",
  "thumbnail_url": "https://... (선택)"
}
```

**Response 200**
```json
{
  "id": "uuid",
  "title": "수정된 제목",
  ...
}
```

**Errors**
- `401 Unauthorized`: 미인증
- `403 Forbidden`: 소유자가 아님
- `404 Not Found`: 프로젝트를 찾을 수 없음

---

### DELETE /api/projects/:projectId
프로젝트를 삭제합니다.

**인증**: 필수 ✅ (소유자만)

**Response 204 No Content**

**Errors**
- `401 Unauthorized`: 미인증
- `403 Forbidden`: 소유자가 아님
- `404 Not Found`: 프로젝트를 찾을 수 없음

---

## Comments (댓글)

### GET /api/projects/:projectId/comments
프로젝트의 댓글 목록을 조회합니다.

**Response 200**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "user_id": "uuid",
    "content": "댓글 내용",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
    "profiles": {
      "display_name": "사용자명",
      "avatar_url": "https://..."
    }
  }
]
```

---

### POST /api/projects/:projectId/comments
새 댓글을 작성합니다.

**인증**: 필수 ✅

**Request Body**
```json
{
  "content": "댓글 내용"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "content": "댓글 내용",
  "profiles": { ... },
  ...
}
```

**Errors**
- `400 Bad Request`: 댓글 내용이 비어있음
- `401 Unauthorized`: 미인증

---

### PATCH /api/comments/:commentId
댓글을 수정합니다.

**인증**: 필수 ✅ (작성자만)

**Request Body**
```json
{
  "content": "수정된 댓글 내용"
}
```

**Response 200**
```json
{
  "id": "uuid",
  "content": "수정된 댓글 내용",
  ...
}
```

**Errors**
- `400 Bad Request`: 댓글 내용이 비어있음
- `401 Unauthorized`: 미인증
- `403 Forbidden`: 작성자가 아님

---

### DELETE /api/comments/:commentId
댓글을 삭제합니다.

**인증**: 필수 ✅ (작성자만)

**Response 204 No Content**

**Errors**
- `401 Unauthorized`: 미인증
- `403 Forbidden`: 작성자가 아님

---

## Ratings (별점)

### GET /api/projects/:projectId/ratings
프로젝트의 별점 목록 및 통계를 조회합니다.

**Response 200**
```json
{
  "ratings": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "user_id": "uuid",
      "score": 5,
      "created_at": "2025-01-01T00:00:00Z",
      "profiles": {
        "display_name": "사용자명",
        "avatar_url": "https://..."
      }
    }
  ],
  "average": 4.5,
  "total": 10,
  "distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4
  }
}
```

---

### POST /api/projects/:projectId/ratings
별점을 등록하거나 수정합니다 (Upsert).

**인증**: 필수 ✅

**Request Body**
```json
{
  "score": 5
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| score | number | ✅ | 1-5 사이의 정수 |

**Response 200**
```json
{
  "id": "uuid",
  "score": 5,
  ...
}
```

**Errors**
- `400 Bad Request`: 점수가 1-5 범위를 벗어남
- `401 Unauthorized`: 미인증

---

### DELETE /api/projects/:projectId/ratings
내 별점을 삭제합니다.

**인증**: 필수 ✅

**Response 204 No Content**

---

## GitHub Integration (GitHub 연동)

### GET /api/github/repos
연동된 GitHub 계정의 레포지토리 목록을 조회합니다.

**인증**: 필수 ✅ (GitHub 연동 필요)

**Response 200**
```json
{
  "repos": [
    {
      "id": 123456,
      "name": "my-project",
      "full_name": "username/my-project",
      "description": "프로젝트 설명",
      "html_url": "https://github.com/username/my-project",
      "homepage": "https://my-project.vercel.app",
      "stargazers_count": 10,
      "forks_count": 2,
      "language": "TypeScript",
      "topics": ["nextjs", "react"],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "pushed_at": "2025-01-01T00:00:00Z",
      "visibility": "public",
      "owner": {
        "login": "username",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 25
}
```

**Errors**
- `401 Unauthorized`: 미인증 또는 GitHub 토큰 만료

---

### POST /api/github/scan-all
사용자의 모든 GitHub 레포를 스캔하여 배포된 앱을 자동으로 찾아 등록합니다.

**인증**: 필수 ✅ (GitHub 연동 필요)

**Response 200**
```json
{
  "success": true,
  "result": {
    "totalRepos": 25,
    "scannedRepos": 25,
    "detectedApps": 5,
    "savedApps": 3,
    "existingApps": 2,
    "skippedRepos": 20,
    "errors": 0
  },
  "apps": [
    {
      "repoFullName": "user/my-app",
      "repoName": "my-app",
      "description": "앱 설명",
      "url": "https://my-app.vercel.app",
      "source": "github_homepage",
      "confidence": "high",
      "thumbnailUrl": "https://opengraph.githubassets.com/1/user/my-app"
    }
  ],
  "skipped": ["user/existing-app"]
}
```

**Errors**
- `400 Bad Request`: GitHub 계정이 연동되지 않음 (`needsGithubLink: true`)
- `401 Unauthorized`: 미인증 또는 재인증 필요 (`needsReauth: true`)

---

### POST /api/github/detect-deployment
개별 레포의 배포 URL을 탐지합니다.

**인증**: 필수 ✅ (GitHub 연동 필요)

**Request Body**
```json
{
  "owner": "username",
  "repo": "repository-name"
}
```

**Response 200 (탐지 성공)**
```json
{
  "detected": true,
  "app": {
    "repoFullName": "username/repository-name",
    "repoName": "repository-name",
    "description": "레포 설명",
    "url": "https://my-app.vercel.app",
    "source": "github_homepage",
    "confidence": "high",
    "thumbnailUrl": "https://..."
  }
}
```

**Response 200 (탐지 실패)**
```json
{
  "detected": false,
  "message": "배포된 URL을 찾을 수 없습니다"
}
```

**Errors**
- `400 Bad Request`: owner 또는 repo 파라미터 누락
- `401 Unauthorized`: 미인증
- `404 Not Found`: 레포를 찾을 수 없음

---

## 배포 URL 탐지 소스

`scan-all` 및 `detect-deployment` API에서 사용하는 배포 URL 탐지 소스:

| 소스 | 신뢰도 | 설명 |
|------|:------:|------|
| `github_homepage` | high | 레포 설정의 Homepage 필드 |
| `github_pages` | high | GitHub Pages 활성화 |
| `github_environments` | high | GitHub Environments/Deployments |
| `readme_badge` | medium | README의 Vercel/Netlify 배지 |
| `readme_link` | medium | README의 Demo/Live 링크 |
| `url_inference` | low | URL 패턴 추론 (vercel.app, netlify.app 등) |

---

## HTTP 상태 코드

| 코드 | 설명 |
|:----:|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 204 | 삭제됨 (No Content) |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 오류 |
