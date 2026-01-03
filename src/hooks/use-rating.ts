"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { RatingWithProfile } from '@/types/database'

interface RatingData {
  ratings: RatingWithProfile[]
  average: number
  total: number
  distribution: Record<number, number>
}

export function useRating(projectId: string) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<RatingData>({
    ratings: [],
    average: 0,
    total: 0,
    distribution: {},
  })
  const [userRating, setUserRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = undefined // TODO: 사용자 ID 로직 재구성 필요

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/ratings`)

      if (!response.ok) {
        throw new Error('별점을 불러오는데 실패했습니다')
      }

      const result = await response.json()
      setData(result)

      // 현재 사용자의 별점 찾기
      if (userId) {
        const myRating = result.ratings.find(
          (r: RatingWithProfile) => r.user_id === userId
        )
        setUserRating(myRating?.score ?? null)
      } else {
        setUserRating(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [projectId, userId])

  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  const submitRating = async (score: number) => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(`/api/projects/${projectId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })

      if (!response.ok) {
        throw new Error('별점 등록에 실패했습니다')
      }

      setUserRating(score)
      await fetchRatings()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
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
    error,
    submitRating,
    deleteRating,
    refetch: fetchRatings,
  }
}
