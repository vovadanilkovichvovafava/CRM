import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({ description: 'Object ID this record belongs to' })
  @IsString()
  @IsNotEmpty()
  objectId: string;

  @ApiProperty({ description: 'Record data as key-value pairs', example: { name: 'John Doe', email: 'john@example.com' } })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Initial stage for pipeline objects' })
  @IsString()
  @IsOptional()
  stage?: string;
}
