'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFetch } from './use-fetch'
import type { ProjectWithProfile, AppType } from '@/types/database'

type ProjectsResponse = {
  projects: ProjectWithProfile[]
  total: number
  limit: number
  offset: number
}

type UseProjectsOptions = {
  userId?: string
  search?: string
  limit?: number
  favoritesOnly?: boolean
}

type CreateProjectData = {
  title: string
  description?: string | null
  thumbnail_url?: string | null
  url?: string | null
  app_type?: AppType
  is_favorite?: boolean
  github_repo?: string | null
  owner_id?: string | null
}

type UpdateProjectData = {
  title?: string
  description?: string | null
  thumbnail_url?: string | null
  url?: string | null
  app_type?: AppType
  is_favorite?: boolean
}

function buildProjectsUrl(options: UseProjectsOptions): string {
  const { userId, search, limit = 20, favoritesOnly } = options
  const params = new URLSearchParams()
  if (userId) params.set('userId', userId)
  if (search) params.set('search', search)
  if (favoritesOnly) params.set('favoritesOnly', 'true')
  params.set('limit', limit.toString())
  params.set('offset', '0')
  return `/api/projects?${params}`
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { userId, search, limit = 20, favoritesOnly } = options
  const [total, setTotal] = useState(0)

  const {
    data: projects,
    loading,
    error,
    refetch,
    setData: setProjects,
    setError,
  } = useFetch<ProjectWithProfile[], ProjectsResponse>({
    url: () => buildProjectsUrl(options),
    initialData: [],
    defaultErrorMessage: '프로젝트를 불러오는데 실패했습니다',
    transform: (response) => {
      setTotal(response.total)
      return response.projects
    },
  })

  // 옵션 변경 시 refetch
  const optionsRef = useRef({ userId, search, limit, favoritesOnly })
  useEffect(() => {
    const prev = optionsRef.current
    if (
      prev.userId !== userId ||
      prev.search !== search ||
      prev.limit !== limit ||
      prev.favoritesOnly !== favoritesOnly
    ) {
      optionsRef.current = { userId, search, limit, favoritesOnly }
      refetch()
    }
  }, [userId, search, limit, favoritesOnly, refetch])

  const fetchProjects = useCallback(async () => {
    await refetch()
  }, [refetch])

  const create = async (
    data: CreateProjectData
  ): Promise<{ data: ProjectWithProfile | null; error: string | null }> => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: result.error || '프로젝트 생성에 실패했습니다',
        }
      }

      return { data: result as ProjectWithProfile, error: null }
    } catch (err) {
      return {
        data: null,
        error:
          err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다',
      }
    }
  }

  const createProject = async (data: CreateProjectData) => {
    const { data: result, error } = await create(data)
    if (error) {
      throw new Error(error)
    }
    await fetchProjects()
    return result
  }

  const updateProject = async (id: string, data: UpdateProjectData) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '프로젝트 수정에 실패했습니다')
    }

    await fetchProjects()
    return result as ProjectWithProfile
  }

  const deleteProject = async (id: string) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || '프로젝트 삭제에 실패했습니다')
    }

    await fetchProjects()
  }

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    // 낙관적 업데이트
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: isFavorite } : p))
    )

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: isFavorite }),
      })

      if (!response.ok) {
        // 실패 시 롤백
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_favorite: !isFavorite } : p))
        )
        const result = await response.json()
        throw new Error(result.error || '즐겨찾기 변경에 실패했습니다')
      }
    } catch (err) {
      // 에러 시 롤백
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_favorite: !isFavorite } : p))
      )
      throw err
    }
  }

  return {
    projects,
    total,
    loading,
    error,
    refetch: fetchProjects,
    create,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
  }
}
