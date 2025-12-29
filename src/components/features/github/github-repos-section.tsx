'use client'

import { useState } from 'react'
import { Github, RefreshCw, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGitHubRepos } from '@/hooks/use-github-repos'
import { useAuth } from '@/hooks/use-auth'
import { RepoCard } from './repo-card'

function ReposSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3 p-4 border rounded-lg">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GitHubReposSection() {
  const { user, hasGitHubLinked, linkGitHubAccount } = useAuth()
  const { repos, loading, error, refetch } = useGitHubRepos()
  const [isLinking, setIsLinking] = useState(false)

  const handleLinkGitHub = async () => {
    setIsLinking(true)
    try {
      // 현재 페이지로 돌아오도록 설정
      await linkGitHubAccount('/')
    } finally {
      setIsLinking(false)
    }
  }

  if (!user) {
    return null
  }

  if (!hasGitHubLinked) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">GitHub 계정을 연동하세요</p>
        <p className="text-sm mb-6">GitHub 레포지토리를 가져오려면 GitHub 계정 연동이 필요합니다.</p>
        <Button onClick={handleLinkGitHub} disabled={isLinking}>
          <Link2 className="h-4 w-4 mr-2" />
          {isLinking ? '연동 중...' : 'GitHub 계정 연동하기'}
        </Button>
      </div>
    )
  }

  if (loading) {
    return <ReposSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>레포지토리가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {repos.length}개의 레포지토리
        </p>
        <Button onClick={refetch} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  )
}
