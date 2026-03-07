import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Global prefixes and versioning (/api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS config
  app.enableCors({
    origin: '*', // Restrict in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip un-decorated properties
      forbidNonWhitelisted: true, // Throw error on stripped properties
      transform: true,       // Auto-transform payloads to DTO instances
    }),
  );

  // Global Exception Filter (RFC 7807 Problem Details)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Driverless API')
    .setDescription('The Driverless ride-hailing core platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Driverless API running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
