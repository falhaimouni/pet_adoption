import 'reflect-metadata'; // Must be the first import
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //helps application shut down cleanly when the process is stopped. (for docker and DB connections)
  app.enableShutdownHooks();
  //middleware that adds security headers to each response
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Crucial: This enables the @IsEmail, @MinLength, etc. validations in your DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Allow the frontend to call this backend from a different port during development
  const configService = app.get(ConfigService);

  // Allow the frontend to call this backend from a different port during development
  const frontendOrigins = (
    configService.get<string>('FRONTEND_URLS') ??
    configService.get<string>('FRONTEND_URL') ??
    'http://localhost:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
