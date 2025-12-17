import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';

import { AppModule } from '../src/app.module';
import { enableAppCors } from '../src/common/cors';

type StartedPostgresContainer = Awaited<ReturnType<GenericContainer['start']>>;

async function waitForPostgres(opts: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  let lastError: unknown;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const client = new Client({
        host: opts.host,
        port: opts.port,
        user: opts.user,
        password: opts.password,
        database: opts.database,
      });

      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, 300));
    }
  }

  throw lastError;
}

describe('CORS', () => {
  let app: INestApplication;
  let container: StartedPostgresContainer;

  beforeAll(async () => {
    const username = 'test';
    const password = 'test';
    const database = 'testdb';

    container = await new GenericContainer('postgres:18-alpine')
      .withEnvironment({
        POSTGRES_USER: username,
        POSTGRES_PASSWORD: password,
        POSTGRES_DB: database,
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);

    await waitForPostgres({ host, port, user: username, password, database });

    process.env.POSTGRES_HOST = host;
    process.env.POSTGRES_PORT = String(port);
    process.env.POSTGRES_USER = username;
    process.env.POSTGRES_PASSWORD = password;
    process.env.POSTGRES_DB = database;

    process.env.CORS_ORIGIN = 'http://localhost:5174';

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
    const origin = 'http://localhost:5174';

    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', origin)
      .expect('Access-Control-Allow-Origin', origin);
  });

  it('responds to preflight request with CORS headers', async () => {
    const origin = 'http://localhost:5174';

    await request(app.getHttpServer())
      .options('/products')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET')
      .expect('Access-Control-Allow-Origin', origin);
  });
});
