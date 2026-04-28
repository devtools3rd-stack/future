import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const DEFAULT_DATABASE_PORT = 5432;

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const port = Number(
    configService.get<string>('DATABASE_PORT', String(DEFAULT_DATABASE_PORT)),
  );
  const ssl =
    configService.get<string>('DATABASE_SSL', 'false') === 'true'
      ? { rejectUnauthorized: false }
      : undefined;

  const commonOptions = {
    type: 'postgres' as const,
    autoLoadEntities: true,
    synchronize: false,
    ssl,
  };

  if (databaseUrl) {
    return {
      ...commonOptions,
      url: databaseUrl,
    };
  }

  return {
    ...commonOptions,
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: Number.isNaN(port) ? DEFAULT_DATABASE_PORT : port,
    username: configService.get<string>('DATABASE_USER', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', ''),
    database: configService.get<string>('DATABASE_NAME', 'postgres'),
  };
}
