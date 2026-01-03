'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Github, RefreshCw, Link2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGitHubRepos } from '@/hooks/use-github-repos'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/hooks/use-auth'
import { SelectableRepoCard } from './selectable-repo-card'
import { toast } from 'sonner'

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
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { repos, loading, error, refetch } = useGitHubRepos()
  const { createProject } = useProjects()
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set())
  const [isCreating, setIsCreating] = useState(false)

  const handleToggleRepo = (repoId: number) => {
    setSelectedRepos(prev => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  const handleCreateProjects = async () => {
    if (selectedRepos.size === 0) return

    setIsCreating(true)
    try {
      const selectedRepoList = repos.filter(r => selectedRepos.has(r.id))
      let successCount = 0

      for (const repo of selectedRepoList) {
        try {
          await createProject({
            title: repo.name,
            description: repo.description || `GitHub: ${repo.html_url}`,
            thumbnail_url: `https://opengraph.githubassets.com/1/${repo.full_name}`,
          })
          successCount++
        } catch (err) {
          console.error(`Failed to create project for ${repo.name}:`, err)
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}개 프로젝트가 생성되었습니다`)
        router.push('/projects')
      } else {
        toast.error('프로젝트 생성에 실패했습니다')
      }
    } finally {
      setIsCreating(false)
      setSelectedRepos(new Set())
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">로그인이 필요합니다</p>
        <p className="text-sm mb-6">GitHub 레포지토리를 가져오려면 로그인이 필요합니다.</p>
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
        <div>
          <p className="text-sm text-muted-foreground">
            총 {repos.length}개의 레포지토리
          </p>
          {selectedRepos.size > 0 && (
            <p className="text-sm font-medium text-primary">
              {selectedRepos.size}개 선택됨
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refetch} variant="ghost" size="sm" disabled={isCreating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          {selectedRepos.size > 0 && (
            <Button onClick={handleCreateProjects} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isCreating ? '생성 중...' : `${selectedRepos.size}개 프로젝트 생성`}
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <SelectableRepoCard
            key={repo.id}
            repo={repo}
            selected={selectedRepos.has(repo.id)}
            onToggle={() => handleToggleRepo(repo.id)}
            disabled={isCreating}
          />
        ))}
      </div>
    </div>
  )
}
