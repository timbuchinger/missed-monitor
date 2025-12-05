import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GroupsController } from '../src/groups/groups.controller';
import { GroupsService } from '../src/groups/groups.service';
import {
  GROUPS_REPOSITORY,
  GroupRecord,
  GroupsRepository,
} from '../src/groups/groups.repository';
import { MonitorAckController, MonitorsController } from '../src/monitors/monitors.controller';
import { MonitorsService } from '../src/monitors/monitors.service';
import {
  MONITORS_REPOSITORY,
  MonitorRecord,
  MonitorsRepository,
} from '../src/monitors/monitors.repository';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import {
  NOTIFICATIONS_REPOSITORY,
  NotificationRecord,
  NotificationsRepository,
} from '../src/notifications/notifications.repository';
import { NotificationRunnerService } from '../src/notifications/notification-runner.service';
import { NotificationType } from '../src/notifications/notification-types';

class InMemoryGroupsRepository implements GroupsRepository {
  private store = new Map<string, GroupRecord>();

  async create(data: { name: string; userId: string }): Promise<GroupRecord> {
    const id = `group-${this.store.size + 1}`;
    const group = { id, ...data };
    this.store.set(id, group);
    return group;
  }

  async findAll(): Promise<GroupRecord[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<GroupRecord | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: string, data: { name: string; userId: string }): Promise<GroupRecord | null> {
    if (!this.store.has(id)) {
      return null;
    }
    const updated = { id, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

class InMemoryNotificationsRepository implements NotificationsRepository {
  private store = new Map<string, NotificationRecord>();

  async create(data: Omit<NotificationRecord, 'id'>): Promise<NotificationRecord> {
    const id = `notification-${this.store.size + 1}`;
    const notification = { id, ...data };
    this.store.set(id, notification);
    return notification;
  }

  async findAll(): Promise<NotificationRecord[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByGroupId(groupId: string): Promise<NotificationRecord[]> {
    return Array.from(this.store.values()).filter((notification) =>
      notification.groupIds.includes(groupId),
    );
  }

  async update(
    id: string,
    data: Omit<NotificationRecord, 'id'>,
  ): Promise<NotificationRecord | null> {
    if (!this.store.has(id)) {
      return null;
    }
    const updated = { id, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

class InMemoryMonitorsRepository implements MonitorsRepository {
  private store = new Map<string, MonitorRecord>();

  async create(data: {
    uuid: string;
    name: string;
    userId: string;
    groupId: string;
    enabled: boolean;
    intervalSeconds: number;
    alarmState: boolean;
  }): Promise<MonitorRecord> {
    const monitor: MonitorRecord = { ...data, lastHeartbeat: null, history: [] };
    this.store.set(data.uuid, monitor);
    return monitor;
  }

  async findAll(): Promise<MonitorRecord[]> {
    return Array.from(this.store.values());
  }

  async findByUuid(uuid: string): Promise<MonitorRecord | null> {
    return this.store.get(uuid) ?? null;
  }

  async update(
    uuid: string,
    data: {
      name: string;
      userId: string;
      groupId: string;
      enabled: boolean;
      intervalSeconds: number;
      alarmState: boolean;
    },
  ): Promise<MonitorRecord | null> {
    const existing = this.store.get(uuid);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...data };
    this.store.set(uuid, updated);
    return updated;
  }

  async delete(uuid: string): Promise<void> {
    this.store.delete(uuid);
  }

  async acknowledge(uuid: string): Promise<MonitorRecord | null> {
    const existing = this.store.get(uuid);
    if (!existing) {
      return null;
    }
    const acked = { ...existing, lastHeartbeat: new Date() };
    this.store.set(uuid, acked);
    return acked;
  }
}

describe('Missed Monitor domain flow', () => {
  let groupsController: GroupsController;
  let notificationsController: NotificationsController;
  let monitorsController: MonitorsController;
  let monitorAckController: MonitorAckController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GroupsController, NotificationsController, MonitorsController, MonitorAckController],
      providers: [
        GroupsService,
        NotificationsService,
        MonitorsService,
        { provide: GROUPS_REPOSITORY, useClass: InMemoryGroupsRepository },
        { provide: NOTIFICATIONS_REPOSITORY, useClass: InMemoryNotificationsRepository },
        { provide: MONITORS_REPOSITORY, useClass: InMemoryMonitorsRepository },
        {
          provide: NotificationRunnerService,
          useValue: { run: jest.fn() },
        },
      ],
    }).compile();

    groupsController = moduleRef.get(GroupsController);
    notificationsController = moduleRef.get(NotificationsController);
    monitorsController = moduleRef.get(MonitorsController);
    monitorAckController = moduleRef.get(MonitorAckController);
  });

  it('creates and manages groups, monitors, notifications, and acknowledgements', async () => {
    const group = await groupsController.create({ name: 'Operations', userId: 'user-a' });
    expect(group).toMatchObject({ name: 'Operations', userId: 'user-a' });

    const updatedGroup = await groupsController.update(group.id, {
      name: 'Operations EU',
      userId: 'user-a',
    });
    expect(updatedGroup.name).toBe('Operations EU');

    const fetchedGroup = await groupsController.findOne(group.id);
    expect(fetchedGroup.id).toBe(group.id);

    const groupList = await groupsController.findAll();
    expect(groupList).toHaveLength(1);

    const notification = await notificationsController.create({
      name: 'PagerDuty',
      userId: 'user-a',
      groupIds: [group.id],
      type: NotificationType.Logger,
      config: { content: 'test content' },
    });
    expect(notification.groupIds).toEqual([group.id]);

    const updatedNotification = await notificationsController.update(notification.id, {
      name: 'PagerDuty (primary)',
      userId: 'user-a',
      groupIds: [group.id],
      type: NotificationType.Logger,
      config: { content: 'updated' },
    });
    expect(updatedNotification.name).toContain('primary');

    const notificationList = await notificationsController.findAll();
    expect(notificationList).toHaveLength(1);

    const monitorUuid = 'c9e7ef63-0d95-4c73-8795-b2b9d19d1c23';
    const monitor = await monitorsController.create({
      uuid: monitorUuid,
      name: 'API uptime',
      userId: 'user-a',
      groupId: group.id,
      enabled: true,
      intervalSeconds: 60,
    });
    expect(monitor.uuid).toBe(monitorUuid);
    expect(monitor.enabled).toBe(true);
    expect(monitor.intervalSeconds).toBe(60);
    expect(monitor.alarmState).toBe(false);

    const monitorsBeforeAck = await monitorsController.findAll();
    expect(monitorsBeforeAck).toHaveLength(1);

    const ackStart = Date.now();
    const ackResponse = await monitorAckController.ack(monitorUuid);
    expect(ackResponse).toEqual({ acknowledged: true });

    const ackedMonitor = await monitorsController.findOne(monitorUuid);
    expect(ackedMonitor.lastHeartbeat).toBeTruthy();
    const ackedTime = (ackedMonitor.lastHeartbeat as Date).getTime();
    expect(ackedTime).toBeGreaterThanOrEqual(ackStart);

    const updatedMonitor = await monitorsController.update(monitorUuid, {
      name: 'API uptime v2',
      userId: 'user-a',
      groupId: group.id,
      enabled: false,
      intervalSeconds: 120,
      alarmState: true,
    });
    expect(updatedMonitor.name).toBe('API uptime v2');
    expect(updatedMonitor.enabled).toBe(false);
    expect(updatedMonitor.intervalSeconds).toBe(120);
    expect(updatedMonitor.alarmState).toBe(true);

    await monitorsController.remove(monitorUuid);
    await notificationsController.remove(notification.id);
    await groupsController.remove(group.id);

    const monitorsAfterDelete = await monitorsController.findAll();
    expect(monitorsAfterDelete).toHaveLength(0);
  });

  it('returns a 404 when acknowledging an unknown monitor', async () => {
    await expect(monitorAckController.ack('unknown-monitor')).rejects.toThrow(NotFoundException);
  });
});
