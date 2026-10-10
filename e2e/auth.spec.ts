import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*error=InvalidCredentials/);
  });

  test('Valid login works and logout works', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@a1fitness.com');
    await page.fill('input[name="password"]', 'password123'); // Assuming seed password
    await page.click('button[type="submit"]');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/');

    // Logout
    if (isMobile) {
      await page.click('button[aria-label="Open sidebar"]');
    }
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/.*\/login/);
  });
  
  test('Mobile navigation drawer', async ({ page, isMobile }) => {
    // Only run if the project uses mobile dimensions
    if (!isMobile) return;

    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@a1fitness.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Click hamburger
    await page.click('button[aria-label="Open sidebar"]');
    await expect(page.getByRole('link', { name: 'All Members' }).last()).toBeVisible();

    // Close sidebar
    await page.click('button:has-text("Close sidebar")');
    await expect(page.locator('nav').last()).not.toBeVisible();
  });
});
