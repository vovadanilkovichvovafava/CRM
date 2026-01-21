import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WebmasterScoringController } from './webmaster-scoring.controller';
import { WebmasterScoringService } from './webmaster-scoring.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WebmasterScoringController],
  providers: [WebmasterScoringService],
  exports: [WebmasterScoringService],
})
export class WebmasterScoringModule {}
