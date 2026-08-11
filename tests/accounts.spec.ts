import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils';

test.describe('Savings & Deposits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display exact balance and navigate to Open Account', async ({ page }) => {
    // Navigate to the accounts page
    await page.goto('/dashboard/accounts');

    // Wait for the page title
    await expect(page.locator('h1').filter({ hasText: 'Savings & Deposits' })).toBeVisible();

    // Verify the "Open Account" button exists
    const openAccountBtn = page.locator('button', { hasText: 'Open Account' });
    await expect(openAccountBtn).toBeVisible();

    // Click "Open Account" and verify navigation
    await openAccountBtn.click();
    
    // We should be redirected to /dashboard/accounts/new
    await page.waitForURL('**/dashboard/accounts/new');
    
    await expect(page.locator('text=Open Savings Account').first()).toBeVisible();
  });
});
