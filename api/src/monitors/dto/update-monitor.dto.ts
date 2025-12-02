import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(1)
  intervalSeconds!: number;

  @IsBoolean()
  @IsOptional()
  alarmState?: boolean;
}
