import type { Product, UpdateProductDto } from 'shared';

import { fetchJson, joinApiUrl } from '@/shared/api';

export async function updateProduct(id: number, dto: UpdateProductDto) {
  return await fetchJson<Product>(joinApiUrl(`/products/${id}`), {
    method: 'PUT',
    body: dto,
  });
}
