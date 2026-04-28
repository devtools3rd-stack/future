import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type HealthResponse = {
  status?: unknown;
  database?: unknown;
  timestamp?: unknown;
  env?: unknown;
  error?: unknown;
};

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as HealthResponse;

        expect(body.status).toBe('ok');
        expect(body.database).toBe('connected');
        expect(body.env).toBe('test');
        expect(body.error).toBeUndefined();
        expect(typeof body.timestamp).toBe('string');

        if (typeof body.timestamp !== 'string') {
          throw new Error('Expected timestamp to be a string');
        }

        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
