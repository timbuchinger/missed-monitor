import { Logger } from '@nestjs/common';
import { NotificationRunnerService } from './notification-runner.service';
import { NotificationRecord } from './notifications.repository';
import { NotificationType } from './notification-types';

describe('NotificationRunnerService', () => {
  let service: NotificationRunnerService;
  const baseNotification: NotificationRecord = {
    id: 'notif-1',
    name: 'PagerDuty',
    userId: 'user-1',
    groupIds: ['group-1'],
    type: NotificationType.Logger,
    config: { content: 'Custom message' },
  };
  const context = {
    monitorUuid: 'monitor-1',
    monitorName: 'API Uptime',
    groupId: 'group-1',
    missedForSeconds: 120,
    triggeredAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    service = new NotificationRunnerService();
    jest.restoreAllMocks();
  });

  it('logs output for logger notifications', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await service.run(baseNotification, context);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Custom message'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('API Uptime'),
    );
  });

  it('sends discord messages via webhook', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 204, text: () => Promise.resolve('') });
    (global as any).fetch = fetchMock;

    await service.run(
      {
        ...baseNotification,
        type: NotificationType.Discord,
        config: { webhookUrl: 'https://discord.test/webhook' },
      },
      context,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.test/webhook',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws when discord webhook fails', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request', text: () => Promise.resolve('bad') });
    (global as any).fetch = fetchMock;

    await expect(
      service.run(
        {
          ...baseNotification,
          type: NotificationType.Discord,
          config: { webhookUrl: 'https://discord.test/webhook' },
        },
        context,
      ),
    ).rejects.toThrow(/Discord webhook error/);
  });
});
