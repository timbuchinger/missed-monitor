import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MonitorDetails from '../components/MonitorDetails.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import { createHistoryEntry, createMonitor } from './fixtures';
import { routerStubs } from './testUtils';
import { acknowledgeMonitor, fetchMonitor } from '../services/api';

vi.mock('../services/api', () => ({
  fetchMonitor: vi.fn(),
  acknowledgeMonitor: vi.fn(),
}));

const mockedFetchMonitor = vi.mocked(fetchMonitor);
const mockedAcknowledge = vi.mocked(acknowledgeMonitor);

const buildHistory = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    createHistoryEntry({
      timestamp: new Date(2024, 0, index + 1).toISOString(),
      status: index % 3 === 0 ? 'triggered' : index % 2 === 0 ? 'suppressed' : 'reset',
    }),
  );

const mountComponent = async () => {
  const wrapper = mount(MonitorDetails, {
    props: { uuid: 'monitor-1' },
    global: { stubs: routerStubs },
  });
  await flushPromises();
  return wrapper;
};

describe('MonitorDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchMonitor.mockResolvedValue(createMonitor({ history: buildHistory(12), alarmState: true }));
    mockedAcknowledge.mockResolvedValue(createMonitor());
  });

  it('renders monitor details, filters, sorts, and paginates history', async () => {
    const wrapper = await mountComponent();

    expect(wrapper.text()).toContain('API uptime');
    expect(wrapper.text()).toContain('Page 1 of 2');
    const nextButtons = wrapper.findAll('.join .btn');
    await nextButtons[nextButtons.length - 1].trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Page 2 of 2');

    await wrapper.get('select').setValue('triggered');
    await flushPromises();
    expect(wrapper.text()).toContain('Triggered');
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0);
  });

  it('acknowledges the monitor and reloads data', async () => {
    mockedFetchMonitor
      .mockResolvedValueOnce(createMonitor({ alarmState: true }))
      .mockResolvedValueOnce(createMonitor({ alarmState: false }));

    const wrapper = await mountComponent();
    await wrapper.get('button.btn-warning').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();

    expect(mockedAcknowledge).toHaveBeenCalledWith('monitor-1');
    expect(mockedFetchMonitor).toHaveBeenCalledTimes(2);
  });

  it('shows an error when acknowledge fails', async () => {
    mockedAcknowledge.mockRejectedValueOnce(new Error('nope'));
    const wrapper = await mountComponent();
    await wrapper.get('button.btn-warning').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn-primary').trigger('click');
    await flushPromises();

    expect((wrapper.vm as any).errorMessage).toBe('Unable to acknowledge monitor');
  });

  it('handles clipboard write errors gracefully', async () => {
    const originalClipboard = (navigator as any).clipboard;
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const wrapper = await mountComponent();
    await wrapper.get('button[title="Copy acknowledge URL"]').trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalled();
    expect((wrapper.vm as any).errorMessage).toBe('Unable to copy URL');

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('shows empty history state and formats safely', async () => {
    mockedFetchMonitor.mockResolvedValueOnce(createMonitor({ history: [], alarmState: false }));
    const wrapper = await mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('No history found.');
    expect((wrapper.vm as any).formatStatus('')).toBe('');
  });

  it('renders disabled monitors with correct status text', async () => {
    mockedFetchMonitor.mockResolvedValueOnce(createMonitor({ enabled: false, alarmState: false }));
    const wrapper = await mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Enabled: No');
  });

  it('handles copy flow when monitor data is missing', async () => {
    const originalClipboard = (navigator as any).clipboard;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    mockedFetchMonitor.mockResolvedValueOnce(createMonitor({ history: [] }));
    const wrapper = await mountComponent();
    (wrapper.vm as any).monitor = null;
    expect((wrapper.vm as any).filteredHistory).toEqual([]);
    await (wrapper.vm as any).copyAckUrl();
    expect(writeText).toHaveBeenCalled();

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('exposes the base url for ack links', async () => {
    const wrapper = await mountComponent();
    expect((wrapper.vm as any).baseUrl).toBe(window.location.origin);
  });

  it('copies the ack URL when clipboard is available', async () => {
    const originalClipboard = (navigator as any).clipboard;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const wrapper = await mountComponent();
    await wrapper.get('button[title="Copy acknowledge URL"]').trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalled();
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('falls back to document.execCommand when clipboard is unavailable', async () => {
    const originalClipboard = (navigator as any).clipboard;
    const originalExec = (document as any).execCommand;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    delete (navigator as any).clipboard;
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(),
      configurable: true,
    });
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true as unknown as boolean);

    const wrapper = await mountComponent();
    await wrapper.get('button[title="Copy acknowledge URL"]').trigger('click');
    await flushPromises();

    expect(execSpy).toHaveBeenCalledWith('copy');

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: originalExec, configurable: true });
  });

  it('allows cancelling acknowledge and navigating history backwards', async () => {
    const wrapper = await mountComponent();
    (wrapper.vm as any).confirmationModal.onConfirm();

    await wrapper.get('button.btn-warning').trigger('click');
    await wrapper.getComponent(ConfirmationModal).get('button.btn').trigger('click');
    expect((wrapper.vm as any).confirmationModal.open).toBe(false);

    (wrapper.vm as any).historyPage = 2;
    await flushPromises();
    const pagerButtons = wrapper.findAll('.join .btn');
    await pagerButtons[0].trigger('click');
    expect((wrapper.vm as any).historyPage).toBe(1);
  });

  it('surfaces a fetch error', async () => {
    vi.useFakeTimers();
    mockedFetchMonitor.mockRejectedValueOnce(new Error('oops'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = await mountComponent();
    await flushPromises();

    expect((wrapper.vm as any).errorMessage).toBe('Unable to load monitor details');
    vi.advanceTimersByTime(5000);
    expect((wrapper.vm as any).errorMessage).toBe('');
    vi.useRealTimers();
    consoleSpy.mockRestore();
  });
});
