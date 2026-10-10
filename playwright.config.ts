import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Small mobile', use: { viewport: { width: 320, height: 640 }, isMobile: true } },
    { name: 'Mobile 360', use: { viewport: { width: 360, height: 800 }, isMobile: true } },
    { name: 'Mobile 390', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: 'Large mobile', use: { viewport: { width: 430, height: 932 }, isMobile: true } },
    { name: 'Tablet portrait', use: { viewport: { width: 768, height: 1024 }, isMobile: true } },
    { name: 'Tablet landscape', use: { viewport: { width: 1024, height: 768 }, isMobile: false } },
    { name: 'Small laptop', use: { viewport: { width: 1280, height: 720 }, isMobile: false } },
    { name: 'Standard desktop', use: { viewport: { width: 1440, height: 900 }, isMobile: false } },
    { name: 'Large desktop', use: { viewport: { width: 1920, height: 1080 }, isMobile: false } },
    { name: 'Ultrawide', use: { viewport: { width: 2560, height: 1440 }, isMobile: false } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
