import { createDataSourceOptions } from './data-source';

describe('createDataSourceOptions', () => {
  it('uses DATABASE_URL when provided', () => {
    const options = createDataSourceOptions({
      DATABASE_URL: 'postgres://user:pass@example.com:5432/app',
      DATABASE_HOST: 'ignored-host',
      DATABASE_PORT: '1111',
      DATABASE_USER: 'ignored-user',
      DATABASE_PASSWORD: 'ignored-password',
      DATABASE_NAME: 'ignored-name',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgres://user:pass@example.com:5432/app',
      synchronize: false,
    });
    expect('host' in options).toBe(false);
  });

  it('uses discrete DATABASE_* values when DATABASE_URL is not provided', () => {
    const options = createDataSourceOptions({
      DATABASE_HOST: '10.2.12.36',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'root',
      DATABASE_PASSWORD: '123456aA',
      DATABASE_NAME: 'db_huy',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      host: '10.2.12.36',
      port: 5432,
      username: 'root',
      password: '123456aA',
      database: 'db_huy',
      synchronize: false,
    });
  });

  it('enables postgres SSL when DATABASE_SSL is true', () => {
    const options = createDataSourceOptions({
      DATABASE_URL: 'postgres://user:pass@example.com:5432/app',
      DATABASE_SSL: 'true',
    });

    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('loads only timestamped migration files', () => {
    const options = createDataSourceOptions();

    expect(options.migrations).toEqual([
      'src/database/migrations/[0-9]*-*.{ts,js}',
    ]);
  });
});
