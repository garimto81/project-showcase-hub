'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'

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

type ProjectCardProps = {
  project: Project
  averageRating?: number
}

export function ProjectCard({ project, averageRating }: ProjectCardProps) {
  const ownerName = project.profiles?.display_name || '익명'
  const ownerInitial = ownerName.charAt(0).toUpperCase()

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
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
}
