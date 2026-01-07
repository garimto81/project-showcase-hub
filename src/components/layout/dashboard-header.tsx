'use client'

import Link from 'next/link'
import { RefreshCw, Plus } from 'lucide-react'
import { UserMenu } from './user-menu'
import { useAuth } from '@/hooks/use-auth'

export function DashboardHeader() {
  const { isAdmin } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold tracking-tight">Aiden&apos;s Market</h1>
        </Link>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <>
              <button
                aria-label="Rescan Apps"
                className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                href="/projects/new"
                aria-label="Add App"
                className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-6 w-6" />
              </Link>
            </>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
