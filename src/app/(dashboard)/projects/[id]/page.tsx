import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProjectRating } from '@/components/features/rating'
import { CommentsSection } from '@/components/features/comments'

// 데모용 프로젝트 데이터
const DEMO_PROJECT = {
  id: 'demo-project-1',
  title: 'Project Showcase Hub',
  description: '오픈소스 프로젝트 포트폴리오 관리 플랫폼. 팀과 개인이 프로젝트를 타임라인, 갤러리, 칸반 보드 등 다양한 뷰로 관리하고 공유할 수 있습니다.',
  tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
  owner: {
    name: 'Demo User',
    avatar: null,
  },
  createdAt: '2025-12-26',
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 실제 구현에서는 Supabase에서 프로젝트 데이터를 가져옴
  // const project = await getProject(id)
  const project = { ...DEMO_PROJECT, id }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 프로젝트 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">
                {project.createdAt}에 생성됨
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
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
