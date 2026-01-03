import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 각 테스트 후 자동 정리
afterEach(() => {
  cleanup()
})

// Next.js router mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Next.js Image mock
vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    fill: _fill,
    unoptimized: _unoptimized,
    priority: _priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    loader: _loader,
    sizes: _sizes,
    ...props
  }: {
    src: string
    alt: string
    fill?: boolean
    unoptimized?: boolean
    priority?: boolean
    quality?: number
    placeholder?: string
    blurDataURL?: string
    loader?: unknown
    sizes?: string
    [key: string]: unknown
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))
