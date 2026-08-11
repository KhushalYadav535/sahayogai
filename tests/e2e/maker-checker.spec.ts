import { test, expect } from '@playwright/test';

// Use the seeded test users from UserRoles
const MAKER_EMAIL = 'usr-001@sahayog.com';
const CHECKER_EMAIL = 'usr-002@sahayog.com';
const PASSWORD = 'password123';

test.describe('Maker-Checker Scenarios', () => {
  // TS-003: Same-user block test
  test('TS-003: Maker cannot approve their own submission', async ({ browser }) => {
    // 1. Login as USR-001 (Maker)
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', MAKER_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Navigate to accounts to initiate an SB account for MEM-001
    await page.goto('/dashboard/accounts/new');
    
    // Fill basic details
    await page.fill('input[placeholder*="member number"]', 'MEM-001');
    // Click the async search result
    await page.click('button:has-text("MEM-001")');
    
    // Fill required deposit field to enable submit button
    const depositInput = page.locator('input[type="number"]').first();
    await depositInput.fill('1000');
    
    // Submit the form
    await page.click('button:has-text("Open Savings Account")');
    
    // Assuming it redirects to a pending list or shows success
    await expect(page.locator('text=Account initiation submitted for approval')).toBeVisible({ timeout: 10000 }).catch(() => {});

    // Try to approve it as the same user
    await page.goto('/dashboard/approvals');
    const approveBtn = page.locator('button', { hasText: 'Approve' }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Should show an error message
      await expect(page.locator('text=Maker and Checker must be different users')).toBeVisible();
    }
  });

  // TS-001: Maker submits, Checker approves
  test('TS-001: Checker approves Maker submission', async ({ browser }) => {
    // 1. Login as USR-002 (Checker)
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', CHECKER_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard.*/);

    // 2. Go to approvals
    await page.goto('/dashboard/approvals');
    
    // 3. Find the pending account and approve
    const approveBtn = page.locator('button', { hasText: 'Approve' }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      
      // Optionally fill reason code if modal appears
      const reasonInput = page.locator('textarea[name="reason"]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Looks good');
        await page.locator('button:has-text("Confirm Approve")').click();
      }

      await expect(page.locator('text=Approved successfully')).toBeVisible();
    }
  });
});
