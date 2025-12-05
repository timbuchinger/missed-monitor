import { test, expect } from '@playwright/test';

const GROUP = { id: 'group-1', name: 'Operations', userId: 'test-user' };

test('User can create a monitor', async ({ page }) => {
  const monitors: any[] = [];

  await page.route('**/groups', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([GROUP]),
      });
    }
    return route.continue();
  });

  await page.route('**/monitors', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(monitors),
      });
    }

    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      const created = {
        uuid: body.uuid ?? `uuid-${Date.now()}`,
        name: body.name,
        userId: body.userId,
        groupId: body.groupId,
        enabled: body.enabled ?? true,
        intervalSeconds: body.intervalSeconds ?? 60,
        alarmState: body.alarmState ?? false,
        lastHeartbeat: null,
      };
      monitors.push(created);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    }

    return route.continue();
  });

  await page.route('**/notifications', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  // Go to the app
  await page.goto('/');

  // Open create monitor modal
  await page.locator('[data-test="add-monitor"]').click();

  const modal = page.locator('[data-test="monitor-modal"]');
  await expect(modal).toBeVisible();

  // Fill form
  await modal.getByLabel('Name').fill('My Test Monitor');
  await modal.locator('select').selectOption(GROUP.id);
  await modal.locator('input[type="number"]').fill('30');

  // Submit
  await modal.getByRole('button', { name: /Create Monitor/i }).click();

  // After submit, monitor should appear in the monitors table
  const row = page.locator('[data-test="monitor-row"]').filter({ hasText: 'My Test Monitor' });
  await expect(row).toHaveCount(1);
});
