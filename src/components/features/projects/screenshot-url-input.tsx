'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScreenshotUrlInputProps {
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}

export function ScreenshotUrlInput({ value, onChange, disabled }: ScreenshotUrlInputProps) {
  const [newUrl, setNewUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddUrl = () => {
    const trimmedUrl = newUrl.trim()
    if (!trimmedUrl) return

    if (!validateUrl(trimmedUrl)) {
      setUrlError('유효한 URL을 입력해주세요')
      return
    }

    if (value.includes(trimmedUrl)) {
      setUrlError('이미 추가된 URL입니다')
      return
    }

    onChange([...value, trimmedUrl])
    setNewUrl('')
    setUrlError(null)
  }

  const handleRemoveUrl = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddUrl()
    }
  }

  return (
    <div className="space-y-4">
      <Label>스크린샷 URL</Label>

      {/* URL 입력 필드 */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/screenshot.png"
          value={newUrl}
          onChange={(e) => {
            setNewUrl(e.target.value)
            setUrlError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(urlError && 'border-destructive')}
          aria-invalid={!!urlError}
          aria-describedby={urlError ? 'url-error' : undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddUrl}
          disabled={disabled || !newUrl.trim()}
          aria-label="스크린샷 URL 추가"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {urlError && (
        <p id="url-error" className="text-sm text-destructive" role="alert">
          {urlError}
        </p>
      )}

      {/* 추가된 스크린샷 목록 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group rounded-lg border overflow-hidden bg-muted"
            >
              <div className="aspect-video relative">
                <Image
                  src={url}
                  alt={`스크린샷 ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden')
                  }}
                />
                <div className="fallback hidden absolute inset-0 flex items-center justify-center bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              {/* 삭제 버튼 */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveUrl(index)}
                disabled={disabled}
                aria-label={`스크린샷 ${index + 1} 삭제`}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* URL 표시 */}
              <div className="p-2 text-xs text-muted-foreground truncate" title={url}>
                {url}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          프로젝트 스크린샷 URL을 추가하세요. 프로젝트 상세 페이지에서 갤러리로 표시됩니다.
        </p>
      )}
    </div>
  )
}
