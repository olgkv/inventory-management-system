import type { ProductsResponse } from '../model/types';

import { fetchJson, joinApiUrl } from '@/shared/api';

type GetProductsParams = {
  page: number;
  limit: number;
};

export async function getProducts(params: GetProductsParams, signal?: AbortSignal) {
  const url = joinApiUrl(`/products?page=${params.page}&limit=${params.limit}`);

  return await fetchJson<ProductsResponse>(url, { signal });
}
