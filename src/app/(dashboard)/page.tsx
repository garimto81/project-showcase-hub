'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { useRepoScanner } from '@/hooks/use-repo-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, RefreshCw, Github, Rocket } from 'lucide-react'
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

function WelcomeCard({
  onLinkGitHub,
  isLoading,
}: {
  onLinkGitHub: () => void
  isLoading: boolean
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <Rocket className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle>AppHub에 오신 것을 환영합니다!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          GitHub 계정을 연동하면 배포된 앱을 자동으로 찾아서 마켓에
          등록해드립니다.
        </p>
        <Button onClick={onLinkGitHub} disabled={isLoading} size="lg">
          <Github className="mr-2 h-5 w-5" />
          GitHub 계정 연동
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, hasGitHubLinked, linkGitHubAccount } = useAuth()
  const [search, setSearch] = useState('')
  const [showMyProjects, setShowMyProjects] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const [showScanResult, setShowScanResult] = useState(false)

  const { projects, loading, error, refetch, create } = useProjects({
    userId: showMyProjects && user ? user.id : undefined,
    search: search || undefined,
  })

  const scanner = useRepoScanner()
  const autoScanTriggeredRef = useRef(false)

  const handleScan = useCallback(async () => {
    const result = await scanner.startScan()
    if (result.success) {
      setShowScanResult(true)
      refetch()
    }
  }, [scanner, refetch])

  // GitHub 연동 후 자동 스캔 (최초 1회)
  useEffect(() => {
    const shouldAutoScan =
      hasGitHubLinked &&
      projects.length === 0 &&
      !loading &&
      !scanner.isScanning &&
      !scanner.isCompleted &&
      !autoScanTriggeredRef.current &&
      typeof window !== 'undefined' &&
      !sessionStorage.getItem('apphub_scanned')

    if (shouldAutoScan) {
      autoScanTriggeredRef.current = true
      sessionStorage.setItem('apphub_scanned', 'true')
      // startTransition으로 감싸서 setState 경고 회피
      startTransition(() => {
        handleScan()
      })
    }
  }, [hasGitHubLinked, projects.length, loading, scanner.isScanning, scanner.isCompleted, handleScan])

  const handleLinkGitHub = async () => {
    await linkGitHubAccount('/projects')
  }

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
    if (!user) return false

    const { error } = await create({
      title: app.title,
      description: app.description || null,
      url: app.url,
      thumbnail_url: app.thumbnailUrl || null,
      owner_id: user.id,
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

  // GitHub 미연동 상태
  if (user && !hasGitHubLinked) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <WelcomeCard onLinkGitHub={handleLinkGitHub} isLoading={false} />
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
            {user && hasGitHubLinked && (
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
              </>
            )}
            {user && (
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 앱
                </Button>
              </Link>
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
            {user && (
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
        {!loading && projects.length === 0 && user && hasGitHubLinked && (
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
