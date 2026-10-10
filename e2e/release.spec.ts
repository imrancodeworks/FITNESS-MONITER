import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Release Verification', () => {
  test('Capture screenshots of all key routes', async ({ page }, testInfo) => {
    const screenshotDir = path.join(process.cwd(), 'test-results', 'responsive-audit');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Helper to format viewport name
    const projectName = testInfo.project.name.toLowerCase().replace(/ /g, '-');
    const viewport = testInfo.project.use.viewport;
    const viewportStr = viewport ? `${viewport.width}x${viewport.height}` : 'unknown';

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@fitnessmonitoring.com'); // We seeded this in Prisma
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `dashboard-${projectName}-${viewportStr}.png`), fullPage: true });

    // All Members
    await page.goto('/members');
    await expect(page.locator('h1:has-text("All Members")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `members-${projectName}-${viewportStr}.png`), fullPage: true });

    // Add Member
    await page.goto('/members/new');
    await expect(page.locator('text=Register New Member').first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `add-member-${projectName}-${viewportStr}.png`), fullPage: true });

    // Partially Paid
    await page.goto('/partially-paid');
    await expect(page.locator('h1:has-text("Partially Paid")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `partially-paid-${projectName}-${viewportStr}.png`), fullPage: true });

    // Unpaid Members
    await page.goto('/unpaid');
    await expect(page.locator('h1:has-text("Unpaid Members")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `unpaid-${projectName}-${viewportStr}.png`), fullPage: true });

    // Payment History
    await page.goto('/payments');
    await expect(page.locator('h1:has-text("Payment History")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `payments-${projectName}-${viewportStr}.png`), fullPage: true });

    // Settings
    await page.goto('/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `settings-${projectName}-${viewportStr}.png`), fullPage: true });

    // Reports & Analytics
    await page.goto('/reports');
    await expect(page.locator('h1:has-text("Reports & Analytics")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `reports-${projectName}-${viewportStr}.png`), fullPage: true });
  });
  


  test('Test Receipt Download', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@fitnessmonitoring.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/payments');
    
    const downloadLink = page.locator('a[href^="/api/receipts/"]').first();
    if (await downloadLink.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadLink.click()
      ]);
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});
