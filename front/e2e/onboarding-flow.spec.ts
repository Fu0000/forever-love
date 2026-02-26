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
  await page.getByTestId('gender-female').click();

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
  const noteCountBefore = await page.getByTestId('note-item').count();
  await page.getByTestId('note-create-toggle').click();
  await page.getByTestId('note-content-input').fill(noteText);
  const notePolishResponsePromise = page.waitForResponse((res) =>
    res.url().includes('/ai/polish'),
  );
  await page.getByTestId('note-polish').click();
  const notePolishResponse = await notePolishResponsePromise;
  console.log(
    `[note:polish] ${notePolishResponse.status()} ${notePolishResponse.url()}`,
  );
  await page.getByTestId('note-submit').click();

  await expect(page.getByTestId('note-item')).toHaveCount(noteCountBefore + 1, {
    timeout: 20_000,
  });
  const createdNoteItem = page.getByTestId('note-item').nth(noteCountBefore);
  await expect(createdNoteItem).toBeVisible({ timeout: 20_000 });

  // Edit created note (author only)
  await createdNoteItem.hover();
  await createdNoteItem.getByTestId('note-edit').click({ force: true });
  await page.getByTestId('note-content-input').fill(`已编辑日记${Date.now()}`);
  await page.getByTestId('note-submit').click();
  await expect(createdNoteItem).toContainText('已编辑日记', { timeout: 20_000 });

  // Delete created note
  await createdNoteItem.hover();
  await createdNoteItem.getByTestId('note-delete').click({ force: true });
  await expect(page.getByTestId('note-item')).toHaveCount(noteCountBefore);

  // Quests flow
  const questTitle = `自动化任务${Date.now()}`;
  await page.getByTestId('nav-quests').click();
  await expect(page.getByTestId('quests-view')).toBeVisible();
  const questCountBefore = await page.getByTestId('quest-item').count();
  await page.getByTestId('quest-create-toggle').click();
  await expect(page.getByTestId('quest-form')).toBeVisible();
  await page.getByTestId('quest-title-input').fill(questTitle);
  await page.getByTestId('quest-desc-input').fill('自动化任务描述');
  await page.getByTestId('quest-points-input').fill('15');
  await page.getByTestId('quest-type-select').selectOption('words');
  const questPolishResponsePromise = page.waitForResponse((res) =>
    res.url().includes('/ai/polish'),
  );
  await page.getByTestId('quest-polish').click();
  const questPolishResponse = await questPolishResponsePromise;
  console.log(
    `[quest:polish] ${questPolishResponse.status()} ${questPolishResponse.url()}`,
  );
  await page.getByTestId('quest-submit').click();

  await expect(page.getByTestId('quest-item')).toHaveCount(questCountBefore + 1, {
    timeout: 20_000,
  });
  const createdQuestItem = page.getByTestId('quest-item').nth(questCountBefore);
  await expect(createdQuestItem).toBeVisible({ timeout: 20_000 });

  // Edit quest
  await createdQuestItem.click();
  await page.getByText('编辑').click();
  await expect(page.getByTestId('quest-form')).toBeVisible();
  const editedQuestTitle = `已编辑任务${Date.now()}`;
  await page.getByTestId('quest-title-input').fill(editedQuestTitle);
  await page.getByTestId('quest-submit').click();
  await expect(
    page.locator('[data-testid="quest-item"]', { hasText: editedQuestTitle }),
  ).toBeVisible({ timeout: 20_000 });

  const editedQuestItem = page.locator('[data-testid="quest-item"]', {
    hasText: editedQuestTitle,
  });
  await editedQuestItem.getByTestId('quest-complete').click();
  await expect(editedQuestItem.getByTestId('quest-complete')).toBeDisabled({
    timeout: 20_000,
  });
  await editedQuestItem.click();
  await page.getByTestId('quest-delete').click();
  await expect(page.getByTestId('quest-item')).toHaveCount(questCountBefore);

  // Moments flow
  const momentTitle = `自动化瞬间${Date.now()}`;
  await page.getByTestId('nav-moments').click();
  await expect(page.getByTestId('moments-view')).toBeVisible();
  const momentCountBefore = await page.getByTestId('moment-item').count();
  await page.getByTestId('moment-create-toggle').click();
  await page.getByTestId('moment-title-input').fill(momentTitle);
  await page.getByTestId('moment-desc-input').fill('自动化瞬间描述');
  await page.getByTestId('moment-tags-input').fill('旅行 测试');
  const momentPolishResponsePromise = page.waitForResponse((res) =>
    res.url().includes('/ai/polish'),
  );
  await page.getByTestId('moment-polish').click();
  const momentPolishResponse = await momentPolishResponsePromise;
  console.log(
    `[moment:polish] ${momentPolishResponse.status()} ${momentPolishResponse.url()}`,
  );
  await page.getByTestId('moment-submit').click();

  await expect(page.getByTestId('moment-item')).toHaveCount(momentCountBefore + 1, {
    timeout: 20_000,
  });
  const createdMomentItem = page.getByTestId('moment-item').nth(momentCountBefore);
  await expect(createdMomentItem).toBeVisible({ timeout: 20_000 });

  await createdMomentItem.click();

  // Edit moment
  await page.getByTestId('moment-edit-open').click();
  const editPolishResponsePromise = page.waitForResponse((res) =>
    res.url().includes('/ai/polish'),
  );
  await page.getByTestId('moment-edit-title-input').fill(`已编辑瞬间${Date.now()}`);
  await page.getByTestId('moment-edit-desc-input').fill('已编辑瞬间描述');
  await page.getByTestId('moment-edit-tags-input').fill('旅行 编辑');
  await page.getByTestId('moment-edit-polish').click();
  const editPolishResponse = await editPolishResponsePromise;
  console.log(
    `[moment:edit-polish] ${editPolishResponse.status()} ${editPolishResponse.url()}`,
  );
  // Refill after polish to keep assertion stable
  const editedMomentTitle = `已编辑瞬间${Date.now()}`;
  await page.getByTestId('moment-edit-title-input').fill(editedMomentTitle);
  await page.getByTestId('moment-edit-desc-input').fill('已编辑瞬间描述');
  await page.getByTestId('moment-edit-submit').click();
  await expect(
    page.locator('h2', { hasText: editedMomentTitle }),
  ).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('moment-delete').dispatchEvent('click');
  await expect(page.getByTestId('moment-item')).toHaveCount(momentCountBefore);
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
  await page.getByTestId('gender-female').click();
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

test('reload recovers couple via /users/me', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('onboarding-start').click();
  await page.getByTestId('login-name-input').fill(`自动化恢复${Date.now()}`);
  await page.getByTestId('gender-female').click();
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('create-space').click();
  await expect(page.getByTestId('enter-app')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('enter-app').click();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await page.evaluate(() => {
    localStorage.removeItem('lovesync_couple_id');
  });

  await page.reload();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });
});

test('pair request flow: request + accept', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  await pageA.goto('/');
  await pageA.getByTestId('onboarding-start').click();
  await pageA.getByTestId('login-name-input').fill(`自动化A${Date.now()}`);
  await pageA.getByTestId('gender-female').click();
  await pageA.getByTestId('login-submit').click();
  await expect(pageA.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });

  const clientIdA = await pageA.evaluate(() =>
    localStorage.getItem('lovesync_client_user_id'),
  );
  expect(clientIdA).toBeTruthy();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  await pageB.goto('/');
  await pageB.getByTestId('onboarding-start').click();
  await pageB.getByTestId('login-name-input').fill(`自动化B${Date.now()}`);
  await pageB.getByTestId('gender-female').click();
  await pageB.getByTestId('login-submit').click();
  await expect(pageB.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });

  await pageB.getByTestId('pair-request-target-input').fill(clientIdA!);
  await pageB.getByTestId('pair-request-send').click();
  await expect(pageB.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await pageA.getByTestId('pair-requests-refresh').click();
  await expect(pageA.getByTestId('incoming-request-item')).toBeVisible({
    timeout: 20_000,
  });
  await pageA.getByTestId('incoming-request-accept').click();
  await expect(pageA.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await pageB.reload();
  await expect(pageB.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await expect(pageA.getByTestId('onboarding')).toHaveCount(0);
  await expect(pageB.getByTestId('onboarding')).toHaveCount(0);
  await expect(pageA.getByTestId('dashboard-pair-request-card')).toHaveCount(0);
  await expect(pageB.getByTestId('dashboard-pair-request-card')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});

test('pair code flow: create + join', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  const userAName = `自动化码A${Date.now()}`;

  await pageA.goto('/');
  await pageA.getByTestId('onboarding-start').click();
  await pageA.getByTestId('login-name-input').fill(userAName);
  await pageA.getByTestId('gender-female').click();
  await pageA.getByTestId('login-submit').click();
  await expect(pageA.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });
  await pageA.getByTestId('create-space').click();

  const pairCode = (await pageA.getByTestId('generated-pair-code').textContent())?.trim();
  expect(pairCode).toBeTruthy();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  await pageB.goto('/');
  await pageB.getByTestId('onboarding-start').click();
  await pageB.getByTestId('login-name-input').fill(`自动化码B${Date.now()}`);
  await pageB.getByTestId('gender-female').click();
  await pageB.getByTestId('login-submit').click();
  await expect(pageB.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });

  await pageB.getByTestId('join-code-input').fill(pairCode!);
  await pageB.getByTestId('join-space').click();

  await expect(pageB.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });
  await expect(pageB.getByText(userAName)).toBeVisible({ timeout: 20_000 });

  await contextA.close();
  await contextB.close();
});
