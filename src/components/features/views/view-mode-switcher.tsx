'use client'

import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Columns, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'gallery' | 'list' | 'board' | 'timeline'

type ViewModeSwitcherProps = {
  currentMode: ViewMode
  onModeChange: (mode: ViewMode) => void
}

const viewModes: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'gallery', icon: LayoutGrid, label: '갤러리' },
  { mode: 'list', icon: List, label: '목록' },
  { mode: 'board', icon: Columns, label: '보드' },
  { mode: 'timeline', icon: Calendar, label: '타임라인' },
]

export function ViewModeSwitcher({ currentMode, onModeChange }: ViewModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {viewModes.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3',
            currentMode === mode && 'bg-background shadow-sm'
          )}
          onClick={() => onModeChange(mode)}
        >
          <Icon className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}
