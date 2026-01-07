/**
 * Supabase Storage 버킷 생성 스크립트
 *
 * 사용법:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; npx tsx scripts/create-storage-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local 로드
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
  console.error('')
  console.error('사용법:')
  console.error('  PowerShell:')
  console.error('    $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  console.error('    npx tsx scripts/create-storage-bucket.ts')
  console.error('')
  console.error('service_role key는 Supabase Dashboard > Settings > API에서 확인할 수 있습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createBucket() {
  console.log('thumbnails 버킷 생성 중...')

  // 기존 버킷 확인
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('버킷 목록 조회 실패:', listError.message)
    process.exit(1)
  }

  const existingBucket = buckets?.find(b => b.name === 'thumbnails')
  if (existingBucket) {
    console.log('thumbnails 버킷이 이미 존재합니다.')
    return
  }

  // 버킷 생성
  const { error } = await supabase.storage.createBucket('thumbnails', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })

  if (error) {
    console.error('버킷 생성 실패:', error.message)
    process.exit(1)
  }

  console.log('thumbnails 버킷 생성 완료!')
  console.log('')
  console.log('이제 다음 명령어로 썸네일을 캡처할 수 있습니다:')
  console.log('  npm run capture:thumbnails')
}

createBucket()
