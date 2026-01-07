'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star, ExternalLink, StarOff, ImageOff } from 'lucide-react'
import type { ProjectWithProfile, ProjectMetadata } from '@/types/database'

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
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`)
  }

  const handleLaunchApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (project.url) {
      window.open(project.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(project.id, !project.is_favorite)
  }

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* 썸네일 이미지 */}
      {project.thumbnail_url ? (
        <Image
          src={project.thumbnail_url}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
        </div>
      )}

      {/* 즐겨찾기 표시 (항상 표시) */}
      {project.is_favorite && (
        <div className="absolute top-2 left-2 z-10">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
        </div>
      )}

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        {/* 상단 액션 버튼들 */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {/* 평균 별점 */}
          {averageRating !== undefined && averageRating > 0 && (
            <div className="flex items-center gap-1 text-sm text-white bg-black/50 rounded-full px-2 py-0.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
            </div>
          )}
          {/* 즐겨찾기 토글 */}
          {onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label={project.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              {project.is_favorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4 text-white" />
              )}
            </button>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="space-y-2">
          {/* 앱 이름 */}
          <h3 className="text-lg font-semibold text-white line-clamp-1">
            {project.title}
          </h3>

          {/* 설명 */}
          {project.description && (
            <p className="text-sm text-white/80 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* 앱 열기 버튼 */}
          {project.url && (
            <button
              onClick={handleLaunchApp}
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-white text-black font-medium text-sm h-9 hover:bg-white/90 transition-colors mt-2"
            >
              <ExternalLink className="h-4 w-4" />
              앱 열기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
