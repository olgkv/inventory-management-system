import { getMetadataArgsStorage } from 'typeorm';

import { Product } from './product.entity';

describe('Product entity metadata', () => {
  it('registers unique index on article', () => {
    const indices = getMetadataArgsStorage().indices.filter(idx => idx.target === Product);

    const articleUnique = indices.find(idx => {
      const columns = idx.columns as unknown as string[];
      return Array.isArray(columns) && columns.length === 1 && columns[0] === 'article';
    });

    expect(articleUnique?.unique).toBe(true);
  });

  it('defines createdAt create date column', () => {
    const columns = getMetadataArgsStorage().columns.filter(col => col.target === Product);

    const createdAt = columns.find(c => c.propertyName === 'createdAt');
    expect(createdAt?.mode).toBe('createDate');
  });
});
