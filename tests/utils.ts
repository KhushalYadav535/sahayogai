import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[id="email"]', 'tenantadmin@sahayog.com');
  await page.fill('input[id="password"]', 'password123');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // The app redirects to /dashboard
  // We'll just wait until we are no longer on the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}
