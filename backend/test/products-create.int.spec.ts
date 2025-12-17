import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';
import { TEST_POSTGRES_IMAGE, TEST_POSTGRES_INTERNAL_PORT } from './test-constants';
import { waitForPostgres } from './test-postgres';

type StartedPostgresContainer = Awaited<ReturnType<GenericContainer['start']>>;

const PRODUCT_PRICE_MINOR = 100;
const PRODUCT_QTY = 1;

describe('POST /products', () => {
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

  it('creates a product (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({
        article: 'A-1',
        name: 'Product 1',
        priceMinor: PRODUCT_PRICE_MINOR,
        quantity: PRODUCT_QTY,
      })
      .expect(HttpStatus.CREATED);

    expect(res.body.id).toBeDefined();
    expect(res.body.article).toBe('A-1');
  });

  it('returns 409 on duplicate article', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        article: 'A-2',
        name: 'Product 2',
        priceMinor: PRODUCT_PRICE_MINOR,
        quantity: PRODUCT_QTY,
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post('/products')
      .send({
        article: 'A-2',
        name: 'Product 2',
        priceMinor: PRODUCT_PRICE_MINOR,
        quantity: PRODUCT_QTY,
      })
      .expect(HttpStatus.CONFLICT);
  });

  it('returns 400 on invalid body', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        article: 'A-3',
        priceMinor: PRODUCT_PRICE_MINOR,
        quantity: PRODUCT_QTY,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
