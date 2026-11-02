const { test, expect } = require('@playwright/test');

test('retrieves existing todos on a fresh device and reconciles remote updates and deletion', async ({ browser, request }) => {
  test.setTimeout(60000);
  const username = 'sync' + Date.now();
  const password = 'disposable-test-password';
  const storage = 'http://localhost:8111';
  const signup = await request.post(storage + '/signup', {
    form: { username, password, email: 'test@example.invalid' },
  });
  expect(signup.ok()).toBeTruthy();

  // Seed data on the provider before this browser has any local cache.
  const auth = await request.post(storage + '/oauth', {
    maxRedirects: 0,
    form: { username, password, client_id: 'http://127.0.0.1:8106', redirect_uri: 'http://127.0.0.1:8106/', response_type: 'token', scope: 'todonna:rw', allow: 'Allow' },
  });
  const token = decodeURIComponent(auth.headers().location.match(/access_token=([^&]+)/)[1]);
  const headers = { Authorization: `Bearer ${token}` };
  const item = { todo_item_id: 'seeded-todo', todo_item_text: 'Todo from another device', todo_item_status: 'todo' };
  const put = value => request.put(storage + '/storage/' + username + '/todonna/' + item.todo_item_id, { headers, data: value });
  expect((await put(item)).ok()).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:8106/');
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByPlaceholder('user@provider.com').fill(username + '@localhost:8111');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByLabel(`Enter the ${username} account's password`).fill(password);
    await page.getByRole('button', { name: 'Allow', exact: true }).click();
    await page.getByRole('link', { name: 'Todo', exact: true }).click();
    const todo = page.locator('#todo-list tr').filter({ hasText: item.todo_item_text });
    await expect(todo).toHaveCount(1);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page.getByText(/^Synced/)).toBeVisible();

    expect((await put({ ...item, todo_item_status: 'done' })).ok()).toBeTruthy();
    await page.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect(page.locator('#done-list tr').filter({ hasText: item.todo_item_text })).toHaveCount(1, { timeout: 20000 });
    await expect(todo).toHaveCount(0);

    expect((await request.delete(storage + '/storage/' + username + '/todonna/' + item.todo_item_id, { headers })).ok()).toBeTruthy();
    await expect(page.getByText(/^Synced/)).toBeVisible();
    await page.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect(page.locator('.item-row').filter({ hasText: item.todo_item_text })).toHaveCount(0, { timeout: 20000 });
  } finally {
    await context.close();
  }
});
