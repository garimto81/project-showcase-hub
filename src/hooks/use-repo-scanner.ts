'use client'

import { useState, useCallback } from 'react'
import type { DetectedApp, ScanStatus } from '@/types/database'

interface ScanState {
  status: ScanStatus
  totalRepos: number
  scannedRepos: number
  savedApps: number
  existingApps: number
  detectedApps: DetectedApp[]
  error: string | null
}

interface ScanApiResult {
  success: boolean
  result?: {
    totalRepos: number
    scannedRepos: number
    detectedApps: number
    savedApps: number
    existingApps: number
    skippedRepos: number
    errors: number
  }
  apps?: DetectedApp[]
  error?: string
  needsGithubLink?: boolean
  needsReauth?: boolean
}

export function useRepoScanner() {
  const [state, setState] = useState<ScanState>({
    status: 'idle',
    totalRepos: 0,
    scannedRepos: 0,
    savedApps: 0,
    existingApps: 0,
    detectedApps: [],
    error: null,
  })

  const startScan = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: 'scanning',
      error: null,
    }))

    try {
      const response = await fetch('/api/github/scan-all', {
        method: 'POST',
      })

      const data = (await response.json()) as ScanApiResult

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: data.error || '스캔 중 오류가 발생했습니다',
        }))

        return {
          success: false,
          needsGithubLink: data.needsGithubLink,
          needsReauth: data.needsReauth,
          error: data.error,
        }
      }

      setState({
        status: 'completed',
        totalRepos: data.result?.totalRepos ?? 0,
        scannedRepos: data.result?.scannedRepos ?? 0,
        savedApps: data.result?.savedApps ?? 0,
        existingApps: data.result?.existingApps ?? 0,
        detectedApps: data.apps ?? [],
        error: null,
      })

      return { success: true, data }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '네트워크 오류가 발생했습니다'

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }))

      return { success: false, error: errorMessage }
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      totalRepos: 0,
      scannedRepos: 0,
      savedApps: 0,
      existingApps: 0,
      detectedApps: [],
      error: null,
    })
  }, [])

  return {
    ...state,
    isScanning: state.status === 'scanning',
    isCompleted: state.status === 'completed',
    hasError: state.status === 'error',
    startScan,
    reset,
  }
}
