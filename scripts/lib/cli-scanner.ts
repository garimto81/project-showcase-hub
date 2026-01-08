/**
 * CLI 전용 GitHub 레포지토리 스캐너
 *
 * 공개 API를 사용하여 배포된 앱을 탐지합니다.
 * OAuth 없이 동작하므로 GitHub Environments API는 사용하지 않습니다.
 */

import type { DetectedApp, DeploymentSource, ScanResult, ScanError } from '../../src/types/database'

export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  homepage: string | null
  html_url: string
  owner: {
    login: string
  }
  has_pages: boolean
  default_branch: string
}

export interface DeploymentDetectionResult {
  url: string | null
  source: DeploymentSource | null
  confidence: 'high' | 'medium' | 'low'
}

export interface ScanOptions {
  dryRun?: boolean
  verbose?: boolean
  force?: boolean
  minConfidence?: 'high' | 'medium' | 'low'
  limit?: number
  onProgress?: (current: number, total: number, repo: string) => void
  onAppDetected?: (app: DetectedApp) => void
}

const CONCURRENT_LIMIT = 5
const GITHUB_API_BASE = 'https://api.github.com'

/**
 * CLI 전용 배포 URL 탐지 클래스
 */
export class CLIDeploymentDetector {
  private token?: string

  constructor(token?: string) {
    this.token = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'project-showcase-hub-scanner',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  /**
   * 레포에서 배포 URL 탐지 (공개 API용, 4단계)
   */
  async detectDeploymentUrl(repo: GitHubRepo): Promise<DeploymentDetectionResult> {
    // 1. GitHub API homepage 필드
    if (repo.homepage && this.isValidUrl(repo.homepage)) {
      const isValid = await this.validateUrl(repo.homepage)
      if (isValid) {
        return {
          url: repo.homepage,
          source: 'github_homepage',
          confidence: 'high',
        }
      }
    }

    // 2. GitHub Pages 확인
    if (repo.has_pages) {
      const pagesUrl = this.getGitHubPagesUrl(repo)
      const isValid = await this.validateUrl(pagesUrl)
      if (isValid) {
        return {
          url: pagesUrl,
          source: 'github_pages',
          confidence: 'high',
        }
      }
    }

    // 3. README.md에서 링크 추출
    const readmeResult = await this.extractFromReadme(repo)
    if (readmeResult.url) {
      return readmeResult
    }

    // 4. URL 패턴 추론 (Vercel, Netlify 등)
    const inferredUrl = await this.inferDeploymentUrl(repo)
    if (inferredUrl) {
      return {
        url: inferredUrl,
        source: 'url_inference',
        confidence: 'low',
      }
    }

    return { url: null, source: null, confidence: 'low' }
  }

  private getGitHubPagesUrl(repo: GitHubRepo): string {
    const owner = repo.owner.login.toLowerCase()
    const repoName = repo.name.toLowerCase()

    if (repoName === `${owner}.github.io`) {
      return `https://${owner}.github.io`
    }

    return `https://${owner}.github.io/${repoName}`
  }

  private async extractFromReadme(repo: GitHubRepo): Promise<DeploymentDetectionResult> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.full_name}/readme`,
        {
          headers: {
            ...this.getHeaders(),
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      )

      if (!response.ok) {
        return { url: null, source: null, confidence: 'low' }
      }

      const readmeContent = await response.text()

      // 1. 배지에서 URL 추출
      const badgeUrl = this.extractBadgeUrl(readmeContent)
      if (badgeUrl) {
        const isValid = await this.validateUrl(badgeUrl)
        if (isValid) {
          return {
            url: badgeUrl,
            source: 'readme_badge',
            confidence: 'medium',
          }
        }
      }

      // 2. Demo/Live 링크 패턴
      const demoUrl = this.extractDemoUrl(readmeContent)
      if (demoUrl) {
        const isValid = await this.validateUrl(demoUrl)
        if (isValid) {
          return {
            url: demoUrl,
            source: 'readme_link',
            confidence: 'medium',
          }
        }
      }

      return { url: null, source: null, confidence: 'low' }
    } catch {
      return { url: null, source: null, confidence: 'low' }
    }
  }

  private extractBadgeUrl(content: string): string | null {
    const vercelBadgePattern = /\[!\[.*?\]\(.*?vercel.*?\)\]\((https:\/\/[^\s)]+)\)/i
    const vercelMatch = content.match(vercelBadgePattern)
    if (vercelMatch?.[1]) {
      return vercelMatch[1]
    }

    const netlifyBadgePattern = /\[!\[.*?\]\(.*?netlify.*?\)\]\((https:\/\/[^\s)]+)\)/i
    const netlifyMatch = content.match(netlifyBadgePattern)
    if (netlifyMatch?.[1]) {
      return netlifyMatch[1]
    }

    return null
  }

  private extractDemoUrl(content: string): string | null {
    const patterns = [
      /(?:demo|live|website|site|deployed|배포|데모)(?:\s*[:\-\|]?\s*)\[?(?:[^\]]+)?\]?\((https?:\/\/[^\s)]+)\)/gi,
      /\[(?:demo|live|website|site|deployed|visit|view|배포|데모)[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi,
      /(?:🔗|🌐|🚀)\s*(?:\[?[^\]]*\]?\()?(https?:\/\/[^\s)]+)/gi,
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        const urlMatch = match[0].match(/(https?:\/\/[^\s)]+)/)
        if (urlMatch?.[1]) {
          return urlMatch[1]
        }
      }
    }

    return null
  }

  private async inferDeploymentUrl(repo: GitHubRepo): Promise<string | null> {
    const repoName = repo.name.toLowerCase().replace(/[_\.]/g, '-')
    const owner = repo.owner.login.toLowerCase()

    const patterns = [
      `https://${repoName}.vercel.app`,
      `https://${repoName}-${owner}.vercel.app`,
      `https://${repoName}.netlify.app`,
      `https://${repoName}.pages.dev`,
    ]

    for (const url of patterns) {
      const isValid = await this.validateUrl(url)
      if (isValid) {
        return url
      }
    }

    return null
  }

  private async validateUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
}

/**
 * CLI 전용 레포지토리 스캐너
 */
export class CLIRepoScanner {
  private username: string
  private token?: string
  private detector: CLIDeploymentDetector

  constructor(username: string, token?: string) {
    this.username = username
    this.token = token
    this.detector = new CLIDeploymentDetector(token)
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'project-showcase-hub-scanner',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  /**
   * 모든 공개 레포지토리 조회
   */
  async fetchAllRepos(): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `${GITHUB_API_BASE}/users/${this.username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API 요청 한도 초과 (Rate Limit)')
        }
        throw new Error(`GitHub API 오류: ${response.status}`)
      }

      const data = (await response.json()) as GitHubRepo[]

      if (data.length === 0) break

      repos.push(...data)
      page++

      if (data.length < perPage) break
    }

    return repos
  }

  /**
   * 모든 레포 스캔하여 배포된 앱 탐지
   */
  async scanAll(options: ScanOptions = {}): Promise<ScanResult> {
    const {
      minConfidence = 'low',
      limit,
      onProgress,
      onAppDetected,
    } = options

    let repos = await this.fetchAllRepos()

    if (limit && limit > 0) {
      repos = repos.slice(0, limit)
    }

    const detectedApps: DetectedApp[] = []
    const skippedRepos: string[] = []
    const errors: ScanError[] = []

    // 병렬 처리 (동시 5개씩)
    for (let i = 0; i < repos.length; i += CONCURRENT_LIMIT) {
      const chunk = repos.slice(i, i + CONCURRENT_LIMIT)

      const results = await Promise.allSettled(
        chunk.map(async (repo) => {
          try {
            const result = await this.detector.detectDeploymentUrl(repo)

            // 신뢰도 필터링
            if (!this.meetsConfidence(result.confidence, minConfidence)) {
              return { repo, result: null, skipped: true }
            }

            return { repo, result, skipped: false }
          } catch (error) {
            throw { repo, error }
          }
        })
      )

      for (const promiseResult of results) {
        const currentIndex = i + results.indexOf(promiseResult) + 1

        if (promiseResult.status === 'rejected') {
          const { repo, error } = promiseResult.reason as { repo: GitHubRepo; error: Error }
          errors.push({
            repo: repo.full_name,
            error: error.message,
          })
          onProgress?.(currentIndex, repos.length, repo.full_name)
          continue
        }

        const { repo, result, skipped } = promiseResult.value

        onProgress?.(currentIndex, repos.length, repo.full_name)

        if (skipped || !result?.url || !result?.source) {
          skippedRepos.push(repo.full_name)
          continue
        }

        const app: DetectedApp = {
          repoFullName: repo.full_name,
          repoName: repo.name,
          description: repo.description,
          url: result.url,
          source: result.source,
          confidence: result.confidence,
          thumbnailUrl: `https://opengraph.githubassets.com/1/${repo.full_name}`,
        }

        detectedApps.push(app)
        onAppDetected?.(app)
      }
    }

    return {
      totalRepos: repos.length,
      scannedRepos: repos.length,
      detectedApps,
      skippedRepos,
      errors,
    }
  }

  private meetsConfidence(
    actual: 'high' | 'medium' | 'low',
    minimum: 'high' | 'medium' | 'low'
  ): boolean {
    const levels = { high: 3, medium: 2, low: 1 }
    return levels[actual] >= levels[minimum]
  }
}
