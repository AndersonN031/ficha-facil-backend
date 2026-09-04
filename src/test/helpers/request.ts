import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

type SupertestApp = Parameters<typeof request>[0];

export function req(app: INestApplication) {
  const server = app.getHttpServer() as SupertestApp;

  return request(server);
}
