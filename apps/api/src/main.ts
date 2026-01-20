import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log(`Starting application...`);
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`PORT: ${process.env.PORT || 'not set, using default'}`);
  logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED!'}`);

  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set - running in DEMO mode');
  }

  const app = await NestFactory.create(AppModule);

  // Health check endpoint (before global prefix)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req: unknown, res: { json: (data: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Nexus CRM API')
    .setDescription('CRM + Project Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('objects', 'Custom objects management')
    .addTag('fields', 'Field definitions')
    .addTag('records', 'Record CRUD operations')
    .addTag('views', 'Custom views')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management')
    .addTag('pipelines', 'Sales pipelines')
    .addTag('auth', 'Authentication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`Frontend: http://localhost:${port}/`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
