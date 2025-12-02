import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../groups/group.schema';

@Schema({
  timestamps: true,
})
export class Notification {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Group.name }], default: [] })
  groupIds!: Types.ObjectId[];
}

export type NotificationDocument = Notification & Document;

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: Record<string, any>) => {
    ret.id = ret._id.toString();
    ret.groupIds = (ret.groupIds ?? []).map((id: Types.ObjectId) => id.toString());
    delete ret._id;
  },
});
