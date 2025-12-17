import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { enableAppCors } from './common/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  enableAppCors(app);

  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
