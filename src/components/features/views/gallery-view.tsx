'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

type GalleryViewProps = {
  projects: Project[]
}

export function GalleryView({ projects }: GalleryViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">프로젝트가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const ownerName = project.profiles?.display_name || '익명'
        const ownerInitial = ownerName.charAt(0).toUpperCase()

        return (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
              {project.thumbnail_url ? (
                <div className="aspect-video w-full overflow-hidden relative">
                  <Image
                    src={project.thumbnail_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground/50">
                    {project.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{ownerInitial}</AvatarFallback>
                  </Avatar>
                  <span>{ownerName}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
