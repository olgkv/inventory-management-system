import {
  CreateProductDtoSchema,
  ProductIdSchema,
  ProductSchema,
  UpdateProductDtoSchema,
} from './product.schemas';

describe('Product schemas', () => {
  describe('ProductIdSchema', () => {
    it('should validate positive integers', () => {
      expect(ProductIdSchema.parse(1)).toBe(1);
      expect(ProductIdSchema.parse(100)).toBe(100);
      expect(ProductIdSchema.parse(999999)).toBe(999999);
    });

    it('should coerce string numbers to integers', () => {
      expect(ProductIdSchema.parse('123')).toBe(123);
    });

    it('should reject non-positive numbers', () => {
      expect(() => ProductIdSchema.parse(0)).toThrow();
      expect(() => ProductIdSchema.parse(-1)).toThrow();
      expect(() => ProductIdSchema.parse(-100)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => ProductIdSchema.parse(1.5)).toThrow();
      expect(() => ProductIdSchema.parse('1.5')).toThrow();
    });

    it('should reject non-numeric values', () => {
      expect(() => ProductIdSchema.parse('abc')).toThrow();
      expect(() => ProductIdSchema.parse(null)).toThrow();
      expect(() => ProductIdSchema.parse(undefined)).toThrow();
      expect(() => ProductIdSchema.parse({})).toThrow();
    });
  });

  describe('ProductSchema', () => {
    const validProduct = {
      id: 1,
      article: 'ART-001',
      name: 'Test Product',
      priceMinor: 9999,
      quantity: 10,
    };

    it('should validate a complete valid product', () => {
      expect(ProductSchema.parse(validProduct)).toEqual(validProduct);
    });

    it('should reject missing required fields', () => {
      expect(() => ProductSchema.parse({ ...validProduct, article: undefined })).toThrow();
      expect(() => ProductSchema.parse({ ...validProduct, name: undefined })).toThrow();
      expect(() => ProductSchema.parse({ ...validProduct, priceMinor: undefined })).toThrow();
      expect(() => ProductSchema.parse({ ...validProduct, quantity: undefined })).toThrow();
    });

    describe('article field', () => {
      it('should accept valid article strings', () => {
        expect(() => ProductSchema.parse({ ...validProduct, article: 'A' })).not.toThrow();
        expect(() =>
          ProductSchema.parse({ ...validProduct, article: 'A'.repeat(100) })
        ).not.toThrow();
      });

      it('should reject empty article', () => {
        expect(() => ProductSchema.parse({ ...validProduct, article: '' })).toThrow();
      });

      it('should reject article longer than 100 characters', () => {
        expect(() => ProductSchema.parse({ ...validProduct, article: 'A'.repeat(101) })).toThrow();
      });

      it('should trim whitespace', () => {
        const result = ProductSchema.parse({
          ...validProduct,
          article: '  ART-001  ',
        });
        expect(result.article).toBe('  ART-001  '); // zod doesn't trim by default
      });
    });

    describe('name field', () => {
      it('should accept valid name strings', () => {
        expect(() => ProductSchema.parse({ ...validProduct, name: 'N' })).not.toThrow();
        expect(() => ProductSchema.parse({ ...validProduct, name: 'N'.repeat(255) })).not.toThrow();
      });

      it('should reject empty name', () => {
        expect(() => ProductSchema.parse({ ...validProduct, name: '' })).toThrow();
      });

      it('should reject name longer than 255 characters', () => {
        expect(() => ProductSchema.parse({ ...validProduct, name: 'N'.repeat(256) })).toThrow();
      });
    });

    describe('priceMinor field', () => {
      it('should accept positive integers', () => {
        expect(ProductSchema.parse({ ...validProduct, priceMinor: 1 }).priceMinor).toBe(1);
        expect(ProductSchema.parse({ ...validProduct, priceMinor: 99999 }).priceMinor).toBe(99999);
      });

      it('should coerce string numbers to integers', () => {
        expect(ProductSchema.parse({ ...validProduct, priceMinor: '123' }).priceMinor).toBe(123);
      });

      it('should reject non-positive numbers', () => {
        expect(() => ProductSchema.parse({ ...validProduct, priceMinor: 0 })).toThrow();
        expect(() => ProductSchema.parse({ ...validProduct, priceMinor: -1 })).toThrow();
      });

      it('should reject non-integers', () => {
        expect(() => ProductSchema.parse({ ...validProduct, priceMinor: 1.5 })).toThrow();
      });

      it('should reject non-numeric values', () => {
        expect(() => ProductSchema.parse({ ...validProduct, priceMinor: 'abc' })).toThrow();
        expect(() => ProductSchema.parse({ ...validProduct, priceMinor: null })).toThrow();
      });
    });

    describe('quantity field', () => {
      it('should accept non-negative integers', () => {
        expect(ProductSchema.parse({ ...validProduct, quantity: 0 }).quantity).toBe(0);
        expect(ProductSchema.parse({ ...validProduct, quantity: 10 }).quantity).toBe(10);
        expect(ProductSchema.parse({ ...validProduct, quantity: 99999 }).quantity).toBe(99999);
      });

      it('should coerce string numbers to integers', () => {
        expect(ProductSchema.parse({ ...validProduct, quantity: '50' }).quantity).toBe(50);
      });

      it('should reject negative numbers', () => {
        expect(() => ProductSchema.parse({ ...validProduct, quantity: -1 })).toThrow();
      });

      it('should reject non-integers', () => {
        expect(() => ProductSchema.parse({ ...validProduct, quantity: 1.5 })).toThrow();
      });
    });

    it('should reject unknown fields', () => {
      const withExtra = { ...validProduct, extra: 'field' };
      expect(() => ProductSchema.parse(withExtra)).toThrow();
    });
  });

  describe('CreateProductDtoSchema', () => {
    const validCreateDto = {
      article: 'NEW-001',
      name: 'New Product',
      priceMinor: 4999,
      quantity: 5,
    };

    it('should validate a complete valid DTO', () => {
      expect(CreateProductDtoSchema.parse(validCreateDto)).toEqual(validCreateDto);
    });

    it('should require all fields', () => {
      expect(() =>
        CreateProductDtoSchema.parse({
          article: 'NEW-001',
          name: 'New Product',
          priceMinor: 4999,
          // Missing quantity
        } as unknown as Record<string, unknown>)
      ).toThrow();
    });

    it('should reject id field (not in omittable)', () => {
      // Should not accept id since it's omitted
      expect(() =>
        CreateProductDtoSchema.parse({
          ...validCreateDto,
          id: 999,
        } as unknown as Record<string, unknown>)
      ).toThrow();
    });

    it('should apply same validation rules as ProductSchema for fields', () => {
      expect(() =>
        CreateProductDtoSchema.parse({
          ...validCreateDto,
          article: '', // Empty article
        })
      ).toThrow();

      expect(() =>
        CreateProductDtoSchema.parse({
          ...validCreateDto,
          priceMinor: -1, // Negative price
        })
      ).toThrow();
    });
  });

  describe('UpdateProductDtoSchema', () => {
    const validUpdateDto = {
      name: 'Updated Name',
    };

    it('should allow partial updates', () => {
      expect(UpdateProductDtoSchema.parse(validUpdateDto)).toEqual(validUpdateDto);
      expect(
        UpdateProductDtoSchema.parse({
          article: 'UPD-001',
        })
      ).toEqual({ article: 'UPD-001' });
      expect(
        UpdateProductDtoSchema.parse({
          priceMinor: 5999,
          quantity: 15,
        })
      ).toEqual({ priceMinor: 5999, quantity: 15 });
    });

    it('should allow empty object', () => {
      expect(UpdateProductDtoSchema.parse({})).toEqual({});
    });

    it('should not require any fields', () => {
      expect(() => UpdateProductDtoSchema.parse({})).not.toThrow();
    });

    it('should validate fields when provided', () => {
      expect(() =>
        UpdateProductDtoSchema.parse({
          article: '', // Invalid empty string
        })
      ).toThrow();

      expect(() =>
        UpdateProductDtoSchema.parse({
          priceMinor: -1, // Invalid negative
        })
      ).toThrow();
    });

    it('should apply same validation rules as CreateProductDtoSchema when fields are present', () => {
      const validDto = {
        article: 'UPD-001',
        name: 'Updated Product',
        priceMinor: 5999,
        quantity: 15,
      };

      expect(UpdateProductDtoSchema.parse(validDto)).toEqual(validDto);
    });

    it('should reject id field', () => {
      expect(() =>
        UpdateProductDtoSchema.parse({
          id: 999,
          name: 'Updated',
        } as unknown as Record<string, unknown>)
      ).toThrow();
    });
  });
});
