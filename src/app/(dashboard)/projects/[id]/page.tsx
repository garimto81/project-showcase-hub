import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProjectRating } from '@/components/features/rating'
import { CommentsSection } from '@/components/features/comments'
import { ProjectActions } from '@/components/features/projects/project-actions'

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
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, currentUser] = await Promise.all([
    getProject(id),
    getCurrentUser(),
  ])

  if (!project) {
    notFound()
  }

  const ownerName = project.profiles?.display_name || '익명'
  const ownerInitial = ownerName.charAt(0).toUpperCase()
  const isOwner = currentUser?.id === project.owner_id
  const createdAt = new Date(project.created_at).toLocaleDateString('ko-KR')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 프로젝트 헤더 */}
      <Card>
        {project.thumbnail_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">
                {createdAt}에 생성됨
              </CardDescription>
            </div>
            {isOwner && <ProjectActions projectId={id} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
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
