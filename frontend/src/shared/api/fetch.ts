import { ApiError } from './api-error';
import type { ApiErrorBody } from './api-error';

type FetchJsonOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function readErrorBody(res: Response) {
  try {
    return (await res.json()) as unknown;
  } catch {
    return undefined;
  }
}

function asApiErrorBody(body: unknown): ApiErrorBody | undefined {
  if (body && typeof body === 'object') {
    return body as ApiErrorBody;
  }
  return undefined;
}

export async function fetchJson<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError(res.status, asApiErrorBody(body));
  }

  return (await res.json()) as T;
}

export async function fetchVoid(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError(res.status, asApiErrorBody(body));
  }
}
