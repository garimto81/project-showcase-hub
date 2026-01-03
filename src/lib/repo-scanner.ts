/**
 * 전체 레포 자동 스캔 유틸리티
 * 사용자의 모든 GitHub 레포를 스캔하여 배포된 앱을 찾습니다.
 */

import type { DetectedApp, ScanResult, ScanError } from '@/types/database'
import {
  DeploymentDetector,
  createDetectedApp,
  type GitHubRepo,
} from './deployment-detector'

const CONCURRENT_LIMIT = 5 // 동시 스캔 제한

export interface ScanOptions {
  onProgress?: (scanned: number, total: number, current: string | null) => void
  onAppDetected?: (app: DetectedApp) => void
}

/**
 * 전체 레포 스캔 클래스
 */
export class RepoScanner {
  private accessToken: string
  private detector: DeploymentDetector

  constructor(accessToken: string) {
    this.accessToken = accessToken
    this.detector = new DeploymentDetector(accessToken)
  }

  /**
   * 사용자의 모든 레포를 스캔하여 배포된 앱 찾기
   */
  async scanAllRepos(options?: ScanOptions): Promise<ScanResult> {
    const repos = await this.fetchAllRepos()
    const detectedApps: DetectedApp[] = []
    const skippedRepos: string[] = []
    const errors: ScanError[] = []

    let scannedCount = 0
    const totalCount = repos.length

    // 병렬 처리 (동시에 CONCURRENT_LIMIT개씩)
    for (let i = 0; i < repos.length; i += CONCURRENT_LIMIT) {
      const batch = repos.slice(i, i + CONCURRENT_LIMIT)

      const results = await Promise.allSettled(
        batch.map(async (repo) => {
          options?.onProgress?.(scannedCount, totalCount, repo.full_name)

          try {
            const result = await this.detector.detectDeploymentUrl(repo)
            scannedCount++

            if (result.url) {
              const app = createDetectedApp(repo, result)
              if (app) {
                detectedApps.push(app)
                options?.onAppDetected?.(app)
              }
            } else {
              skippedRepos.push(repo.full_name)
            }
          } catch (error) {
            scannedCount++
            errors.push({
              repo: repo.full_name,
              error: error instanceof Error ? error.message : '알 수 없는 오류',
            })
          }
        })
      )

      // 실패한 Promise 처리
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const repo = batch[index]
          errors.push({
            repo: repo.full_name,
            error: result.reason?.message || '알 수 없는 오류',
          })
        }
      })
    }

    options?.onProgress?.(totalCount, totalCount, null)

    return {
      totalRepos: totalCount,
      scannedRepos: scannedCount,
      detectedApps,
      skippedRepos,
      errors,
    }
  }

  /**
   * 사용자의 모든 레포 가져오기 (페이지네이션 처리)
   */
  private async fetchAllRepos(): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API 오류: ${response.status}`)
      }

      const pageRepos = (await response.json()) as GitHubRepo[]

      if (pageRepos.length === 0) {
        break
      }

      repos.push(...pageRepos)

      if (pageRepos.length < perPage) {
        break
      }

      page++
    }

    return repos
  }

  /**
   * 단일 레포 스캔
   */
  async scanSingleRepo(owner: string, repo: string): Promise<DetectedApp | null> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`레포를 찾을 수 없습니다: ${owner}/${repo}`)
    }

    const repoData = (await response.json()) as GitHubRepo
    const result = await this.detector.detectDeploymentUrl(repoData)

    return createDetectedApp(repoData, result)
  }
}
