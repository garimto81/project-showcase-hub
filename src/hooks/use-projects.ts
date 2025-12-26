'use client'

import { useState, useEffect, useCallback } from 'react'

type Project = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  owner_id: string
  profiles: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type ProjectsResponse = {
  projects: Project[]
  total: number
  limit: number
  offset: number
}

type UseProjectsOptions = {
  userId?: string
  search?: string
  limit?: number
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { userId, search, limit = 20 } = options
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async (offset = 0) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      if (search) params.set('search', search)
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())

      const response = await fetch(`/api/projects?${params}`)
      const data: ProjectsResponse = await response.json()

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || '프로젝트를 불러오는데 실패했습니다')
      }

      setProjects(data.projects)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [userId, search, limit])

  const createProject = async (data: { title: string; description?: string; thumbnail_url?: string }) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '프로젝트 생성에 실패했습니다')
    }

    await fetchProjects()
    return result as Project
  }

  const updateProject = async (id: string, data: { title?: string; description?: string; thumbnail_url?: string }) => {
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
    return result as Project
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

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    total,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}
