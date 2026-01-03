'use client'

import { Badge } from '@/components/ui/badge'
import { Activity, Wrench, Archive, HelpCircle } from 'lucide-react'
import type { ProjectStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface ProjectStatusBadgeProps {
  status: ProjectStatus | undefined
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const statusConfig: Record<
  ProjectStatus,
  {
    label: string
    icon: typeof Activity
    className: string
  }
> = {
  active: {
    label: '활발히 개발 중',
    icon: Activity,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  maintained: {
    label: '유지보수 중',
    icon: Wrench,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  archived: {
    label: '보관됨',
    icon: Archive,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  unknown: {
    label: '상태 미정',
    icon: HelpCircle,
    className: 'bg-gray-50 text-gray-400 border-gray-100 border-dashed',
  },
}

export function ProjectStatusBadge({
  status = 'unknown',
  size = 'sm',
  showLabel = true,
}: ProjectStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <Badge
      variant="outline"
      className={cn('font-normal gap-1', config.className, textSize)}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )
}

// 간단한 점 형태의 상태 표시 (카드용)
export function ProjectStatusDot({ status = 'unknown' }: { status?: ProjectStatus }) {
  const dotColors: Record<ProjectStatus, string> = {
    active: 'bg-green-500',
    maintained: 'bg-blue-500',
    archived: 'bg-gray-400',
    unknown: 'bg-gray-300',
  }

  return (
    <span
      className={cn('w-2 h-2 rounded-full inline-block', dotColors[status])}
      title={statusConfig[status].label}
    />
  )
}
