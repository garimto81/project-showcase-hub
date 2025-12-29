'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GitHubRepo } from '@/app/api/github/repos/route'

interface UseGitHubReposResult {
  repos: GitHubRepo[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGitHubRepos(): UseGitHubReposResult {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'GitHub 레포지토리를 가져오는데 실패했습니다')
      }

      setRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  return { repos, loading, error, refetch: fetchRepos }
}
