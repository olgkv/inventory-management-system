import type { CreateProductDto, Product } from 'shared';

import { fetchJson, joinApiUrl } from '@/shared/api';

export async function createProduct(dto: CreateProductDto) {
  return await fetchJson<Product>(joinApiUrl('/products'), {
    method: 'POST',
    body: dto,
  });
}
