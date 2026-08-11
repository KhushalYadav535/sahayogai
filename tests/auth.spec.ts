import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with correct credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify the page has loaded by checking for the login button
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Fill in the login form
    await page.fill('input[id="email"]', 'tenantadmin@sahayog.com');
    await page.fill('input[id="password"]', 'password123');

    // Submit the form using the submit button (it has type="submit")
    // Note: The form has a button that says 'Sign in'
    await page.click('button[type="submit"]');

    // We should be redirected to the dashboard
    await page.waitForURL('**/dashboard*');
    
    // Check that we are indeed on the dashboard
    await expect(page.locator('text=Total Members').first()).toBeVisible();

    // The sidebar should exist and have a link to members
    const membersLink = page.locator('nav').locator('a[href="/dashboard/members"]').first();
    await expect(membersLink).toBeVisible();
    
    // The sidebar should have a link to accounts
    const accountsLink = page.locator('nav').locator('a[href="/dashboard/accounts"]').first();
    await expect(accountsLink).toBeVisible();
  });

  test('should show error with incorrect credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="email"]', 'admin@sahayog.com');
    await page.fill('input[id="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show a toast notification for "Login Failed"
    await expect(page.locator('text=Login Failed').first()).toBeVisible();
    
    // URL should still be /login
    expect(page.url()).toContain('/login');
  });
});
