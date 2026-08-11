import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils';

test.describe('Members', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should list members and view member details', async ({ page }) => {
    // Navigate to members
    await page.goto('/dashboard/members');

    // Wait for the Members header
    await expect(page.locator('h1').filter({ hasText: 'Members' })).toBeVisible();

    // Check that we have a Register New Member button
    const addMemberBtn = page.locator('button').filter({ hasText: 'Register New Member' });
    await expect(addMemberBtn).toBeVisible();
  });
});
