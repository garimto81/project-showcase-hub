'use client'

import { useProjects } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/features/projects'

export default function NewProjectPage() {
  const { createProject } = useProjects()

  return (
    <div className="container py-8">
      <ProjectForm
        mode="create"
        onSubmit={async (data) => {
          await createProject(data)
        }}
      />
    </div>
  )
}
