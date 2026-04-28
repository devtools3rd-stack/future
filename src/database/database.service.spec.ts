import { DataSource } from 'typeorm';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  it('logs database connection status on app bootstrap', () => {
    const dataSource = {
      isInitialized: true,
      options: {
        type: 'postgres',
        host: '10.2.12.36',
        port: 5432,
        database: 'db_huy',
      },
    } as unknown as DataSource;
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
    };
    const service = new DatabaseService(dataSource, logger);

    service.onApplicationBootstrap();

    expect(logger.log).toHaveBeenCalledWith(
      'Database connected: 10.2.12.36:5432/db_huy',
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
