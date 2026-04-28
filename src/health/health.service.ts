import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

type HealthStatus = 'ok' | 'degraded';
type DatabaseStatus = 'connected' | 'error';

export type HealthResponse = {
  status: HealthStatus;
  database: DatabaseStatus;
  timestamp: string;
  env: string;
  error?: 'database_unavailable';
};

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();
    const env = this.configService.get<string>('NODE_ENV', 'development');

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        database: 'connected',
        timestamp,
        env,
      };
    } catch {
      return {
        status: 'degraded',
        database: 'error',
        timestamp,
        env,
        error: 'database_unavailable',
      };
    }
  }
}
