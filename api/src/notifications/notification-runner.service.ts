import { Injectable, Logger } from '@nestjs/common';
import { NotificationRecord } from './notifications.repository';
import {
  DiscordNotificationConfig,
  LoggerNotificationConfig,
  NotificationAlertContext,
  NotificationType,
} from './notification-types';

@Injectable()
export class NotificationRunnerService {
  private readonly logger = new Logger(NotificationRunnerService.name);

  async run(notification: NotificationRecord, context: NotificationAlertContext): Promise<void> {
    if (notification.type === NotificationType.Logger) {
      this.emitLogger(notification, context);
      return;
    }

    if (notification.type === NotificationType.Discord) {
      await this.emitDiscord(notification, context);
      return;
    }

    this.logger.warn(`Unsupported notification type ${notification.type} for ${notification.id}`);
  }

  private emitLogger(notification: NotificationRecord, context: NotificationAlertContext) {
    const config = notification.config as LoggerNotificationConfig;
    const userContent = (config.content ?? '').trim();
    const message = [userContent, this.formatAlertDetails(context)].filter(Boolean).join(' - ');
    this.logger.warn(`[${notification.name}] ${message}`);
  }

  private async emitDiscord(
    notification: NotificationRecord,
    context: NotificationAlertContext,
  ): Promise<void> {
    const config = notification.config as DiscordNotificationConfig;
    const content = [
      `:rotating_light: ${notification.name} alert`,
      this.formatAlertDetails(context),
    ].join('\n');

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Discord webhook error (${response.status}): ${errorText || response.statusText}`,
      );
    }
  }

  private formatAlertDetails(context: NotificationAlertContext): string {
    const timestamp = context.triggeredAt.toISOString();
    return `Monitor ${context.monitorName} (${context.monitorUuid}) missed heartbeat for ${context.missedForSeconds}s in group ${context.groupId} at ${timestamp}`;
  }
}
