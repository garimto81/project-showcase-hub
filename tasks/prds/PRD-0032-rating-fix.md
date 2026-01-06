# PRD-0032: 별점 평가 중복 등록 방지 및 새로고침 문제 해결

**Issue**: [#32](https://github.com/garimto81/project-showcase-hub/issues/32)
**Status**: Open
**Created**: 2025-01-06

---

## 개요

별점 평가 시스템의 두 가지 버그를 수정합니다:
1. 동일 사용자가 같은 프로젝트에 중복 별점 등록 가능
2. 별점 입력 시 페이지 새로고침 발생

---

## 문제 분석

### 1. 중복 등록 문제

**현재 동작**:
- 사용자가 같은 프로젝트에 여러 번 별점 등록 가능
- ratings 테이블에 중복 레코드 생성

**원인 추정**:
- DB에 unique constraint 미설정 (user_id + project_id)
- API에서 기존 별점 확인 없이 INSERT 수행

### 2. 새로고침 문제

**현재 동작**:
- 별점 클릭 시 페이지 전체 새로고침
- UX 저하 및 상태 손실

**원인 추정**:
- form submit 이벤트 미처리
- 또는 router.refresh() 불필요 호출

---

## 해결 방안

### Phase 1: 데이터베이스

```sql
-- ratings 테이블에 unique constraint 추가
ALTER TABLE ratings
ADD CONSTRAINT ratings_user_project_unique
UNIQUE (user_id, project_id);
```

### Phase 2: API 수정

**파일**: `src/app/api/ratings/route.ts`

```typescript
// INSERT 대신 UPSERT 사용
const { data, error } = await supabase
  .from('ratings')
  .upsert(
    { project_id, user_id, score },
    { onConflict: 'user_id,project_id' }
  )
  .select()
  .single();
```

### Phase 3: 프론트엔드

**파일**: `src/components/features/rating/*.tsx`

1. form submit preventDefault 확인
2. 불필요한 router.refresh() 제거
3. 낙관적 UI 업데이트 적용

---

## Checklist

- [ ] DB: unique constraint 추가 (#32)
- [ ] API: upsert 로직 구현 (#32)
- [ ] Frontend: 새로고침 방지 (#32)
- [ ] Frontend: 낙관적 UI 업데이트 (#32)
- [ ] Test: E2E 테스트 작성 (#32)

---

## 영향 범위

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/` | unique constraint 추가 |
| `src/app/api/ratings/route.ts` | upsert 로직 |
| `src/components/features/rating/` | 이벤트 처리 수정 |
| `src/hooks/use-rating.ts` | 상태 관리 개선 |

---

## 테스트 시나리오

1. **중복 등록 방지**
   - 별점 등록 후 다시 등록 시 기존 값 업데이트 확인
   - DB에 단일 레코드만 존재 확인

2. **새로고침 방지**
   - 별점 클릭 시 페이지 유지 확인
   - URL 변경 없음 확인
   - 스크롤 위치 유지 확인

3. **UI 반영**
   - 별점 변경 즉시 UI 반영
   - 평균 별점 재계산 및 표시
