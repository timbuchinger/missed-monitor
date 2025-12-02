import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NOTIFICATIONS_REPOSITORY,
  NotificationRecord,
  NotificationsRepository,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepository,
    private readonly groupsService: GroupsService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationRecord> {
    await this.groupsService.ensureGroupsExist(dto.groupIds);
    return this.repository.create(dto);
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
    const updated = await this.repository.update(id, dto);
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
}
