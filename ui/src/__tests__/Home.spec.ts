import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import Home from '../views/Home.vue';
import {
  acknowledgeMonitor,
  createGroup,
  createMonitor,
  createNotification,
  deleteGroup,
  deleteMonitor,
  deleteNotification,
  fetchGroups,
  fetchMonitors,
  fetchNotifications,
  updateGroup,
  updateMonitor,
  updateNotification,
} from '../services/api';
import { createGroup as buildGroup, createMonitor as buildMonitor, createNotification as buildNotification } from './fixtures';
import { routerStubs } from './testUtils';

vi.mock('../services/api', () => ({
  fetchGroups: vi.fn(),
  fetchMonitors: vi.fn(),
  fetchNotifications: vi.fn(),
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

const mockedApi = {
  fetchGroups: vi.mocked(fetchGroups),
  fetchMonitors: vi.mocked(fetchMonitors),
  fetchNotifications: vi.mocked(fetchNotifications),
  createGroup: vi.mocked(createGroup),
  updateGroup: vi.mocked(updateGroup),
  deleteGroup: vi.mocked(deleteGroup),
  createMonitor: vi.mocked(createMonitor),
  updateMonitor: vi.mocked(updateMonitor),
  deleteMonitor: vi.mocked(deleteMonitor),
  acknowledgeMonitor: vi.mocked(acknowledgeMonitor),
  createNotification: vi.mocked(createNotification),
  updateNotification: vi.mocked(updateNotification),
  deleteNotification: vi.mocked(deleteNotification),
};

const buildWrapper = async () => {
  const wrapper = mount(Home, {
    global: { stubs: routerStubs },
  });
  await flushPromises();
  return wrapper;
};

let lastMatchMedia: ReturnType<ReturnType<typeof mockMatchMedia>> | null = null;
const mockMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation(() => {
    lastMatchMedia = {
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    return lastMatchMedia;
  });

describe('Home view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    lastMatchMedia = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    });

    mockedApi.fetchGroups.mockResolvedValue([buildGroup()]);
    mockedApi.fetchMonitors.mockResolvedValue([buildMonitor({ alarmState: true })]);
    mockedApi.fetchNotifications.mockResolvedValue([buildNotification()]);
    mockedApi.createGroup.mockResolvedValue(buildGroup({ id: 'new-group' }));
    mockedApi.updateGroup.mockResolvedValue(buildGroup());
    mockedApi.deleteGroup.mockResolvedValue();
    mockedApi.createMonitor.mockResolvedValue(buildMonitor({ uuid: 'new-monitor' }));
    mockedApi.updateMonitor.mockResolvedValue(buildMonitor());
    mockedApi.deleteMonitor.mockResolvedValue();
    mockedApi.acknowledgeMonitor.mockResolvedValue(buildMonitor());
    mockedApi.createNotification.mockResolvedValue(buildNotification({ id: 'new-notification' }));
    mockedApi.updateNotification.mockResolvedValue(buildNotification());
    mockedApi.deleteNotification.mockResolvedValue();
  });

  it('paginates monitors and notifications and resets page when data shrinks', async () => {
    mockedApi.fetchMonitors.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => buildMonitor({ uuid: `monitor-${index}`, name: `Monitor ${index}` })),
    );
    mockedApi.fetchNotifications.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        buildNotification({ id: `notif-${index}`, name: `Notification ${index}` }),
      ),
    );

    const wrapper = await buildWrapper();
    expect(wrapper.findAll('[data-test="monitor-row"]').length).toBe(5);
    expect(wrapper.text()).toContain('Page 1 of 2');

    const monitorPager = wrapper.findAll('section.card').at(1)!;
    await monitorPager.findAll('.join .btn').at(1)!.trigger('click');
    await flushPromises();
    expect(wrapper.findAll('[data-test="monitor-row"]').length).toBe(2);

    const notificationPager = wrapper.findAll('section.card').at(2)!;
    await notificationPager.findAll('.join .btn').at(1)!.trigger('click');
    await flushPromises();
    expect(wrapper.findAll('[data-test="notification-row"]').length).toBe(1);

    mockedApi.fetchMonitors.mockResolvedValue([buildMonitor({ uuid: 'only' })]);
    mockedApi.fetchNotifications.mockResolvedValue([buildNotification({ id: 'only' })]);
    await (wrapper.vm as any).reloadAll();
    await flushPromises();

    expect((wrapper.vm as any).monitorPage).toBe(1);
    expect((wrapper.vm as any).notificationPage).toBe(1);
  });

  it('handles group CRUD flows and validation for deletion with monitors present', async () => {
    mockedApi.fetchGroups.mockResolvedValue([buildGroup({ id: 'group-1' }), buildGroup({ id: 'group-2', name: 'QA' })]);
    mockedApi.fetchMonitors.mockResolvedValue([buildMonitor({ groupId: 'group-1' })]);
    const wrapper = await buildWrapper();

    await wrapper.find('[aria-label="Delete group"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Remove monitors from this group before deleting it.');

    await wrapper.findAll('[aria-label="Edit group"]').at(1)!.trigger('click');
    const groupModal = wrapper.get('[data-test="group-modal"]');
    await groupModal.find('input').setValue('QA Updated ');
    await groupModal.find('form').trigger('submit');
    await flushPromises();
    expect(mockedApi.updateGroup).toHaveBeenCalledWith('group-2', expect.objectContaining({ name: 'QA Updated' }));

    await wrapper.get('[data-test="add-group"]').trigger('click');
    const createModal = wrapper.get('[data-test="group-modal"]');
    await createModal.find('input').setValue('Site Reliability');
    await createModal.find('form').trigger('submit');
    await flushPromises();
    expect(mockedApi.createGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'Site Reliability' }));

    await wrapper.findAll('[aria-label="Delete group"]').at(1)!.trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(mockedApi.deleteGroup).toHaveBeenCalledWith('group-2');
  });

  it('requires a group name and surfaces save errors', async () => {
    mockedApi.fetchGroups.mockResolvedValue([buildGroup({ id: 'group-1' })]);
    mockedApi.fetchMonitors.mockResolvedValue([]);
    mockedApi.createGroup.mockRejectedValueOnce(new Error('bad'));
    const wrapper = await buildWrapper();

    await wrapper.get('[data-test="add-group"]').trigger('click');
    const modal = wrapper.get('[data-test="group-modal"]');
    await modal.find('input').setValue('   ');
    await modal.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Group name is required');

    await modal.find('input').setValue('Team');
    await modal.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to save group');
  });

  it('surfaces group deletion errors', async () => {
    mockedApi.fetchGroups.mockResolvedValue([buildGroup({ id: 'group-3' })]);
    mockedApi.fetchMonitors.mockResolvedValue([]);
    mockedApi.deleteGroup.mockRejectedValueOnce(new Error('nope'));
    const wrapper = await buildWrapper();

    await wrapper.find('[aria-label="Delete group"]').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to delete group');
  });

  it('creates, updates, acknowledges, and copies monitors with validation', async () => {
    const clipboardWrite = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWrite },
      configurable: true,
    });

    const wrapper = await buildWrapper();
    await wrapper.get('[data-test="add-monitor"]').trigger('click');
    const monitorModal = wrapper.get('[data-test="monitor-modal"]');
    await monitorModal.find('#monitor-name').setValue(' New API ');
    await monitorModal.find('input[type="number"]').setValue('120');
    await monitorModal.find('input.toggle-error').setValue(true);
    await monitorModal.find('form').trigger('submit');
    await flushPromises();
    expect(mockedApi.createMonitor).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New API', intervalSeconds: 120 }),
    );

    await wrapper.find('[aria-label="Edit monitor"]').trigger('click');
    const editModal = wrapper.get('[data-test="monitor-modal"]');
    mockedApi.updateMonitor.mockRejectedValueOnce(new Error('fail'));
    await editModal.find('#monitor-name').setValue('Edited');
    await editModal.find('form').trigger('submit');
    await flushPromises();
    expect(mockedApi.updateMonitor).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: 'Edited' }),
    );
    expect(wrapper.text()).toContain('Unable to save monitor');
    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect((wrapper.vm as any).errorMessage).toBe('');

    await wrapper.get('[aria-label^="Copy UUID"]').trigger('click');
    expect(clipboardWrite).toHaveBeenCalled();

    await wrapper.get('[aria-label="Acknowledge alarm"]').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(mockedApi.acknowledgeMonitor).toHaveBeenCalled();
  });

  it('updates an existing monitor successfully', async () => {
    const wrapper = await buildWrapper();
    const monitor = buildMonitor({ uuid: 'edit-me' });
    (wrapper.vm as any).monitorModal.mode = 'edit';
    (wrapper.vm as any).monitorModal.form = {
      uuid: monitor.uuid,
      name: monitor.name,
      userId: monitor.userId,
      groupId: monitor.groupId,
      enabled: monitor.enabled,
      intervalSeconds: monitor.intervalSeconds,
      alarmState: monitor.alarmState,
    };
    await (wrapper.vm as any).handleMonitorSubmit();
    expect(mockedApi.updateMonitor).toHaveBeenCalledWith(
      'edit-me',
      expect.objectContaining({ name: monitor.name }),
    );
  });

  it('handles monitor deletion success and failure', async () => {
    const wrapper = await buildWrapper();

    mockedApi.deleteMonitor.mockRejectedValueOnce(new Error('delete-fail'));
    await wrapper.find('[aria-label="Delete monitor"]').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to delete monitor');

    mockedApi.deleteMonitor.mockResolvedValueOnce();
    await (wrapper.vm as any).handleMonitorDelete('monitor-1');
    await (wrapper.vm as any).confirmationModal.onConfirm();
    await flushPromises();
    expect(mockedApi.deleteMonitor).toHaveBeenCalled();
  });

  it('falls back to textarea copy when clipboard is missing', async () => {
    Object.defineProperty(document, 'execCommand', { value: vi.fn(), configurable: true });
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true as unknown as boolean);
    const wrapper = await buildWrapper();
    await wrapper.find('[aria-label="Edit monitor"]').trigger('click');
    (wrapper.vm as any).monitorModal.form.uuid = 'fallback-uuid';
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    delete (navigator as any).clipboard;
    await (wrapper.vm as any).copyMonitorUuid();
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  it('shows an error when copying monitor UUID fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('copy-fail'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const wrapper = await buildWrapper();
    await wrapper.find('[aria-label=\"Edit monitor\"]').trigger('click');
    const modal = wrapper.get('[data-test=\"monitor-modal\"]');
    await modal.get('button[aria-label^=\"Copy UUID\"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to copy UUID');
  });

  it('validates monitor creation when no group exists and falls back to uuid generation', async () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {} as Crypto);
    mockedApi.fetchGroups.mockResolvedValue([]);
    mockedApi.fetchMonitors.mockResolvedValue([]);
    const wrapper = await buildWrapper();

    await wrapper.get('[data-test="add-monitor"]').trigger('click');
    const modal = wrapper.get('[data-test="monitor-modal"]');
    await modal.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Select a group before saving');

    (wrapper.vm as any).monitorModal.form.name = 'Generated';
    (wrapper.vm as any).monitorModal.form.groupId = 'missing';
    (wrapper.vm as any).monitorModal.form.uuid = '';
    await (wrapper.vm as any).handleMonitorSubmit();
    expect(mockedApi.createMonitor).toHaveBeenCalled();

    vi.stubGlobal('crypto', originalCrypto as any);
  });

  it('handles load failure for notifications', async () => {
    mockedApi.fetchNotifications.mockRejectedValueOnce(new Error('load-fail'));
    const wrapper = await buildWrapper();
    await (wrapper.vm as any).loadNotifications();
    expect(wrapper.text()).toContain('Unable to load notifications');
  });

  it('renders logger notification fields even when no groups exist', async () => {
    mockedApi.fetchGroups.mockResolvedValue([]);
    mockedApi.fetchNotifications.mockResolvedValue([]);
    const wrapper = await buildWrapper();
    await wrapper.get('[data-test="add-notification"]').trigger('click');
    const modal = wrapper.get('[data-test="notification-modal"]');
    expect(modal.find('textarea').exists()).toBe(true);
    await modal.find('textarea').setValue('Logger body');
    expect(modal.text()).toContain('No groups available');
  });

  it('handles load failures for groups and monitors', async () => {
    mockedApi.fetchGroups.mockRejectedValue(new Error('groups-fail'));
    mockedApi.fetchMonitors.mockResolvedValueOnce([]);
    const wrapper = await buildWrapper();

    (wrapper.vm as any).errorMessage = '';
    mockedApi.fetchGroups.mockRejectedValueOnce(new Error('groups-fail'));
    await (wrapper.vm as any).loadGroups();
    expect((wrapper.vm as any).errorMessage).toBe('Unable to load groups');

    mockedApi.fetchMonitors.mockRejectedValueOnce(new Error('monitors-fail'));
    await (wrapper.vm as any).loadMonitors();
    expect((wrapper.vm as any).errorMessage).toBe('Unable to load monitors');
  });

  it('updates placeholders and notification config when sources change', async () => {
    const wrapper = await buildWrapper();
    const monitorNames = [
      'API uptime',
      'Database health',
      'Backend service',
      'Frontend rendering',
      'Mobile app responsiveness',
      'Third-party integration',
    ];
    (wrapper.vm as any).monitors = monitorNames.map((name: string, index: number) =>
      buildMonitor({ uuid: `m-${index}`, name }),
    );
    expect((wrapper.vm as any).monitorPlaceholder).toBe('New Monitor');

    const groupNames = ['Engineering', 'Product', 'Marketing', 'Design', 'Support', 'QA'];
    (wrapper.vm as any).groups = groupNames.map((name: string, index: number) =>
      buildGroup({ id: `g-${index}`, name }),
    );
    expect((wrapper.vm as any).groupPlaceholder).toBe('New Group');

    (wrapper.vm as any).notificationModal.form.groupIds = ['missing'];
    (wrapper.vm as any).groups = [buildGroup({ id: 'new-group' })];
    await flushPromises();
    expect((wrapper.vm as any).notificationModal.form.groupIds).toEqual(['new-group']);

    (wrapper.vm as any).notificationModal.mode = 'create';
    (wrapper.vm as any).notificationModal.form.type = 'logger';
    (wrapper.vm as any).notificationModal.form.config = {};
    (wrapper.vm as any).notificationModal.form.type = 'discord';
    await flushPromises();
    expect((wrapper.vm as any).notificationModal.form.config).toEqual({ webhookUrl: '' });
  });

  it('surfaces acknowledge failures', async () => {
    mockedApi.acknowledgeMonitor.mockRejectedValueOnce(new Error('ack-fail'));
    const wrapper = await buildWrapper();
    await wrapper.get('[aria-label="Acknowledge alarm"]').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to acknowledge monitor');
  });

  it('creates, edits, validates, and deletes notifications', async () => {
    mockedApi.fetchNotifications.mockResolvedValue([
      buildNotification({ id: 'discord', type: 'discord', config: { webhookUrl: 'https://discord.test' } }),
    ]);
    const wrapper = await buildWrapper();

    (wrapper.vm as any).notificationModal.form.groupIds = [];
    await (wrapper.vm as any).handleNotificationSubmit();
    expect(wrapper.text()).toContain('Select at least one group for the notification');

    await wrapper.get('[data-test="add-notification"]').trigger('click');
    const modal = wrapper.get('[data-test="notification-modal"]');
    await modal.get('input[placeholder="PagerDuty"]').setValue('PagerDuty');
    await modal.find('input.checkbox').setValue(true);
    await modal.find('[data-test="notification-type"]').setValue('discord');
    await modal.find('input[type="url"]').setValue('https://discord.com/api/webhooks/test');
    await (wrapper.vm as any).handleNotificationSubmit();
    expect(mockedApi.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'PagerDuty', type: 'discord' }),
    );

    await wrapper.find('[aria-label="Edit notification"]').trigger('click');
    const editModal = wrapper.get('[data-test="notification-modal"]');
    await editModal.find('[data-test="notification-type"]').setValue('discord');
    await editModal.find('input[type="url"]').setValue('');
    await editModal.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Discord webhook URL is required');

    mockedApi.updateNotification.mockRejectedValueOnce(new Error('save-fail'));
    await editModal.find('input[type="url"]').setValue('https://discord.com/api/webhooks/123');
    await editModal.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to save notification');
    expect(mockedApi.updateNotification).toHaveBeenCalled();

    mockedApi.updateNotification.mockResolvedValueOnce(buildNotification({ id: 'discord' }));
    await editModal.find('form').trigger('submit');
    await flushPromises();
    expect(mockedApi.updateNotification).toHaveBeenCalledTimes(2);

    mockedApi.deleteNotification.mockRejectedValueOnce(new Error('nope'));
    await wrapper.get('[aria-label="Delete notification"]').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Unable to delete notification');

    mockedApi.deleteNotification.mockResolvedValueOnce();
    await (wrapper.vm as any).handleNotificationDelete('discord');
    await (wrapper.vm as any).confirmationModal.onConfirm();
    await flushPromises();
    expect(mockedApi.deleteNotification).toHaveBeenCalled();
  });

  it('submits logger notifications, toggles groups, and dismisses errors', async () => {
    mockedApi.fetchNotifications.mockResolvedValue([]);
    const wrapper = await buildWrapper();

    (wrapper.vm as any).errorMessage = 'error';
    await wrapper.vm.$nextTick();
    await wrapper.get('.alert button').trigger('click');
    expect((wrapper.vm as any).errorMessage).toBe('');

    await wrapper.get('[data-test="add-notification"]').trigger('click');
    const modal = wrapper.get('[data-test="notification-modal"]');
    const checkbox = modal.get('input.checkbox');

    await checkbox.setValue(false);
    expect((wrapper.vm as any).notificationModal.form.groupIds).toEqual([]);
    await modal.get('form').trigger('submit');
    expect(wrapper.text()).toContain('Select at least one group for the notification');

    await checkbox.setValue(true);
    await modal.get('input[placeholder="PagerDuty"]').setValue('Logger');
    await modal.find('textarea').setValue('  log body  ');
    await modal.get('form').trigger('submit');
    await flushPromises();

    expect(mockedApi.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'logger', config: { content: 'log body' } }),
    );
  });

  it('handles pagination back navigation, modal toggles, and confirmation cancel', async () => {
    mockedApi.fetchMonitors.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => buildMonitor({ uuid: `monitor-${index}` })),
    );
    mockedApi.fetchNotifications.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => buildNotification({ id: `notification-${index}` })),
    );

    const wrapper = await buildWrapper();
    (wrapper.vm as any).confirmationModal.onConfirm();

    (wrapper.vm as any).monitorPage = 2;
    await flushPromises();
    const monitorPager = wrapper.findAll('section.card').at(1)!;
    await monitorPager.findAll('.join .btn').at(0)!.trigger('click');
    expect((wrapper.vm as any).monitorPage).toBe(1);

    (wrapper.vm as any).notificationPage = 2;
    await flushPromises();
    const notificationPager = wrapper.findAll('section.card').at(2)!;
    await notificationPager.findAll('.join .btn').at(0)!.trigger('click');
    expect((wrapper.vm as any).notificationPage).toBe(1);

    await wrapper.get('[data-test="add-monitor"]').trigger('click');
    const modal = wrapper.get('[data-test="monitor-modal"]');
    const toggles = modal.findAll('input[type="checkbox"]');
    await toggles[0].setValue(false);
    await toggles[1].setValue(true);
    await modal.get('#monitor-name').setValue('Toggled monitor');
    await modal.find('form').trigger('submit');
    expect(mockedApi.createMonitor).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, alarmState: true }),
    );

    (wrapper.vm as any).confirmationModal.open = true;
    await wrapper.vm.$nextTick();
    await wrapper.getComponent(ConfirmationModal).get('button.btn').trigger('click');
    expect((wrapper.vm as any).confirmationModal.open).toBe(false);
  });

  it('covers copy fallbacks and notification defaults', async () => {
    const wrapper = await buildWrapper();

    (wrapper.vm as any).monitorModal.form.uuid = '';
    await (wrapper.vm as any).copyMonitorUuid();
    expect((wrapper.vm as any).copiedUuid).toBe(false);

    (wrapper.vm as any).groups.push(buildGroup({ id: 'group-2', name: 'Support' }));
    await wrapper.get('[data-test="add-monitor"]').trigger('click');
    const monitorModal = wrapper.get('[data-test="monitor-modal"]');
    await monitorModal.find('select').setValue('group-2');
    await monitorModal.find('input[type="number"]').setValue('120');
    await monitorModal.find('form').trigger('submit');
    expect(mockedApi.createMonitor).toHaveBeenCalled();

    await wrapper.get('[data-test="add-notification"]').trigger('click');
    const notificationModal = wrapper.get('[data-test="notification-modal"]');
    (wrapper.vm as any).notificationModal.form.config = {};
    await notificationModal.get('input[placeholder="PagerDuty"]').setValue('Logger defaults');
    await notificationModal.get('form').trigger('submit');
    expect(mockedApi.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ config: { content: '' }, type: 'logger' }),
    );

    await notificationModal.find('[data-test="notification-type"]').setValue('discord');
    (wrapper.vm as any).notificationModal.form.config = {};
    await notificationModal.get('form').trigger('submit');
    expect(wrapper.text()).toContain('Discord webhook URL is required');
  });

  it('keeps valid group assignments, returns config defaults, and renders disabled monitors', async () => {
    const wrapper = await buildWrapper();

    (wrapper.vm as any).notificationModal.form.groupIds = ['group-1'];
    mockedApi.fetchGroups.mockResolvedValue([buildGroup()]);
    await (wrapper.vm as any).loadGroups();
    expect((wrapper.vm as any).notificationModal.form.groupIds).toEqual(['group-1']);

    expect((wrapper.vm as any).configForType('logger')).toEqual({ content: '' });
    expect((wrapper.vm as any).configForType('discord', { webhookUrl: 'https://discord.test' })).toEqual({
      webhookUrl: 'https://discord.test',
    });

    await (wrapper.vm as any).openNotificationModal('edit', buildNotification({ config: {} as any }));
    expect((wrapper.vm as any).notificationModal.form.config).toEqual({ content: '' });

    (wrapper.vm as any).monitors = [buildMonitor({ uuid: 'disabled', enabled: false })];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Disabled');
  });

  it('applies theme from storage or system preference and syncs updates', async () => {
    const matchMediaMock = mockMatchMedia(true);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    localStorage.setItem('missed-monitor-theme', 'invalid');
    const wrapper = await buildWrapper();
    expect((wrapper.get('[data-test=\"theme-select\"]').element as HTMLSelectElement).value).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await wrapper.get('[data-test=\"theme-select\"]').setValue('aqua');
    expect(localStorage.getItem('missed-monitor-theme')).toBe('aqua');

    localStorage.removeItem('missed-monitor-theme');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    });
    const media = lastMatchMedia!;
    const handler = (media.addEventListener as vi.Mock).mock.calls[0][1] as (event: MediaQueryListEvent) => void;
    handler({ matches: false } as MediaQueryListEvent);
    expect((wrapper.vm as any).selectedTheme).toBe('light');
  });

  it('uses stored theme when valid', async () => {
    localStorage.setItem('missed-monitor-theme', 'emerald');
    const wrapper = await buildWrapper();
    expect((wrapper.vm as any).selectedTheme).toBe('emerald');
  });

  it('skips sync when a theme is already stored', async () => {
    localStorage.setItem('missed-monitor-theme', 'dark');
    const wrapper = await buildWrapper();
    (wrapper.vm as any).selectedTheme = 'emerald';
    (wrapper.vm as any).syncThemeWithSystem();
    expect((wrapper.vm as any).selectedTheme).toBe('emerald');
  });

  it('falls back when theme storage read fails', async () => {
    const originalStorage = window.localStorage;
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('denied');
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    const wrapper = await buildWrapper();
    expect((wrapper.vm as any).selectedTheme).toBe('light');
    Object.defineProperty(window, 'localStorage', { value: originalStorage, configurable: true });
  });

  it('cleans up theme listeners and tolerates storage failures', async () => {
    const originalMatchMedia = window.matchMedia;
    const originalStorage = window.localStorage;
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('nope');
      }),
      removeItem: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMatchMedia(true) });

    const wrapper = await buildWrapper();
    await wrapper.get('[data-test=\"theme-select\"]').setValue('business');
    expect(storage.setItem).toHaveBeenCalled();

    await wrapper.unmount();
    const media = lastMatchMedia!;
    expect((media.removeEventListener as vi.Mock).mock.calls[0][0]).toBe('change');

    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true });
    Object.defineProperty(window, 'localStorage', { value: originalStorage, configurable: true });
  });
});
