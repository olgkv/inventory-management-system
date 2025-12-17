import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  });

export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
