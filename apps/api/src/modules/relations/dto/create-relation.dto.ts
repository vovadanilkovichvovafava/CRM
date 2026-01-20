import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationDto {
  @ApiProperty({ description: 'Source record ID' })
  @IsString()
  @IsNotEmpty()
  fromRecordId!: string;

  @ApiProperty({ description: 'Target record ID' })
  @IsString()
  @IsNotEmpty()
  toRecordId!: string;

  @ApiProperty({ description: 'Type of relation (e.g., "company", "contact", "deal")' })
  @IsString()
  @IsNotEmpty()
  relationType!: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the relation' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
