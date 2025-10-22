import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('protected dashboard redirects to login', async ({ page }) => {
    const resp = await page.goto('/dashboard');
    // Middleware should redirect unauthenticated users to /login
    expect(resp?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);
  });
});
