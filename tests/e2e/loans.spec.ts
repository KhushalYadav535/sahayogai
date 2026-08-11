import { test, expect } from '@playwright/test';

test.describe('Loans Scenarios', () => {
  test('TS-015: KYC pending → loan application blocked', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-003@sahayog.com'); // Loan Officer
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/loans/new');
    // MEM-004 has KYC PENDING
    await page.fill('input[placeholder="Name or Member ID"]', 'MEM-004');
    await page.click('button:has-text("MEM-004")');
    
    // Application blocked
    await expect(page.locator('text=KYC not verified')).toBeVisible();
    await expect(page.locator('button:has-text("Proceed")')).toBeDisabled();
  });

  test('TS-014: AI score above threshold - override path', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-003@sahayog.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/loans/LN-APP-0003');
    // Score is 0.72 which might need override
    const overrideBtn = page.locator('button:has-text("Override AI Decision")');
    if (await overrideBtn.isVisible()) {
      await overrideBtn.click();
      await page.selectOption('select[name="overrideCategory"]', 'GUARANTOR_STRENGTH');
      await page.fill('textarea[name="narrative"]', 'Strong guarantor history');
      await page.click('button:has-text("Proceed with Override")');
      await expect(page.locator('text=Override logged')).toBeVisible();
    }
  });
});
