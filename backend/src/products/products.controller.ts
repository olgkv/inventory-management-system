import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQuerySchema, ProductsListResponse } from 'shared';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: {
      page: number;
      limit: number;
    }
  ): Promise<ProductsListResponse> {
    const { data, total } = await this.productsService.list(query);

    return {
      data: data.map(p => ({
        id: p.id,
        article: p.article,
        name: p.name,
        priceMinor: p.priceMinor,
        quantity: p.quantity,
      })),
      total,
    };
  }
}
