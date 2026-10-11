import { defineConfig, devices } from '@playwright/test';

// Uçtan uca testler üretim derlemesine karşı çalışır (vite preview).
// Yerelde kurulu Chrome kullanılabilir: PW_CHANNEL=chrome npx playwright test
const channel = process.env.PW_CHANNEL;
const launchOptions = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'masaustu',
      use: { ...devices['Desktop Chrome'], channel, launchOptions, permissions: ['clipboard-read', 'clipboard-write'] },
      grepInvert: /@mobil/,
    },
    { name: 'mobil', use: { ...devices['Pixel 7'], channel, launchOptions }, grep: /@mobil/ },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
