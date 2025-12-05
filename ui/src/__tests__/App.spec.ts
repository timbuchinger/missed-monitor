import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '../App.vue';
import Home from '../views/Home.vue';

vi.mock('../services/api', () => ({
  fetchGroups: vi.fn(() => Promise.resolve([])),
  fetchMonitors: vi.fn(() => Promise.resolve([])),
  fetchNotifications: vi.fn(() => Promise.resolve([])),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  createMonitor: vi.fn(),
  updateMonitor: vi.fn(),
  deleteMonitor: vi.fn(),
  acknowledgeMonitor: vi.fn(),
  createNotification: vi.fn(),
  updateNotification: vi.fn(),
  deleteNotification: vi.fn(),
}));

describe('App shell', () => {
  it('renders the routed view', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'Home', component: Home }],
    });
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();
    await flushPromises();

    expect(wrapper.findComponent(Home).exists()).toBe(true);
  });
});
