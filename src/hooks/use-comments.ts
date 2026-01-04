"use client"

import { useState, useEffect, useCallback } from 'react'
import type { CommentWithProfile } from '@/types/database'

export function useComments(projectId: string) {
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/comments`)

      if (!response.ok) {
        throw new Error('댓글을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setComments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const addComment = async (content: string, authorName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author_name: authorName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '댓글 등록에 실패했습니다')
      }

      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      throw err
    }
  }

  const updateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '댓글 수정에 실패했습니다')
      }

      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      throw err
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '댓글 삭제에 실패했습니다')
      }

      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      throw err
    }
  }

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments,
  }
}
