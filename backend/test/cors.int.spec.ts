import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';

import { AppModule } from '../src/app.module';
import { enableAppCors } from '../src/common/cors';
import {
  TEST_FRONTEND_ORIGIN,
  TEST_POSTGRES_IMAGE,
  TEST_POSTGRES_INTERNAL_PORT,
} from './test-constants';
import { waitForPostgres } from './test-postgres';

type StartedPostgresContainer = Awaited<ReturnType<GenericContainer['start']>>;

describe('CORS', () => {
  let app: INestApplication;
  let container: StartedPostgresContainer;

  beforeAll(async () => {
    const username = 'test';
    const password = 'test';
    const database = 'testdb';

    container = await new GenericContainer(TEST_POSTGRES_IMAGE)
      .withEnvironment({
        POSTGRES_USER: username,
        POSTGRES_PASSWORD: password,
        POSTGRES_DB: database,
      })
      .withExposedPorts(TEST_POSTGRES_INTERNAL_PORT)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(TEST_POSTGRES_INTERNAL_PORT);

    await waitForPostgres({ host, port, user: username, password, database });

    process.env.POSTGRES_HOST = host;
    process.env.POSTGRES_PORT = String(port);
    process.env.POSTGRES_USER = username;
    process.env.POSTGRES_PASSWORD = password;
    process.env.POSTGRES_DB = database;

    process.env.CORS_ORIGIN = TEST_FRONTEND_ORIGIN;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    enableAppCors(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close().catch(() => undefined);
    await container?.stop().catch(() => undefined);
  });

  it('adds Access-Control-Allow-Origin for allowed origin', async () => {
    const origin = TEST_FRONTEND_ORIGIN;

    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', origin)
      .expect('Access-Control-Allow-Origin', origin);
  });

  it('responds to preflight request with CORS headers', async () => {
    const origin = TEST_FRONTEND_ORIGIN;

    await request(app.getHttpServer())
      .options('/products')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Allow-Origin', origin);
  });
});
