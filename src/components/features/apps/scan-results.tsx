'use client'

import { CheckCircle, ExternalLink, FolderX, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DetectedApp } from '@/types/database'

interface ScanResultsProps {
  savedApps: number
  existingApps: number
  skippedRepos: number
  detectedApps: DetectedApp[]
  onViewApps: () => void
  onRescan: () => void
}

export function ScanResults({
  savedApps,
  existingApps,
  skippedRepos,
  detectedApps,
  onViewApps,
  onRescan,
}: ScanResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          스캔 완료!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 결과 요약 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600">{savedApps}</div>
            <div className="text-sm text-muted-foreground">새로 등록됨</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <div className="text-2xl font-bold text-blue-600">{existingApps}</div>
            <div className="text-sm text-muted-foreground">이미 등록됨</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="text-2xl font-bold text-muted-foreground">
              {skippedRepos}
            </div>
            <div className="text-sm text-muted-foreground">배포 없음</div>
          </div>
        </div>

        {/* 탐지된 앱 미리보기 */}
        {detectedApps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">새로 등록된 앱</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {detectedApps.slice(0, 4).map((app) => (
                <div
                  key={app.repoFullName}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{app.repoName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.url}
                    </p>
                  </div>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
            {detectedApps.length > 4 && (
              <p className="text-center text-sm text-muted-foreground">
                외 {detectedApps.length - 4}개 앱
              </p>
            )}
          </div>
        )}

        {/* 배포 없음 안내 */}
        {savedApps === 0 && existingApps === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <FolderX className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              배포된 앱이 발견되지 않았습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              수동으로 앱을 추가하거나 레포에 배포 URL을 설정해주세요.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button onClick={onViewApps} className="flex-1">
            내 앱 마켓 보기
          </Button>
          <Button variant="outline" onClick={onRescan}>
            다시 스캔
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
