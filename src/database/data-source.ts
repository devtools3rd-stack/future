import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SettingEntity } from '../settings/entities/setting.entity';
import { SignalEntity } from '../signals/entities/signal.entity';
import { StrategyConfigEntity } from '../strategies/entities/strategy-config.entity';
import { WatchlistEntity } from '../watchlist/entities/watchlist.entity';

loadEnv();

type DatabaseEnv = Partial<Record<string, string>>;

const DEFAULT_DATABASE_PORT = 5432;

function parseDatabasePort(value: string | undefined): number {
  const port = Number(value ?? DEFAULT_DATABASE_PORT);

  return Number.isNaN(port) ? DEFAULT_DATABASE_PORT : port;
}

function createSslOptions(
  env: DatabaseEnv,
): { rejectUnauthorized: false } | undefined {
  return env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;
}

export function createDataSourceOptions(
  env: DatabaseEnv = process.env,
): DataSourceOptions {
  const commonOptions = {
    type: 'postgres' as const,
    entities: [
      WatchlistEntity,
      StrategyConfigEntity,
      SignalEntity,
      SettingEntity,
    ],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    ssl: createSslOptions(env),
  };

  if (env.DATABASE_URL) {
    return {
      ...commonOptions,
      url: env.DATABASE_URL,
    };
  }

  return {
    ...commonOptions,
    host: env.DATABASE_HOST ?? 'localhost',
    port: parseDatabasePort(env.DATABASE_PORT),
    username: env.DATABASE_USER ?? 'postgres',
    password: env.DATABASE_PASSWORD ?? '',
    database: env.DATABASE_NAME ?? 'postgres',
  };
}

export default new DataSource(createDataSourceOptions());
