import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
  Matches,
} from 'class-validator';
import { ObjectType } from '../../../../generated/prisma';

export class CreateObjectDto {
  @ApiProperty({ description: 'Unique system name (lowercase, no spaces)', example: 'contacts' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Name must start with a letter and contain only lowercase letters, numbers, and underscores',
  })
  name: string;

  @ApiProperty({ description: 'Display name for UI', example: 'Contacts' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ enum: ObjectType, default: ObjectType.CUSTOM })
  @IsEnum(ObjectType)
  @IsOptional()
  type?: ObjectType;

  @ApiPropertyOptional({ description: 'Icon emoji or name', example: '👤' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ description: 'Hex color for UI', example: '#3B82F6' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
  color?: string;

  @ApiPropertyOptional({ description: 'Object settings', default: {} })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
