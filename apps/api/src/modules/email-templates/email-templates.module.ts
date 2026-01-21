import { Module } from '@nestjs/common';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { EmailSendingService } from './email-sending.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, AuthModule, FilesModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, EmailSendingService],
  exports: [EmailTemplatesService, EmailSendingService],
})
export class EmailTemplatesModule {}
