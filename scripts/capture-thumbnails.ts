/**
 * 프로젝트 썸네일 캡처 스크립트
 *
 * 배포 URL이 있는 프로젝트의 스크린샷을 Playwright로 캡처하여
 * Supabase Storage에 업로드합니다.
 *
 * 사용법:
 *   npx tsx scripts/capture-thumbnails.ts           # 모든 프로젝트
 *   npx tsx scripts/capture-thumbnails.ts <id>     # 특정 프로젝트
 *   npx tsx scripts/capture-thumbnails.ts --dry-run # 테스트 (업로드 안함)
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const THUMBNAIL_BUCKET = 'thumbnails'

interface Project {
  id: string
  title: string
  url: string | null
  thumbnail_url: string | null
}

async function getProjects(projectId?: string): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('id, title, url, thumbnail_url')
    .not('url', 'is', null)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('id', projectId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`프로젝트 조회 실패: ${error.message}`)
  }

  return data || []
}

async function captureScreenshot(url: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    })

    const page = await context.newPage()

    // 네트워크 요청 최적화 (불필요한 리소스 차단)
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType()
      if (['media', 'font'].includes(resourceType)) {
        return route.abort()
      }
      return route.continue()
    })

    // 페이지 로드 (최대 30초 대기)
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // 추가 대기 (동적 콘텐츠 로드)
    await page.waitForTimeout(2000)

    // 스크린샷 캡처
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    })

    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}

async function uploadThumbnail(
  projectId: string,
  imageBuffer: Buffer
): Promise<string> {
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
    throw new Error(`업로드 실패: ${error.message}`)
  }

  // 공개 URL 반환
  const { data: urlData } = supabase.storage
    .from(THUMBNAIL_BUCKET)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

async function updateProjectThumbnail(
  projectId: string,
  thumbnailUrl: string
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', projectId)

  if (error) {
    throw new Error(`프로젝트 업데이트 실패: ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const projectId = args.find((arg) => !arg.startsWith('--'))

  console.log('='.repeat(60))
  console.log('프로젝트 썸네일 캡처 스크립트')
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('[DRY RUN] 업로드를 수행하지 않습니다.\n')
  }

  // 프로젝트 조회
  const projects = await getProjects(projectId)

  if (projects.length === 0) {
    console.log('캡처할 프로젝트가 없습니다.')
    return
  }

  console.log(`캡처 대상: ${projects.length}개 프로젝트\n`)

  let successCount = 0
  let failCount = 0

  for (const project of projects) {
    console.log(`[${project.title}]`)
    console.log(`  URL: ${project.url}`)

    if (!project.url) {
      console.log('  - 스킵: 배포 URL 없음\n')
      continue
    }

    try {
      // 스크린샷 캡처
      console.log('  - 스크린샷 캡처 중...')
      const imageBuffer = await captureScreenshot(project.url)
      console.log(`  - 캡처 완료 (${imageBuffer.length} bytes)`)

      if (dryRun) {
        console.log('  - [DRY RUN] 업로드 스킵\n')
        successCount++
        continue
      }

      // Storage 업로드
      console.log('  - Supabase Storage 업로드 중...')
      const thumbnailUrl = await uploadThumbnail(project.id, imageBuffer)
      console.log(`  - 업로드 완료: ${thumbnailUrl}`)

      // DB 업데이트
      console.log('  - DB 업데이트 중...')
      await updateProjectThumbnail(project.id, thumbnailUrl)
      console.log('  - 완료!\n')

      successCount++
    } catch (error) {
      console.error(
        `  - 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n`
      )
      failCount++
    }
  }

  console.log('='.repeat(60))
  console.log(`결과: 성공 ${successCount}개, 실패 ${failCount}개`)
  console.log('='.repeat(60))
}

main().catch((error) => {
  console.error('스크립트 실행 실패:', error)
  process.exit(1)
})
