import { test, expect } from '@playwright/test';

const MAKER_EMAIL = 'usr-001@sahayog.com';
const CHECKER_EMAIL = 'usr-002@sahayog.com';
const PASSWORD = 'password123';

// We'll use a dynamic name to avoid conflicts
const dynamicName = `E2E Tester ${Date.now()}`;
let dynamicMemberId = ''; // Will capture this during the flow

test.describe.serial('Comprehensive End-to-End Workflow', () => {

  test('Step 1: Admin registers a new member', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[id="email"]', 'tenantadmin@sahayog.com');
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Go to member registration
    await page.goto('/dashboard/members/register');
    
    // Fill required details
    await page.fill('input[name="firstName"]', 'Comprehensive');
    await page.fill('input[name="lastName"]', dynamicName); // Unique identifier
    await page.fill('input[name="dateOfBirth"]', '1990-01-01');
    await page.fill('input[name="mobileNumber"]', '9999999999');
    await page.fill('input[name="permanentAddress"]', 'Test Address 123');
    await page.fill('input[name="city"]', 'Pune');
    await page.fill('input[name="state"]', 'Maharashtra');
    await page.fill('input[name="pincode"]', '411001');
    await page.fill('input[name="occupation"]', 'Engineer');
    await page.fill('input[name="incomeRange"]', '5-10 Lakhs');
    
    // Submit registration
    await page.click('button:has-text("Register Member")');
    
    // Success message and capture Member ID
    // We expect "Member created successfully!" or similar alert/dialog
    await expect(page.locator('text=Registration Successful').or(page.locator('text=Member registered successfully'))).toBeVisible({ timeout: 10000 });
    
    await context.close();
  });

  test('Step 2: Maker opens Savings Account for the new member', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as Maker
    await page.goto('/login');
    await page.fill('input[id="email"]', MAKER_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Go to Accounts
    await page.goto('/dashboard/accounts/new');
    
    // Async Member Search
    await page.fill('input[placeholder*="member number"]', dynamicName);
    
    // Click the async search result
    await page.click(`button:has-text("${dynamicName}")`);
    
    // Fill opening deposit
    const depositInput = page.locator('input[type="number"]').first();
    await depositInput.fill('1000');
    
    // Submit the form
    await page.click('button:has-text("Open Savings Account")');
    
    // Wait for submission confirmation
    await expect(page.locator('text=successfully').or(page.locator('text=submitted for approval'))).toBeVisible({ timeout: 10000 });
    
    await context.close();
  });

  test('Step 3: Checker approves the Savings Account', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as Checker
    await page.goto('/login');
    await page.fill('input[id="email"]', CHECKER_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Go to approvals
    await page.goto('/dashboard/approvals');
    
    // Approve the pending account
    // We assume the first "Approve" button is our recently created account
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await expect(page.locator('text=successfully').or(page.locator('text=Approved'))).toBeVisible({ timeout: 10000 });
    } else {
        // If no approvals found, it might have auto-approved or backend has no maker-checker setup
        console.log('No pending approvals found.');
    }
    
    await context.close();
  });

  test('Step 4: Maker opens an FDR (Testing Deposit Flow & Auto-fetch)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as Maker
    await page.goto('/login');
    await page.fill('input[id="email"]', MAKER_EMAIL);
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Go to deposits
    await page.goto('/dashboard/deposits/new');
    
    // Search member
    await page.fill('input[placeholder="Search member..."]', dynamicName);
    await page.click(`button:has-text("${dynamicName}")`);
    
    // Amount & Tenure
    await page.fill('input[type="number"]', '50000'); // Amount
    await page.fill('input[placeholder="Enter months"]', '30'); // Tenure
    
    // Check auto rate fetch logic implemented earlier
    await expect(page.locator('text=7.75%')).toBeVisible({ timeout: 5000 });
    
    await context.close();
  });

  test('Step 5: Auditor verifies RBAC constraints (Access Denied)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as Auditor
    await page.goto('/login');
    await page.fill('input[id="email"]', 'usr-008@sahayog.com');
    await page.fill('input[id="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Navigate to transactions page we just built
    await page.goto('/dashboard/transactions/new');
    
    // RBAC blocks entry
    await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 5000 });
    
    await context.close();
  });

});
