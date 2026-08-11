import { test, expect } from '@playwright/test';

test.describe('Accounting and RBAC Scenarios', () => {
  test('TS-029: Auditor read-only - write attempt blocked', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-008@sahayog.com'); // Auditor
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');
    // Try to initiate a transaction
    await page.goto('/dashboard/transactions/new');
    await expect(page.locator('text=Access Denied')).toBeVisible();
    await expect(page.locator('text=Read-only access')).toBeVisible();
  });

  test('TS-030: Penal rate cannot be changed (Platform Rules)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-005@sahayog.com'); // Society Admin
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/settings/platform');
    
    // Penal rate field should be read-only
    const penalRateInput = page.locator('input[name="penalRate"]');
    if (await penalRateInput.isVisible()) {
      await expect(penalRateInput).toHaveAttribute('readonly', '');
      
      // Verify tooltip or text
      await expect(page.locator('text=Platform-fixed - RBI Circular RBI/2023-24/53')).toBeVisible();
    }
  });
});
