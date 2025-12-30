'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ProjectWithProfile } from '@/types/database'

type BoardViewProps = {
  projects: ProjectWithProfile[]
}

// 프로젝트를 월별로 그룹화
function groupByMonth(projects: ProjectWithProfile[]) {
  const groups: Record<string, ProjectWithProfile[]> = {}

  projects.forEach((project) => {
    const date = new Date(project.created_at)
    const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(project)
  })

  return groups
}

export function BoardView({ projects }: BoardViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">프로젝트가 없습니다</p>
      </div>
    )
  }

  const groupedProjects = groupByMonth(projects)
  const months = Object.keys(groupedProjects).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {months.map((month) => (
        <div key={month} className="flex-shrink-0 w-80">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-4">{month}</h3>
            <div className="space-y-3">
              {groupedProjects[month].map((project) => {
                const ownerName = project.profiles?.display_name || '익명'
                const ownerInitial = ownerName.charAt(0).toUpperCase()

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {project.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={project.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">{ownerInitial}</AvatarFallback>
                          </Avatar>
                          <span>{ownerName}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
