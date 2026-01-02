'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import {
  ViewModeSwitcher,
  GalleryView,
  ListView,
  BoardView,
  TimelineView,
  type ViewMode,
} from '@/components/features/views'

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [showMyProjects, setShowMyProjects] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')

  const { projects, loading, error } = useProjects({
    userId: showMyProjects && user ? user.id : undefined,
    search: search || undefined,
  })

  const renderProjects = () => {
    if (loading) {
      return <ProjectsSkeleton />
    }

    switch (viewMode) {
      case 'gallery':
        return <GalleryView projects={projects} />
      case 'list':
        return <ListView projects={projects} />
      case 'board':
        return <BoardView projects={projects} />
      case 'timeline':
        return <TimelineView projects={projects} />
      default:
        return <GalleryView projects={projects} />
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">프로젝트</h1>
            <p className="text-muted-foreground">
              {showMyProjects ? '내 프로젝트' : '모든 프로젝트'}를 탐색하세요
            </p>
          </div>
          {isAdmin && (
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 프로젝트
              </Button>
            </Link>
          )}
        </div>

        {/* 필터 & 검색 & 뷰 모드 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프로젝트 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant={showMyProjects ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMyProjects(true)}
                >
                  내 프로젝트
                </Button>
                <Button
                  variant={!showMyProjects ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMyProjects(false)}
                >
                  전체
                </Button>
              </div>
            )}
          </div>

          <ViewModeSwitcher currentMode={viewMode} onModeChange={setViewMode} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* 프로젝트 목록 */}
        {renderProjects()}
      </div>
    </div>
  )
}
