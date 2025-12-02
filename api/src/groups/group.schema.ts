import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Group {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  userId!: string;
}

export type GroupDocument = Group & Document;

export const GroupSchema = SchemaFactory.createForClass(Group);

GroupSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_: unknown, ret: Record<string, any>) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});
