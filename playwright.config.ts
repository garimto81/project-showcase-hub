import { defineConfig, devices } from '@playwright/test'

const PRODUCTION_URL = 'https://project-showcase-hub-phi.vercel.app'
const AUTH_FILE = 'tests/e2e/.auth/user.json'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || PRODUCTION_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 공개 페이지 테스트 (기본 실행)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/authenticated\//, /auth\.setup\.ts/],
    },
    // 인증 설정 프로젝트 (수동 실행: npx playwright test --project=setup)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 인증된 사용자 테스트 (수동 실행: npx playwright test --project=authenticated)
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      testMatch: /authenticated\//,
      dependencies: ['setup'],
    },
  ],
})
