import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './group.schema';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GROUPS_REPOSITORY, MongoGroupsRepository } from './groups.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }])],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    {
      provide: GROUPS_REPOSITORY,
      useClass: MongoGroupsRepository,
    },
  ],
  exports: [GroupsService, GROUPS_REPOSITORY],
})
export class GroupsModule {}
