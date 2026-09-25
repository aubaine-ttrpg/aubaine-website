import { defineConfig, devices } from '@playwright/test'

const PORT = 4322
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    storageState: {
      cookies: [],
      origins: [{ origin: BASE_URL, localStorage: [{ name: 'aubaine.drafts', value: 'shown' }] }],
    },
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    {
      name: 'no-javascript',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /no-javascript\.spec\.ts/,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
  },
})
