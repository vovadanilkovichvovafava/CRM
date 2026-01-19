import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { FieldConfig } from './create-field.dto';

export class UpdateFieldDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Email Address' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Type-specific configuration' })
  @IsObject()
  @IsOptional()
  config?: FieldConfig;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Is field unique' })
  @IsBoolean()
  @IsOptional()
  isUnique?: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional({ description: 'Position in field list' })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
