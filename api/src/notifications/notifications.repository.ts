import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './notification.schema';

export interface NotificationRecord {
  id: string;
  name: string;
  userId: string;
  groupIds: string[];
}

export interface NotificationsRepository {
  create(data: Omit<NotificationRecord, 'id'>): Promise<NotificationRecord>;
  findAll(): Promise<NotificationRecord[]>;
  findById(id: string): Promise<NotificationRecord | null>;
  update(
    id: string,
    data: Omit<NotificationRecord, 'id'>,
  ): Promise<NotificationRecord | null>;
  delete(id: string): Promise<void>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

@Injectable()
export class MongoNotificationsRepository implements NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(data: Omit<NotificationRecord, 'id'>): Promise<NotificationRecord> {
    const doc = await this.model.create({
      ...data,
      groupIds: data.groupIds.map((id) => new Types.ObjectId(id)),
    });
    return this.toRecord(doc);
  }

  async findAll(): Promise<NotificationRecord[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toRecord(doc) : null;
  }

  async update(
    id: string,
    data: Omit<NotificationRecord, 'id'>,
  ): Promise<NotificationRecord | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { ...data, groupIds: data.groupIds.map((gid) => new Types.ObjectId(gid)) },
        { new: true },
      )
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  private toRecord(doc: NotificationDocument): NotificationRecord {
    return {
      id: doc._id.toString(),
      name: doc.name,
      userId: doc.userId,
      groupIds: (doc.groupIds ?? []).map((gid) => gid.toString()),
    };
  }
}
