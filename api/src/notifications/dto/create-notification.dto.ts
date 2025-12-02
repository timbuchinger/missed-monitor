import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

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
}
