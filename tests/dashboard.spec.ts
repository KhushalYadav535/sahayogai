import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should load the dashboard with key elements', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    
    // Ensure dashboard title is visible
    await expect(page.locator('text=Total Members').first()).toBeVisible();

    // The sidebar should exist and have a link to members
    const membersLink = page.locator('nav').locator('a[href="/dashboard/members"]').first();
    await expect(membersLink).toBeVisible();
    
    // The sidebar should have a link to accounts
    const accountsLink = page.locator('nav').locator('a[href="/dashboard/accounts"]').first();
    await expect(accountsLink).toBeVisible();
  });
});
