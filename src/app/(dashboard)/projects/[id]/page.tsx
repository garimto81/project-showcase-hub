import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProjectRating } from '@/components/features/rating'
import { CommentsSection } from '@/components/features/comments'
import { ProjectActions } from '@/components/features/projects/project-actions'
import { TechStackTags } from '@/components/features/projects/tech-stack-tags'
import { ProjectStatusBadge } from '@/components/features/projects/project-status-badge'
import { ScreenshotGallery } from '@/components/features/projects/screenshot-gallery'
import { GitHubInfoSection } from '@/components/features/projects/github-info-section'

async function getProject(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        id,
        display_name,
        avatar_url
      ),
      project_metadata (
        id,
        tech_stack,
        screenshots,
        status,
        github_stars,
        github_forks,
        github_language,
        github_topics,
        github_last_pushed_at,
        github_last_synced_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function checkIsAdmin() {
  const session = await getSession()
  // 단일 Admin 시스템이므로 인증 = Admin
  return session.isAuthenticated
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, isAdmin] = await Promise.all([
    getProject(id),
    checkIsAdmin(),
  ])

  if (!project) {
    notFound()
  }

  const ownerName = project.profiles?.display_name || 'Admin'
  const ownerInitial = ownerName.charAt(0).toUpperCase()
  const createdAt = new Date(project.created_at).toLocaleDateString('ko-KR')

  // 메타데이터 (배열로 반환될 수 있으므로 첫 번째 요소 사용)
  const metadata = Array.isArray(project.project_metadata)
    ? project.project_metadata[0]
    : project.project_metadata

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 프로젝트 헤더 */}
      <Card>
        {project.thumbnail_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
            <Image
              src={project.thumbnail_url}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                {/* 프로젝트 상태 배지 */}
                {metadata?.status && metadata.status !== 'unknown' && (
                  <ProjectStatusBadge status={metadata.status} size="sm" />
                )}
              </div>
              <CardDescription className="mt-2">
                {createdAt}에 생성됨
              </CardDescription>
            </div>
            {isAdmin && <ProjectActions projectId={id} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          {/* 기술 스택 태그 */}
          {metadata && (
            <TechStackTags
              techStack={metadata.tech_stack || []}
              language={metadata.github_language}
              topics={metadata.github_topics || []}
              showAll
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{ownerInitial}</AvatarFallback>
            </Avatar>
            <span>{ownerName}</span>
          </div>
        </CardContent>
      </Card>

      {/* 스크린샷 갤러리 */}
      {metadata?.screenshots && metadata.screenshots.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ScreenshotGallery screenshots={metadata.screenshots} />
          </CardContent>
        </Card>
      )}

      {/* GitHub 정보 섹션 */}
      {project.github_repo && (
        <GitHubInfoSection
          projectId={id}
          githubRepo={project.github_repo}
          metadata={metadata}
          canSync={isAdmin}
        />
      )}

      {/* 별점 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>평가</CardTitle>
          <CardDescription>
            이 프로젝트에 대한 평가를 남겨주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectRating projectId={id} />
        </CardContent>
      </Card>

      <Separator />

      {/* 댓글 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>댓글</CardTitle>
          <CardDescription>
            프로젝트에 대한 의견을 나눠보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommentsSection projectId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
