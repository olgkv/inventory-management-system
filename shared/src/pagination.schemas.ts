import { z } from 'zod';

import { PAGINATION_LIMIT_MAX } from './constants';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .transform(val => Math.min(val, PAGINATION_LIMIT_MAX))
    .default(10),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  });

export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
