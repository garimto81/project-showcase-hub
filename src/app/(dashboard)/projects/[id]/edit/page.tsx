'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/features/projects'
import { Skeleton } from '@/components/ui/skeleton'

type Project = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { updateProject } = useProjects()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '프로젝트를 불러오는데 실패했습니다')
        }

        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-destructive">{error || '프로젝트를 찾을 수 없습니다'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary hover:underline"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <ProjectForm
        mode="edit"
        initialData={project}
        onSubmit={async (data) => {
          await updateProject(projectId, data)
        }}
      />
    </div>
  )
}
