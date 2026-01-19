import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MaxLength, Matches, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateObjectDto {
  @ApiPropertyOptional({ description: 'Display name for UI', example: 'Contacts' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

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

  @ApiPropertyOptional({ description: 'Object settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Position in sidebar' })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ description: 'Archive the object' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
