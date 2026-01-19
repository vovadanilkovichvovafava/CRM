import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { FieldType } from '../../../../generated/prisma';

export class CreateFieldDto {
  @ApiProperty({ description: 'Object ID this field belongs to' })
  @IsString()
  @IsNotEmpty()
  objectId!: string;

  @ApiProperty({ description: 'Field system name', example: 'email' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Name must start with a letter and contain only lowercase letters, numbers, and underscores',
  })
  name!: string;

  @ApiProperty({ description: 'Display name', example: 'Email Address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @ApiProperty({ enum: FieldType, description: 'Field type' })
  @IsEnum(FieldType)
  type!: FieldType;

  @ApiPropertyOptional({ description: 'Type-specific configuration' })
  @IsObject()
  @IsOptional()
  config?: FieldConfig;

  @ApiPropertyOptional({ description: 'Is field required', default: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Is field unique', default: false })
  @IsBoolean()
  @IsOptional()
  isUnique?: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsString()
  @IsOptional()
  defaultValue?: string;
}

// Field configuration types
export interface FieldConfig {
  // SELECT / MULTI_SELECT
  options?: Array<{ value: string; label: string; color?: string }>;

  // RELATION
  relatedObjectId?: string;
  relatedFieldId?: string;
  relationshipType?: 'one_to_one' | 'one_to_many' | 'many_to_many';

  // NUMBER / DECIMAL / CURRENCY
  min?: number;
  max?: number;
  precision?: number;

  // CURRENCY
  currency?: string;

  // TEXT / LONG_TEXT
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // FORMULA
  formula?: string;

  // FILE
  allowedTypes?: string[];
  maxSize?: number;

  // RATING
  maxRating?: number;

  // DATE / DATETIME
  dateFormat?: string;

  // URL
  allowedDomains?: string[];

  // General
  placeholder?: string;
  helpText?: string;
}
