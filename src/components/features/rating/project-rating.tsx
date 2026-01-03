"use client"

import { useAuth } from '@/hooks/use-auth'
import { useRating } from '@/hooks/use-rating'
import { StarRating } from './star-rating'
import { RatingSummary } from './rating-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectRatingProps {
  projectId: string
}

export function ProjectRating({ projectId }: ProjectRatingProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { average, total, distribution, userRating, loading, submitRating } = useRating(projectId)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RatingSummary
        averageRating={average}
        totalRatings={total}
        distribution={distribution}
      />

      {!authLoading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isAuthenticated ? '내 평가' : '로그인하여 평가하기'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <StarRating
                  value={userRating ?? 0}
                  onChange={submitRating}
                  size="lg"
                />
                {userRating && (
                  <span className="text-sm text-muted-foreground">
                    {userRating}점을 주셨습니다
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                프로젝트를 평가하려면 로그인이 필요합니다.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
