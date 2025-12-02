import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Monitor, MonitorDocument } from './monitor.schema';

export interface MonitorRecord {
  uuid: string;
  name: string;
  userId: string;
  groupId: string;
  enabled: boolean;
  intervalSeconds: number;
  alarmState: boolean;
  lastHeartbeat: Date | null;
}

export type MonitorCreateInput = Omit<MonitorRecord, 'lastHeartbeat'>;
export type MonitorUpdateInput = Omit<MonitorRecord, 'uuid' | 'lastHeartbeat'>;

export interface MonitorsRepository {
  create(data: MonitorCreateInput): Promise<MonitorRecord>;
  findAll(): Promise<MonitorRecord[]>;
  findByUuid(uuid: string): Promise<MonitorRecord | null>;
  update(uuid: string, data: MonitorUpdateInput): Promise<MonitorRecord | null>;
  delete(uuid: string): Promise<void>;
  acknowledge(uuid: string): Promise<MonitorRecord | null>;
}

export const MONITORS_REPOSITORY = Symbol('MONITORS_REPOSITORY');

@Injectable()
export class MongoMonitorsRepository implements MonitorsRepository {
  constructor(@InjectModel(Monitor.name) private readonly model: Model<MonitorDocument>) {}

  async create(data: MonitorCreateInput): Promise<MonitorRecord> {
    const doc = await this.model.create({
      ...data,
      groupId: new Types.ObjectId(data.groupId),
    });
    return this.toRecord(doc);
  }

  async findAll(): Promise<MonitorRecord[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findByUuid(uuid: string): Promise<MonitorRecord | null> {
    const doc = await this.model.findOne({ uuid }).exec();
    return doc ? this.toRecord(doc) : null;
  }

  async update(uuid: string, data: MonitorUpdateInput): Promise<MonitorRecord | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { uuid },
        { ...data, groupId: new Types.ObjectId(data.groupId) },
        { new: true },
      )
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  async delete(uuid: string): Promise<void> {
    await this.model.deleteOne({ uuid }).exec();
  }

  async acknowledge(uuid: string): Promise<MonitorRecord | null> {
    const doc = await this.model
      .findOneAndUpdate({ uuid }, { lastHeartbeat: new Date() }, { new: true })
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  private toRecord(doc: MonitorDocument): MonitorRecord {
    return {
      uuid: doc.uuid,
      name: doc.name,
      userId: doc.userId,
      groupId: doc.groupId.toString(),
      enabled: doc.enabled,
      intervalSeconds: doc.intervalSeconds,
      alarmState: doc.alarmState ?? false,
      lastHeartbeat: doc.lastHeartbeat ?? null,
    };
  }
}
