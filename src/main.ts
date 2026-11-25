import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Ensure BigInt (e.g. ActivityLog ID) serializes cleanly to JSON string
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Configuration: Dynamic whitelist supporting development, production domains, and env overrides
  const envAllowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile clients, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*localhost:5173$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1:5173$/.test(origin) ||
        /^https?:\/\/(?:localhost|127\.0\.0\.1):(3000|3001)$/.test(origin) ||
        /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*unilms\.(?:com|io|in|app)$/.test(origin) ||
        envAllowed.includes(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      // Reject non-whitelisted origins gracefully without throwing server exceptions
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-Code',
      'X-Tenant-ID',
      'X-Tenant-Domain',
      'x-tenant-code',
      'x-tenant-id',
      'x-tenant-domain',
      'X-API-Key',
      'x-api-key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // Global prefix for all API endpoints
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global Response Envelope Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Exception Filter for symmetrical error structures
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('UniLMS Multi-Tenant Enterprise API')
    .setDescription('Unified REST API for UniLMS SaaS & PaaS Architecture')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Tenant-Code', in: 'header' }, 'X-Tenant-Code')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 UniLMS Backend running on: http://localhost:${port}/api/v1`);
  console.log(`📑 Interactive Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
