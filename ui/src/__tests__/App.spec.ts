import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.vue';

const mockGroups = [{ id: 'group-1', name: 'Default', userId: '74bad85b-f378-4bda-8762-e44abffd9228' }];
const mockMonitors = [
  {
    uuid: 'monitor-1',
    name: 'API',
    userId: mockGroups[0].userId,
    groupId: 'group-1',
    enabled: true,
    intervalSeconds: 60,
    alarmState: false,
    lastHeartbeat: null,
  },
];
const mockNotifications = [
  { id: 'notification-1', name: 'PagerDuty', userId: mockGroups[0].userId, groupIds: ['group-1'] },
];

vi.mock('../services/api', () => ({
  fetchGroups: vi.fn(() => Promise.resolve(mockGroups)),
  fetchMonitors: vi.fn(() => Promise.resolve(mockMonitors)),
  fetchNotifications: vi.fn(() => Promise.resolve(mockNotifications)),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  createMonitor: vi.fn(),
  updateMonitor: vi.fn(),
  deleteMonitor: vi.fn(),
  createNotification: vi.fn(),
  updateNotification: vi.fn(),
  deleteNotification: vi.fn(),
}));

let mockPrefersDark = false;
const matchMediaMock = vi.fn().mockImplementation(() => ({
  matches: mockPrefersDark,
  media: '(prefers-color-scheme: dark)',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrefersDark = false;
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  it('renders group, monitor, and notification tables', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find('[data-test="group-row"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="monitor-row"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="notification-row"]').exists()).toBe(true);
  });

  it('opens modals for create actions', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('[data-test="add-monitor"]').trigger('click');
    expect(wrapper.find('[data-test="monitor-modal"]').exists()).toBe(true);

    await wrapper.get('[data-test="add-notification"]').trigger('click');
    expect(wrapper.find('[data-test="notification-modal"]').exists()).toBe(true);

    await wrapper.get('[data-test="add-group"]').trigger('click');
    expect(wrapper.find('[data-test="group-modal"]').exists()).toBe(true);
  });

  it('sets theme based on system preference when not stored', async () => {
    mockPrefersDark = true;
    const wrapper = mount(App);
    await flushPromises();

    const themeSelect = wrapper.get('[data-test="theme-select"]');
    expect((themeSelect.element as HTMLSelectElement).value).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists theme selection', async () => {
    const wrapper = mount(App);
    await flushPromises();

    const select = wrapper.get('[data-test="theme-select"]');
    await select.setValue('emerald');
    expect(localStorage.getItem('missed-monitor-theme')).toBe('emerald');
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald');
  });
});
