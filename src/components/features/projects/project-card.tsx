'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, ExternalLink, StarOff } from 'lucide-react'
import type { ProjectWithProfile, ProjectMetadata } from '@/types/database'
import { TechStackTags } from './tech-stack-tags'
import { ProjectStatusDot } from './project-status-badge'
import { GitHubStarsCompact } from './github-info-section'

type ProjectWithOptionalMetadata = ProjectWithProfile & {
  project_metadata?: ProjectMetadata | null
}

type ProjectCardProps = {
  project: ProjectWithOptionalMetadata
  averageRating?: number
  onToggleFavorite?: (projectId: string, isFavorite: boolean) => void
}

export function ProjectCard({
  project,
  averageRating,
  onToggleFavorite,
}: ProjectCardProps) {
  const ownerName = project.profiles?.display_name || '익명'
  const ownerInitial = ownerName.charAt(0).toUpperCase()

  const handleLaunchApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
    // Link 컴포넌트의 기본 동작을 막기 위해 이벤트 전파 중단
    // a 태그의 기본 동작(href로 이동)은 유지
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(project.id, !project.is_favorite)
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {project.thumbnail_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
            <Image
              src={project.thumbnail_url}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
            {/* 즐겨찾기 버튼 (hover 시 표시) */}
            {onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={
                  project.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'
                }
              >
                {project.is_favorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4 text-white" />
                )}
              </button>
            )}
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">
                {project.title}
              </CardTitle>
              {project.is_favorite && !project.thumbnail_url && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              )}
              {/* 프로젝트 상태 점 */}
              {project.project_metadata?.status && project.project_metadata.status !== 'unknown' && (
                <ProjectStatusDot status={project.project_metadata.status} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* GitHub Stars */}
              <GitHubStarsCompact stars={project.project_metadata?.github_stars} />
              {/* 평균 별점 */}
              {averageRating !== undefined && averageRating > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 기술 스택 태그 (최대 3개) */}
          {project.project_metadata && (
            <TechStackTags
              techStack={project.project_metadata.tech_stack || []}
              language={project.project_metadata.github_language}
              topics={project.project_metadata.github_topics || []}
              maxTags={3}
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{ownerInitial}</AvatarFallback>
            </Avatar>
            <span>{ownerName}</span>
          </div>

          {/* 앱 열기 버튼 - Link 내부에서 외부 링크 처리를 위해 a 태그 사용 */}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLaunchApp}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 w-full"
            >
              <ExternalLink className="h-4 w-4" />
              앱 열기
            </a>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
