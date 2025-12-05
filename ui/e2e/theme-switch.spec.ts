import { expect, test } from '@playwright/test';

const GROUP = { id: 'group-1', name: 'Ops', userId: 'user-1' };

test('switching themes updates the colors', async ({ page }) => {
  await page.route('**/groups', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([GROUP]),
      });
    }
    return route.continue();
  });

  await page.route('**/monitors', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  await page.route('**/notifications', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  await page.goto('/');

  const themeSelect = page.locator('[data-test="theme-select"]');
  await expect(themeSelect).toBeVisible();
  const accentLabel = page.locator('p.text-primary');

  const readAccentColor = async () =>
    accentLabel.evaluate((el) => getComputedStyle(el as HTMLElement).color || '');

  const initialColor = await readAccentColor();

  await themeSelect.selectOption('dark');

  await expect.poll(readAccentColor).not.toBe(initialColor);
  await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');

  const darkColor = await readAccentColor();

  await themeSelect.selectOption('emerald');

  await expect.poll(readAccentColor).not.toBe(darkColor);
  await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
    'emerald',
  );
});
