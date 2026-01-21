import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Famille DZ en Or/);

  // Use getByRole to target the heading specifically
  await expect(page.getByRole('heading', { name: 'FAMILLE DZ EN OR' })).toBeVisible();
});
