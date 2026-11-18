import { test, expect } from '@playwright/test';

test.describe('Частина 1 — вкладки та фрейми', () => {
  test('нова вкладка не замінює вихідну', async ({ page, context }) => {
    await page.goto('/windows');
    const nextPagePromise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'Click Here' }).click();
    const newPage = await nextPagePromise;
    try {
      await expect(newPage.getByRole('heading', { name: 'New Window' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Opening a new window' })).toBeVisible();
    } finally {
      await newPage.close();
    }
  });

  test('введення тексту в редактор TinyMCE у iframe', async ({ page }) => {
    await page.goto('/iframe');
    const editor = page.frameLocator('#mce_0_ifr').locator('#tinymce');
    await expect(editor).toBeVisible();
    // .fill() підтримує contenteditable і не залежить від Control/Command на Mac.
    await editor.fill('Текст, уведений автотестом');
    await expect(editor).toContainText('Текст, уведений автотестом');
  });
});
