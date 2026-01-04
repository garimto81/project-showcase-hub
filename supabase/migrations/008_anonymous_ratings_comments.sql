-- =============================================================
-- 익명 사용자 별점/댓글 지원
-- user_id를 nullable로 변경하여 비로그인 사용자도 작성 가능
-- =============================================================

-- 1. Comments 테이블 수정
-- user_id nullable로 변경 및 익명 작성자 이름 필드 추가

-- 기존 외래 키 제약 조건 삭제
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- user_id를 nullable로 변경
ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;

-- 익명 작성자 이름 필드 추가 (비로그인 사용자용)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name TEXT;

-- 외래 키 재생성 (user_id가 있을 경우에만 참조)
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 2. Ratings 테이블 수정
-- user_id nullable로 변경

-- 기존 외래 키 제약 조건 삭제
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;

-- 기존 UNIQUE 제약 조건 삭제 (project_id, user_id)
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_project_id_user_id_key;

-- user_id를 nullable로 변경
ALTER TABLE ratings ALTER COLUMN user_id DROP NOT NULL;

-- 외래 키 재생성
ALTER TABLE ratings
  ADD CONSTRAINT ratings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- UNIQUE 제약 조건 재생성 (user_id가 null이 아닐 때만 적용)
-- 익명 사용자는 중복 별점 가능 (나중에 IP 기반 제한 추가 가능)
CREATE UNIQUE INDEX IF NOT EXISTS ratings_project_user_unique
  ON ratings(project_id, user_id)
  WHERE user_id IS NOT NULL;

-- 3. RLS 정책 업데이트
-- 익명 사용자도 작성 가능하도록 변경

-- Comments 정책 업데이트
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    -- 로그인 사용자: auth.uid() = user_id
    -- 익명 사용자: user_id IS NULL AND author_name IS NOT NULL
    (auth.uid() = user_id) OR
    (user_id IS NULL AND author_name IS NOT NULL)
  );

-- 익명 댓글은 수정/삭제 불가, 로그인 사용자만 자신의 댓글 수정/삭제
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Ratings 정책 업데이트
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON ratings;

CREATE POLICY "Anyone can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (
    -- 로그인 사용자: auth.uid() = user_id
    -- 익명 사용자: user_id IS NULL
    (auth.uid() = user_id) OR (user_id IS NULL)
  );

-- 익명 별점은 수정/삭제 불가, 로그인 사용자만 자신의 별점 수정/삭제
DROP POLICY IF EXISTS "Users can update own rating" ON ratings;
DROP POLICY IF EXISTS "Users can delete own rating" ON ratings;

CREATE POLICY "Users can update own rating"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own rating"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- =============================================================
-- 코멘트
-- =============================================================

-- 이제 비로그인 사용자도 별점과 댓글을 남길 수 있습니다.
-- - 댓글: author_name 필드에 이름 입력 (필수)
-- - 별점: user_id = null로 저장
-- - 로그인 사용자는 기존과 동일하게 user_id 사용
-- - 익명 작성물은 수정/삭제 불가
