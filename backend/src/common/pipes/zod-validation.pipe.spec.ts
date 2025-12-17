import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  describe('transform', () => {
    it('should pass through valid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const pipe = new ZodValidationPipe(schema);

      const validData = { name: 'John', age: 30 };

      expect(pipe.transform(validData)).toEqual(validData);
    });

    it('should transform and coerce data according to schema', () => {
      const schema = z.object({
        id: z.coerce.number(),
        active: z.coerce.boolean(),
      });
      const pipe = new ZodValidationPipe(schema);

      const result = pipe.transform({ id: '123', active: 'true' });

      expect(result).toEqual({ id: 123, active: true });
    });

    it('should strip unknown fields', () => {
      const schema = z.object({
        name: z.string(),
      });
      const pipe = new ZodValidationPipe(schema);

      const result = pipe.transform({ name: 'John', extra: 'field' });

      expect(result).toEqual({ name: 'John' });
      expect((result as any).extra).toBeUndefined();
    });

    it('should throw BadRequestException for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        age: z.number().positive('Age must be positive'),
      });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ name: '', age: -5 })).toThrow(BadRequestException);
    });

    it('should include validation error details in exception', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
      });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ name: '', email: 'invalid' });
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);

        const response = (error as BadRequestException).getResponse();
        expect(response).toHaveProperty('message', 'Validation failed');
        expect(response).toHaveProperty('errors');
      }
    });

    it('should handle nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            street: z.string(),
            city: z.string(),
          }),
        }),
      });
      const pipe = new ZodValidationPipe(schema);

      const validData = {
        user: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
      };

      expect(pipe.transform(validData)).toEqual(validData);
    });

    it('should handle arrays', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const pipe = new ZodValidationPipe(schema);

      const validData = { tags: ['typescript', 'nestjs'] };

      expect(pipe.transform(validData)).toEqual(validData);
    });

    it('should throw for invalid array items', () => {
      const schema = z.object({
        numbers: z.array(z.number()),
      });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ numbers: [1, 'two', 3] })).toThrow(BadRequestException);
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });
      const pipe = new ZodValidationPipe(schema);

      expect(pipe.transform({ required: 'value' })).toEqual({ required: 'value' });
      expect(pipe.transform({ required: 'value', optional: 'present' })).toEqual({
        required: 'value',
        optional: 'present',
      });
    });

    it('should handle default values', () => {
      const schema = z.object({
        count: z.number().default(10),
        active: z.boolean().default(true),
      });
      const pipe = new ZodValidationPipe(schema);

      const result = pipe.transform({});

      expect(result).toEqual({ count: 10, active: true });
    });

    it('should handle union types', () => {
      const schema = z.object({
        status: z.union([z.literal('active'), z.literal('inactive')]),
      });
      const pipe = new ZodValidationPipe(schema);

      expect(pipe.transform({ status: 'active' })).toEqual({ status: 'active' });
      expect(() => pipe.transform({ status: 'pending' })).toThrow(BadRequestException);
    });
  });
});
