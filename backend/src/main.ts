import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DEFAULT_BACKEND_PORT } from './common/constants';
import { enableAppCors } from './common/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  enableAppCors(app);

  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? DEFAULT_BACKEND_PORT);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
