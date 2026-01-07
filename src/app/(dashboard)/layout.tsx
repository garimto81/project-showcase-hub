import { DashboardHeader } from '@/components/layout'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  )
}
