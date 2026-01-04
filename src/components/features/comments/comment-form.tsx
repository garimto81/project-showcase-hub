"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  initialValue?: string
  onSubmit: (content: string, authorName: string) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  placeholder?: string
  className?: string
}

export function CommentForm({
  initialValue = '',
  onSubmit,
  onCancel,
  submitLabel = '작성',
  placeholder = '댓글을 입력하세요...',
  className,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [authorName, setAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !authorName.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), authorName.trim())
      setContent('')
      setAuthorName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <Input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="이름"
        disabled={isSubmitting}
        className="w-full max-w-xs"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={3}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        required
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim() || !authorName.trim()}
        >
          {isSubmitting ? '등록 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
