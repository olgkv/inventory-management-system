import { z } from 'zod';

import { PAGINATION_LIMIT_MAX } from './constants';
import {
  paginatedResponseSchema,
  PaginationQueryInput,
  PaginationQuerySchema,
} from './pagination.schemas';

describe('Pagination schemas', () => {
  describe('PaginationQuerySchema', () => {
    it('should validate with default values when no input provided', () => {
      const result = PaginationQuerySchema.parse({});
      expect(result).toEqual({ page: 1, limit: 10 });
    });

    it('should accept valid page and limit numbers', () => {
      const result = PaginationQuerySchema.parse({ page: 2, limit: 20 });
      expect(result).toEqual({ page: 2, limit: 20 });
    });

    it('should coerce string values to numbers', () => {
      const result = PaginationQuerySchema.parse({ page: '3', limit: '15' });
      expect(result).toEqual({ page: 3, limit: 15 });
    });

    it('should handle page default when only limit provided', () => {
      const result = PaginationQuerySchema.parse({ limit: 25 });
      expect(result).toEqual({ page: 1, limit: 25 });
    });

    it('should handle limit default when only page provided', () => {
      const result = PaginationQuerySchema.parse({ page: 5 });
      expect(result).toEqual({ page: 5, limit: 10 });
    });

    it('should enforce page must be positive integer', () => {
      expect(() => PaginationQuerySchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ page: -1 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ page: 1.5 })).toThrow();
    });

    it('should enforce limit must be positive integer', () => {
      expect(() => PaginationQuerySchema.parse({ limit: 0 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: -5 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: 10.5 })).toThrow();
    });

    it('should enforce limit maximum constraint', () => {
      const maxLimit = PAGINATION_LIMIT_MAX;

      // Should accept limit at exactly max
      expect(() => PaginationQuerySchema.parse({ limit: maxLimit })).not.toThrow();

      // Should reject limit over max
      expect(() => PaginationQuerySchema.parse({ limit: maxLimit + 1 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: maxLimit + 100 })).toThrow();
    });

    it('should reject invalid input types', () => {
      expect(() => PaginationQuerySchema.parse({ page: 'abc' })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: 'xyz' })).toThrow();
      expect(() => PaginationQuerySchema.parse({ page: null })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: undefined })).toThrow();
    });

    it('should reject non-integer page values', () => {
      expect(() => PaginationQuerySchema.parse({ page: '1.5' })).toThrow();
    });

    it('should reject non-integer limit values', () => {
      expect(() => PaginationQuerySchema.parse({ limit: '10.7' })).toThrow();
    });
  });

  describe('paginatedResponseSchema', () => {
    const mockItemSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const PaginatedResponseSchema = paginatedResponseSchema(mockItemSchema);

    it('should validate a complete paginated response', () => {
      const validResponse = {
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        total: 100,
        page: 2,
        limit: 10,
      };

      expect(PaginatedResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it('should validate without optional page and limit', () => {
      const minimalResponse = {
        data: [{ id: 1, name: 'Item 1' }],
        total: 50,
      };

      expect(PaginatedResponseSchema.parse(minimalResponse)).toEqual(minimalResponse);
    });

    it('should accept empty data array', () => {
      const emptyResponse = {
        data: [],
        total: 0,
      };

      expect(PaginatedResponseSchema.parse(emptyResponse)).toEqual(emptyResponse);
    });

    it('should validate all items in data array', () => {
      const validResponse = {
        data: [
          { id: 1, name: 'Valid Item' },
          { id: 2, name: 'Another Item' },
        ],
        total: 2,
      };

      expect(PaginatedResponseSchema.parse(validResponse)).toEqual(validResponse);
    });

    it('should reject invalid items in data array', () => {
      const invalidResponse = {
        data: [
          { id: 1, name: 'Valid Item' },
          { id: 'two', name: 123 }, // Invalid types
        ],
        total: 2,
      };

      expect(() => PaginatedResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should enforce data must be an array', () => {
      expect(() =>
        PaginatedResponseSchema.parse({
          data: 'not an array',
          total: 1,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: null,
          total: 1,
        })
      ).toThrow();
    });

    it('should enforce total must be non-negative integer', () => {
      const validData = { data: [], total: 0 };
      expect(PaginatedResponseSchema.parse(validData)).toEqual(validData);

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: -1,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 1.5,
        })
      ).toThrow();
    });

    it('should enforce page must be positive integer when provided', () => {
      const validData = {
        data: [],
        total: 0,
        page: 1,
      };
      expect(PaginatedResponseSchema.parse(validData)).toEqual(validData);

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          page: 0,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          page: -1,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          page: 1.5,
        })
      ).toThrow();
    });

    it('should enforce limit must be positive integer when provided', () => {
      const validData = {
        data: [],
        total: 0,
        limit: 10,
      };
      expect(PaginatedResponseSchema.parse(validData)).toEqual(validData);

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          limit: 0,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          limit: -5,
        })
      ).toThrow();

      expect(() =>
        PaginatedResponseSchema.parse({
          data: [],
          total: 0,
          limit: 10.7,
        })
      ).toThrow();
    });

    it('should work with different item schemas', () => {
      const stringSchema = z.string();
      const StringPaginatedSchema = paginatedResponseSchema(stringSchema);

      const result = StringPaginatedSchema.parse({
        data: ['item1', 'item2', 'item3'],
        total: 3,
      });

      expect(result).toEqual({
        data: ['item1', 'item2', 'item3'],
        total: 3,
      });
    });

    it('should infer correct types', () => {
      type ExpectedType = z.infer<typeof PaginatedResponseSchema>;

      // Type checking - these should compile if types are correct
      const validData: ExpectedType = {
        data: [{ id: 1, name: 'Test' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      expect(validData.data).toBeDefined();
      expect(validData.total).toBeDefined();
    });
  });

  describe('TypeScript type inference', () => {
    it('should produce correct types for PaginationQueryInput', () => {
      const query: PaginationQueryInput = {
        page: 2,
        limit: 20,
      };

      expect(query.page).toBe(2);
      expect(query.limit).toBe(20);
    });

    it('should work with default values in type', () => {
      const query: PaginationQueryInput = {
        page: 1,
        limit: 10,
      };

      expect(query).toBeDefined();
      expect(typeof query.page).toBe('number');
      expect(typeof query.limit).toBe('number');
    });
  });
});
