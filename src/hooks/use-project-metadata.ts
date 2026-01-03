'use client'

import { useState, useCallback } from 'react'
import type { ProjectMetadata, ProjectStatus } from '@/types/database'

interface UseProjectMetadataResult {
  metadata: ProjectMetadata | null
  loading: boolean
  error: string | null
  syncing: boolean
  fetchMetadata: () => Promise<void>
  updateMetadata: (data: Partial<Pick<ProjectMetadata, 'tech_stack' | 'screenshots' | 'status'>>) => Promise<void>
  syncGitHub: () => Promise<void>
}

export function useProjectMetadata(projectId: string): UseProjectMetadataResult {
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  // 메타데이터 조회
  const fetchMetadata = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/metadata`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '메타데이터 조회 실패')
      }

      setMetadata(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 메타데이터 업데이트
  const updateMetadata = useCallback(
    async (data: Partial<Pick<ProjectMetadata, 'tech_stack' | 'screenshots' | 'status'>>) => {
      if (!projectId) return

      setError(null)

      try {
        const response = await fetch(`/api/projects/${projectId}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || '메타데이터 업데이트 실패')
        }

        setMetadata(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류')
        throw err
      }
    },
    [projectId]
  )

  // GitHub 동기화
  const syncGitHub = useCallback(async () => {
    if (!projectId) return

    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'GitHub 동기화 실패')
      }

      setMetadata(result.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      throw err
    } finally {
      setSyncing(false)
    }
  }, [projectId])

  return {
    metadata,
    loading,
    error,
    syncing,
    fetchMetadata,
    updateMetadata,
    syncGitHub,
  }
}

// 상태 판단 유틸리티
export function getStatusInfo(status: ProjectStatus | undefined): {
  label: string
  color: string
  bgColor: string
} {
  switch (status) {
    case 'active':
      return { label: '활발히 개발 중', color: 'text-green-600', bgColor: 'bg-green-100' }
    case 'maintained':
      return { label: '유지보수 중', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    case 'archived':
      return { label: '보관됨', color: 'text-gray-600', bgColor: 'bg-gray-100' }
    default:
      return { label: '상태 미정', color: 'text-gray-400', bgColor: 'bg-gray-50' }
  }
}

// 언어별 색상 코드
export function getLanguageColor(language: string | null | undefined): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Vue: '#41b883',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
  }
  return colors[language || ''] || '#6e7681'
}
