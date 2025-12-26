"use client"

import { useAuth } from '@/hooks/use-auth'
import { useComments } from '@/hooks/use-comments'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { Separator } from '@/components/ui/separator'

interface CommentsSectionProps {
  projectId: string
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const { user, loading: authLoading } = useAuth()
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(projectId)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 댓글 작성 폼 */}
      {!authLoading && (
        <div>
          {user ? (
            <CommentForm
              onSubmit={addComment}
              placeholder="댓글을 남겨주세요..."
            />
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
          )}
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div>
          <Separator className="my-4" />
          <p className="text-sm font-medium mb-2">
            댓글 {comments.length}개
          </p>
          <div className="divide-y">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onUpdate={updateComment}
                onDelete={deleteComment}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </p>
        </div>
      )}
    </div>
  )
}
