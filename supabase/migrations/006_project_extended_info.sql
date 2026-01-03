-- 006_project_extended_info.sql
-- 프로젝트 확장 정보 테이블 (기술 스택, 스크린샷, GitHub 캐시)

-- 1. 프로젝트 메타데이터 테이블 생성
CREATE TABLE IF NOT EXISTS project_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 기술 스택 (배열)
  tech_stack TEXT[] DEFAULT '{}',

  -- 스크린샷 갤러리 (URL 배열)
  screenshots TEXT[] DEFAULT '{}',

  -- 프로젝트 상태: active(활발), maintained(유지보수), archived(보관), unknown(미정)
  status TEXT DEFAULT 'unknown' CHECK (status IN ('active', 'maintained', 'archived', 'unknown')),

  -- GitHub 캐시 데이터 (API 호출 최소화)
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_language TEXT,
  github_topics TEXT[] DEFAULT '{}',
  github_last_pushed_at TIMESTAMPTZ,
  github_last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_metadata_project_id ON project_metadata(project_id);
CREATE INDEX IF NOT EXISTS idx_project_metadata_status ON project_metadata(status);
CREATE INDEX IF NOT EXISTS idx_project_metadata_github_stars ON project_metadata(github_stars DESC);

-- 3. RLS 활성화
ALTER TABLE project_metadata ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 읽기는 모든 사용자 허용
CREATE POLICY "Anyone can view project metadata"
  ON project_metadata FOR SELECT
  USING (true);

-- 5. RLS 정책: 쓰기는 프로젝트 소유자만 허용
CREATE POLICY "Project owners can insert metadata"
  ON project_metadata FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update metadata"
  ON project_metadata FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete metadata"
  ON project_metadata FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- 6. 트리거: updated_at 자동 갱신
CREATE TRIGGER project_metadata_updated_at
  BEFORE UPDATE ON project_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 기존 프로젝트에 대한 메타데이터 레코드 생성
INSERT INTO project_metadata (project_id)
SELECT id FROM projects
WHERE id NOT IN (SELECT project_id FROM project_metadata);

-- 8. 테이블 설명
COMMENT ON TABLE project_metadata IS '프로젝트 확장 정보 (기술 스택, 스크린샷, GitHub 캐시)';
COMMENT ON COLUMN project_metadata.tech_stack IS '기술 스택 태그 배열';
COMMENT ON COLUMN project_metadata.screenshots IS '스크린샷 URL 배열';
COMMENT ON COLUMN project_metadata.status IS '프로젝트 상태 (active/maintained/archived/unknown)';
COMMENT ON COLUMN project_metadata.github_stars IS 'GitHub Star 수 (캐시)';
COMMENT ON COLUMN project_metadata.github_forks IS 'GitHub Fork 수 (캐시)';
COMMENT ON COLUMN project_metadata.github_language IS 'GitHub 주요 언어 (캐시)';
COMMENT ON COLUMN project_metadata.github_topics IS 'GitHub 토픽 태그 (캐시)';
COMMENT ON COLUMN project_metadata.github_last_pushed_at IS 'GitHub 마지막 푸시 시간 (캐시)';
COMMENT ON COLUMN project_metadata.github_last_synced_at IS 'GitHub 동기화 시간';
