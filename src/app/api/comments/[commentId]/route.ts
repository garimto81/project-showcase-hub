import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 })
  }

  // 본인 댓글인지 확인
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 })
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('*, profiles(display_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE: 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  // 본인 댓글인지 확인
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다' }, { status: 404 })
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
