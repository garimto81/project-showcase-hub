import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectList } from './project-list'
import type { ProjectWithProfile } from '@/types/database'

// ProjectCard mock
vi.mock('./project-card', () => ({
  ProjectCard: ({ project }: { project: ProjectWithProfile }) => (
    <div data-testid={`project-card-${project.id}`}>
      <h3>{project.title}</h3>
    </div>
  ),
}))

describe('ProjectList', () => {
  const mockProjects: ProjectWithProfile[] = [
    {
      id: 'project-1',
      title: '프로젝트 1',
      description: '첫 번째 프로젝트',
      owner_id: 'user-1',
      thumbnail_url: null,
      url: null,
      app_type: 'web_app',
      is_favorite: false,
      github_repo: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      profile: { display_name: 'User 1', avatar_url: null },
    },
    {
      id: 'project-2',
      title: '프로젝트 2',
      description: '두 번째 프로젝트',
      owner_id: 'user-2',
      thumbnail_url: 'https://example.com/image.jpg',
      url: 'https://project-2.vercel.app',
      app_type: 'web_app',
      is_favorite: true,
      github_repo: 'user/project-2',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      profile: { display_name: 'User 2', avatar_url: 'https://example.com/avatar.jpg' },
    },
    {
      id: 'project-3',
      title: '프로젝트 3',
      description: null,
      owner_id: 'user-1',
      thumbnail_url: null,
      url: null,
      app_type: 'web_app',
      is_favorite: false,
      github_repo: null,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
      profile: { display_name: 'User 1', avatar_url: null },
    },
  ]

  describe('프로젝트 목록 렌더링', () => {
    it('프로젝트 목록을 렌더링한다', () => {
      render(<ProjectList projects={mockProjects} />)

      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
    })

    it('각 프로젝트의 제목을 표시한다', () => {
      render(<ProjectList projects={mockProjects} />)

      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 2')).toBeInTheDocument()
      expect(screen.getByText('프로젝트 3')).toBeInTheDocument()
    })

    it('그리드 레이아웃으로 렌더링한다', () => {
      const { container } = render(<ProjectList projects={mockProjects} />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('로딩 상태', () => {
    it('로딩 중 스켈레톤을 렌더링한다', () => {
      const { container } = render(<ProjectList projects={[]} isLoading={true} />)

      // 6개의 스켈레톤 카드가 렌더링됨
      const skeletons = container.querySelectorAll('.animate-pulse, .space-y-3')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('로딩 중에는 프로젝트 카드를 렌더링하지 않는다', () => {
      render(<ProjectList projects={mockProjects} isLoading={true} />)

      expect(screen.queryByTestId('project-card-project-1')).not.toBeInTheDocument()
    })
  })

  describe('빈 상태', () => {
    it('프로젝트가 없을 때 빈 상태 메시지를 표시한다', () => {
      render(<ProjectList projects={[]} />)

      expect(screen.getByText('프로젝트가 없습니다')).toBeInTheDocument()
      expect(screen.getByText('새 프로젝트를 만들어보세요')).toBeInTheDocument()
    })

    it('프로젝트가 없을 때 카드를 렌더링하지 않는다', () => {
      const { container } = render(<ProjectList projects={[]} />)

      expect(container.querySelector('.grid')).not.toBeInTheDocument()
    })
  })

  describe('프로젝트 수', () => {
    it('한 개의 프로젝트만 있어도 렌더링한다', () => {
      render(<ProjectList projects={[mockProjects[0]]} />)

      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.queryByText('프로젝트가 없습니다')).not.toBeInTheDocument()
    })

    it('많은 프로젝트도 모두 렌더링한다', () => {
      const manyProjects = Array.from({ length: 10 }, (_, i) => ({
        ...mockProjects[0],
        id: `project-${i + 1}`,
        title: `프로젝트 ${i + 1}`,
      }))

      render(<ProjectList projects={manyProjects} />)

      for (let i = 1; i <= 10; i++) {
        expect(screen.getByTestId(`project-card-project-${i}`)).toBeInTheDocument()
      }
    })
  })
})
