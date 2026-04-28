import { HealthController } from './health.controller';
import { HealthResponse, HealthService } from './health.service';

describe('HealthController', () => {
  it('returns app health status', async () => {
    const health: HealthResponse = {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      env: 'test',
    };
    const getHealth = jest.fn().mockResolvedValue(health);
    const healthService = {
      getHealth,
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.env).toBe('test');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    expect(getHealth).toHaveBeenCalledTimes(1);
  });
});
