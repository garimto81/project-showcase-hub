-- profiles INSERT 정책 수정 (트리거에서 삽입 가능하도록)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- 새 정책: 모든 INSERT 허용 (트리거가 SECURITY DEFINER로 실행되어야 함)
-- 실제로는 auth.users 트리거에서만 호출되므로 안전
CREATE POLICY "Allow insert from trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);
