import { BadRequestException } from '@nestjs/common';

export enum NotificationType {
  Logger = 'logger',
  Discord = 'discord',
}

export interface LoggerNotificationConfig {
  content: string;
}

export interface DiscordNotificationConfig {
  webhookUrl: string;
}

export type NotificationConfig = LoggerNotificationConfig | DiscordNotificationConfig;

export interface NotificationAlertContext {
  monitorUuid: string;
  monitorName: string;
  groupId: string;
  missedForSeconds: number;
  triggeredAt: Date;
}

export const normalizeNotificationConfig = (
  type: NotificationType,
  raw: unknown,
): NotificationConfig => {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Notification config must be an object');
  }

  if (type === NotificationType.Logger) {
    const rawContent = (raw as Record<string, unknown>).content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    return { content };
  }

  if (type === NotificationType.Discord) {
    const webhookUrl = String((raw as Record<string, unknown>).webhookUrl ?? '').trim();
    if (!webhookUrl) {
      throw new BadRequestException('Discord webhook URL is required');
    }

    try {
      new URL(webhookUrl);
    } catch {
      throw new BadRequestException('Discord webhook URL must be a valid URL');
    }

    return { webhookUrl };
  }

  throw new BadRequestException(`Unsupported notification type: ${type}`);
};
