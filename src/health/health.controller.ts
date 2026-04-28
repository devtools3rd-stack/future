import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type HealthResponse = {
  status: 'ok';
  app: string;
  timestamp: string;
};

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      app: this.configService.get<string>('APP_NAME', 'crypto-signal-api'),
      timestamp: new Date().toISOString(),
    };
  }
}
