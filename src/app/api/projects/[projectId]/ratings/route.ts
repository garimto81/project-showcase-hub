import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 프로젝트 별점 목록 및 통계
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select('*, profiles(display_name, avatar_url)')
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 평균 및 분포 계산
  const ratings = data || []
  const total = ratings.length
  const average = total > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / total
    : 0

  const distribution = ratings.reduce((acc, r) => {
    acc[r.score] = (acc[r.score] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return NextResponse.json({
    ratings,
    average,
    total,
    distribution,
  })
}

// POST: 별점 생성/수정 (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { score } = body

  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: '1-5 사이의 점수를 입력해주세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      {
        project_id: projectId,
        user_id: user.id,
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE: 별점 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
