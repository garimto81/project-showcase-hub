import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Storage 전용 Supabase 클라이언트
 * Server Component/API 외부에서 사용 (스크립트 등)
 */
export function createStorageClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export const THUMBNAIL_BUCKET = 'thumbnails'

/**
 * 썸네일 이미지를 Supabase Storage에 업로드
 * @param projectId 프로젝트 ID
 * @param imageBuffer 이미지 버퍼 (PNG)
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadThumbnail(
  projectId: string,
  imageBuffer: Buffer
): Promise<string> {
  const supabase = createStorageClient()

  const fileName = `${projectId}.png`
  const filePath = `projects/${fileName}`

  // 기존 파일 삭제 (있으면)
  await supabase.storage.from(THUMBNAIL_BUCKET).remove([filePath])

  // 새 파일 업로드
  const { error } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    throw new Error(`썸네일 업로드 실패: ${error.message}`)
  }

  // 공개 URL 반환
  const { data: urlData } = supabase.storage
    .from(THUMBNAIL_BUCKET)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * 프로젝트 thumbnail_url 필드 업데이트
 */
export async function updateProjectThumbnail(
  projectId: string,
  thumbnailUrl: string
): Promise<void> {
  const supabase = createStorageClient()

  const { error } = await supabase
    .from('projects')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', projectId)

  if (error) {
    throw new Error(`프로젝트 업데이트 실패: ${error.message}`)
  }
}
