'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, GitFork, RefreshCw, ExternalLink, Clock } from 'lucide-react'
import { getLanguageColor } from '@/hooks/use-project-metadata'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ProjectMetadata } from '@/types/database'

interface GitHubInfoSectionProps {
  projectId?: string
  githubRepo: string | null
  metadata: Pick<
    ProjectMetadata,
    | 'github_stars'
    | 'github_forks'
    | 'github_language'
    | 'github_topics'
    | 'github_last_pushed_at'
    | 'github_last_synced_at'
  > | null
  onSync?: () => Promise<void>
  canSync?: boolean
}

export function GitHubInfoSection({
  projectId,
  githubRepo,
  metadata: initialMetadata,
  onSync,
  canSync = false,
}: GitHubInfoSectionProps) {
  const [syncing, setSyncing] = useState(false)
  const [metadata, setMetadata] = useState(initialMetadata)
  const [error, setError] = useState<string | null>(null)

  if (!githubRepo) {
    return null
  }

  const handleSync = async () => {
    // 외부 onSync가 있으면 사용
    if (onSync) {
      setSyncing(true)
      try {
        await onSync()
      } finally {
        setSyncing(false)
      }
      return
    }

    // projectId가 있으면 API 직접 호출
    if (!projectId) return

    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '동기화 실패')
        return
      }

      // 메타데이터 업데이트
      setMetadata({
        github_stars: data.synced.stars,
        github_forks: data.synced.forks,
        github_language: data.synced.language,
        github_topics: data.synced.topics,
        github_last_pushed_at: data.synced.lastPushedAt,
        github_last_synced_at: new Date().toISOString(),
      })
    } catch (err) {
      setError('동기화 중 오류가 발생했습니다')
      console.error('GitHub 동기화 오류:', err)
    } finally {
      setSyncing(false)
    }
  }

  const lastPushed = metadata?.github_last_pushed_at
    ? formatDistanceToNow(new Date(metadata.github_last_pushed_at), {
        addSuffix: true,
        locale: ko,
      })
    : null

  const lastSynced = metadata?.github_last_synced_at
    ? formatDistanceToNow(new Date(metadata.github_last_synced_at), {
        addSuffix: true,
        locale: ko,
      })
    : null

  const languageColor = getLanguageColor(metadata?.github_language)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <svg
              viewBox="0 0 16 16"
              className="h-5 w-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </CardTitle>
          <a
            href={`https://github.com/${githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {githubRepo}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 통계 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{metadata?.github_stars || 0}</span>
            <span className="text-sm text-muted-foreground">Stars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{metadata?.github_forks || 0}</span>
            <span className="text-sm text-muted-foreground">Forks</span>
          </div>
          {metadata?.github_language && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: languageColor }}
              />
              <span className="text-sm">{metadata.github_language}</span>
            </div>
          )}
        </div>

        {/* Topics */}
        {metadata?.github_topics && metadata.github_topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {metadata.github_topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs font-normal">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            {error}
          </div>
        )}

        {/* 시간 정보 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {lastPushed && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>최근 푸시: {lastPushed}</span>
              </div>
            )}
            {lastSynced && <span>동기화: {lastSynced}</span>}
          </div>

          {/* 동기화 버튼 - canSync이고 (onSync 또는 projectId가 있으면) 표시 */}
          {canSync && (onSync || projectId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="h-7 text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '동기화 중...' : '동기화'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 카드용 간략 GitHub 정보 (Stars만 표시)
export function GitHubStarsCompact({
  stars,
  className,
}: {
  stars: number | undefined
  className?: string
}) {
  if (!stars || stars === 0) return null

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
      <span>{stars}</span>
    </div>
  )
}
