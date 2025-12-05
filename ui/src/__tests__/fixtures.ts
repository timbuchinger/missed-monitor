import type { Group, Monitor, Notification } from '../services/api';

export const DEFAULT_USER_ID = '74bad85b-f378-4bda-8762-e44abffd9228';

export const createGroup = (overrides: Partial<Group> = {}): Group => ({
  id: 'group-1',
  name: 'Engineering',
  userId: DEFAULT_USER_ID,
  ...overrides,
});

export const createHistoryEntry = (
  overrides: Partial<Monitor['history'][number]> = {},
): Monitor['history'][number] => ({
  timestamp: new Date().toISOString(),
  status: 'reset',
  ...overrides,
});

export const createMonitor = (overrides: Partial<Monitor> = {}): Monitor => ({
  uuid: 'monitor-1',
  name: 'API uptime',
  userId: DEFAULT_USER_ID,
  groupId: 'group-1',
  enabled: true,
  intervalSeconds: 60,
  alarmState: false,
  lastHeartbeat: null,
  history: [
    createHistoryEntry({ status: 'reset' }),
    createHistoryEntry({ status: 'triggered' }),
  ],
  ...overrides,
});

export const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notification-1',
  name: 'PagerDuty',
  userId: DEFAULT_USER_ID,
  groupIds: ['group-1'],
  type: 'logger',
  config: { content: 'Alert fired' },
  ...overrides,
});
