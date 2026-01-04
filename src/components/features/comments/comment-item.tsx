"use client"

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { CommentForm } from './comment-form'
import type { CommentWithProfile } from '@/types/database'

interface CommentItemProps {
  comment: CommentWithProfile
  onUpdate: (id: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CommentItem({ comment, onUpdate, onDelete }: CommentItemProps) {
  const { isAdmin } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = isAdmin

  const handleUpdate = async (content: string) => {
    await onUpdate(comment.id, content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName = comment.profiles?.display_name || '익명'
  const avatarUrl = comment.profiles?.avatar_url
  const isUpdated = comment.updated_at !== comment.created_at

  if (isEditing) {
    return (
      <div className="py-4">
        <CommentForm
          initialValue={comment.content}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          submitLabel="수정"
        />
      </div>
    )
  }

  return (
    <div className="flex gap-3 py-4">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>
          {displayName[0]?.toUpperCase() ?? 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: ko,
              })}
              {isUpdated && ' (수정됨)'}
            </span>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">더보기</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="size-4 mr-2" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="mt-1 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
