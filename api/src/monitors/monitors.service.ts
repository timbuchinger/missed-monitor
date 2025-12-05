import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { GroupsService } from '../groups/groups.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import {
  MONITORS_REPOSITORY,
  MonitorRecord,
  MonitorsRepository,
} from './monitors.repository';

@Injectable()
export class MonitorsService {
  constructor(
    @Inject(MONITORS_REPOSITORY)
    private readonly repository: MonitorsRepository,
    private readonly groupsService: GroupsService,
  ) {}

  async create(dto: CreateMonitorDto): Promise<MonitorRecord> {
    const existing = await this.repository.findByUuid(dto.uuid);
    if (existing) {
      throw new ConflictException(`Monitor ${dto.uuid} already exists`);
    }
    await this.groupsService.ensureGroupExists(dto.groupId);
    return this.repository.create({
      uuid: dto.uuid,
      name: dto.name,
      userId: dto.userId,
      groupId: dto.groupId,
      enabled: dto.enabled,
      intervalSeconds: dto.intervalSeconds,
      alarmState: dto.alarmState ?? false,
    });
  }

  findAll(): Promise<MonitorRecord[]> {
    return this.repository.findAll();
  }

  async findOne(uuid: string): Promise<MonitorRecord> {
    const monitor = await this.repository.findByUuid(uuid);
    if (!monitor) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }
    return monitor;
  }

  async update(uuid: string, dto: UpdateMonitorDto): Promise<MonitorRecord> {
    await this.groupsService.ensureGroupExists(dto.groupId);
    const monitor = await this.repository.findByUuid(uuid);
    if (!monitor) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }

    if (dto.alarmState !== undefined && dto.alarmState !== monitor.alarmState) {
      monitor.history.push({
        status: dto.alarmState ? 'triggered' : 'suppressed',
        timestamp: new Date(),
      });
    }

    const updated = await this.repository.update(uuid, {
      name: dto.name,
      userId: dto.userId,
      groupId: dto.groupId,
      enabled: dto.enabled,
      intervalSeconds: dto.intervalSeconds,
      alarmState: dto.alarmState ?? monitor.alarmState ?? false,
    });
    if (!updated) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }
    return updated;
  }

  async remove(uuid: string): Promise<void> {
    const monitor = await this.repository.findByUuid(uuid);
    if (!monitor) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }
    await this.repository.delete(uuid);
  }

  async acknowledge(uuid: string): Promise<MonitorRecord> {
    const tracer = trace.getTracer('missed-monitor');
    return await tracer.startActiveSpan('monitors.acknowledge', async (span) => {
      span.setAttribute('monitor.uuid', uuid);
      try {
        const monitor = await this.repository.findByUuid(uuid);
        if (!monitor) {
          throw new NotFoundException(`Monitor ${uuid} was not found`);
        }

        monitor.alarmState = false;
        monitor.lastHeartbeat = new Date();
        monitor.history.push({
          status: 'reset',
          timestamp: new Date(),
        });

        const updated = await this.repository.update(uuid, monitor);
        if (!updated) {
          throw new NotFoundException(`Monitor ${uuid} was not found`);
        }
        return updated;
      } catch (err) {
        span.recordException(err as any);
        throw err;
      } finally {
        span.end();
      }
    });
  }

  async suppress(uuid: string): Promise<MonitorRecord> {
    const monitor = await this.repository.findByUuid(uuid);
    if (!monitor) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }

    monitor.alarmState = false;
    monitor.history.push({
      status: 'suppressed',
      timestamp: new Date(),
    });

    const updated = await this.repository.update(uuid, monitor);
    if (!updated) {
      throw new NotFoundException(`Monitor ${uuid} was not found`);
    }
    return updated;
  }
}
