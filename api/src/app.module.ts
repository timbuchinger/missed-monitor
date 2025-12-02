import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { GroupsModule } from './groups/groups.module';
import { MonitorsModule } from './monitors/monitors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri =
          process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/missed-monitor';

        const options: MongooseModuleOptions = {
          uri,
        };

        if (process.env.MONGODB_DB) {
          options.dbName = process.env.MONGODB_DB;
        }

        if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
          options.auth = {
            username: process.env.MONGODB_USER,
            password: process.env.MONGODB_PASSWORD,
          };
        }

        if (process.env.MONGODB_AUTH_SOURCE) {
          options.authSource = process.env.MONGODB_AUTH_SOURCE;
        }

        return options;
      },
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    GroupsModule,
    MonitorsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
