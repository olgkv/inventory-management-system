import type { ProductsResponse } from '../model/types';

import { joinApiUrl } from '../../../shared/api';

type GetProductsParams = {
  page: number;
  limit: number;
};

export async function getProducts(params: GetProductsParams, signal?: AbortSignal) {
  const url = joinApiUrl(`/products?page=${params.page}&limit=${params.limit}`);
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as ProductsResponse;
}
