import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok when database query succeeds', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const dataSource = {
      query,
    } as unknown as DataSource;
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'NODE_ENV') {
          return 'test';
        }

        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new HealthService(dataSource, configService);

    const result = await service.getHealth();

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.env).toBe('test');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    expect('error' in result).toBe(false);
  });

  it('returns degraded when database query fails', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('connection failed')),
    } as unknown as DataSource;
    const configService = {
      get: jest.fn((key: string, fallback?: string) => fallback),
    } as unknown as ConfigService;
    const service = new HealthService(dataSource, configService);

    const result = await service.getHealth();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('error');
    expect(result.env).toBe('development');
    expect(result.error).toBe('database_unavailable');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
