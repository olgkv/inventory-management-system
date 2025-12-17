import { Client } from 'pg';

import { TEST_DB_READY_TIMEOUT_MS, TEST_DB_RETRY_DELAY_MS } from './test-constants';

export async function waitForPostgres(opts: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  const startedAt = Date.now();

  let lastError: unknown;
  while (Date.now() - startedAt < TEST_DB_READY_TIMEOUT_MS) {
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
      await new Promise(r => setTimeout(r, TEST_DB_RETRY_DELAY_MS));
    }
  }

  throw lastError;
}
