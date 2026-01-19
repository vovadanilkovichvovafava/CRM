import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
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
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Enterprise CRM API')
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

  // Railway uses PORT, fallback to API_PORT or 3001
  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
