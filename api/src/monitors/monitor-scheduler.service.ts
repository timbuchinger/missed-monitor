import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MONITORS_REPOSITORY, MonitorsRepository, MonitorRecord } from './monitors.repository';

@Injectable()
export class MonitorSchedulerService {
  private readonly logger = new Logger(MonitorSchedulerService.name);

  constructor(
    @Inject(MONITORS_REPOSITORY)
    private readonly repository: MonitorsRepository,
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

        if (secondsSince > m.intervalSeconds) {
          if (!m.alarmState) {
            this.logger.warn(`Alarm triggered for monitor ${m.uuid} (missed by ${secondsSince}s)`);
            // update alarmState to true
            await this.repository.update(m.uuid, {
              name: m.name,
              userId: m.userId,
              groupId: m.groupId,
              enabled: m.enabled,
              intervalSeconds: m.intervalSeconds,
              alarmState: true,
            });
          } else {
            // already in alarm state; still log at debug level
            this.logger.debug(`Monitor ${m.uuid} still in alarm state (missed by ${secondsSince}s)`);
          }
        }
      }
    } catch (err) {
      this.logger.error('Error running monitor scheduler', err as any);
    }
  }
}
