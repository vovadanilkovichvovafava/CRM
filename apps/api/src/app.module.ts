import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';
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

    // Serve static frontend files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web-static'),
      exclude: ['/api/{*path}', '/socket.io/{*path}'],
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
  ],
})
export class AppModule {}
