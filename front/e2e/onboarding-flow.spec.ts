import { test, expect } from '@playwright/test';

test('onboarding flow: login, notes, quests, moments', async ({ page }) => {
  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    console.log(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  await page.goto('/');

  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByTestId('onboarding-start').click();

  await page.getByTestId('login-name-input').fill(`自动化${Date.now()}`);

  const loginResponsePromise = page.waitForResponse((res) =>
    res.url().includes('/auth/login'),
  );
  await page.getByTestId('login-submit').click();
  const loginResponse = await loginResponsePromise;
  console.log(`[login] ${loginResponse.status()} ${loginResponse.url()}`);
  try {
    console.log(`[login] ${await loginResponse.text()}`);
  } catch (err) {
    console.log(`[login] failed to read body: ${String(err)}`);
  }

  await expect(page.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('create-space').click();

  await expect(page.getByTestId('enter-app')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('enter-app').click();

  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  // Notes flow
  const noteText = `自动化日记${Date.now()}`;
  await page.getByTestId('nav-notes').click();
  await expect(page.getByTestId('notes-view')).toBeVisible();
  await page.getByTestId('note-create-toggle').click();
  await page.getByTestId('note-content-input').fill(noteText);
  await page.getByTestId('note-submit').click();

  const noteItem = page.locator('[data-testid="note-item"]', { hasText: noteText });
  await expect(noteItem).toBeVisible({ timeout: 20_000 });
  await noteItem.hover();
  await noteItem.getByTestId('note-delete').click({ force: true });
  await expect(noteItem).toHaveCount(0);

  // Quests flow
  const questTitle = `自动化任务${Date.now()}`;
  await page.getByTestId('nav-quests').click();
  await expect(page.getByTestId('quests-view')).toBeVisible();
  await page.getByTestId('quest-create-toggle').click();
  await expect(page.getByTestId('quest-form')).toBeVisible();
  await page.getByTestId('quest-title-input').fill(questTitle);
  await page.getByTestId('quest-desc-input').fill('自动化任务描述');
  await page.getByTestId('quest-points-input').fill('15');
  await page.getByTestId('quest-type-select').selectOption('words');
  await page.getByTestId('quest-submit').click();

  const questItem = page.locator('[data-testid="quest-item"]', { hasText: questTitle });
  await expect(questItem).toBeVisible({ timeout: 20_000 });
  await questItem.getByTestId('quest-complete').click();
  await expect(questItem.getByTestId('quest-complete')).toBeDisabled({ timeout: 20_000 });
  await questItem.click();
  await page.getByTestId('quest-delete').click();
  await expect(questItem).toHaveCount(0);

  // Moments flow
  const momentTitle = `自动化瞬间${Date.now()}`;
  await page.getByTestId('nav-moments').click();
  await expect(page.getByTestId('moments-view')).toBeVisible();
  await page.getByTestId('moment-create-toggle').click();
  await page.getByTestId('moment-title-input').fill(momentTitle);
  await page.getByTestId('moment-desc-input').fill('自动化瞬间描述');
  await page.getByTestId('moment-tags-input').fill('旅行 测试');
  await page.getByTestId('moment-submit').click();

  const momentItem = page.locator('[data-testid="moment-item"]', { hasText: momentTitle });
  await expect(momentItem).toBeVisible({ timeout: 20_000 });
  await momentItem.click();
  await page.getByTestId('moment-delete').dispatchEvent('click');
  await expect(momentItem).toHaveCount(0);
});

test('logged-in users skip onboarding unless token invalid', async ({ page }) => {
  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    console.log(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  await page.goto('/');

  await page.getByTestId('onboarding-start').click();
  await page.getByTestId('login-name-input').fill(`自动化持久${Date.now()}`);
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('create-space').click();
  await expect(page.getByTestId('enter-app')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('enter-app').click();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(page.getByTestId('onboarding')).toHaveCount(0);
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await page.evaluate(() => {
    localStorage.setItem('lovesync_auth_token', 'invalid-token');
  });
  await page.reload();
  await expect(page.getByTestId('onboarding')).toBeVisible({ timeout: 20_000 });
});
