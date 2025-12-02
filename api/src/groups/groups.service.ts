import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  GROUPS_REPOSITORY,
  GroupRecord,
  GroupsRepository,
} from './groups.repository';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(GROUPS_REPOSITORY) private readonly repository: GroupsRepository,
  ) {}

  create(dto: CreateGroupDto): Promise<GroupRecord> {
    return this.repository.create(dto);
  }

  findAll(): Promise<GroupRecord[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<GroupRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Group ${id} was not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupRecord> {
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Group ${id} was not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Group ${id} was not found`);
    }
    await this.repository.delete(id);
  }

  async ensureGroupExists(id: string): Promise<GroupRecord> {
    return this.findOne(id);
  }

  async ensureGroupsExist(ids: string[]): Promise<void> {
    const checks = await Promise.all(ids.map((id) => this.repository.findById(id)));
    const missingIndex = checks.findIndex((group) => !group);
    if (missingIndex !== -1) {
      throw new NotFoundException(`Group ${ids[missingIndex]} was not found`);
    }
  }
}
