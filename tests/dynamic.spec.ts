import { test, expect } from '@playwright/test';

test('Частина 1 — динамічне завантаження без фіксованих пауз', async ({ page }) => {
  await page.goto('/dynamic_loading/2');
  await page.getByRole('button', { name: 'Start' }).click();
  const finish = page.locator('#finish');
  await expect(finish).toBeVisible({ timeout: 15_000 });
  await expect(finish).toHaveText('Hello World!');
  await expect(page.locator('#loading')).toBeHidden();
});
