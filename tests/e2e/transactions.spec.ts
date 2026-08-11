import { test, expect } from '@playwright/test';

test.describe('Transactions Scenarios', () => {
  test('TS-010: Withdrawal above threshold — signature verification', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-002@sahayog.com'); // Checker
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/approvals');
    // Look for high-value transaction TXN-002
    const txn = page.locator('text=TXN-002');
    if (await txn.isVisible()) {
      await page.click('button:has-text("Verify Signature")');
      // Non-dismissible signature panel appears
      const signaturePanel = page.locator('.signature-panel');
      await expect(signaturePanel).toBeVisible();
      await page.click('button:has-text("Match")');
    }
  });

  test('TS-012: RTGS enforcement above ₹2 lakh', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-001@sahayog.com'); // Maker
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/transactions/new');
    await page.fill('input[name="amount"]', '200001'); // Above 2 Lakh
    
    // Check if error message appears automatically since mode defaults to NEFT
    await expect(page.locator('text=NEFT not available above ₹2,00,000')).toBeVisible();
  });
});
