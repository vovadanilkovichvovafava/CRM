import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Log environment for debugging startup issues
  logger.log(`Starting application...`);
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`PORT: ${process.env.PORT || 'not set, using default'}`);
  logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED!'}`);
  logger.log(`REDIS_HOST: ${process.env.REDIS_HOST || 'not set'}`);
  logger.log(`REDIS_URL: ${process.env.REDIS_URL ? 'configured' : 'not set'}`);

  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set - running in DEMO mode');
  }

  const app = await NestFactory.create(AppModule);

  // Health check endpoint (before global prefix)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req: unknown, res: { json: (data: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root endpoint - welcome page
  expressApp.get('/', (_req: unknown, res: { send: (data: string) => void }) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Enterprise CRM API</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            a { color: #3B82F6; }
            .links { margin-top: 20px; }
            .links a { display: block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Enterprise CRM API</h1>
          <p>API server is running successfully.</p>
          <div class="links">
            <a href="/api/docs">API Documentation (Swagger)</a>
            <a href="/api/health">Health Check</a>
            <a href="/api/objects">Objects API</a>
          </div>
        </body>
      </html>
    `);
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

  // CORS - allow all origins for demo
  app.enableCors({
    origin: true,
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

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
