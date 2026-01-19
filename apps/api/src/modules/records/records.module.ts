import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { ValidationService } from './validation.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RecordsController],
  providers: [RecordsService, ValidationService],
  exports: [RecordsService, ValidationService],
})
export class RecordsModule {}
