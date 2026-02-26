import { test, expect } from '@playwright/test';

test('cupid chat: save history, open, and start new conversation', async ({
  page,
}) => {
  const token = 'e2e-token';
  const userId = 'usr_e2e_user';
  const clientUserId = `user_${Date.now().toString(36)}e2e`;
  const coupleId = 'cpl_e2e_couple';
  const pairCode = 'A1B2C3';

  type StoredConversation = {
    id: string;
    title: string;
    messages: Array<{ role: 'user' | 'model'; text: string; timestampMs?: number }>;
    createdAt: string;
    updatedAt: string;
  };

  const conversations = new Map<string, StoredConversation>();

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = async <T,>() => {
      const raw = request.postData() ?? '';
      return (raw ? (JSON.parse(raw) as T) : ({} as T));
    };

    const envelope = (data: unknown, meta?: Record<string, unknown>) => ({
      data,
      meta: { requestId: 'e2e', ...(meta ?? {}) },
    });

    // Health
    if (method === 'GET' && path.endsWith('/api/v1/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope({ ok: true })),
      });
      return;
    }

    // Auth
    if (method === 'POST' && path.endsWith('/api/v1/auth/login')) {
      await json<{
        clientUserId: string;
        name?: string;
        avatarUrl?: string;
      }>();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope({
            token,
            user: { id: userId, name: 'E2E', avatarUrl: null },
          }),
        ),
      });
      return;
    }

    if (method === 'GET' && path.endsWith('/api/v1/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope({
            id: userId,
            clientUserId,
            name: 'E2E',
            avatarUrl: null,
          }),
        ),
      });
      return;
    }

    // Pair requests (empty lists)
    if (
      method === 'GET' &&
      path.endsWith('/api/v1/couples/requests/incoming')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([])),
      });
      return;
    }
    if (
      method === 'GET' &&
      path.endsWith('/api/v1/couples/requests/outgoing')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([])),
      });
      return;
    }

    // Couple space (create only for this test)
    if (method === 'POST' && path.endsWith('/api/v1/couples')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope({
            id: coupleId,
            pairCode,
            creatorId: userId,
            partnerId: null,
            anniversaryDate: null,
            intimacyScore: 0,
            users: [{ id: userId, name: 'E2E', avatarUrl: null, clientUserId }],
          }),
        ),
      });
      return;
    }

    // Cupid advice
    if (method === 'POST' && path.endsWith('/api/v1/ai/cupid/advice')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(envelope({ text: '测试回复：记得先倾听，再表达。' })),
      });
      return;
    }

    // Conversations: list
    if (method === 'GET' && path.endsWith('/api/v1/ai/cupid/conversations')) {
      const list = [...conversations.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((c) => ({
          id: c.id,
          title: c.title,
          messageCount: c.messages.length,
          lastMessageAt:
            c.messages.length > 0
              ? new Date(
                  c.messages[c.messages.length - 1].timestampMs ?? Date.now(),
                ).toISOString()
              : null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(list, { nextCursor: null })),
      });
      return;
    }

    // Conversations: create
    if (method === 'POST' && path.endsWith('/api/v1/ai/cupid/conversations')) {
      const body = await json<{
        title?: string;
        messages: Array<{ role: 'user' | 'model'; text: string; timestampMs?: number }>;
      }>();

      const now = new Date().toISOString();
      const id = `cvc_${Date.now().toString(36)}`;
      const stored: StoredConversation = {
        id,
        title: body.title ?? `丘比特对话 ${now.slice(0, 16)}`,
        messages: body.messages,
        createdAt: now,
        updatedAt: now,
      };
      conversations.set(id, stored);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: { Location: `/api/v1/ai/cupid/conversations/${id}` },
        body: JSON.stringify(
          envelope({
            id,
            title: stored.title,
            messageCount: stored.messages.length,
            lastMessageAt:
              stored.messages.length > 0
                ? new Date(
                    stored.messages[stored.messages.length - 1].timestampMs ??
                      Date.now(),
                  ).toISOString()
                : null,
            createdAt: stored.createdAt,
            updatedAt: stored.updatedAt,
          }),
        ),
      });
      return;
    }

    // Conversations: detail / update / delete
    const matchDetail = path.match(/\/api\/v1\/ai\/cupid\/conversations\/([^/]+)$/);
    if (matchDetail) {
      const id = matchDetail[1];
      const existing = conversations.get(id);
      if (!existing) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'CONVERSATION_NOT_FOUND', message: 'Not found', details: {} },
            meta: { requestId: 'e2e' },
          }),
        });
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope({
              id: existing.id,
              title: existing.title,
              messages: existing.messages.map((m) => ({
                role: m.role,
                text: m.text,
                timestampMs: m.timestampMs ?? null,
              })),
            }),
          ),
        });
        return;
      }

      if (method === 'PATCH') {
        const body = await json<{
          title?: string;
          messages?: Array<{ role: 'user' | 'model'; text: string; timestampMs?: number }>;
        }>();
        if (body.title) existing.title = body.title;
        if (body.messages) existing.messages = body.messages;
        existing.updatedAt = new Date().toISOString();
        conversations.set(id, existing);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope({
              id: existing.id,
              title: existing.title,
              messageCount: existing.messages.length,
              lastMessageAt:
                existing.messages.length > 0
                  ? new Date(
                      existing.messages[existing.messages.length - 1].timestampMs ??
                        Date.now(),
                    ).toISOString()
                  : null,
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
            }),
          ),
        });
        return;
      }

      if (method === 'DELETE') {
        conversations.delete(id);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    // Default: block unexpected API calls to keep the test deterministic.
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'E2E_UNMOCKED_ENDPOINT',
          message: `Unmocked endpoint: ${method} ${path}`,
          details: {},
        },
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
