import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeMonitor,
  createGroup,
  createMonitor,
  createNotification,
  deleteGroup,
  deleteMonitor,
  deleteNotification,
  fetchGroups,
  fetchMonitor,
  fetchMonitors,
  fetchNotifications,
  request,
  updateGroup,
  updateMonitor,
  updateNotification,
} from '../services/api';
import { createGroup as buildGroup, createMonitor as buildMonitor, createNotification as buildNotification } from './fixtures';

const mockFetch = vi.fn();

const mockResponse = (data: unknown, init?: Partial<Response>) =>
  Promise.resolve({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(typeof data === 'string' ? data : ''),
  } as unknown as Response);

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api request helper', () => {
  it('merges custom headers and returns parsed json', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));
    const result = await request<{ ok: boolean }>('/custom', {
      headers: { Authorization: 'Bearer token' },
    });

    expect(mockFetch).toHaveBeenCalledWith('/custom', expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      }),
    }));
    expect(result).toEqual({ ok: true });
  });

  it('returns undefined for 204 responses', async () => {
    mockFetch.mockResolvedValue(mockResponse(null, { status: 204, ok: true }));
    const result = await request<void>('/no-content', { method: 'DELETE' });

    expect(result).toBeUndefined();
  });

  it('throws an error when response is not ok', async () => {
    mockFetch.mockResolvedValue(mockResponse('Boom', { ok: false, status: 500 }));
    await expect(fetchGroups()).rejects.toThrow('Boom');
  });

  it('throws a generic error message when response has no body', async () => {
    mockFetch.mockResolvedValue(mockResponse('', { ok: false, status: 503 }));
    await expect(fetchMonitors()).rejects.toThrow('Request failed with status 503');
  });
});

describe('endpoint wrappers', () => {
  it('calls endpoints with correct methods and payloads', async () => {
    const group = buildGroup();
    const monitor = buildMonitor();
    const notification = buildNotification();

    mockFetch
      .mockResolvedValueOnce(mockResponse([group])) // fetchGroups
      .mockResolvedValueOnce(mockResponse([monitor])) // fetchMonitors
      .mockResolvedValueOnce(mockResponse(monitor)) // fetchMonitor
      .mockResolvedValueOnce(mockResponse([notification])) // fetchNotifications
      .mockResolvedValueOnce(mockResponse(group)) // createGroup
      .mockResolvedValueOnce(mockResponse(group)) // updateGroup
      .mockResolvedValueOnce(mockResponse(null, { status: 204, ok: true })) // deleteGroup
      .mockResolvedValueOnce(mockResponse(monitor)) // createMonitor
      .mockResolvedValueOnce(mockResponse(monitor)) // updateMonitor
      .mockResolvedValueOnce(mockResponse(null, { status: 204, ok: true })) // deleteMonitor
      .mockResolvedValueOnce(mockResponse(monitor)) // acknowledgeMonitor
      .mockResolvedValueOnce(mockResponse(notification)) // createNotification
      .mockResolvedValueOnce(mockResponse(notification)) // updateNotification
      .mockResolvedValueOnce(mockResponse(null, { status: 204, ok: true })); // deleteNotification

    await fetchGroups();
    await fetchMonitors();
    await fetchMonitor(monitor.uuid);
    await fetchNotifications();
    await createGroup({ name: group.name, userId: group.userId });
    await updateGroup(group.id, { name: `${group.name} Updated`, userId: group.userId });
    await deleteGroup(group.id);
    await createMonitor({
      uuid: monitor.uuid,
      name: monitor.name,
      userId: monitor.userId,
      groupId: monitor.groupId,
      enabled: monitor.enabled,
      intervalSeconds: monitor.intervalSeconds,
      alarmState: monitor.alarmState,
      history: monitor.history,
    });
    await updateMonitor(monitor.uuid, {
      name: 'Updated Monitor',
      userId: monitor.userId,
      groupId: monitor.groupId,
      enabled: monitor.enabled,
      intervalSeconds: monitor.intervalSeconds,
      alarmState: monitor.alarmState,
      history: monitor.history,
    });
    await deleteMonitor(monitor.uuid);
    await acknowledgeMonitor(monitor.uuid);
    await createNotification({
      name: notification.name,
      userId: notification.userId,
      groupIds: notification.groupIds,
      type: notification.type,
      config: notification.config,
    });
    await updateNotification(notification.id, {
      name: `${notification.name} Updated`,
      userId: notification.userId,
      groupIds: notification.groupIds,
      type: notification.type,
      config: notification.config,
    });
    await deleteNotification(notification.id);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      '/groups',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      '/groups',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: group.name, userId: group.userId }) }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      7,
      `/groups/${group.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      8,
      '/monitors',
      expect.objectContaining({ method: 'POST', body: expect.stringContaining(monitor.uuid) }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      10,
      `/monitors/${monitor.uuid}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      11,
      `/ack/${monitor.uuid}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      12,
      '/notifications',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      14,
      `/notifications/${notification.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
