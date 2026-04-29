import { ConfigService } from '@nestjs/config';
import { createTypeOrmOptions } from './typeorm.options';

describe('createTypeOrmOptions', () => {
  function createConfigService(values: Record<string, string>) {
    return {
      get: jest.fn((key: string, defaultValue?: string) => {
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;
  }

  it('creates PostgreSQL options from environment config', () => {
    const values: Record<string, string> = {
      DATABASE_HOST: '10.2.12.36',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'root',
      DATABASE_PASSWORD: '123456aA',
      DATABASE_NAME: 'db_huy',
    };

    const configService = createConfigService(values);

    const options = createTypeOrmOptions(configService);

    expect(options).toMatchObject({
      type: 'postgres',
      host: '10.2.12.36',
      port: 5432,
      username: 'root',
      password: '123456aA',
      database: 'db_huy',
      autoLoadEntities: true,
      synchronize: false,
    });
  });

  it('prefers DATABASE_URL over discrete connection fields', () => {
    const configService = createConfigService({
      DATABASE_URL: 'postgres://user:pass@db.example.com:5432/app',
      DATABASE_HOST: 'ignored-host',
      DATABASE_PORT: '1111',
      DATABASE_USER: 'ignored-user',
      DATABASE_PASSWORD: 'ignored-password',
      DATABASE_NAME: 'ignored-name',
    });

    const options = createTypeOrmOptions(configService);

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgres://user:pass@db.example.com:5432/app',
      autoLoadEntities: true,
      synchronize: false,
    });
    expect('host' in options).toBe(false);
  });

  it('enables PostgreSQL SSL when DATABASE_SSL is true', () => {
    const configService = createConfigService({
      DATABASE_URL: 'postgres://user:pass@db.example.com:5432/app',
      DATABASE_SSL: 'true',
    });

    const options = createTypeOrmOptions(configService);

    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });
});
