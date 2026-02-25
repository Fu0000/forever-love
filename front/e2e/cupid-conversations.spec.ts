import { test, expect } from '@playwright/test';

test('cupid chat: save history, open, and start new conversation', async ({
  page,
}) => {
  await page.route('**/api/v1/ai/cupid/advice', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { text: '测试回复：记得先倾听，再表达。' },
        meta: { requestId: 'e2e' },
      }),
    });
  });

  await page.goto('/');
  await page.getByTestId('onboarding-start').click();
  await page.getByTestId('login-name-input').fill(`自动化丘比特${Date.now()}`);
  await page.getByTestId('gender-female').click();
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('create-space')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('create-space').click();
  await expect(page.getByTestId('enter-app')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('enter-app').click();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('nav-chat').click();
  await expect(page.getByTestId('chat-view')).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('cupid-input').fill('你好丘比特');
  await page.getByTestId('cupid-send').click();
  await expect(page.getByText('测试回复：记得先倾听，再表达。')).toBeVisible({
    timeout: 20_000,
  });

  await page.getByTestId('cupid-save').click();
  await expect(page.getByText('已保存')).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('cupid-history').click();
  await expect(page.getByTestId('cupid-history-modal')).toBeVisible();
  await expect(page.getByTestId('cupid-history-item')).toHaveCount(1, {
    timeout: 20_000,
  });

  await page.getByTestId('cupid-history-item').locator('button').first().click();
  await expect(page.getByText('测试回复：记得先倾听，再表达。')).toBeVisible({
    timeout: 20_000,
  });

  await page.getByTestId('cupid-new').click();
  await expect(page.getByText('测试回复：记得先倾听，再表达。')).toHaveCount(0);
});
