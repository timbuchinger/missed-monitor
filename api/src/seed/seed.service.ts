import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DEFAULT_USER_ID } from '../constants/default-user';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly groupsService: GroupsService) {}

  async onModuleInit() {
    await this.ensureDefaultGroup();
  }

  private async ensureDefaultGroup() {
    const groups = await this.groupsService.findAll();
    const existing = groups.find(
      (group) => group.userId === DEFAULT_USER_ID && group.name === 'Default',
    );
    if (!existing) {
      await this.groupsService.create({ name: 'Default', userId: DEFAULT_USER_ID });
      this.logger.log('Seeded default group for default user');
    }
  }
}
