import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRelationsDto {
  @ApiPropertyOptional({ description: 'Filter by record ID' })
  @IsString()
  @IsOptional()
  recordId?: string;

  @ApiPropertyOptional({ description: 'Filter by relation type' })
  @IsString()
  @IsOptional()
  relationType?: string;
}
