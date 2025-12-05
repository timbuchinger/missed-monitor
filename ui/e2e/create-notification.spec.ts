import { test, expect } from '@playwright/test';

const GROUP = { id: 'group-1', name: 'Operations', userId: 'test-user' };

test('User can create a notification and assign it to a group', async ({ page }) => {
  const notifications: any[] = [];

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
        body: JSON.stringify([]),
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
        body: JSON.stringify(notifications),
      });
    }

    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      const created = {
        id: body.id ?? `notif-${Date.now()}`,
        name: body.name,
        userId: body.userId,
        groupIds: body.groupIds ?? [],
        type: body.type ?? 'logger',
        config: body.config ?? { content: '' },
      };
      notifications.push(created);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    }

    return route.continue();
  });

  await page.goto('/');

  // Open notification modal
  await page.locator('[data-test="add-notification"]').click();
  const modal = page.locator('[data-test="notification-modal"]');
  await expect(modal).toBeVisible();

  // Fill form
  await modal.getByPlaceholder('PagerDuty').fill('PagerDuty Channel');

  // Check the group checkbox
  const checkbox = modal.locator('input[type="checkbox"][value="group-1"]');
  await checkbox.check();

  // Submit
  await modal.getByRole('button', { name: /Create Notification/i }).click();

  // Expect notification row
  const row = page.locator('[data-test="notification-row"]').filter({ hasText: 'PagerDuty Channel' });
  await expect(row).toHaveCount(1);
  // And it should show the group name as badge
  await expect(row.locator(`text=${GROUP.name}`)).toBeVisible();
});
