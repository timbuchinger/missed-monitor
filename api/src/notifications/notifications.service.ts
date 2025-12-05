import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NOTIFICATIONS_REPOSITORY,
  NotificationRecord,
  NotificationsRepository,
} from './notifications.repository';
import { NotificationAlertContext, normalizeNotificationConfig } from './notification-types';
import { NotificationRunnerService } from './notification-runner.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepository,
    private readonly groupsService: GroupsService,
    private readonly runner: NotificationRunnerService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationRecord> {
    await this.groupsService.ensureGroupsExist(dto.groupIds);
    const config = normalizeNotificationConfig(dto.type, dto.config);
    return this.repository.create({
      name: dto.name,
      userId: dto.userId,
      groupIds: dto.groupIds,
      type: dto.type,
      config,
    });
  }

  findAll(): Promise<NotificationRecord[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<NotificationRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Notification ${id} was not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<NotificationRecord> {
    await this.groupsService.ensureGroupsExist(dto.groupIds);
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Notification ${id} was not found`);
    }

    if (existing.type !== dto.type) {
      throw new BadRequestException('Notification type cannot be changed');
    }

    const config = normalizeNotificationConfig(existing.type, dto.config);
    const updated = await this.repository.update(id, {
      name: dto.name,
      userId: dto.userId,
      groupIds: dto.groupIds,
      type: existing.type,
      config,
    });
    if (!updated) {
      throw new NotFoundException(`Notification ${id} was not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Notification ${id} was not found`);
    }
    await this.repository.delete(id);
  }

  async dispatchGroupAlert(groupId: string, context: NotificationAlertContext): Promise<void> {
    const notifications = await this.repository.findByGroupId(groupId);
    await Promise.all(
      notifications.map(async (notification) => {
        try {
          await this.runner.run(notification, context);
        } catch (error) {
          this.logger.error(
            `Failed to execute notification ${notification.id} (${notification.type})`,
            error as any,
          );
        }
      }),
    );
  }
}
