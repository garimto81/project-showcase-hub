'use client'

import { ProjectCard } from '@/components/features/projects/project-card'
import type { ProjectWithProfile } from '@/types/database'

type GalleryViewProps = {
  projects: ProjectWithProfile[]
  onToggleFavorite?: (projectId: string, isFavorite: boolean) => void
}

export function GalleryView({ projects, onToggleFavorite }: GalleryViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">앱이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
