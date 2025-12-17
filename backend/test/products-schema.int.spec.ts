import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { PG_UNIQUE_VIOLATION } from '../src/common/postgres-error-codes';
import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';
import { TEST_POSTGRES_IMAGE, TEST_POSTGRES_INTERNAL_PORT } from './test-constants';
import { waitForPostgres } from './test-postgres';

// waitForPostgres moved to test-postgres helper

const PRODUCT_1_PRICE_MINOR = 100;
const PRODUCT_1_QTY = 1;
const PRODUCT_2_PRICE_MINOR = 200;
const PRODUCT_2_QTY = 2;

describe('DB migrations + products schema', () => {
  it('applies migrations and enforces unique article constraint', async () => {
    const username = 'test';
    const password = 'test';
    const database = 'testdb';

    const container = await new GenericContainer(TEST_POSTGRES_IMAGE)
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

    const dataSource = new DataSource({
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

    try {
      await dataSource.initialize();
      await dataSource.runMigrations();

      await dataSource.query(
        'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
        ['A-1', 'Product 1', PRODUCT_1_PRICE_MINOR, PRODUCT_1_QTY]
      );

      await expect(
        dataSource.query(
          'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
          ['A-1', 'Product 2', PRODUCT_2_PRICE_MINOR, PRODUCT_2_QTY]
        )
      ).rejects.toMatchObject({ code: PG_UNIQUE_VIOLATION });
    } finally {
      await dataSource.destroy().catch(() => undefined);
      await container.stop().catch(() => undefined);
    }
  });
});
