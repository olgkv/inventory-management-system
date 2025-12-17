import type { Product, UpdateProductDto } from 'shared';

import { joinApiUrl } from '@/shared/api';

type ApiErrorBody = {
  message?: string;
  errors?: unknown;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | undefined;

  constructor(status: number, body: ApiErrorBody | undefined) {
    super(body?.message ?? `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function updateProduct(id: number, dto: UpdateProductDto) {
  const res = await fetch(joinApiUrl(`/products/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, body);
  }

  return (await res.json()) as Product;
}
