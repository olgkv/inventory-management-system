import type { INestApplication } from '@nestjs/common';

export function enableAppCors(app: INestApplication) {
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5174')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
  });
}
