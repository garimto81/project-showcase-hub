'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronRight } from 'lucide-react'

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

type ListViewProps = {
  projects: Project[]
}

export function ListView({ projects }: ListViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">프로젝트가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg divide-y">
      {projects.map((project) => {
        const ownerName = project.profiles?.display_name || '익명'
        const ownerInitial = ownerName.charAt(0).toUpperCase()
        const createdAt = new Date(project.created_at).toLocaleDateString('ko-KR')

        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            {/* 썸네일 */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {project.thumbnail_url ? (
                <img
                  src={project.thumbnail_url}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xl font-bold text-muted-foreground/50">
                    {project.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={project.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{ownerInitial}</AvatarFallback>
                  </Avatar>
                  <span>{ownerName}</span>
                </div>
                <span>{createdAt}</span>
              </div>
            </div>

            {/* 화살표 */}
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
