import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './group.schema';

export interface GroupRecord {
  id: string;
  name: string;
  userId: string;
}

export interface GroupsRepository {
  create(data: Omit<GroupRecord, 'id'>): Promise<GroupRecord>;
  findAll(): Promise<GroupRecord[]>;
  findById(id: string): Promise<GroupRecord | null>;
  update(id: string, data: Omit<GroupRecord, 'id'>): Promise<GroupRecord | null>;
  delete(id: string): Promise<void>;
}

export const GROUPS_REPOSITORY = Symbol('GROUPS_REPOSITORY');

@Injectable()
export class MongoGroupsRepository implements GroupsRepository {
  constructor(@InjectModel(Group.name) private readonly model: Model<GroupDocument>) {}

  async create(data: Omit<GroupRecord, 'id'>): Promise<GroupRecord> {
    const created = await this.model.create(data);
    return this.toRecord(created);
  }

  async findAll(): Promise<GroupRecord[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findById(id: string): Promise<GroupRecord | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toRecord(doc) : null;
  }

  async update(id: string, data: Omit<GroupRecord, 'id'>): Promise<GroupRecord | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    return doc ? this.toRecord(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  private toRecord(doc: GroupDocument): GroupRecord {
    return {
      id: doc._id.toString(),
      name: doc.name,
      userId: doc.userId,
    };
  }
}
