import { HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { QueryFailedError } from 'typeorm';

import { PG_UNIQUE_VIOLATION } from '../postgres-error-codes';
import { TypeOrmExceptionFilter } from './typeorm-exception.filter';

describe('TypeOrmExceptionFilter', () => {
  it('maps Postgres unique violation (23505) to 409', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    const exception = { code: PG_UNIQUE_VIOLATION } as unknown as QueryFailedError;

    const filter = new TypeOrmExceptionFilter();
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({ message: 'Article already exists' });
  });

  it('maps other QueryFailedError to 500', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    const exception = { code: 'XXXXX' } as unknown as QueryFailedError;

    const filter = new TypeOrmExceptionFilter();
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({ message: 'Database error' });
  });
});
