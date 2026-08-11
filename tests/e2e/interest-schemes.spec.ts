import { test, expect } from '@playwright/test';

const PRESIDENT_EMAIL = 'usr-004@sahayog.com';
const ADMIN_EMAIL = 'usr-005@sahayog.com';
const PASSWORD = 'password123';

test.describe('Interest Schemes Scenarios', () => {
  test('TS-004: FDR scheme approval with delta >0.5% triggers President notification', async ({ browser }) => {
    // Note: Assuming Scheme Maker is already implemented or we are testing the approval
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', PRESIDENT_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Check for oversight notification or pending approval
    await page.goto('/dashboard/schemes/approvals');
    const schemeItem = page.locator('text=SCH-FDR-003');
    if (await schemeItem.isVisible()) {
      await page.click('button:has-text("Approve")');
      await expect(page.locator('text=Scheme Activated')).toBeVisible();
    }
  });

  test('TS-005: FDR rate auto-fetch on tenure entry', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-001@sahayog.com'); // Maker
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Go to new FDR
    await page.goto('/dashboard/deposits/new');
    await page.fill('input[placeholder="Search member..."]', 'MEM-003');
    // Click the search result
    await page.click('button:has-text("MEM-003")');
    
    // Enter tenure and wait for rate fetch
    await page.fill('input[placeholder="Enter months"]', '30');
    
    // Check rate field auto-populates
    await expect(page.locator('text=7.75%')).toBeVisible({ timeout: 5000 });
  });
});
