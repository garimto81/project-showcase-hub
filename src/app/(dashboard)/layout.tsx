import { DashboardHeader } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  )
}
