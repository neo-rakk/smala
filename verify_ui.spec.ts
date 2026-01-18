import { test, expect } from '@playwright/test';

test('verify leaderboard and auth', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'home_new.png' });

  // Click on "CONNEXION JOUEUR"
  await page.click('text=CONNEXION JOUEUR');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'auth_modal.png' });

  // Go to leaderboard
  await page.goto('http://localhost:5173/leaderboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'leaderboard.png' });
});
