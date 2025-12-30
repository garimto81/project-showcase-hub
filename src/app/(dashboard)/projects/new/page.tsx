'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/hooks/use-auth'
import { ProjectForm } from '@/components/features/projects'
import { GitHubReposSection } from '@/components/features/github/github-repos-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Github } from 'lucide-react'

export default function NewProjectPage() {
  const { createProject } = useProjects()
  const { hasGitHubLinked } = useAuth()
  const [activeTab, setActiveTab] = useState<string>(hasGitHubLinked ? 'github' : 'manual')

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">새 프로젝트</h1>
        <p className="text-muted-foreground mb-6">
          직접 입력하거나 GitHub 레포지토리에서 가져올 수 있습니다
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub에서 가져오기
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              직접 입력
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github">
            <GitHubReposSection />
          </TabsContent>

          <TabsContent value="manual">
            <ProjectForm
              mode="create"
              onSubmit={async (data) => {
                await createProject(data)
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
