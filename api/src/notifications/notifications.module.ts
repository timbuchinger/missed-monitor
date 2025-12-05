import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsModule } from '../groups/groups.module';
import { Notification, NotificationSchema } from './notification.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  NOTIFICATIONS_REPOSITORY,
  MongoNotificationsRepository,
} from './notifications.repository';
import { NotificationRunnerService } from './notification-runner.service';

@Module({
  imports: [
    GroupsModule,
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationRunnerService,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useClass: MongoNotificationsRepository,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
