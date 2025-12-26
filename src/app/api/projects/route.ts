import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: 프로젝트 목록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        id,
        display_name,
        avatar_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // 특정 사용자의 프로젝트만 조회
  if (userId) {
    query = query.eq('owner_id', userId)
  }

  // 검색어로 필터링
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    projects: data,
    total: count,
    limit,
    offset,
  })
}

// POST: 새 프로젝트 생성
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, thumbnail_url } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: '프로젝트 제목은 필수입니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }
}
