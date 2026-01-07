'use client'

import { useFetch } from './use-fetch'
import type { GitHubRepo } from '@/app/api/github/repos/route'

interface UseGitHubReposResult {
  repos: GitHubRepo[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGitHubRepos(): UseGitHubReposResult {
  const { data: repos, loading, error, refetch } = useFetch<
    GitHubRepo[],
    { repos: GitHubRepo[] }
  >({
    url: '/api/github/repos',
    initialData: [],
    defaultErrorMessage: 'GitHub 레포지토리를 가져오는데 실패했습니다',
    transform: (response) => response.repos,
  })

  return { repos, loading, error, refetch }
}
