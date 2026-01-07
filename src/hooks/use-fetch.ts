'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type UseFetchOptions<T, R = T> = {
  url: string | (() => string)
  initialData: T
  fetchOnMount?: boolean
  defaultErrorMessage?: string
  transform?: (response: R) => T
}

export type UseFetchResult<T> = {
  data: T
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export function useFetch<T, R = T>(
  options: UseFetchOptions<T, R>
): UseFetchResult<T> {
  const {
    url,
    initialData,
    fetchOnMount = true,
    defaultErrorMessage = '데이터를 불러오는데 실패했습니다',
    transform,
  } = options

  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(fetchOnMount)
  const [error, setError] = useState<string | null>(null)

  // useRef로 함수 참조를 안정화하여 무한 루프 방지
  const urlRef = useRef(url)
  const transformRef = useRef(transform)
  const defaultErrorMessageRef = useRef(defaultErrorMessage)

  // 값 업데이트
  urlRef.current = url
  transformRef.current = transform
  defaultErrorMessageRef.current = defaultErrorMessage

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const resolvedUrl = typeof urlRef.current === 'function'
        ? urlRef.current()
        : urlRef.current
      const response = await fetch(resolvedUrl)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || defaultErrorMessageRef.current)
      }

      const transformedData = transformRef.current
        ? transformRef.current(result)
        : (result as T)
      setData(transformedData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : defaultErrorMessageRef.current
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fetchOnMount) {
      fetchData()
    }
  }, [fetchOnMount, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
    setError,
  }
}
