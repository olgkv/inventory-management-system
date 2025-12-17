import { z } from 'zod';

export const ProductIdSchema = z.number().int().positive();

export const ProductSchema = z.object({
  id: ProductIdSchema,
  article: z.string().min(1, 'Required').max(100, 'Too long'),
  name: z.string().min(1, 'Required').max(255, 'Too long'),
  priceMinor: z.number().int('Invalid').positive('Must be > 0'),
  quantity: z.number().int('Invalid').nonnegative('Must be ≥ 0'),
});

export const CreateProductDtoSchema = ProductSchema.omit({ id: true });

export const UpdateProductDtoSchema = CreateProductDtoSchema.partial();
