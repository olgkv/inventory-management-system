import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';
import {
  TEST_PAGINATION_LIMIT_MAX,
  TEST_PAGINATION_LIMIT_TOO_HIGH,
  TEST_POSTGRES_IMAGE,
  TEST_POSTGRES_INTERNAL_PORT,
} from './test-constants';
import { waitForPostgres } from './test-postgres';

type StartedPostgresContainer = Awaited<ReturnType<GenericContainer['start']>>;

const PAGE_1 = 1;
const PAGE_2 = 2;
const LIMIT_2 = 2;
const TOTAL_3 = 3;

const PRODUCT_1 = { article: 'A-1', name: 'Product 1', priceMinor: 100, quantity: 1 };
const PRODUCT_2 = { article: 'A-2', name: 'Product 2', priceMinor: 200, quantity: 2 };
const PRODUCT_3 = { article: 'A-3', name: 'Product 3', priceMinor: 300, quantity: 3 };

describe('GET /products (pagination)', () => {
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
      [PRODUCT_1.article, PRODUCT_1.name, PRODUCT_1.priceMinor, PRODUCT_1.quantity]
    );
    await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
      [PRODUCT_2.article, PRODUCT_2.name, PRODUCT_2.priceMinor, PRODUCT_2.quantity]
    );
    await migrationDataSource.query(
      'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
      [PRODUCT_3.article, PRODUCT_3.name, PRODUCT_3.priceMinor, PRODUCT_3.quantity]
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
      .query({ page: PAGE_1, limit: LIMIT_2 })
      .expect(HttpStatus.OK);

    expect(res.body.total).toBe(TOTAL_3);
    expect(res.body.data).toHaveLength(LIMIT_2);

    const res2 = await request(app.getHttpServer())
      .get('/products')
      .query({ page: PAGE_2, limit: LIMIT_2 })
      .expect(HttpStatus.OK);

    expect(res2.body.total).toBe(TOTAL_3);
    expect(res2.body.data).toHaveLength(TOTAL_3 - LIMIT_2);
  });

  it(`rejects limit > ${TEST_PAGINATION_LIMIT_MAX}`, async () => {
    await request(app.getHttpServer())
      .get('/products')
      .query({ page: PAGE_1, limit: TEST_PAGINATION_LIMIT_TOO_HIGH })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
