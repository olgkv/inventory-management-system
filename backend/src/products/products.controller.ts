import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateProductDto,
  CreateProductDtoSchema,
  PaginationQuerySchema,
  Product,
  ProductsListResponse,
  UpdateProductDto,
  UpdateProductDtoSchema,
} from 'shared';
import { z } from 'zod';

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

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateProductDtoSchema))
    body: CreateProductDto
  ): Promise<Product> {
    const created = await this.productsService.create(body);

    return {
      id: created.id,
      article: created.article,
      name: created.name,
      priceMinor: created.priceMinor,
      quantity: created.quantity,
    };
  }

  @Put(':id')
  async update(
    @Param('id', new ZodValidationPipe(z.coerce.number().int().positive()))
    id: number,
    @Body(new ZodValidationPipe(UpdateProductDtoSchema))
    body: UpdateProductDto
  ): Promise<Product> {
    const updated = await this.productsService.update(id, body);

    return {
      id: updated.id,
      article: updated.article,
      name: updated.name,
      priceMinor: updated.priceMinor,
      quantity: updated.quantity,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ZodValidationPipe(z.coerce.number().int().positive()))
    id: number
  ): Promise<void> {
    await this.productsService.remove(id);
  }
}
