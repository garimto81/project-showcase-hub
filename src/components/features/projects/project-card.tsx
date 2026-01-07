'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star, Rocket, Heart, ImageOff } from 'lucide-react'
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
      className="group/card relative aspect-square w-full overflow-hidden rounded-xl bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
      onClick={handleCardClick}
      tabIndex={0}
    >
      {/* 썸네일 이미지 - Stitch 스타일: scale 확대 효과 */}
      {project.thumbnail_url ? (
        <Image
          src={project.thumbnail_url}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 group-hover/card:scale-110"
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
          <Heart className="h-5 w-5 fill-red-500 text-red-500 drop-shadow-lg" />
        </div>
      )}

      {/* 평균 별점 (항상 표시) */}
      {averageRating !== undefined && averageRating > 0 && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-xs text-white bg-black/60 rounded-full px-2 py-0.5 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{averageRating.toFixed(1)}</span>
        </div>
      )}

      {/* 호버 오버레이 - Stitch 스타일 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        {/* 상단: 앱 이름 + 즐겨찾기 */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-white line-clamp-1 flex-1">
            {project.title}
          </h3>
          {onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className={`ml-2 transition-colors ${
                project.is_favorite
                  ? 'text-red-500 hover:text-red-400'
                  : 'text-gray-400 hover:text-red-500'
              }`}
              aria-label={project.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Heart
                className={`h-5 w-5 ${project.is_favorite ? 'fill-current' : ''}`}
              />
            </button>
          )}
        </div>

        {/* 설명 */}
        {project.description && (
          <p className="text-xs text-gray-300 line-clamp-1 mb-3">
            {project.description}
          </p>
        )}

        {/* Launch 버튼 - Stitch 스타일: 시안 배경 */}
        {project.url && (
          <button
            onClick={handleLaunchApp}
            className="w-full rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
          >
            <Rocket className="h-4 w-4" />
            Launch
          </button>
        )}
      </div>
    </div>
  )
}
