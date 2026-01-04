-- =============================================================
-- 다중 인증 시스템: Admin & Anonymous 프로필 생성
-- PRD-0003 v2.4.0
-- =============================================================

-- 1. Admin 프로필 생성 (앱 관리용)
-- UUID: 00000000-0000-0000-0000-000000000001
INSERT INTO profiles (id, email, display_name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@local',
  'Admin',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 2. Anonymous 프로필 생성 (익명 댓글/별점용)
-- UUID: 00000000-0000-0000-0000-000000000002
INSERT INTO profiles (id, email, display_name, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'anonymous@local',
  '익명 사용자',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 3. 기존 잘못된 user_id 데이터 정리
-- 'admin' 문자열로 저장된 잘못된 데이터를 Anonymous UUID로 변경

-- 3.1 Comments 테이블 정리
UPDATE comments
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM profiles);

-- 3.2 Ratings 테이블 정리
UPDATE ratings
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM profiles);

-- 3.3 Projects 테이블 정리 (owner_id)
UPDATE projects
SET owner_id = '00000000-0000-0000-0000-000000000001'
WHERE owner_id IS NOT NULL
  AND owner_id NOT IN (SELECT id FROM profiles);

-- =============================================================
-- 코멘트
-- =============================================================

-- 이제 3가지 인증 방식이 지원됩니다:
-- 1. Admin (00000000-0000-0000-0000-000000000001)
--    - 환경변수 비밀번호 인증
--    - 앱 CRUD 권한
--
-- 2. User (Supabase Auth 생성 UUID)
--    - Email/Password 회원가입/로그인
--    - 댓글/별점 작성 권한
--    - 본인 작성물 수정/삭제
--
-- 3. Anonymous (00000000-0000-0000-0000-000000000002)
--    - 인증 없음
--    - 댓글/별점 작성 권한
--    - 수정/삭제 불가
