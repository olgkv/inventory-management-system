export const TEST_POSTGRES_IMAGE = 'postgres:18-alpine' as const;
export const TEST_POSTGRES_INTERNAL_PORT = 5432 as const;

export const TEST_DB_READY_TIMEOUT_MS = 30_000 as const;
export const TEST_DB_RETRY_DELAY_MS = 300 as const;

export const TEST_FRONTEND_ORIGIN = 'http://localhost:5174' as const;

export const TEST_MISSING_ID = 999_999 as const;

export const TEST_PAGINATION_LIMIT_MAX = 50 as const;
export const TEST_PAGINATION_LIMIT_TOO_HIGH = TEST_PAGINATION_LIMIT_MAX + 1;

export const TEST_SEED_COUNT_DEFAULT = 75 as const;
