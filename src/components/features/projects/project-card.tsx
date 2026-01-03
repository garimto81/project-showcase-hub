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
import { Button } from '@/components/ui/button'
import { Star, ExternalLink, StarOff } from 'lucide-react'
import type { ProjectWithProfile } from '@/types/database'

type ProjectCardProps = {
  project: ProjectWithProfile
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

  const handleLaunchApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (project.url) {
      window.open(project.url, '_blank', 'noopener,noreferrer')
    }
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
            </div>
            {averageRating !== undefined && averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{ownerInitial}</AvatarFallback>
            </Avatar>
            <span>{ownerName}</span>
          </div>

          {/* 앱 열기 버튼 */}
          {project.url && (
            <Button
              onClick={handleLaunchApp}
              variant="default"
              size="sm"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              앱 열기
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
