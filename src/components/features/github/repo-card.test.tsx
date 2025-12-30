import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RepoCard } from './repo-card'
import type { GitHubRepo } from '@/app/api/github/repos/route'

const mockRepo: GitHubRepo = {
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  description: 'A test repository',
  html_url: 'https://github.com/user/test-repo',
  homepage: 'https://example.com',
  stargazers_count: 42,
  forks_count: 10,
  language: 'TypeScript',
  topics: ['react', 'typescript', 'nextjs'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
  pushed_at: '2024-12-01T00:00:00Z',
  visibility: 'public',
  owner: {
    login: 'user',
    avatar_url: 'https://example.com/avatar.png',
  },
}

describe('RepoCard', () => {
  describe('렌더링', () => {
    it('레포지토리 이름을 렌더링한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })

    it('레포지토리 설명을 렌더링한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('A test repository')).toBeInTheDocument()
    })

    it('설명이 없으면 "설명 없음"을 표시한다', () => {
      const repoWithoutDescription = { ...mockRepo, description: null }
      render(<RepoCard repo={repoWithoutDescription} />)

      expect(screen.getByText('설명 없음')).toBeInTheDocument()
    })

    it('visibility 배지를 표시한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('public')).toBeInTheDocument()
    })

    it('private 레포지토리의 visibility를 표시한다', () => {
      const privateRepo = { ...mockRepo, visibility: 'private' }
      render(<RepoCard repo={privateRepo} />)

      expect(screen.getByText('private')).toBeInTheDocument()
    })
  })

  describe('통계 정보', () => {
    it('스타 수를 표시한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('포크 수를 표시한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('프로그래밍 언어를 표시한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('TypeScript')).toBeInTheDocument()
    })

    it('언어가 없으면 언어 섹션을 표시하지 않는다', () => {
      const repoWithoutLanguage = { ...mockRepo, language: null }
      render(<RepoCard repo={repoWithoutLanguage} />)

      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
    })
  })

  describe('토픽', () => {
    it('토픽 배지를 최대 4개까지 표시한다', () => {
      render(<RepoCard repo={mockRepo} />)

      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
      expect(screen.getByText('nextjs')).toBeInTheDocument()
    })

    it('토픽이 4개 이상이면 나머지 개수를 표시한다', () => {
      const repoWithManyTopics = {
        ...mockRepo,
        topics: ['react', 'typescript', 'nextjs', 'tailwind', 'supabase', 'vercel'],
      }
      render(<RepoCard repo={repoWithManyTopics} />)

      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('토픽이 없으면 토픽 섹션을 표시하지 않는다', () => {
      const repoWithoutTopics = { ...mockRepo, topics: [] }
      render(<RepoCard repo={repoWithoutTopics} />)

      expect(screen.queryByText('react')).not.toBeInTheDocument()
    })
  })

  describe('링크', () => {
    it('GitHub URL로의 링크가 있다', () => {
      render(<RepoCard repo={mockRepo} />)

      const link = screen.getByRole('link', { name: /test-repo/i })
      expect(link).toHaveAttribute('href', 'https://github.com/user/test-repo')
    })

    it('링크가 새 탭에서 열린다', () => {
      render(<RepoCard repo={mockRepo} />)

      const link = screen.getByRole('link', { name: /test-repo/i })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('언어 색상', () => {
    it('TypeScript는 파란색 배경을 가진다', () => {
      render(<RepoCard repo={mockRepo} />)

      const languageDot = document.querySelector('.bg-blue-500')
      expect(languageDot).toBeInTheDocument()
    })

    it('JavaScript는 노란색 배경을 가진다', () => {
      const jsRepo = { ...mockRepo, language: 'JavaScript' }
      render(<RepoCard repo={jsRepo} />)

      const languageDot = document.querySelector('.bg-yellow-400')
      expect(languageDot).toBeInTheDocument()
    })

    it('알 수 없는 언어는 회색 배경을 가진다', () => {
      const unknownLangRepo = { ...mockRepo, language: 'UnknownLanguage' }
      render(<RepoCard repo={unknownLangRepo} />)

      const languageDot = document.querySelector('.bg-gray-400')
      expect(languageDot).toBeInTheDocument()
    })
  })
})
