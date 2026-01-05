'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/use-projects'
import { useProjectMetadata } from '@/hooks/use-project-metadata'
import { ProjectForm, ScreenshotUrlInput } from '@/components/features/projects'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Project } from '@/types/database'

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { updateProject } = useProjects()
  const { metadata, loading: metadataLoading, fetchMetadata, updateMetadata } = useProjectMetadata(projectId)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [savingScreenshots, setSavingScreenshots] = useState(false)

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
    fetchMetadata()
  }, [projectId, fetchMetadata])

  // 메타데이터 로드 시 스크린샷 상태 동기화
  useEffect(() => {
    if (metadata?.screenshots) {
      setScreenshots(metadata.screenshots)
    }
  }, [metadata])

  const handleSaveScreenshots = async () => {
    setSavingScreenshots(true)
    try {
      await updateMetadata({ screenshots })
      toast.success('스크린샷이 저장되었습니다')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '스크린샷 저장에 실패했습니다')
    } finally {
      setSavingScreenshots(false)
    }
  }

  const hasScreenshotChanges = JSON.stringify(screenshots) !== JSON.stringify(metadata?.screenshots || [])

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
    <div className="container py-8 space-y-6">
      <ProjectForm
        mode="edit"
        initialData={project}
        onSubmit={async (data) => {
          await updateProject(projectId, data)
        }}
      />

      {/* 스크린샷 편집 섹션 */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>스크린샷</CardTitle>
          <CardDescription>
            프로젝트 스크린샷 URL을 추가하세요. 상세 페이지에서 갤러리로 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metadataLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="aspect-video" />
                <Skeleton className="aspect-video" />
              </div>
            </div>
          ) : (
            <ScreenshotUrlInput
              value={screenshots}
              onChange={setScreenshots}
              disabled={savingScreenshots}
            />
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveScreenshots}
            disabled={savingScreenshots || !hasScreenshotChanges}
          >
            {savingScreenshots ? '저장 중...' : '스크린샷 저장'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
