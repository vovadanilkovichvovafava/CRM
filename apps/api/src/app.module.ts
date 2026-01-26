import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ObjectsModule } from './modules/objects/objects.module';
import { FieldsModule } from './modules/fields/fields.module';
import { RecordsModule } from './modules/records/records.module';
import { ViewsModule } from './modules/views/views.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { RelationsModule } from './modules/relations/relations.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FilesModule } from './modules/files/files.module';
import { UsersModule } from './modules/users/users.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { LeadScoringModule } from './modules/lead-scoring/lead-scoring.module';
import { WebmasterScoringModule } from './modules/webmaster-scoring/webmaster-scoring.module';

const logger = new Logger('AppModule');

// Conditionally include BullMQ only if Redis is configured
const optionalImports = [];

if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  logger.log('Redis configured, enabling BullMQ');
  optionalImports.push(
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
          },
    }),
  );
} else {
  logger.warn('Redis not configured, BullMQ disabled. Background jobs will not work.');
}

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Optional modules (like BullMQ)
    ...optionalImports,

    // Core modules
    PrismaModule,
    AuthModule,

    // CRM modules
    ObjectsModule,
    FieldsModule,
    RecordsModule,
    ViewsModule,
    PipelinesModule,
    ActivitiesModule,
    RelationsModule,

    // Collaboration
    CommentsModule,
    FilesModule,
    CollaborationModule,

    // Project Management
    ProjectsModule,
    TasksModule,

    // Users
    UsersModule,

    // Dashboard
    DashboardModule,

    // Notifications
    NotificationsModule,

    // Email
    EmailTemplatesModule,

    // Time Tracking
    TimeEntriesModule,

    // Workflows & Automations
    WorkflowsModule,

    // System Settings
    SystemSettingsModule,

    // Import/Export
    ImportExportModule,

    // Lead Scoring
    LeadScoringModule,

    // Webmaster Scoring
    WebmasterScoringModule,
  ],
})
export class AppModule {}
