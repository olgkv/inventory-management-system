import { z } from 'zod';

export const ProductIdSchema = z.number().int().positive();

export const ProductSchema = z.object({
  id: ProductIdSchema,
  article: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  priceMinor: z.number().int().positive(),
  quantity: z.number().int().nonnegative(),
});

export const CreateProductDtoSchema = ProductSchema.omit({ id: true });

export const UpdateProductDtoSchema = CreateProductDtoSchema.partial();
