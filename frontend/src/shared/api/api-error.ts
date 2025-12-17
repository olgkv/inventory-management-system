export type ApiErrorBody = {
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
