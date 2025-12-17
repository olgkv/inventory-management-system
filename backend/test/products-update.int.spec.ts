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

describe('PUT /products/:id', () => {
  let app: INestApplication;
  let container: StartedPostgresContainer;
  let product1Id: number;
  let product2Id: number;

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

    const rows1 = await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4) RETURNING id',
      ['A-1', 'Product 1', 100, 1]
    );
    const rows2 = await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4) RETURNING id',
      ['A-2', 'Product 2', 200, 2]
    );

    product1Id = Number(rows1[0].id);
    product2Id = Number(rows2[0].id);

    await migrationDataSource.destroy();

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

  it('updates product fields (200)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/products/${product1Id}`)
      .send({ name: 'Updated name' })
      .expect(200);

    expect(res.body.id).toBe(product1Id);
    expect(res.body.name).toBe('Updated name');
    expect(res.body.article).toBe('A-1');
  });

  it('returns 404 for missing product', async () => {
    await request(app.getHttpServer()).put('/products/999999').send({ name: 'X' }).expect(404);
  });

  it('returns 409 on duplicate article', async () => {
    await request(app.getHttpServer())
      .put(`/products/${product2Id}`)
      .send({ article: 'A-1' })
      .expect(409);
  });

  it('returns 400 on invalid body', async () => {
    await request(app.getHttpServer())
      .put(`/products/${product1Id}`)
      .send({ priceMinor: -1 })
      .expect(400);
  });
});
