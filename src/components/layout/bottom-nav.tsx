'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, RefreshCw, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: 'Apps',
    icon: LayoutGrid,
  },
  {
    href: '/sync',
    label: 'Sync',
    icon: RefreshCw,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* iOS Home Indicator Spacing */}
      <div className="h-1 w-full bg-transparent" />
    </nav>
  )
}
