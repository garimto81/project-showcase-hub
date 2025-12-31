'use client'

import Link from 'next/link'
import { Rocket } from 'lucide-react'
import { UserMenu } from './user-menu'

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-bold">AppHub</span>
          </Link>
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
