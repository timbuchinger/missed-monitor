import { describe, expect, it, vi } from 'vitest';

const use = vi.fn().mockReturnThis();
const mount = vi.fn();
const createAppMock = vi.fn(() => ({ use, mount }));
const createRouterMock = vi.fn(() => ({}));
const createWebHistoryMock = vi.fn(() => ({}));

vi.mock('vue', () => ({
  createApp: createAppMock,
}));

vi.mock('vue-router', () => ({
  createRouter: createRouterMock,
  createWebHistory: createWebHistoryMock,
}));

vi.mock('../App.vue', () => ({ default: {} }));
vi.mock('../views/Home.vue', () => ({ default: {} }));
vi.mock('../components/MonitorDetails.vue', () => ({ default: {} }));
vi.mock('../style.css', () => ({}), { virtual: true });

describe('main entrypoint', () => {
  it('creates the Vue app with router and mounts', async () => {
    vi.resetModules();
    await import('../main');

    expect(createRouterMock).toHaveBeenCalled();
    expect(use).toHaveBeenCalled();
    expect(mount).toHaveBeenCalled();
  });
});
