-- MVP 마이그레이션: AppHub 필드 추가
-- 기존 projects 테이블에 앱 마켓 기능을 위한 필드 추가

-- 1. 앱 URL 필드 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. 앱 타입 필드 추가 (MVP에서는 web_app만 사용)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS app_type TEXT DEFAULT 'web_app';

-- 3. 즐겨찾기 필드 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- 4. GitHub 레포 전체 이름 필드 추가 (owner/repo 형식)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_is_favorite ON projects(is_favorite);
CREATE INDEX IF NOT EXISTS idx_projects_app_type ON projects(app_type);
CREATE INDEX IF NOT EXISTS idx_projects_github_repo ON projects(github_repo);

-- 6. RLS 정책은 기존 것 유지 (projects 테이블에 이미 적용됨)

COMMENT ON COLUMN projects.url IS '앱 접근 URL (배포된 사이트 주소)';
COMMENT ON COLUMN projects.app_type IS '앱 유형: web_app, pwa, api, docker';
COMMENT ON COLUMN projects.is_favorite IS '즐겨찾기 여부';
COMMENT ON COLUMN projects.github_repo IS 'GitHub 레포지토리 (owner/repo 형식)';
