import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { configureApp } from './main';

describe('main application configuration', () => {
  it('enables CORS for local frontend origins', () => {
    const enableCors = jest.fn();
    const useGlobalPipes = jest.fn();
    const app = {
      enableCors,
      useGlobalPipes,
    } as unknown as INestApplication;
    const configService = {
      get: jest.fn().mockImplementation((key: string, fallback?: unknown) => {
        if (key === 'FRONTEND_ORIGINS') {
          return fallback;
        }

        return fallback;
      }),
    } as unknown as ConfigService;

    configureApp(app, configService);

    expect(enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    });
    expect(useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
  });
});
