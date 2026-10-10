# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: release.spec.ts >> Release Verification >> Capture screenshots of all key routes
- Location: e2e\release.spec.ts:6:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
  navigated to "http://localhost:3000/login?error=InternalError"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]: Fitness Monitoring
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Fitness Monitoring" [level=1] [ref=e22]
      - paragraph [ref=e23]: Sign in to your account
    - generic [ref=e24]:
      - generic [ref=e25]:
        - text: Email
        - textbox [ref=e26]
      - generic [ref=e27]:
        - text: Password
        - textbox [ref=e28]
      - button "Sign In" [ref=e29]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | test.describe('Release Verification', () => {
  6  |   test('Capture screenshots of all key routes', async ({ page }, testInfo) => {
  7  |     const screenshotDir = path.join(process.cwd(), 'test-results', 'responsive-audit');
  8  |     if (!fs.existsSync(screenshotDir)) {
  9  |       fs.mkdirSync(screenshotDir, { recursive: true });
  10 |     }
  11 | 
  12 |     // Helper to format viewport name
  13 |     const projectName = testInfo.project.name.toLowerCase().replace(/ /g, '-');
  14 |     const viewport = testInfo.project.use.viewport;
  15 |     const viewportStr = viewport ? `${viewport.width}x${viewport.height}` : 'unknown';
  16 | 
  17 |     // Login
  18 |     await page.goto('/login');
  19 |     await page.fill('input[name="email"]', 'admin@fitnessmonitoring.com'); // We seeded this in Prisma
  20 |     await page.fill('input[name="password"]', 'password123');
  21 |     await page.click('button[type="submit"]');
> 22 |     await page.waitForURL('/');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  23 |     await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  24 |     await page.screenshot({ path: path.join(screenshotDir, `dashboard-${projectName}-${viewportStr}.png`), fullPage: true });
  25 | 
  26 |     // All Members
  27 |     await page.goto('/members');
  28 |     await expect(page.locator('h1:has-text("All Members")')).toBeVisible();
  29 |     await page.screenshot({ path: path.join(screenshotDir, `members-${projectName}-${viewportStr}.png`), fullPage: true });
  30 | 
  31 |     // Add Member
  32 |     await page.goto('/members/new');
  33 |     await expect(page.locator('text=Register New Member').first()).toBeVisible();
  34 |     await page.screenshot({ path: path.join(screenshotDir, `add-member-${projectName}-${viewportStr}.png`), fullPage: true });
  35 | 
  36 |     // Partially Paid
  37 |     await page.goto('/partially-paid');
  38 |     await expect(page.locator('h1:has-text("Partially Paid")')).toBeVisible();
  39 |     await page.screenshot({ path: path.join(screenshotDir, `partially-paid-${projectName}-${viewportStr}.png`), fullPage: true });
  40 | 
  41 |     // Unpaid Members
  42 |     await page.goto('/unpaid');
  43 |     await expect(page.locator('h1:has-text("Unpaid Members")')).toBeVisible();
  44 |     await page.screenshot({ path: path.join(screenshotDir, `unpaid-${projectName}-${viewportStr}.png`), fullPage: true });
  45 | 
  46 |     // Payment History
  47 |     await page.goto('/payments');
  48 |     await expect(page.locator('h1:has-text("Payment History")')).toBeVisible();
  49 |     await page.screenshot({ path: path.join(screenshotDir, `payments-${projectName}-${viewportStr}.png`), fullPage: true });
  50 | 
  51 |     // Settings
  52 |     await page.goto('/settings');
  53 |     await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  54 |     await page.screenshot({ path: path.join(screenshotDir, `settings-${projectName}-${viewportStr}.png`), fullPage: true });
  55 | 
  56 |     // Reports & Analytics
  57 |     await page.goto('/reports');
  58 |     await expect(page.locator('h1:has-text("Reports & Analytics")')).toBeVisible();
  59 |     await page.screenshot({ path: path.join(screenshotDir, `reports-${projectName}-${viewportStr}.png`), fullPage: true });
  60 |   });
  61 |   
  62 | 
  63 | 
  64 |   test('Test Receipt Download', async ({ page }) => {
  65 |     await page.goto('/login');
  66 |     await page.fill('input[name="email"]', 'admin@fitnessmonitoring.com');
  67 |     await page.fill('input[name="password"]', 'password123');
  68 |     await page.click('button[type="submit"]');
  69 |     await page.waitForURL('/');
  70 | 
  71 |     await page.goto('/payments');
  72 |     
  73 |     const downloadLink = page.locator('a[href^="/api/receipts/"]').first();
  74 |     if (await downloadLink.isVisible()) {
  75 |       const [download] = await Promise.all([
  76 |         page.waitForEvent('download'),
  77 |         downloadLink.click()
  78 |       ]);
  79 |       expect(download.suggestedFilename()).toContain('.pdf');
  80 |     }
  81 |   });
  82 | });
  83 | 
```