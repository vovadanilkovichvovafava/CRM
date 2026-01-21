import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @ApiProperty({ description: 'Source column name from file' })
  @IsString()
  sourceColumn!: string;

  @ApiProperty({ description: 'Target field name in CRM' })
  @IsString()
  targetField!: string;

  @ApiPropertyOptional({ enum: ['none', 'lowercase', 'uppercase', 'trim'] })
  @IsOptional()
  @IsEnum(['none', 'lowercase', 'uppercase', 'trim'])
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim';
}

export class ImportOptionsDto {
  @ApiPropertyOptional({ description: 'Skip duplicate records based on unique fields' })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({ description: 'Update existing records if duplicate found' })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;
}

export class ImportDataDto {
  @ApiProperty({ description: 'Object ID to import into' })
  @IsString()
  objectId!: string;

  @ApiProperty({ description: 'Parsed rows from file', type: 'array' })
  @IsArray()
  rows!: Record<string, string>[];

  @ApiProperty({ description: 'Column to field mappings', type: [ColumnMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  mappings!: ColumnMappingDto[];

  @ApiPropertyOptional({ description: 'Import options' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImportOptionsDto)
  options?: ImportOptionsDto;
}

export class ExportOptionsDto {
  @ApiProperty({ description: 'Export format', enum: ['csv', 'xlsx'] })
  @IsEnum(['csv', 'xlsx'])
  format!: 'csv' | 'xlsx';

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Filters to apply' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}

export interface ImportPreviewResponse {
  totalRows: number;
  headers: string[];
  sampleData: Record<string, string>[];
  suggestedMappings: ColumnMappingDto[];
}

export interface ImportResultResponse {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export interface AvailableObjectResponse {
  id: string;
  name: string;
  displayName: string;
  icon: string | null;
  recordCount: number;
}

export interface ObjectFieldResponse {
  name: string;
  displayName: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
}
