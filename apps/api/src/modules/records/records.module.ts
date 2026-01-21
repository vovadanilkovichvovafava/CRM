import { Module, forwardRef } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { ValidationService } from './validation.service';
import { AuthModule } from '../auth/auth.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [AuthModule, forwardRef(() => WorkflowsModule)],
  controllers: [RecordsController],
  providers: [RecordsService, ValidationService],
  exports: [RecordsService, ValidationService],
})
export class RecordsModule {}
