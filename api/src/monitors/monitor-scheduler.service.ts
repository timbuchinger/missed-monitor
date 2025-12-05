import { Inject, Injectable, Logger } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Cron } from '@nestjs/schedule';
import { MONITORS_REPOSITORY, MonitorsRepository } from './monitors.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MonitorSchedulerService {
  private readonly logger = new Logger(MonitorSchedulerService.name);

  constructor(
    @Inject(MONITORS_REPOSITORY)
    private readonly repository: MonitorsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Runs once every minute
  @Cron('* * * * *')
  async handleCron() {
    try {
      const monitors = await this.repository.findAll();
      const now = new Date();

      for (const m of monitors) {
        if (!m.enabled) continue;

        const last = m.lastHeartbeat;
        const secondsSince = last ? Math.floor((now.getTime() - new Date(last).getTime()) / 1000) : Infinity;
        const tracer = trace.getTracer('missed-monitor');
        await tracer.startActiveSpan('monitors.check', async (span) => {
          span.setAttribute('monitor.uuid', m.uuid);
          span.setAttribute('monitor.missed_seconds', secondsSince);
          try {
            if (secondsSince > m.intervalSeconds) {
              if (!m.alarmState) {
                this.logger.warn(`Alarm triggered for monitor ${m.uuid} (missed by ${secondsSince}s)`);
                await tracer.startActiveSpan('monitors.alarm.trigger', async (alarmSpan) => {
                  alarmSpan.setAttribute('monitor.uuid', m.uuid);
                  alarmSpan.setAttribute('monitor.missed_seconds', secondsSince);
                  try {
                    await this.repository.update(m.uuid, {
                      name: m.name,
                      userId: m.userId,
                      groupId: m.groupId,
                      enabled: m.enabled,
                      intervalSeconds: m.intervalSeconds,
                      alarmState: true,
                    });
                    await this.notificationsService.dispatchGroupAlert(m.groupId, {
                      monitorUuid: m.uuid,
                      monitorName: m.name,
                      groupId: m.groupId,
                      missedForSeconds: secondsSince,
                      triggeredAt: now,
                    });
                  } catch (err) {
                    alarmSpan.recordException(err as any);
                    throw err;
                  } finally {
                    alarmSpan.end();
                  }
                });
              } else {
                // already in alarm state; still log at debug level
                this.logger.debug(`Monitor ${m.uuid} still in alarm state (missed by ${secondsSince}s)`);
              }
            }
          } catch (err) {
            span.recordException(err as any);
            throw err;
          } finally {
            span.end();
          }
        });
      }
    } catch (err) {
      this.logger.error('Error running monitor scheduler', err as any);
    }
  }
}
