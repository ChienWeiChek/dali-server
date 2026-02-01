import { test, expect } from '@playwright/test';

test('login and view dashboard', async ({ page }) => {
  await page.goto('http://localhost');
  
  // Login
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  // Verify dashboard
  await expect(page.locator('h1')).toHaveText('System Overview');
  await expect(page.locator('text=Active Devices')).toBeVisible();

  // Navigate to devices
  await page.goto('http://localhost/devices');
  await expect(page.locator('h1')).toHaveText('Device Explorer');
});
