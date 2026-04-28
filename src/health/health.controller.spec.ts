import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns app health status', () => {
    const controller = new HealthController(new ConfigService());

    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.app).toBe('crypto-signal-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
