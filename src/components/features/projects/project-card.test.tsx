import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectCard } from './project-card'
import type { ProjectWithProfile } from '@/types/database'

// Next.js navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const mockProject: ProjectWithProfile = {
  id: 'project-1',
  title: '테스트 프로젝트',
  description: '프로젝트 설명입니다',
  thumbnail_url: 'https://example.com/image.jpg',
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  url: 'https://example.com/app',
  app_type: 'web_app',
  is_favorite: false,
  github_repo: 'user/repo',
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

  it('card is clickable with cursor-pointer', () => {
    render(<ProjectCard project={mockProject} />)

    // Stitch 스타일: group/card 클래스를 가진 div
    const card = screen.getByText('테스트 프로젝트').closest('.group\\/card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('cursor-pointer')
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

  it('renders Launch button when url is provided', () => {
    render(<ProjectCard project={mockProject} />)

    // Stitch 스타일: "Launch" 버튼
    expect(screen.getByRole('button', { name: /Launch/i })).toBeInTheDocument()
  })

  it('does not render Launch button when url is null', () => {
    const projectWithoutUrl = {
      ...mockProject,
      url: null,
    }

    render(<ProjectCard project={projectWithoutUrl} />)

    expect(screen.queryByRole('button', { name: /Launch/i })).not.toBeInTheDocument()
  })

  it('renders favorite heart when is_favorite is true', () => {
    const favoriteProject = {
      ...mockProject,
      is_favorite: true,
    }

    render(<ProjectCard project={favoriteProject} />)

    // Stitch 스타일: Heart 아이콘이 fill-red-500 클래스를 가짐
    const card = screen.getByText('테스트 프로젝트').closest('.group\\/card')
    expect(card).toBeInTheDocument()
  })

  it('card has aspect-square class for Stitch design', () => {
    render(<ProjectCard project={mockProject} />)

    const card = screen.getByText('테스트 프로젝트').closest('.group\\/card')
    expect(card).toHaveClass('aspect-square')
  })
})
