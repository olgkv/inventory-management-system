import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';
import {
  TEST_PAGINATION_LIMIT_MAX,
  TEST_POSTGRES_IMAGE,
  TEST_POSTGRES_INTERNAL_PORT,
  TEST_SEED_COUNT_DEFAULT,
} from './test-constants';
import { waitForPostgres } from './test-postgres';

type StartedPostgresContainer = Awaited<ReturnType<GenericContainer['start']>>;

const PAGE_1 = 1;

async function bootstrapApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Seed (idempotent products)', () => {
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

    // Force seed even under Jest
    process.env.SEED_FORCE = 'true';
    process.env.SEED_COUNT = String(TEST_SEED_COUNT_DEFAULT);
  });

  afterAll(async () => {
    delete process.env.SEED_FORCE;
    delete process.env.SEED_COUNT;
    await container?.stop().catch(() => undefined);
  });

  it('seeds products on first app start and stays idempotent', async () => {
    const app1 = await bootstrapApp();

    const res1 = await request(app1.getHttpServer())
      .get('/products')
      .query({ page: PAGE_1, limit: TEST_PAGINATION_LIMIT_MAX })
      .expect(HttpStatus.OK);

    expect(res1.body.total).toBe(TEST_SEED_COUNT_DEFAULT);

    await app1.close();

    const app2 = await bootstrapApp();

    const res2 = await request(app2.getHttpServer())
      .get('/products')
      .query({ page: PAGE_1, limit: TEST_PAGINATION_LIMIT_MAX })
      .expect(HttpStatus.OK);

    expect(res2.body.total).toBe(TEST_SEED_COUNT_DEFAULT);

    await app2.close();
  });
});
