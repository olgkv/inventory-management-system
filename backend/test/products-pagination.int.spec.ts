import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';

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

describe('GET /products (pagination)', () => {
  let app: INestApplication;
  let container: StartedPostgresContainer;

  beforeAll(async () => {
    const username = 'test';
    const password = 'test';
    const database = 'testdb';

    container = await new GenericContainer('postgres:16-alpine')
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

    // Run migrations
    const migrationDataSource = new DataSource({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      synchronize: false,
      migrationsRun: false,
      entities: [],
      migrations: [CreateProductsTable1734469320000],
    });

    await migrationDataSource.initialize();
    await migrationDataSource.runMigrations();

    // Seed 3 products
    await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
      ['A-1', 'Product 1', 100, 1]
    );
    await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
      ['A-2', 'Product 2', 200, 2]
    );
    await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
      ['A-3', 'Product 3', 300, 3]
    );

    await migrationDataSource.destroy();

    // Configure Nest to use this DB via env vars (AppModule reads process.env)
    process.env.POSTGRES_HOST = host;
    process.env.POSTGRES_PORT = String(port);
    process.env.POSTGRES_USER = username;
    process.env.POSTGRES_PASSWORD = password;
    process.env.POSTGRES_DB = database;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close().catch(() => undefined);
    await container?.stop().catch(() => undefined);
  });

  it('returns { data, total } and paginates with page/limit', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .query({ page: 1, limit: 2 })
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.data).toHaveLength(2);

    const res2 = await request(app.getHttpServer())
      .get('/products')
      .query({ page: 2, limit: 2 })
      .expect(200);

    expect(res2.body.total).toBe(3);
    expect(res2.body.data).toHaveLength(1);
  });

  it('rejects limit > 50', async () => {
    await request(app.getHttpServer()).get('/products').query({ page: 1, limit: 51 }).expect(400);
  });
});
