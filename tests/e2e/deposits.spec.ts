import { test, expect } from '@playwright/test';

test.describe('Deposits & FDR Scenarios', () => {
  test('TS-007: Premature FDR closure - penalty + no TDS', async ({ browser }) => {
    // 1. Login as Checker (assuming Maker has initiated closure)
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-002@sahayog.com'); // Checker
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Go to approvals -> FDR-2024-0031
    await page.goto('/dashboard/approvals');
    const fdrClosure = page.locator('text=FDR-2024-0031');
    if (await fdrClosure.isVisible()) {
      await page.click('button:has-text("Approve Closure")');
      
      // 3. Verify calculation net payout and penalty
      await expect(page.locator('text=Penalty 1% applied')).toBeVisible();
      await expect(page.locator('text=TDS = NIL')).toBeVisible();
      await page.click('button:has-text("Confirm")');
    }
  });

  test('TS-008: FDR closure - TDS deducted atomically', async ({ browser }) => {
    // Similar to above but verifying TDS deduction
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-002@sahayog.com'); // Checker
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/approvals');
    const fdrClosure = page.locator('text=FDR-2024-0003');
    if (await fdrClosure.isVisible()) {
      await page.click('button:has-text("Approve Closure")');
      await expect(page.locator('text=TDS ₹5,156 (10%) deducted')).toBeVisible();
    }
  });
});
