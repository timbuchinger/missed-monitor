import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsModule } from '../groups/groups.module';
import { Monitor, MonitorSchema } from './monitor.schema';
import { MonitorAckController, MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { MONITORS_REPOSITORY, MongoMonitorsRepository } from './monitors.repository';
import { MonitorSchedulerService } from './monitor-scheduler.service';

@Module({
  imports: [
    GroupsModule,
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
  ],
  controllers: [MonitorsController, MonitorAckController],
  providers: [
    MonitorsService,
    MonitorSchedulerService,
    {
      provide: MONITORS_REPOSITORY,
      useClass: MongoMonitorsRepository,
    },
  ],
})
export class MonitorsModule {}
