import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { IntegrationsController } from './integrations.controller';
import { AnalyticsController } from './analytics.controller';
import { IntegrationsService } from './integrations.service';
import { AnalyticsService } from './analytics.service';
import { KeitaroService } from './keitaro.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IntegrationsController, AnalyticsController],
  providers: [IntegrationsService, AnalyticsService, KeitaroService],
  exports: [IntegrationsService, AnalyticsService, KeitaroService],
})
export class IntegrationsModule {}
