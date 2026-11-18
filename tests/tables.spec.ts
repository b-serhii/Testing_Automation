import { test, expect } from '@playwright/test';

test.describe('Частина 1 — таблиці', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tables');
    await expect(page.locator('#table1 tbody tr')).toHaveCount(4);
  });

  test('першу таблицю заповнено чотирма рядками', async ({ page }) => {
    await expect(page.locator('#table1 tbody tr')).toHaveCount(4);
  });

  test('пошук рядка Conway за вмістом', async ({ page }) => {
    const row = page.locator('#table1 tbody tr').filter({ hasText: 'Conway' });
    await expect(row).toHaveCount(1);
    await expect(row.locator('td').nth(2)).toHaveText('tconway@earthlink.net');
    await expect(row.locator('td').nth(3)).toHaveText('$50.00');
  });

  test('сортування прізвищ за зростанням', async ({ page }) => {
    await page.locator('#table1 thead th').first().click();
    // Перед allTextContents() уже є очікувальна перевірка числа рядків.
    const names = await page.locator('#table1 tbody tr td:first-child').allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  test('сума значень Due дорівнює 203 доларам', async ({ page }) => {
    const due = await page.locator('#table1 tbody tr td:nth-child(4)').allTextContents();
    const sum = due.map((amount) => Number(amount.replace('$', '')))
      .reduce((acc, amount) => acc + amount, 0);
    expect(sum).toBeCloseTo(203.0, 2);
  });
});
