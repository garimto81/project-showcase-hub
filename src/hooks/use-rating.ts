"use client"

import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFetch } from './use-fetch'
import type { RatingWithProfile } from '@/types/database'

interface RatingData {
  ratings: RatingWithProfile[]
  average: number
  total: number
  distribution: Record<number, number>
}

const initialRatingData: RatingData = {
  ratings: [],
  average: 0,
  total: 0,
  distribution: {},
}

export function useRating(projectId: string) {
  const { isAuthenticated } = useAuth()
  const [userRating, setUserRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const lastSubmittedScore = useRef<number | null>(null)

  const {
    data,
    loading,
    error,
    refetch: fetchRatings,
    setError,
  } = useFetch<RatingData>({
    url: `/api/projects/${projectId}/ratings`,
    initialData: initialRatingData,
    defaultErrorMessage: '별점을 불러오는데 실패했습니다',
  })

  const submitRating = async (score: number) => {
    // 중복 요청 방지: 이미 제출 중이거나 동일 점수면 무시
    if (submitting || score === lastSubmittedScore.current) {
      return
    }

    // 낙관적 UI 업데이트
    const previousRating = userRating
    setUserRating(score)
    setSubmitting(true)
    lastSubmittedScore.current = score

    try {
      const response = await fetch(`/api/projects/${projectId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })

      if (!response.ok) {
        // 실패 시 롤백
        setUserRating(previousRating)
        lastSubmittedScore.current = previousRating
        throw new Error('별점 등록에 실패했습니다')
      }

      // 성공 시 최신 데이터 동기화
      await fetchRatings()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRating = async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(`/api/projects/${projectId}/ratings`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('별점 삭제에 실패했습니다')
      }

      setUserRating(null)
      await fetchRatings()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    }
  }

  return {
    ratings: data.ratings,
    average: data.average,
    total: data.total,
    distribution: data.distribution,
    userRating,
    loading,
    submitting,
    error,
    submitRating,
    deleteRating,
    refetch: fetchRatings,
  }
}
