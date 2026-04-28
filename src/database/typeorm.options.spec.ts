import { ConfigService } from '@nestjs/config';
import { createTypeOrmOptions } from './typeorm.options';

describe('createTypeOrmOptions', () => {
  it('creates PostgreSQL options from environment config', () => {
    const values: Record<string, string> = {
      DATABASE_HOST: '10.2.12.36',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'root',
      DATABASE_PASSWORD: '123456aA',
      DATABASE_NAME: 'db_huy',
    };

    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

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
});
