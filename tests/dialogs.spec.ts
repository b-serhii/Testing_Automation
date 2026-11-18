import { test, expect } from '@playwright/test';

test.describe('Частина 1 — JavaScript-діалоги', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/javascript_alerts');
  });

  test('JS Alert: перевірити текст та підтвердити', async ({ page }) => {
    // Підписка на подію ОБОВ’ЯЗКОВО перед click().
    const dialogPromise = page.waitForEvent('dialog');
    const clickPromise = page.getByRole('button', { name: 'Click for JS Alert' }).click();
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe('alert');
    expect(dialog.message()).toBe('I am a JS Alert');
    await dialog.accept();
    await clickPromise;
    await expect(page.locator('#result')).toHaveText('You successfully clicked an alert');
  });

  test('JS Confirm: скасування підтвердження', async ({ page }) => {
    const dialogPromise = page.waitForEvent('dialog');
    const clickPromise = page.getByRole('button', { name: 'Click for JS Confirm' }).click();
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe('confirm');
    await dialog.dismiss();
    await clickPromise;
    await expect(page.locator('#result')).toHaveText('You clicked: Cancel');
  });

  test('JS Prompt: передача тексту через accept()', async ({ page }) => {
    const dialogPromise = page.waitForEvent('dialog');
    const clickPromise = page.getByRole('button', { name: 'Click for JS Prompt' }).click();
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe('prompt');
    await dialog.accept('Тестове значення');
    await clickPromise;
    await expect(page.locator('#result')).toHaveText('You entered: Тестове значення');
  });
});
