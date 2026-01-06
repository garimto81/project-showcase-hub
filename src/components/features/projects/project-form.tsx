'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'

type ProjectFormProps = {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    url: string | null
    github_repo: string | null
  }
  onSubmit: (data: { title: string; description?: string; thumbnail_url?: string; url?: string; github_repo?: string }) => Promise<void>
}

export function ProjectForm({ mode, initialData, onSubmit }: ProjectFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '')
  const [demoUrl, setDemoUrl] = useState(initialData?.url || '')
  const [githubRepo, setGithubRepo] = useState(initialData?.github_repo || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)

  // 썸네일 자동 생성 (GitHub Open Graph 또는 스크린샷)
  const generateThumbnail = async () => {
    // GitHub repo가 있으면 Open Graph 이미지 사용
    if (githubRepo.trim()) {
      const ogUrl = `https://opengraph.githubassets.com/1/${githubRepo.trim()}`
      setThumbnailUrl(ogUrl)
      toast.success('GitHub 썸네일이 생성되었습니다')
      return
    }

    // 배포 URL이 있으면 스크린샷 API 사용
    if (demoUrl.trim()) {
      setIsGeneratingThumbnail(true)
      try {
        const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(demoUrl.trim())}&screenshot=true&meta=false`
        const response = await fetch(microlinkUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success' && data.data?.screenshot?.url) {
            setThumbnailUrl(data.data.screenshot.url)
            toast.success('스크린샷 썸네일이 생성되었습니다')
            return
          }
        }
        throw new Error('스크린샷 생성 실패')
      } catch {
        toast.error('썸네일 생성에 실패했습니다. URL을 확인해주세요.')
      } finally {
        setIsGeneratingThumbnail(false)
      }
      return
    }

    toast.error('GitHub 레포지토리 또는 배포 URL을 먼저 입력해주세요')
  }

  const canGenerateThumbnail = githubRepo.trim() || demoUrl.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        url: demoUrl.trim() || undefined,
        github_repo: githubRepo.trim() || undefined,
      })
      toast.success(mode === 'create' ? '프로젝트가 생성되었습니다' : '프로젝트가 수정되었습니다')
      router.push('/projects')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? '새 프로젝트' : '프로젝트 수정'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? '새로운 프로젝트를 만들어보세요'
            : '프로젝트 정보를 수정하세요'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">프로젝트 제목 *</Label>
            <Input
              id="title"
              placeholder="멋진 프로젝트 이름"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대해 설명해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
            <div className="flex gap-2">
              <Input
                id="thumbnailUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                disabled={isSubmitting || isGeneratingThumbnail}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateThumbnail}
                disabled={isSubmitting || isGeneratingThumbnail || !canGenerateThumbnail}
                title={canGenerateThumbnail ? '썸네일 자동 생성' : 'GitHub 레포 또는 배포 URL을 먼저 입력하세요'}
              >
                {isGeneratingThumbnail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              GitHub 레포 또는 배포 URL이 있으면 <Camera className="inline h-3 w-3" /> 버튼으로 자동 생성할 수 있습니다
            </p>
            {thumbnailUrl && (
              <div className="mt-2 aspect-video max-w-xs overflow-hidden rounded-lg border relative">
                <Image
                  src={thumbnailUrl}
                  alt="썸네일 미리보기"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="demoUrl">배포 앱 URL</Label>
            <Input
              id="demoUrl"
              type="url"
              placeholder="https://your-app.vercel.app"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              실제 배포된 앱의 URL을 입력하면 프로젝트 카드에서 바로 열 수 있습니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubRepo">GitHub 레포지토리</Label>
            <Input
              id="githubRepo"
              placeholder="owner/repo (예: garimto81/heritage_shop)"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              GitHub 레포지토리를 연결하면 Stars, 기술 스택 등을 자동으로 가져옵니다
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting
              ? mode === 'create' ? '생성 중...' : '수정 중...'
              : mode === 'create' ? '프로젝트 생성' : '변경사항 저장'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
