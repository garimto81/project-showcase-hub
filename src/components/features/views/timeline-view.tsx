'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Project = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  profiles: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type TimelineViewProps = {
  projects: Project[]
}

export function TimelineView({ projects }: TimelineViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">프로젝트가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 타임라인 선 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-8">
        {projects.map((project) => {
          const ownerName = project.profiles?.display_name || '익명'
          const ownerInitial = ownerName.charAt(0).toUpperCase()
          const date = new Date(project.created_at)
          const formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          return (
            <div key={project.id} className="relative pl-20">
              {/* 타임라인 점 */}
              <div className="absolute left-6 w-4 h-4 bg-background border-2 border-primary rounded-full" />

              {/* 날짜 */}
              <div className="absolute left-0 top-0 text-xs text-muted-foreground w-16 text-right pr-8">
                {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </div>

              {/* 카드 */}
              <Link
                href={`/projects/${project.id}`}
                className="block p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* 썸네일 */}
                  {project.thumbnail_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      <Image
                        src={project.thumbnail_url}
                        alt={project.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.title}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={project.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">{ownerInitial}</AvatarFallback>
                      </Avatar>
                      <span>{ownerName}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
