import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  DeploymentDetector,
  createDetectedApp,
  type GitHubRepo,
  type DeploymentDetectionResult,
} from './deployment-detector'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DeploymentDetector', () => {
  let detector: DeploymentDetector

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    detector = new DeploymentDetector('test-access-token')
  })

  const mockRepo: GitHubRepo = {
    name: 'my-project',
    full_name: 'user/my-project',
    description: 'A test project',
    homepage: null,
    html_url: 'https://github.com/user/my-project',
    owner: { login: 'user' },
    has_pages: false,
    default_branch: 'main',
  }

  describe('detectDeploymentUrl', () => {
    describe('homepage 필드', () => {
      it('유효한 homepage가 있으면 반환한다', async () => {
        const repo = { ...mockRepo, homepage: 'https://my-project.vercel.app' }

        // URL 유효성 검증 mock
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://my-project.vercel.app')
        expect(result.source).toBe('github_homepage')
        expect(result.confidence).toBe('high')
      })

      it('homepage URL이 유효하지 않으면 다음 탐지 방법을 시도한다', async () => {
        const repo = { ...mockRepo, homepage: 'https://invalid-url.example.com' }

        // homepage 유효성 검증 실패
        mockFetch.mockResolvedValueOnce({ ok: false })
        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // URL 추론 시도들
        mockFetch.mockResolvedValue({ ok: false })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBeNull()
        expect(result.source).toBeNull()
      })

      it('잘못된 URL 형식의 homepage는 무시한다', async () => {
        const repo = { ...mockRepo, homepage: 'not-a-url' }

        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // URL 추론 시도들
        mockFetch.mockResolvedValue({ ok: false })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBeNull()
      })
    })

    describe('GitHub Pages', () => {
      it('has_pages가 true이면 GitHub Pages URL을 확인한다', async () => {
        const repo = { ...mockRepo, has_pages: true }

        // GitHub Pages URL 유효성 검증 성공
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://user.github.io/my-project')
        expect(result.source).toBe('github_pages')
        expect(result.confidence).toBe('high')
      })

      it('user.github.io 레포는 루트 URL을 반환한다', async () => {
        const repo = {
          ...mockRepo,
          name: 'user.github.io',
          full_name: 'user/user.github.io',
          has_pages: true,
          owner: { login: 'user' },
        }

        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://user.github.io')
        expect(result.source).toBe('github_pages')
      })
    })

    describe('GitHub Environments', () => {
      it('production 환경에서 배포 URL을 가져온다', async () => {
        const repo = { ...mockRepo }

        // environments API
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              environments: [
                { name: 'production', html_url: 'https://github.com/...' },
              ],
            }),
        })
        // deployments API
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                environment: 'production',
                payload: { web_url: 'https://my-app.vercel.app' },
              },
            ]),
        })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://my-app.vercel.app')
        expect(result.source).toBe('github_environments')
        expect(result.confidence).toBe('high')
      })
    })

    describe('README 추출', () => {
      it('README에서 Vercel 배지 URL을 추출한다', async () => {
        const repo = { ...mockRepo }

        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () =>
            Promise.resolve(
              '[![Vercel](https://vercel.com/badge)](https://my-app.vercel.app)'
            ),
        })
        // URL 유효성 검증
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://my-app.vercel.app')
        expect(result.source).toBe('readme_badge')
        expect(result.confidence).toBe('medium')
      })

      it('README에서 Demo 링크를 추출한다', async () => {
        const repo = { ...mockRepo }

        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () =>
            Promise.resolve('[Live Demo](https://demo.example.com)'),
        })
        // URL 유효성 검증
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://demo.example.com')
        expect(result.source).toBe('readme_link')
        expect(result.confidence).toBe('medium')
      })
    })

    describe('URL 패턴 추론', () => {
      it('Vercel 패턴으로 URL을 추론한다', async () => {
        const repo = { ...mockRepo }

        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // 첫 번째 패턴 (my-project.vercel.app) 성공
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://my-project.vercel.app')
        expect(result.source).toBe('url_inference')
        expect(result.confidence).toBe('low')
      })

      it('언더스코어와 점을 하이픈으로 변환한다', async () => {
        const repo = {
          ...mockRepo,
          name: 'my_project.name',
        }

        // environments API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // readme API
        mockFetch.mockResolvedValueOnce({ ok: false })
        // 변환된 패턴 성공
        mockFetch.mockResolvedValueOnce({ ok: true })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBe('https://my-project-name.vercel.app')
      })
    })

    describe('탐지 실패', () => {
      it('모든 방법이 실패하면 null을 반환한다', async () => {
        const repo = { ...mockRepo }

        // 모든 API 실패
        mockFetch.mockResolvedValue({ ok: false })

        const result = await detector.detectDeploymentUrl(repo)

        expect(result.url).toBeNull()
        expect(result.source).toBeNull()
        expect(result.confidence).toBe('low')
      })
    })
  })

  describe('URL 유효성 검증', () => {
    it('유효한 URL은 true를 반환한다', async () => {
      const repo = { ...mockRepo, homepage: 'https://valid-url.com' }

      mockFetch.mockResolvedValueOnce({ ok: true })

      const result = await detector.detectDeploymentUrl(repo)

      expect(result.url).toBe('https://valid-url.com')
    })

    it('fetch 실패 시 false를 반환한다', async () => {
      const repo = { ...mockRepo, homepage: 'https://slow-url.com' }

      // homepage 유효성 검증 실패 (네트워크 오류)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      // 나머지 API들
      mockFetch.mockResolvedValue({ ok: false })

      const result = await detector.detectDeploymentUrl(repo)

      expect(result.url).toBeNull()
    })
  })
})

describe('createDetectedApp', () => {
  const mockRepo: GitHubRepo = {
    name: 'my-project',
    full_name: 'user/my-project',
    description: 'A test project',
    homepage: 'https://my-project.vercel.app',
    html_url: 'https://github.com/user/my-project',
    owner: { login: 'user' },
    has_pages: false,
    default_branch: 'main',
  }

  it('DetectedApp 객체를 생성한다', () => {
    const result: DeploymentDetectionResult = {
      url: 'https://my-project.vercel.app',
      source: 'github_homepage',
      confidence: 'high',
    }

    const app = createDetectedApp(mockRepo, result)

    expect(app).toEqual({
      repoFullName: 'user/my-project',
      repoName: 'my-project',
      description: 'A test project',
      url: 'https://my-project.vercel.app',
      source: 'github_homepage',
      confidence: 'high',
      thumbnailUrl: 'https://opengraph.githubassets.com/1/user/my-project',
    })
  })

  it('URL이 없으면 null을 반환한다', () => {
    const result: DeploymentDetectionResult = {
      url: null,
      source: null,
      confidence: 'low',
    }

    const app = createDetectedApp(mockRepo, result)

    expect(app).toBeNull()
  })

  it('source가 없으면 null을 반환한다', () => {
    const result: DeploymentDetectionResult = {
      url: 'https://example.com',
      source: null,
      confidence: 'low',
    }

    const app = createDetectedApp(mockRepo, result)

    expect(app).toBeNull()
  })

  it('description이 null인 경우도 처리한다', () => {
    const repoWithoutDesc = { ...mockRepo, description: null }
    const result: DeploymentDetectionResult = {
      url: 'https://my-project.vercel.app',
      source: 'github_homepage',
      confidence: 'high',
    }

    const app = createDetectedApp(repoWithoutDesc, result)

    expect(app?.description).toBeNull()
  })
})
