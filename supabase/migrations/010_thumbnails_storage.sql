-- 썸네일 저장용 Storage 버킷 생성
-- 이 마이그레이션은 Supabase 대시보드에서 수동 실행 필요

-- 1. Storage 버킷 생성 (SQL로는 불가, 대시보드에서 생성)
-- Bucket name: thumbnails
-- Public bucket: Yes

-- 2. Storage 정책 설정 (대시보드에서 실행)

-- 읽기: 모든 사용자 허용 (공개)
-- CREATE POLICY "Public read access for thumbnails"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'thumbnails');

-- 쓰기: 인증된 사용자만 (anon key로는 service_role 필요)
-- CREATE POLICY "Authenticated users can upload thumbnails"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'thumbnails');

-- 업데이트: 인증된 사용자만
-- CREATE POLICY "Authenticated users can update thumbnails"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'thumbnails');

-- 삭제: 인증된 사용자만
-- CREATE POLICY "Authenticated users can delete thumbnails"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'thumbnails');

-- ====================================================================
-- Supabase 대시보드에서 수동 설정 필요:
--
-- 1. Storage > Create bucket
--    - Name: thumbnails
--    - Public bucket: Yes (체크)
--
-- 2. 버킷 선택 > Policies > New Policy
--    - SELECT (읽기): Allow public access
--    - INSERT/UPDATE/DELETE: Allow authenticated access
-- ====================================================================

-- 참고: 로컬 스크립트에서 실행 시 anon key로 업로드하려면
-- Supabase 대시보드에서 다음 정책 추가:
--
-- Policy name: Allow anon uploads for thumbnails
-- Allowed operation: INSERT
-- Policy definition: bucket_id = 'thumbnails'
-- Target roles: anon (선택)
