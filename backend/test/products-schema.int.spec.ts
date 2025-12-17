import { Client } from 'pg';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

import { CreateProductsTable1734469320000 } from '../src/migrations/1734469320000-CreateProductsTable';

async function waitForPostgres(opts: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  while (true) {
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
      if (Date.now() - startedAt > timeoutMs) {
        throw e;
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }
}

describe('DB migrations + products schema', () => {
  it('applies migrations and enforces unique article constraint', async () => {
    const username = 'test';
    const password = 'test';
    const database = 'testdb';

    const container = await new GenericContainer('postgres:16-alpine')
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
        ['A-1', 'Product 1', 100, 1]
      );

      await expect(
        dataSource.query(
          'INSERT INTO products (article, name, "priceMinor", quantity) VALUES ($1, $2, $3, $4)',
          ['A-1', 'Product 2', 200, 2]
        )
      ).rejects.toMatchObject({ code: '23505' });
    } finally {
      await dataSource.destroy().catch(() => undefined);
      await container.stop().catch(() => undefined);
    }
  });
});
