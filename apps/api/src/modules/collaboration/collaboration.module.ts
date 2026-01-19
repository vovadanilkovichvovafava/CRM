import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { PresenceService } from './presence.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CollaborationGateway, PresenceService],
  exports: [CollaborationGateway, PresenceService],
})
export class CollaborationModule {}
