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
}

export interface Notification {
  id: string;
  name: string;
  userId: string;
  groupIds: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
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
