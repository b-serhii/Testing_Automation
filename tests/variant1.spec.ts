import { test, expect } from '@playwright/test';

// Варіант 1: додати 5 елементів, видалити 2, перевірити кількість після КОЖНОЇ дії.
// Стійкі семантичні локатори кнопок; індекси застосовуються тільки для
// свідомого вибору першої/останньої однакової кнопки «Delete».

test.describe('Частина 2 — варіант 1: додавання й видалення елементів', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add_remove_elements/');
    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  });

  test('п’ять додавань і два видалення перших елементів', async ({ page }) => {
    const add = page.getByRole('button', { name: 'Add Element' });
    const remove = page.getByRole('button', { name: 'Delete' });

    for (let count = 1; count <= 5; count++) {
      await add.click();
      await expect(remove).toHaveCount(count);
    }
    await remove.first().click();
    await expect(remove).toHaveCount(4);
    await remove.first().click();
    await expect(remove).toHaveCount(3);
  });

  test('повторний незалежний сценарій: видалення останнього й першого', async ({ page }) => {
    const add = page.getByRole('button', { name: 'Add Element' });
    const remove = page.getByRole('button', { name: 'Delete' });

    for (let count = 1; count <= 5; count++) {
      await add.click();
      await expect(remove).toHaveCount(count);
    }
    await remove.last().click();
    await expect(remove).toHaveCount(4);
    await remove.first().click();
    await expect(remove).toHaveCount(3);
  });
});
