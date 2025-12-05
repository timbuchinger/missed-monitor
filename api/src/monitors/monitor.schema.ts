import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../groups/group.schema';

@Schema({
  timestamps: true,
})
export class Monitor {
  @Prop({ required: true, unique: true })
  uuid!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ type: Types.ObjectId, ref: Group.name, required: true })
  groupId!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastHeartbeat?: Date | null;

  @Prop({ type: Boolean, required: true })
  enabled!: boolean;

  @Prop({ type: Number, required: true })
  intervalSeconds!: number;

  @Prop({ type: Boolean, default: false })
  alarmState!: boolean;

  @Prop({
    type: [
      {
        timestamp: { type: Date, required: true },
        status: { type: String, enum: ['triggered', 'reset', 'suppressed'], required: true },
      },
    ],
    default: [],
  })
  history!: { timestamp: Date; status: 'triggered' | 'reset' | 'suppressed' }[];
}

export type MonitorDocument = Monitor & Document;

export const MonitorSchema = SchemaFactory.createForClass(Monitor);

MonitorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: Record<string, any>) => {
    ret.id = ret._id?.toString?.();
    ret.groupId = ret.groupId?.toString?.();
    delete ret._id;
  },
});
