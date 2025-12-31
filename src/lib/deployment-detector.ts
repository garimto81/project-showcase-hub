/**
 * 배포 URL 자동 탐지 유틸리티
 * GitHub 레포에서 배포된 앱 URL을 자동으로 찾아냅니다.
 */

import type { DeploymentSource, DetectedApp } from '@/types/database'

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

interface GitHubEnvironment {
  name: string
  html_url: string
}

interface GitHubDeployment {
  environment: string
  payload?: {
    web_url?: string
  }
}

/**
 * 배포 URL 탐지 클래스
 */
export class DeploymentDetector {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * 레포에서 배포 URL 탐지 (우선순위 순서대로 시도)
   */
  async detectDeploymentUrl(
    repo: GitHubRepo
  ): Promise<DeploymentDetectionResult> {
    // 1. GitHub API homepage 필드 (가장 신뢰도 높음)
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

    // 3. GitHub Environments/Deployments 확인
    const envUrl = await this.getEnvironmentDeploymentUrl(repo)
    if (envUrl) {
      return {
        url: envUrl,
        source: 'github_environments',
        confidence: 'high',
      }
    }

    // 4. README.md에서 링크 추출
    const readmeResult = await this.extractFromReadme(repo)
    if (readmeResult.url) {
      return readmeResult
    }

    // 5. URL 패턴 추론 (Vercel, Netlify 등)
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

  /**
   * GitHub Pages URL 생성
   */
  private getGitHubPagesUrl(repo: GitHubRepo): string {
    const owner = repo.owner.login.toLowerCase()
    const repoName = repo.name.toLowerCase()

    // user.github.io 레포인 경우
    if (repoName === `${owner}.github.io`) {
      return `https://${owner}.github.io`
    }

    return `https://${owner}.github.io/${repoName}`
  }

  /**
   * GitHub Environments에서 배포 URL 가져오기
   */
  private async getEnvironmentDeploymentUrl(
    repo: GitHubRepo
  ): Promise<string | null> {
    try {
      // Environments 조회
      const envResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/environments`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!envResponse.ok) return null

      const envData = await envResponse.json()
      const environments = envData.environments as GitHubEnvironment[]

      // production 또는 preview 환경 찾기
      const productionEnv = environments?.find(
        (env) =>
          env.name.toLowerCase() === 'production' ||
          env.name.toLowerCase() === 'preview'
      )

      if (productionEnv?.html_url) {
        // Deployments에서 실제 URL 가져오기
        const deploymentsResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/deployments?environment=${productionEnv.name}&per_page=1`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (deploymentsResponse.ok) {
          const deployments =
            (await deploymentsResponse.json()) as GitHubDeployment[]
          if (deployments[0]?.payload?.web_url) {
            return deployments[0].payload.web_url
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * README.md에서 배포 URL 추출
   */
  private async extractFromReadme(
    repo: GitHubRepo
  ): Promise<DeploymentDetectionResult> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/readme`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      )

      if (!response.ok) {
        return { url: null, source: null, confidence: 'low' }
      }

      const readmeContent = await response.text()

      // 1. 배지에서 URL 추출 (Vercel, Netlify)
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

      // 2. Demo/Live 링크 패턴 찾기
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

  /**
   * README 배지에서 배포 URL 추출
   */
  private extractBadgeUrl(content: string): string | null {
    // Vercel 배지 패턴
    const vercelBadgePattern =
      /\[!\[.*?\]\(.*?vercel.*?\)\]\((https:\/\/[^\s)]+)\)/i
    const vercelMatch = content.match(vercelBadgePattern)
    if (vercelMatch?.[1]) {
      return vercelMatch[1]
    }

    // Netlify 배지 패턴
    const netlifyBadgePattern =
      /\[!\[.*?\]\(.*?netlify.*?\)\]\((https:\/\/[^\s)]+)\)/i
    const netlifyMatch = content.match(netlifyBadgePattern)
    if (netlifyMatch?.[1]) {
      return netlifyMatch[1]
    }

    return null
  }

  /**
   * README에서 Demo/Live URL 추출
   */
  private extractDemoUrl(content: string): string | null {
    // Demo, Live, Website, 데모 등의 패턴
    const patterns = [
      /(?:demo|live|website|site|deployed|배포|데모)(?:\s*[:\-\|]?\s*)\[?(?:[^\]]+)?\]?\((https?:\/\/[^\s)]+)\)/gi,
      /\[(?:demo|live|website|site|deployed|visit|view|배포|데모)[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi,
      /(?:🔗|🌐|🚀)\s*(?:\[?[^\]]*\]?\()?(https?:\/\/[^\s)]+)/gi,
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        // URL 추출
        const urlMatch = match[0].match(/(https?:\/\/[^\s)]+)/)
        if (urlMatch?.[1]) {
          return urlMatch[1]
        }
      }
    }

    return null
  }

  /**
   * URL 패턴 추론 (Vercel, Netlify 등)
   */
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

  /**
   * URL 유효성 검증 (HEAD 요청)
   */
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

  /**
   * URL 형식 유효성 검사
   */
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
 * 레포 정보로 DetectedApp 객체 생성
 */
export function createDetectedApp(
  repo: GitHubRepo,
  result: DeploymentDetectionResult
): DetectedApp | null {
  if (!result.url || !result.source) {
    return null
  }

  return {
    repoFullName: repo.full_name,
    repoName: repo.name,
    description: repo.description,
    url: result.url,
    source: result.source,
    confidence: result.confidence,
    thumbnailUrl: `https://opengraph.githubassets.com/1/${repo.full_name}`,
  }
}
