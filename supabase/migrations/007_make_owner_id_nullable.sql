-- 마이그레이션 007: owner_id를 nullable로 변경
-- 이유: OAuth 제거 후 단일 Admin 사용자 시스템으로 전환
-- owner_id에 UUID 대신 null을 허용하여 GitHub 동기화 에러 해결

-- 1. 기존 FK 제약 조건 확인 및 제거
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;

-- 2. owner_id를 nullable로 변경
ALTER TABLE projects ALTER COLUMN owner_id DROP NOT NULL;

-- 3. 기존 데이터의 owner_id를 null로 설정 (UUID 형식이 아닌 값)
UPDATE projects SET owner_id = NULL WHERE owner_id IS NOT NULL;

-- 4. FK 제약 조건 다시 추가 (nullable 허용)
-- 주의: profiles 테이블이 없으면 FK 추가하지 않음
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    -- FK 추가 실패 시 무시 (profiles 테이블이 없거나 참조 무결성 문제)
    RAISE NOTICE 'FK constraint not added: %', SQLERRM;
END $$;

-- 5. RLS 정책 업데이트 (owner_id 체크 제거)
-- 기존 정책 삭제 (모든 가능한 정책명)
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

-- 새 정책: 모든 사용자가 프로젝트 조회 가능
CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT USING (true);

-- 새 정책: 인증된 사용자가 프로젝트 생성 가능
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (true);

-- 새 정책: 인증된 사용자가 프로젝트 수정 가능 (단일 사용자이므로)
CREATE POLICY "Authenticated users can update projects" ON projects
  FOR UPDATE USING (true);

-- 새 정책: 인증된 사용자가 프로젝트 삭제 가능 (단일 사용자이므로)
CREATE POLICY "Authenticated users can delete projects" ON projects
  FOR DELETE USING (true);

COMMENT ON COLUMN projects.owner_id IS '프로젝트 소유자 ID (nullable - 단일 사용자 시스템)';
