import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectCard } from './project-card'
import type { ProjectWithProfile } from '@/types/database'

// Next.js Link mock
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockProject: ProjectWithProfile = {
  id: 'project-1',
  title: '테스트 프로젝트',
  description: '프로젝트 설명입니다',
  thumbnail_url: 'https://example.com/image.jpg',
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  profiles: {
    id: 'user-1',
    display_name: '홍길동',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

describe('ProjectCard', () => {
  it('renders project title', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument()
  })

  it('renders project description', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('프로젝트 설명입니다')).toBeInTheDocument()
  })

  it('renders owner name', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('홍길동')).toBeInTheDocument()
  })

  it('renders owner initial in avatar fallback', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('홍')).toBeInTheDocument()
  })

  it('links to project detail page', () => {
    render(<ProjectCard project={mockProject} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/projects/project-1')
  })

  it('renders average rating when provided', () => {
    render(<ProjectCard project={mockProject} averageRating={4.5} />)

    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('does not render rating when averageRating is 0', () => {
    render(<ProjectCard project={mockProject} averageRating={0} />)

    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  it('does not render rating when not provided', () => {
    render(<ProjectCard project={mockProject} />)

    // Star 아이콘이 없어야 함
    const ratingContainer = screen.queryByText(/\d\.\d/)
    expect(ratingContainer).not.toBeInTheDocument()
  })

  it('renders "익명" when profile is null', () => {
    const projectWithoutProfile = {
      ...mockProject,
      profiles: null,
    }

    render(<ProjectCard project={projectWithoutProfile} />)

    expect(screen.getByText('익명')).toBeInTheDocument()
    expect(screen.getByText('익')).toBeInTheDocument() // Avatar fallback
  })

  it('renders "익명" when display_name is null', () => {
    const projectWithNullName: ProjectWithProfile = {
      ...mockProject,
      profiles: {
        id: 'user-1',
        display_name: null,
        avatar_url: null,
      },
    }

    render(<ProjectCard project={projectWithNullName} />)

    expect(screen.getByText('익명')).toBeInTheDocument()
  })

  it('renders thumbnail image when provided', () => {
    render(<ProjectCard project={mockProject} />)

    const img = screen.getByAltText('테스트 프로젝트')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('does not render thumbnail when not provided', () => {
    const projectWithoutThumbnail = {
      ...mockProject,
      thumbnail_url: null,
    }

    render(<ProjectCard project={projectWithoutThumbnail} />)

    expect(screen.queryByAltText('테스트 프로젝트')).not.toBeInTheDocument()
  })

  it('handles project without description', () => {
    const projectWithoutDescription = {
      ...mockProject,
      description: null,
    }

    render(<ProjectCard project={projectWithoutDescription} />)

    expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 설명입니다')).not.toBeInTheDocument()
  })
})
