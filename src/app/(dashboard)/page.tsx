'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { useRepoScanner } from '@/hooks/use-repo-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, RefreshCw, Rocket } from 'lucide-react'
import Link from 'next/link'
import {
  ViewModeSwitcher,
  GalleryView,
  ListView,
  BoardView,
  TimelineView,
  type ViewMode,
} from '@/components/features/views'
import {
  ScanProgress,
  ScanResults,
  ManualAddDialog,
} from '@/components/features/apps'

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


export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState('')
  const [showMyProjects, setShowMyProjects] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const [showScanResult, setShowScanResult] = useState(false)

  const { projects, loading, error, refetch, create } = useProjects({
    userId: showMyProjects && isAuthenticated ? undefined : undefined, // TODO: 사용자 ID 로직 재구성 필요
    search: search || undefined,
  })

  const scanner = useRepoScanner()
  const _autoScanTriggeredRef = useRef(false) // Reserved for future auto-scan feature

  const handleScan = useCallback(async () => {
    const result = await scanner.startScan()
    if (result.success) {
      setShowScanResult(true)
      refetch()
    }
  }, [scanner, refetch])

  // 자동 스캔 로직 제거 (GitHub 연동 상태 확인 불가)

  const handleViewApps = () => {
    setShowScanResult(false)
    scanner.reset()
  }

  const handleManualAdd = async (app: {
    title: string
    url: string
    description: string
    thumbnailUrl?: string
  }) => {
    if (!isAuthenticated) return false

    const { error } = await create({
      title: app.title,
      description: app.description || null,
      url: app.url,
      thumbnail_url: app.thumbnailUrl || null,
      owner_id: '', // TODO: 사용자 ID 로직 재구성 필요
    })

    if (!error) {
      refetch()
      return true
    }
    return false
  }

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

  // 스캔 진행 중 또는 완료 결과 표시
  if (scanner.isScanning) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <ScanProgress
          isScanning={scanner.isScanning}
          totalRepos={scanner.totalRepos}
          scannedRepos={scanner.scannedRepos}
          detectedCount={scanner.detectedApps.length}
          error={scanner.error}
        />
      </div>
    )
  }

  if (showScanResult && scanner.isCompleted) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <ScanResults
          savedApps={scanner.savedApps}
          existingApps={scanner.existingApps}
          skippedRepos={scanner.totalRepos - scanner.savedApps - scanner.existingApps}
          detectedApps={scanner.detectedApps}
          onViewApps={handleViewApps}
          onRescan={handleScan}
        />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">내 앱</h1>
            <p className="text-muted-foreground">
              {showMyProjects ? '내 앱' : '모든 앱'}을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScan}
                  disabled={scanner.isScanning}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${scanner.isScanning ? 'animate-spin' : ''}`}
                  />
                  다시 스캔
                </Button>
                <ManualAddDialog onAdd={handleManualAdd} />
                <Link href="/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    새 앱
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 필터 & 검색 & 뷰 모드 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="앱 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAuthenticated && (
              <div className="flex gap-2">
                <Button
                  variant={showMyProjects ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMyProjects(true)}
                >
                  내 앱
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

        {/* 앱이 없을 때 안내 */}
        {!loading && projects.length === 0 && isAuthenticated && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">앱이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                GitHub 레포를 스캔하거나 수동으로 앱을 추가해보세요
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={handleScan} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  레포 스캔
                </Button>
                <ManualAddDialog onAdd={handleManualAdd} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 프로젝트 목록 */}
        {(loading || projects.length > 0) && renderProjects()}
      </div>
    </div>
  )
}
