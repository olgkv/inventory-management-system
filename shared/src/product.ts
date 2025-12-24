export type ProductId = number;

export interface Product {
  id: ProductId;
  article: string;
  name: string;
  priceMinor: number;
  quantity: number;
}

export interface CreateProductDto {
  article: string;
  name: string;
  priceMinor: number;
  quantity: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductsListResponse {
  data: Product[];
  total: number;
  page?: number;
  limit?: number;
}
