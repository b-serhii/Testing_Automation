import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const filesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'files');

test.describe('Частина 1 — файлові операції', () => {
  test('завантаження текстового файлу на сервер', async ({ page }) => {
    await page.goto('/upload');
    const filePath = path.join(filesDir, 'upload-sample.txt');
    await page.locator('#file-upload').setInputFiles(filePath);
    await page.locator('#file-submit').click();
    await expect(page.locator('#uploaded-files')).toHaveText('upload-sample.txt');
  });

  test('скачування і збереження непорожнього файлу', async ({ page }) => {
    await page.goto('/download');
    const links = page.getByRole('link');
    await expect(links.first()).toBeVisible();

    // Подію очікуємо до натискання, НЕ ставимо await перед подією.
    const downloadPromise = page.waitForEvent('download');
    await links.first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    const target = path.join(test.info().outputDir, download.suggestedFilename());
    await download.saveAs(target);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.statSync(target).size).toBeGreaterThan(0);
  });
});
