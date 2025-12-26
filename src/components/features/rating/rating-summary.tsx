"use client"

import { StarRating } from './star-rating'

interface RatingSummaryProps {
  averageRating: number
  totalRatings: number
  distribution?: Record<number, number>
}

export function RatingSummary({
  averageRating,
  totalRatings,
  distribution,
}: RatingSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
          <StarRating value={averageRating} readonly size="md" />
          <span className="text-sm text-muted-foreground">
            {totalRatings}개의 평가
          </span>
        </div>
      </div>

      {distribution && totalRatings > 0 && (
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = distribution[score] || 0
            const percentage = (count / totalRatings) * 100

            return (
              <div key={score} className="flex items-center gap-2">
                <span className="w-3 text-sm text-muted-foreground">{score}</span>
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-muted-foreground text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
