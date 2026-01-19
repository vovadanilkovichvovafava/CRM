import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdateRecordDto {
  @ApiPropertyOptional({ description: 'Record data as key-value pairs' })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Stage for pipeline objects' })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ description: 'Owner user ID' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Archive the record' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
