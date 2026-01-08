/**
 * GitHub 레포지토리 자동 스캔 스크립트
 *
 * GitHub 공개 레포지토리를 스캔하여 배포된 앱을 탐지하고
 * Supabase에 자동 등록합니다.
 *
 * 사용법:
 *   npm run scan                          # 기본 실행
 *   npm run scan -- --dry-run             # 테스트 (DB 저장 안함)
 *   npm run scan -- --verbose             # 상세 로그
 *   npm run scan -- --force               # 중복 허용 (업데이트)
 *   npm run scan -- --output json         # JSON 출력
 *   npm run scan -- --limit 10            # 최대 10개 레포만 스캔
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { CLIRepoScanner } from './lib/cli-scanner'
import type { DetectedApp, Database } from '../src/types/database'

// .env.local 로드
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  config({ path: envPath, override: true })
}

// 환경변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const githubUsername = process.env.GITHUB_USERNAME || 'garimto81'
const githubToken = process.env.GITHUB_TOKEN

// Admin UUID (고정값)
const ADMIN_UUID = '00000000-0000-0000-0000-000000000001'

interface CliOptions {
  dryRun: boolean
  verbose: boolean
  force: boolean
  output: 'text' | 'json'
  limit?: number
  minConfidence: 'high' | 'medium' | 'low'
}

interface SaveResult {
  status: 'created' | 'updated' | 'skipped' | 'error'
  reason?: string
}

interface FinalResult {
  success: boolean
  timestamp: string
  summary: {
    totalRepos: number
    scannedRepos: number
    detectedApps: number
    created: number
    updated: number
    skipped: number
    errors: number
  }
  apps: Array<DetectedApp & { saveStatus: string }>
  errors: Array<{ repo: string; error: string }>
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    force: args.includes('--force'),
    output: args.includes('--output') && args[args.indexOf('--output') + 1] === 'json' ? 'json' : 'text',
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : undefined,
    minConfidence: args.includes('--min-confidence')
      ? (args[args.indexOf('--min-confidence') + 1] as 'high' | 'medium' | 'low')
      : 'low',
  }
}

function log(message: string, options: CliOptions): void {
  if (options.output === 'text') {
    console.log(message)
  }
}

function logVerbose(message: string, options: CliOptions): void {
  if (options.verbose && options.output === 'text') {
    console.log(message)
  }
}

async function checkExistingProject(
  supabase: SupabaseClient<Database>,
  githubRepo: string
): Promise<{ id: string; title: string } | null> {
  const { data } = await supabase
    .from('projects')
    .select('id, title')
    .eq('github_repo', githubRepo)
    .single()

  return data
}

async function saveProject(
  supabase: SupabaseClient<Database>,
  app: DetectedApp,
  options: CliOptions
): Promise<SaveResult> {
  const existing = await checkExistingProject(supabase, app.repoFullName)

  if (existing && !options.force) {
    return { status: 'skipped', reason: 'already_exists' }
  }

  if (existing && options.force) {
    // 업데이트
    const { error } = await supabase
      .from('projects')
      .update({
        title: app.repoName,
        description: app.description,
        url: app.url,
        thumbnail_url: app.thumbnailUrl,
      })
      .eq('id', existing.id)

    if (error) {
      return { status: 'error', reason: error.message }
    }

    return { status: 'updated' }
  }

  // 신규 생성
  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: app.repoName,
      description: app.description,
      owner_id: ADMIN_UUID,
      thumbnail_url: app.thumbnailUrl,
      url: app.url,
      github_repo: app.repoFullName,
      app_type: 'web_app',
      is_favorite: false,
    })
    .select()
    .single()

  if (error) {
    return { status: 'error', reason: error.message }
  }

  // 메타데이터 레코드 생성
  if (data) {
    await supabase.from('project_metadata').insert({
      project_id: data.id,
      tech_stack: [],
      screenshots: [],
      status: 'unknown',
      github_stars: 0,
      github_forks: 0,
      github_topics: [],
    })
  }

  return { status: 'created' }
}

async function main() {
  const options = parseArgs()

  // 환경변수 검증
  const supabaseKey = supabaseServiceKey || supabaseAnonKey

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.')
    console.error('')
    console.error('.env.local 파일에 다음 변수가 필요합니다:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
    console.error('')
    process.exit(1)
  }

  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY가 없습니다. DB 저장이 실패할 수 있습니다.')
  }

  // Supabase 클라이언트 생성
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // 헤더 출력
  log('='.repeat(60), options)
  log('GitHub 레포 자동 스캔 스크립트', options)
  log('='.repeat(60), options)
  log(`대상: ${githubUsername}`, options)
  log(`옵션: dry-run=${options.dryRun}, force=${options.force}, min-confidence=${options.minConfidence}`, options)
  if (options.limit) {
    log(`제한: 최대 ${options.limit}개 레포`, options)
  }
  log('', options)

  if (options.dryRun) {
    log('[DRY RUN] DB 저장을 수행하지 않습니다.\n', options)
  }

  // 스캐너 생성
  const scanner = new CLIRepoScanner(githubUsername, githubToken)

  // 결과 추적
  const saveResults: Array<DetectedApp & { saveStatus: string }> = []
  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  log('[스캔 진행]', options)

  // 스캔 실행
  const result = await scanner.scanAll({
    minConfidence: options.minConfidence,
    limit: options.limit,
    onProgress: (current, total, repo) => {
      logVerbose(`  [${current}/${total}] ${repo}`, options)
    },
    onAppDetected: async (app) => {
      const sourceLabel = getSourceLabel(app.source)
      log(`  + ${app.repoName} (${sourceLabel}, ${app.confidence})`, options)
      logVerbose(`    URL: ${app.url}`, options)
    },
  })

  log('', options)
  log('[등록 처리]', options)

  // DB 저장
  for (const app of result.detectedApps) {
    if (options.dryRun) {
      log(`  [DRY RUN] ${app.repoName} - 저장 스킵`, options)
      saveResults.push({ ...app, saveStatus: 'dry_run' })
      continue
    }

    try {
      const saveResult = await saveProject(supabase, app, options)

      switch (saveResult.status) {
        case 'created':
          log(`  + ${app.repoName} → 신규 등록`, options)
          createdCount++
          break
        case 'updated':
          log(`  ~ ${app.repoName} → 업데이트`, options)
          updatedCount++
          break
        case 'skipped':
          log(`  = ${app.repoName} → 스킵 (이미 등록됨)`, options)
          skippedCount++
          break
        case 'error':
          log(`  ! ${app.repoName} → 오류: ${saveResult.reason}`, options)
          errorCount++
          break
      }

      saveResults.push({ ...app, saveStatus: saveResult.status })
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      log(`  ! ${app.repoName} → 오류: ${message}`, options)
      errorCount++
      saveResults.push({ ...app, saveStatus: 'error' })
    }
  }

  // 결과 요약
  log('', options)
  log('='.repeat(60), options)
  log('결과 요약', options)
  log('='.repeat(60), options)
  log(`총 레포: ${result.totalRepos}개`, options)
  log(`스캔 완료: ${result.scannedRepos}개`, options)
  log(`배포 감지: ${result.detectedApps.length}개`, options)

  if (!options.dryRun) {
    log(`  - 신규 등록: ${createdCount}개`, options)
    log(`  - 업데이트: ${updatedCount}개`, options)
    log(`  - 스킵 (중복): ${skippedCount}개`, options)
  }

  if (result.errors.length > 0 || errorCount > 0) {
    log(`에러: ${result.errors.length + errorCount}개`, options)
  }

  log('='.repeat(60), options)

  // JSON 출력
  if (options.output === 'json') {
    const finalResult: FinalResult = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalRepos: result.totalRepos,
        scannedRepos: result.scannedRepos,
        detectedApps: result.detectedApps.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: result.errors.length + errorCount,
      },
      apps: saveResults,
      errors: result.errors,
    }

    console.log(JSON.stringify(finalResult, null, 2))
  }
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    github_homepage: 'homepage',
    github_pages: 'GitHub Pages',
    readme_badge: 'README 배지',
    readme_link: 'README 링크',
    url_inference: 'URL 추론',
  }
  return labels[source] || source
}

main().catch((error) => {
  console.error('스크립트 실행 실패:', error)
  process.exit(1)
})
