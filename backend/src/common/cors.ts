import type { INestApplication } from '@nestjs/common';

import { DEFAULT_CORS_ORIGIN } from './constants';

export function enableAppCors(app: INestApplication) {
  const origins = (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
  });
}
