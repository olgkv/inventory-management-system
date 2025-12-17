import { registerAs } from '@nestjs/config';

import {
  DEFAULT_POSTGRES_DATABASE,
  DEFAULT_POSTGRES_HOST,
  DEFAULT_POSTGRES_PASSWORD,
  DEFAULT_POSTGRES_PORT,
  DEFAULT_POSTGRES_USERNAME,
} from '../common/constants';

export default registerAs('database', () => ({
  host: process.env.POSTGRES_HOST ?? DEFAULT_POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? DEFAULT_POSTGRES_PORT),
  username: process.env.POSTGRES_USER ?? DEFAULT_POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD ?? DEFAULT_POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB ?? DEFAULT_POSTGRES_DATABASE,
}));
