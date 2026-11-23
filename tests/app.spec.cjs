const { test, expect } = require('@playwright/test');

test('adds, persists, completes, and restores a todo', async ({ page }) => {
  await page.goto('./');
  await page.getByPlaceholder('New item').fill('Ponder Source test');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByPlaceholder('New item')).toHaveValue('');
  await page.reload();
  const row = page.locator('#todo-list tr').filter({ hasText: 'Ponder Source test' });
  await expect(row).toBeVisible();
  await row.getByTitle('Change todo item state').click();
  await page.locator('#week-tab').click();
  const done = page.locator('#done-list tr').filter({ hasText: 'Ponder Source test' });
  await expect(done).toBeVisible();
  await done.getByTitle('Remove done item').click();
  await expect(done).toHaveCount(0);
  await page.locator('.undo-delete .undo').click();
  await expect(done).toBeVisible();
});

test('install button explains manual installation when no prompt is available', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.locator('a#settings').click();
  await page.locator('#install-button').click();
  await expect(page.locator('#update-messages')).toContainText('browser menu');
  expect(errors).toEqual([]);
});
