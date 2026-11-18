import { test, expect } from '@playwright/test';

test.describe('Частина 1 — елементи форм', () => {
  test('вибір Option 2 у випадному списку', async ({ page }) => {
    await page.goto('/dropdown');
    const dropdown = page.locator('#dropdown');
    await dropdown.selectOption('2');
    await expect(dropdown).toHaveValue('2');
    await expect(dropdown.locator('option:checked')).toHaveText('Option 2');
  });

  test('check() і uncheck() встановлюють потрібні стани', async ({ page }) => {
    await page.goto('/checkboxes');
    // На стенді два однакові безіменні checkbox, тому індекс описує перший/другий.
    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).uncheck();
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).not.toBeChecked();
  });

  test('повзунок збільшується трьома натисканнями ArrowRight', async ({ page }) => {
    await page.goto('/horizontal_slider');
    const slider = page.getByRole('slider');
    await expect(slider).toHaveValue('0');
    // focus() не змінює значення на відміну від click() по випадковій позиції.
    await slider.focus();
    for (let i = 0; i < 3; i++) {
      await slider.press('ArrowRight');
    }
    await expect(slider).toHaveValue('1.5');
    await expect(page.locator('#range')).toHaveText('1.5');
  });
});
