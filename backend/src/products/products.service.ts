import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async list(params: { page: number; limit: number }) {
    const { page, limit } = params;

    const skip = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    return {
      data,
      total,
    };
  }

  async create(dto: {
    article: string;
    name: string;
    priceMinor: number;
    quantity: number;
  }): Promise<Product> {
    try {
      const entity = this.productRepository.create(dto);
      return await this.productRepository.save(entity);
    } catch (e: unknown) {
      const maybeCode =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: unknown }).code
          : undefined;

      if (maybeCode === '23505') {
        throw new ConflictException({ message: 'Article already exists' });
      }
      throw e;
    }
  }

  async update(
    id: number,
    dto: Partial<{
      article: string;
      name: string;
      priceMinor: number;
      quantity: number;
    }>
  ): Promise<Product> {
    const existing = await this.productRepository.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException({ message: 'Product not found' });
    }

    const next = Object.assign(existing, dto);

    try {
      return await this.productRepository.save(next);
    } catch (e: unknown) {
      const maybeCode =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: unknown }).code
          : undefined;

      if (maybeCode === '23505') {
        throw new ConflictException({ message: 'Article already exists' });
      }

      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete({ id });

    if (!result.affected) {
      throw new NotFoundException({ message: 'Product not found' });
    }
  }
}
