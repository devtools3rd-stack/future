import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseCorsOrigins(value?: string): string[] {
  return value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : DEFAULT_CORS_ORIGINS;
}

export function configureApp(
  app: INestApplication,
  configService: ConfigService,
) {
  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('FRONTEND_ORIGINS')),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  configureApp(app, configService);

  await app.listen(port);
}

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
