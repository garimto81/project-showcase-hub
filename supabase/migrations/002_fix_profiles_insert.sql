-- profiles INSERT 정책 추가 (트리거가 사용자 생성 시 프로필 삽입 가능하도록)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
