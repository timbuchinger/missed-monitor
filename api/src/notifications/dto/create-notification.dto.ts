import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
} from 'class-validator';
import { NotificationType } from '../notification-types';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  groupIds!: string[];

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsObject()
  config!: Record<string, unknown>;
}
