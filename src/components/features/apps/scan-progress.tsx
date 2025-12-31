'use client'

import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScanProgressProps {
  isScanning: boolean
  totalRepos: number
  scannedRepos: number
  detectedCount: number
  error: string | null
}

export function ScanProgress({
  isScanning,
  totalRepos,
  scannedRepos,
  detectedCount,
  error,
}: ScanProgressProps) {
  const progress = totalRepos > 0 ? (scannedRepos / totalRepos) * 100 : 0

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            스캔 오류
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!isScanning && scannedRepos === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {isScanning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              레포 스캔 중...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              스캔 완료
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 프로그레스 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {scannedRepos} / {totalRepos} 레포
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 탐지 결과 */}
        <div className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span>
            탐지된 앱: <strong className="text-primary">{detectedCount}개</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
