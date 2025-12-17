import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { PG_UNIQUE_VIOLATION } from '../postgres-error-codes';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const maybeCode =
      typeof (exception as unknown as { code?: unknown }).code === 'string'
        ? (exception as unknown as { code: string }).code
        : undefined;

    if (maybeCode === PG_UNIQUE_VIOLATION) {
      response.status(HttpStatus.CONFLICT).json({
        message: 'Article already exists',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Database error',
    });
  }
}
