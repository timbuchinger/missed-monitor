export interface Group {
  id: string;
  name: string;
  userId: string;
}

export interface Monitor {
  uuid: string;
  name: string;
  userId: string;
  groupId: string;
  enabled: boolean;
  intervalSeconds: number;
  alarmState: boolean;
  lastHeartbeat: string | null;
  history: {
    timestamp: string;
    status: 'triggered' | 'reset' | 'suppressed';
  }[];
}

export type NotificationType = 'logger' | 'discord';

export interface LoggerNotificationConfig {
  content: string;
}

export interface DiscordNotificationConfig {
  webhookUrl: string;
}

export type NotificationConfig = LoggerNotificationConfig | DiscordNotificationConfig;

export interface Notification {
  id: string;
  name: string;
  userId: string;
  groupIds: string[];
  type: NotificationType;
  config: NotificationConfig;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options ?? {};
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const fetchGroups = () => request<Group[]>('/groups');
export const fetchMonitors = () => request<Monitor[]>('/monitors');
export const fetchMonitor = (uuid: string) => request<Monitor>(`/monitors/${uuid}`);
export const fetchNotifications = () => request<Notification[]>('/notifications');

export const createGroup = (data: Omit<Group, 'id'>) =>
  request<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateGroup = (id: string, data: Omit<Group, 'id'>) =>
  request<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteGroup = (id: string) =>
  request<void>(`/groups/${id}`, {
    method: 'DELETE',
  });

export const createMonitor = (data: Omit<Monitor, 'lastHeartbeat'> & { lastHeartbeat?: never }) =>
  request<Monitor>('/monitors', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateMonitor = (uuid: string, data: Omit<Monitor, 'uuid' | 'lastHeartbeat'>) =>
  request<Monitor>(`/monitors/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteMonitor = (uuid: string) =>
  request<void>(`/monitors/${uuid}`, {
    method: 'DELETE',
  });

export const acknowledgeMonitor = (uuid: string) =>
  request<Monitor>(`/ack/${uuid}`, {
    method: 'GET',
  });

export const createNotification = (data: Omit<Notification, 'id'>) =>
  request<Notification>('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateNotification = (id: string, data: Omit<Notification, 'id'>) =>
  request<Notification>(`/notifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteNotification = (id: string) =>
  request<void>(`/notifications/${id}`, {
    method: 'DELETE',
  });
