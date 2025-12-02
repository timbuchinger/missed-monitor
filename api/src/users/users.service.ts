import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_USER_ID } from '../constants/default-user';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.ensureDefaultUser();
  }

  private async ensureDefaultUser() {
    await this.userModel
      .updateOne(
        { userId: DEFAULT_USER_ID },
        {
          userId: DEFAULT_USER_ID,
          name: 'Missed Monitor User',
        },
        { upsert: true },
      )
      .exec();
  }
}
